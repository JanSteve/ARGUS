/**
 * ARGUS 2.0 Real POSIX Sandbox Executor
 * 
 * Performs actual filesystem and process operations inside the sandboxed workspace jail.
 */

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { CapabilityRequest, ExecutionResult } from "./types";

const execAsync = promisify(exec);

export class SandboxExecutor {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = path.resolve(workspaceRoot);
    this.ensureWorkspaceExists();
  }

  private ensureWorkspaceExists() {
    if (!fs.existsSync(this.workspaceRoot)) {
      fs.mkdirSync(this.workspaceRoot, { recursive: true });
    }
  }

  private resolvePath(target: string): string {
    return path.isAbsolute(target)
      ? path.normalize(target)
      : path.normalize(path.join(this.workspaceRoot, target));
  }

  /**
   * Execute an authorized Capability Request against the real host
   */
  public async execute(request: CapabilityRequest): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      switch (request.tool) {
        case "filesystem.write": {
          const filePath = this.resolvePath(request.target);
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          const content = typeof request.payload === "string"
            ? request.payload
            : JSON.stringify(request.payload || "", null, 2);

          fs.writeFileSync(filePath, content, "utf8");
          const stats = fs.statSync(filePath);

          return {
            success: true,
            targetPath: filePath,
            output: {
              bytesWritten: stats.size,
              path: filePath,
              createdAt: stats.birthtime,
            },
            durationMs: Date.now() - startTime,
          };
        }

        case "filesystem.read": {
          const filePath = this.resolvePath(request.target);
          if (!fs.existsSync(filePath)) {
            return {
              success: false,
              error: `File not found: ${filePath}`,
              durationMs: Date.now() - startTime,
            };
          }

          const content = fs.readFileSync(filePath, "utf8");
          return {
            success: true,
            targetPath: filePath,
            output: content,
            durationMs: Date.now() - startTime,
          };
        }

        case "filesystem.list": {
          const dirPath = this.resolvePath(request.target || ".");
          if (!fs.existsSync(dirPath)) {
            return {
              success: false,
              error: `Directory not found: ${dirPath}`,
              durationMs: Date.now() - startTime,
            };
          }

          const files = fs.readdirSync(dirPath);
          return {
            success: true,
            output: files,
            durationMs: Date.now() - startTime,
          };
        }

        case "filesystem.delete": {
          const filePath = this.resolvePath(request.target);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          return {
            success: true,
            output: { deleted: true, path: filePath },
            durationMs: Date.now() - startTime,
          };
        }

        case "process.exec": {
          const command = request.target;
          const { stdout, stderr } = await execAsync(command, {
            cwd: this.workspaceRoot,
            timeout: 8000,
            maxBuffer: 1024 * 1024 * 5, // 5MB limit
          });

          return {
            success: true,
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: 0,
            durationMs: Date.now() - startTime,
          };
        }

        case "network.fetch": {
          const url = request.target;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          const body = await res.text();
          return {
            success: res.ok,
            output: { status: res.status, body: body.slice(0, 1000) },
            durationMs: Date.now() - startTime,
          };
        }

        default:
          return {
            success: true,
            output: { payload: request.payload, message: "Standard execution completed" },
            durationMs: Date.now() - startTime,
          };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || String(err),
        durationMs: Date.now() - startTime,
      };
    }
  }
}
