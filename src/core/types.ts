/**
 * ARGUS 2.0 Linux/POSIX Native Core — Type Definitions & Capability Contracts
 * 
 * Execution Paradigm:
 * Objective → AI Planner → Capability Request → Policy Kernel → Sandbox Jail → Real Execution → Verification → Flight Recorder
 */

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type CapabilityType =
  | "filesystem.read"
  | "filesystem.write"
  | "filesystem.delete"
  | "filesystem.list"
  | "process.exec"
  | "network.fetch"
  | "vault.encrypt"
  | "vault.decrypt"
  | "memory.commit";

export interface CapabilityRequest {
  id: string;
  objectiveId: string;
  tool: CapabilityType;
  target: string;
  payload?: any;
  riskLevel: RiskLevel;
  requester: {
    agentId: string;
    role: string;
  };
  timestamp: string;
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  riskLevel: RiskLevel;
  matchedRule: string;
  requiresHumanApproval: boolean;
  evaluatedAt: string;
}

export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  durationMs: number;
  targetPath?: string;
}

export interface VerificationAssertion {
  verified: boolean;
  target: string;
  checks: Array<{ name: string; passed: boolean; details: string }>;
  sha256Checksum?: string;
  sizeBytes?: number;
  durationMs: number;
}

export interface FlightRecordEvent {
  eventId: string;
  sessionId: string;
  objective: string;
  timestamp: string;
  stepIndex: number;
  capability: CapabilityRequest;
  policy: PolicyDecision;
  execution?: ExecutionResult;
  verification?: VerificationAssertion;
}

export interface FlightRecordSession {
  sessionId: string;
  objective: string;
  startedAt: string;
  completedAt?: string;
  status: "IN_PROGRESS" | "VERIFIED" | "FAILED" | "BLOCKED";
  events: FlightRecordEvent[];
  summary: {
    totalCapabilities: number;
    allowed: number;
    blocked: number;
    verified: number;
    durationMs: number;
  };
}
