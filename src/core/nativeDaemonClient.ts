/**
 * ARGUS 2.0 Native Daemon Bridge (TypeScript Intelligence ➔ Rust Native Runtime)
 * 
 * Mediates all communication between the AI Intelligence Layer (LLM Router, Voice)
 * and the privileged Rust Native Daemon (`argusd`).
 * 
 * Zero Direct OS Access: Every action is mediated via Capability Tokens and Policy Decisions.
 */

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

export interface NativeDaemonResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}

export class NativeDaemonClient {
  private static projectRoot = path.resolve(process.cwd());

  /**
   * Introspect host OS and native Rust runtime health
   */
  public static async getDoctorDiagnostics(): Promise<NativeDaemonResponse<string>> {
    const t0 = Date.now();
    try {
      const { stdout } = await execAsync("cargo run --manifest-path crates/argusd/Cargo.toml -- doctor", {
        cwd: this.projectRoot,
      });
      return {
        success: true,
        data: stdout,
        durationMs: Date.now() - t0,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        durationMs: Date.now() - t0,
      };
    }
  }

  /**
   * Execute 10 Real-World Linux Benchmark Tasks on Native Rust Core
   */
  public static async runBenchmark(): Promise<NativeDaemonResponse<string>> {
    const t0 = Date.now();
    try {
      const { stdout } = await execAsync("cargo run --manifest-path crates/argusd/Cargo.toml -- benchmark", {
        cwd: this.projectRoot,
      });
      return {
        success: true,
        data: stdout,
        durationMs: Date.now() - t0,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        durationMs: Date.now() - t0,
      };
    }
  }

  /**
   * Ingest voice command and trigger 4-Tier Voice Synthesis Cascade
   */
  public static async executeVoiceCommand(spokenText: string): Promise<NativeDaemonResponse<string>> {
    const t0 = Date.now();
    try {
      const escaped = spokenText.replace(/"/g, '\\"');
      const { stdout } = await execAsync(`cargo run --manifest-path crates/argusd/Cargo.toml -- voice "${escaped}"`, {
        cwd: this.projectRoot,
      });
      return {
        success: true,
        data: stdout,
        durationMs: Date.now() - t0,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        durationMs: Date.now() - t0,
      };
    }
  }

  /**
   * Execute Autonomous Developer Agent Mission with Live Telemetry
   */
  public static async streamMission(objective: string): Promise<NativeDaemonResponse<string>> {
    const t0 = Date.now();
    try {
      const escaped = objective.replace(/"/g, '\\"');
      const { stdout } = await execAsync(`node bin/argus.mjs mission stream "${escaped}"`, {
        cwd: this.projectRoot,
      });
      return {
        success: true,
        data: stdout,
        durationMs: Date.now() - t0,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        durationMs: Date.now() - t0,
      };
    }
  }
}
