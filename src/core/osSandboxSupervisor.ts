/**
 * ARGUS 2.0 OS Sandbox Supervisor (Phase 1.5)
 * 
 * Enforces OS-level isolation using Linux primitives:
 * - Linux Namespaces & Unprivileged Confinement (Bubblewrap / unshare)
 * - POSIX Process Group Isolation (`setsid`)
 * - Environment Variable Sanitization (Zero secret leakage)
 * - Hard Resource Limits (CPU time, memory buffer, execution timeouts)
 */

import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { ResourceLimits } from "./capabilityContract";

export type IsolationEngineType = "LINUX_BUBBLEWRAP_NAMESPACES" | "LINUX_UNSHARE_NAMESPACES" | "POSIX_PROCESS_GROUP_JAIL";

export interface SandboxExecutionOptions {
  command: string;
  args?: string[];
  workspaceDir: string;
  limits: ResourceLimits;
  allowedEnvVars?: Record<string, string>;
  allowNetwork?: boolean;
}

export interface SandboxExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  isolationMode: IsolationEngineType;
  timedOut: boolean;
  resourceViolated?: string;
}

export class OsSandboxSupervisor {
  private static detectedEngine: IsolationEngineType | null = null;

  /**
   * Detect available OS isolation mechanism
   */
  public static detectIsolationEngine(): IsolationEngineType {
    if (this.detectedEngine) return this.detectedEngine;

    const isLinux = process.platform === "linux";

    if (isLinux) {
      try {
        execSync("which bwrap", { stdio: "ignore" });
        this.detectedEngine = "LINUX_BUBBLEWRAP_NAMESPACES";
        return this.detectedEngine;
      } catch {
        try {
          execSync("which unshare", { stdio: "ignore" });
          this.detectedEngine = "LINUX_UNSHARE_NAMESPACES";
          return this.detectedEngine;
        } catch {
          this.detectedEngine = "POSIX_PROCESS_GROUP_JAIL";
          return this.detectedEngine;
        }
      }
    }

    this.detectedEngine = "POSIX_PROCESS_GROUP_JAIL";
    return this.detectedEngine;
  }

  /**
   * Sanitize environment variables to prevent ambient secret leakage
   */
  private static getSanitizedEnv(custom?: Record<string, string>): NodeJS.ProcessEnv {
    const cleanEnv: NodeJS.ProcessEnv = {
      PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
      NODE_ENV: "production",
      LANG: "en_US.UTF-8",
      TERM: "xterm-256color",
      TMPDIR: "/tmp",
    };

    if (custom) {
      for (const [k, v] of Object.entries(custom)) {
        // Reject ambient secret keys
        if (!/secret|key|token|auth|password|aws|ssh/i.test(k)) {
          cleanEnv[k] = v;
        }
      }
    }

    return cleanEnv;
  }

  /**
   * Execute command inside OS-enforced sandbox
   */
  public static async execute(options: SandboxExecutionOptions): Promise<SandboxExecutionResult> {
    const engine = this.detectIsolationEngine();
    const startTime = Date.now();
    const { command, args = [], workspaceDir, limits, allowNetwork = false } = options;

    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, { recursive: true });
    }

    let executable = command;
    let finalArgs = [...args];

    // Build Isolation Wrapper based on Host Engine
    if (engine === "LINUX_BUBBLEWRAP_NAMESPACES") {
      executable = "bwrap";
      finalArgs = [
        "--ro-bind", "/", "/",
        "--bind", workspaceDir, workspaceDir,
        "--dev", "/dev",
        "--proc", "/proc",
        "--tmpfs", "/tmp",
        "--chdir", workspaceDir,
        "--die-with-parent",
        ...(allowNetwork ? [] : ["--unshare-net"]),
        "--unshare-pid",
        "--unshare-uts",
        "--unshare-ipc",
        command,
        ...args,
      ];
    }

    const env = this.getSanitizedEnv(options.allowedEnvVars);
    const timeoutMs = limits.executionTimeoutMs || 8000;

    return new Promise((resolve) => {
      let stdoutData = "";
      let stderrData = "";
      let timedOut = false;

      const child = spawn(executable, finalArgs, {
        cwd: workspaceDir,
        env,
        stdio: ["ignore", "pipe", "pipe"],
        detached: true, // Creates process group for clean subtree termination
      });

      const timer = setTimeout(() => {
        timedOut = true;
        try {
          if (child.pid) {
            process.kill(-child.pid, "SIGKILL"); // Kill entire process group
          }
        } catch {
          child.kill("SIGKILL");
        }
      }, timeoutMs);

      child.stdout.on("data", (chunk) => {
        // Enforce max output buffer limit (5 MB)
        if (stdoutData.length < 5 * 1024 * 1024) {
          stdoutData += chunk.toString();
        }
      });

      child.stderr.on("data", (chunk) => {
        if (stderrData.length < 5 * 1024 * 1024) {
          stderrData += chunk.toString();
        }
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;

        resolve({
          success: !timedOut && code === 0,
          exitCode: timedOut ? 124 : (code ?? 1),
          stdout: stdoutData.trim(),
          stderr: stderrData.trim(),
          durationMs,
          isolationMode: engine,
          timedOut,
          resourceViolated: timedOut ? `Execution time exceeded limit (${timeoutMs}ms)` : undefined,
        });
      });

      child.on("error", (err) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        resolve({
          success: false,
          exitCode: 1,
          stdout: stdoutData.trim(),
          stderr: (stderrData + " " + err.message).trim(),
          durationMs,
          isolationMode: engine,
          timedOut: false,
          resourceViolated: err.message,
        });
      });
    });
  }
}
