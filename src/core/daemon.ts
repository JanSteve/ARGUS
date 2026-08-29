/**
 * ARGUS 2.0 Linux Runtime Daemon (`argusd`)
 * 
 * Central background service for agent governance, capability dispatch, policy evaluation,
 * sandbox execution, independent verification, and black-box telemetry.
 */

import http from "http";
import fs from "fs";
import path from "path";
import { ArgusCoreRuntime } from "./runtime";
import { runSystemDoctor } from "./doctor";
import { REALITY_CAPABILITIES } from "./realityMatrix";
import { AutonomousDeveloperAgent } from "./autonomousDeveloperAgent";
import { CapabilityRequest } from "./types";

export interface DaemonConfig {
  port?: number;
  socketPath?: string;
  workspaceDir?: string;
}

export class ArgusDaemon {
  private runtime: ArgusCoreRuntime;
  private server: http.Server | null = null;
  private config: DaemonConfig;
  private isRunning = false;

  constructor(config?: DaemonConfig) {
    this.config = config || {};
    const workspace = path.resolve(this.config.workspaceDir || path.join(process.cwd(), "workspace"));
    this.runtime = new ArgusCoreRuntime(workspace);
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;

    this.server = http.createServer(async (req, res) => {
      // Set JSON headers
      res.setHeader("Content-Type", "application/json");

      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      const pathname = url.pathname;

      // Simple body parser
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }
      const jsonBody = body ? (() => { try { return JSON.parse(body); } catch { return {}; } })() : {};

      try {
        if (req.method === "GET" && pathname === "/status") {
          res.writeHead(200);
          res.end(JSON.stringify({
            daemon: "argusd",
            version: "2.0.0-linux",
            status: "RUNNING",
            workspace: this.runtime.getWorkspaceRoot(),
            uptimeSeconds: Math.floor(process.uptime()),
          }));
          return;
        }

        if (req.method === "GET" && pathname === "/doctor") {
          const report = await runSystemDoctor(this.runtime.getWorkspaceRoot());
          res.writeHead(200);
          res.end(JSON.stringify(report));
          return;
        }

        if (req.method === "GET" && pathname === "/capabilities") {
          res.writeHead(200);
          res.end(JSON.stringify(REALITY_CAPABILITIES));
          return;
        }

        if (req.method === "POST" && pathname === "/capability/dispatch") {
          const capReq: CapabilityRequest = jsonBody;
          const result = await this.runtime.dispatchCapability(capReq);
          res.writeHead(200);
          res.end(JSON.stringify(result));
          return;
        }

        if (req.method === "POST" && pathname === "/mission/run") {
          const agent = new AutonomousDeveloperAgent(this.runtime.getWorkspaceRoot());
          const missionResult = await agent.executeObjective(jsonBody.objective);
          res.writeHead(200);
          res.end(JSON.stringify(missionResult));
          return;
        }

        if (req.method === "GET" && pathname.startsWith("/audit/")) {
          const sessionId = pathname.replace("/audit/", "");
          const flightDir = path.join(this.runtime.getWorkspaceRoot(), ".argus", "flight_recorder");
          const targetFile = sessionId === "latest"
            ? (fs.readdirSync(flightDir).sort().reverse()[0] ? path.join(flightDir, fs.readdirSync(flightDir).sort().reverse()[0]) : null)
            : path.join(flightDir, `${sessionId}.json`);

          if (targetFile && fs.existsSync(targetFile)) {
            const data = fs.readFileSync(targetFile, "utf8");
            res.writeHead(200);
            res.end(data);
          } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Audit trace not found" }));
          }
          return;
        }

        res.writeHead(404);
        res.end(JSON.stringify({ error: "Endpoint not found" }));
      } catch (err: any) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message || "Internal Daemon Error" }));
      }
    });

    const port = this.config.port || 4120;
    await new Promise<void>((resolve) => {
      this.server!.listen(port, "127.0.0.1", () => {
        this.isRunning = true;
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    if (!this.isRunning || !this.server) return;
    await new Promise<void>((resolve) => {
      this.server!.close(() => {
        this.isRunning = false;
        resolve();
      });
    });
  }
}

// Auto-run if executed directly as daemon process
if (typeof process !== "undefined" && process.argv && process.argv[1]?.includes("daemon")) {
  const daemon = new ArgusDaemon();
  daemon.start().then(() => {
    console.log("ARGUS 2.0 Linux Daemon (argusd) active on http://127.0.0.1:4120");
  });
}
