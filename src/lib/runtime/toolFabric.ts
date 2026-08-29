/**
 * ARGUS Tool Fabric & Protocol (M5, M14, Phase 1 Hardening)
 * 
 * "Every application exposes structured tools rather than pixel-clicking."
 * 
 * Capabilities:
 * - filesystem: read, write, list, delete, stat (sandboxed to argus://workspace/)
 * - command: allowlisted structured command runner (git, npm, node, python, cargo, ls, pwd, cat, mkdir)
 * - notes: create, read, list, update, delete (persistent storage)
 * - browser: search, fetch, extract (read-only, domain allowlist)
 * - code: compilePrototype, testRunner
 * - crm: createLead, updateLead, getLead, listLeads
 * - verifier: assertCriterion, assertFileExists, assertNonEmpty
 */

import { PermissionKernel, RiskLevel } from "../governance/permissionKernel";
import { AgentFirewall, canonicalizePath } from "../governance/agentFirewall";
import { queryWikipedia } from "../apis/publicApiGateway";
import { RuntimeEvents, RiskTier } from "./runtimeEvents";

export interface ToolCallResult<T = any> {
  success: boolean;
  data: T;
  riskLevel: RiskTier;
  verified: boolean;
  executionMs: number;
  error?: string;
}

export interface WorkspaceFileRecord {
  path: string;
  content: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  checksum: string;
}

export interface CommandExecutionResult {
  command: string;
  args: string[];
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  timedOut: boolean;
}

const ALLOWED_COMMANDS = new Set([
  "git",
  "npm",
  "node",
  "python",
  "python3",
  "cargo",
  "ls",
  "pwd",
  "cat",
  "mkdir",
  "echo",
]);

const STORAGE_KEY_WORKSPACE = "argus:workspace:files";

class ToolFabricEngine {
  private getWorkspaceStore(): Map<string, WorkspaceFileRecord> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WORKSPACE);
      if (raw) {
        const parsed = JSON.parse(raw);
        return new Map(Object.entries(parsed));
      }
    } catch {}
    return new Map();
  }

  private saveWorkspaceStore(store: Map<string, WorkspaceFileRecord>) {
    try {
      const obj = Object.fromEntries(store.entries());
      localStorage.setItem(STORAGE_KEY_WORKSPACE, JSON.stringify(obj));
      window.dispatchEvent(new CustomEvent("argus:workspace-updated"));
    } catch {}
  }

  private simpleChecksum(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `chk_${Math.abs(hash).toString(16)}`;
  }

  // ==========================================
  // 1. REAL SANDBOXED FILESYSTEM CAPABILITY
  // ==========================================

  public async readFile(params: { path: string; agentId: string }): Promise<ToolCallResult<{ path: string; content: string; size: number }>> {
    const start = Date.now();
    const riskLevel: RiskTier = "LOW";

    RuntimeEvents.emit({
      type: "ToolRequested",
      sessionId: "session_exec",
      missionId: "mission_fs",
      agentId: params.agentId,
      toolId: "filesystem.read",
      riskLevel,
      action: `Read File: ${params.path}`,
      status: "PENDING",
    });

    // Inspect via Agent Firewall
    const fw = AgentFirewall.inspectAction({
      agentId: params.agentId,
      agentName: "Filesystem Tool",
      actionType: "FS_READ",
      target: params.path,
    });

    if (!fw.allowed) {
      RuntimeEvents.emit({
        type: "ToolFailed",
        sessionId: "session_exec",
        missionId: "mission_fs",
        agentId: params.agentId,
        toolId: "filesystem.read",
        riskLevel,
        action: `Read File: ${params.path}`,
        status: "BLOCKED",
        payload: { reason: fw.reason },
      });
      return { success: false, data: { path: params.path, content: "", size: 0 }, riskLevel, verified: false, executionMs: Date.now() - start, error: fw.reason };
    }

    const canonical = canonicalizePath(params.path);
    const store = this.getWorkspaceStore();
    const file = store.get(canonical);

    if (!file) {
      return { success: false, data: { path: params.path, content: "", size: 0 }, riskLevel, verified: false, executionMs: Date.now() - start, error: `File not found: ${params.path}` };
    }

    RuntimeEvents.emit({
      type: "ToolExecuted",
      sessionId: "session_exec",
      missionId: "mission_fs",
      agentId: params.agentId,
      toolId: "filesystem.read",
      riskLevel,
      action: `Read File: ${params.path}`,
      status: "SUCCESS",
      payload: { size: file.sizeBytes },
    });

    return {
      success: true,
      data: { path: file.path, content: file.content, size: file.sizeBytes },
      riskLevel,
      verified: true,
      executionMs: Date.now() - start,
    };
  }

  public async writeFile(params: { path: string; content: string; agentId: string }): Promise<ToolCallResult<{ path: string; sizeBytes: number; checksum: string }>> {
    const start = Date.now();
    const riskLevel: RiskTier = "MEDIUM";

    RuntimeEvents.emit({
      type: "ToolRequested",
      sessionId: "session_exec",
      missionId: "mission_fs",
      agentId: params.agentId,
      toolId: "filesystem.write",
      riskLevel,
      action: `Write File: ${params.path}`,
      status: "PENDING",
    });

    const fw = AgentFirewall.inspectAction({
      agentId: params.agentId,
      agentName: "Filesystem Tool",
      actionType: "FS_WRITE