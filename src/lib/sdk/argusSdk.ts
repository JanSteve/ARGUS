/**
 * ARGUS Sovereign Developer SDK (@argus/sdk)
 * 
 * "Build sovereign, permission-governed AI agents and tools."
 * 
 * Core API:
 * - createAgent(spec): Defines agent identity, role, risk tier, and initial capabilities
 * - registerTool(toolSpec): Exposes a native capability to the ARGUS intelligence runtime
 * - requestCapability(agentId, bounds): Issues a scoped, time-limited capability token
 * - createCheckpoint(agentId, desc): Creates atomic system snapshot with 1-click rollback
 * - verifyAction(assertion): Validates execution output against proof rules
 * - queryMemory(filter): Accesses encrypted episodic and semantic memory
 */

import { PermissionKernel, RiskLevel } from "../governance/permissionKernel";
import { AgentFirewall, CapabilityToken } from "../governance/agentFirewall";
import { CheckpointManager, SystemSnapshot } from "../runtime/checkpointEngine";
import { SovereignMemory } from "../memory/sovereignMemory";
import { FlightRecorder } from "../runtime/flightRecorder";

export interface AgentSpec {
  id: string;
  name: string;
  role: string;
  version: string;
  owner: string;
  riskTier: RiskLevel;
  requiredCapabilities: string[];
  systemInstructions: string;
}

export interface ToolSpec {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  execute: (params: any) => Promise<any>;
  verify: (result: any) => boolean;
}

class ArgusSDKClient {
  private agentRegistry: Map<string, AgentSpec> = new Map();
  private toolRegistry: Map<string, ToolSpec> = new Map();

  /**
   * Register a new sovereign agent definition
   */
  public createAgent(spec: AgentSpec): AgentSpec {
    this.agentRegistry.set(spec.id, spec);
    return spec;
  }

  /**
   * Register a native tool with built-in verification
   */
  public registerTool(tool: ToolSpec): ToolSpec {
    this.toolRegistry.set(tool.id, tool);
    return tool;
  }

  /**
   * Request a capability token for an agent
   */
  public requestCapability(params: {
    agentId: string;
    allowedPathsRead: string[];
    allowedPathsWrite: string[];
    allowedDomains?: string[];
    durationMinutes?: number;
  }): CapabilityToken {
    return AgentFirewall.issueCapabilityToken(params);
  }

  /**
   * Request operator authorization through the Permission Kernel
   */
  public async requestApproval(params: {
    agentId: string;
    agentName: string;
    tool: "filesystem" | "terminal" | "browser" | "code_sandbox" | "network" | "credentials" | "hardware";
    action: string;
    target: string;
    why: string;
    riskLevel?: RiskLevel;
  }) {
    return PermissionKernel.requestAuthorization(params);
  }

  /**
   * Create an atomic state checkpoint
   */
  public createCheckpoint(agentId: string, description: string): SystemSnapshot {
    return CheckpointManager.createSnapshot(`sdk_${Date.now()}`, agentId, description);
  }

  /**
   * Rollback to a previous state snapshot
   */
  public rollback(snapshotId: string) {
    return CheckpointManager.rollbackSnapshot(snapshotId);
  }

  /**
   * Query sovereign memory enclave
   */
  public async queryMemory(goal: string) {
    return SovereignMemory.retrieveRelevantContext(goal);
  }

  /**
   * List all registered agents
   */
  public getRegisteredAgents(): AgentSpec[] {
    return Array.from(this.agentRegistry.values());
  }

  /**
   * List all registered tools
   */
  public getRegisteredTools(): ToolSpec[] {
    return Array.from(this.toolRegistry.values());
  }
}

export const ArgusSDK = new ArgusSDKClient();
