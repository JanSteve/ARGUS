/**
 * ARGUS 2.0 Capability Contract System (Phase 1.5)
 * 
 * Defines machine-readable, cryptographically enforceable capability contracts for AI agents.
 * No agent executes arbitrarily; every agent is bounded by its Capability Contract.
 */

import crypto from "crypto";

export interface ResourceLimits {
  cpuSeconds: number;
  memoryMB: number;
  maxProcesses: number;
  diskQuotaMB?: number;
  executionTimeoutMs: number;
}

export interface CapabilityContract {
  contractId: string;
  agent: string;
  role: string;
  version: string;
  capabilities: string[];
  denied: string[];
  approvalRequired: string[];
  resourceLimits: ResourceLimits;
  networkAllowlist?: string[];
  signature?: string;
}

export const STANDARD_CONTRACTS: Record<string, CapabilityContract> = {
  "developer-agent": {
    contractId: "CONTRACT-DEV-001",
    agent: "developer-agent",
    role: "Code Synthesizer & Bug Fixer",
    version: "1.0.0",
    capabilities: [
      "workspace.read",
      "workspace.write",
      "workspace.list",
      "process.execute",
      "network.read",
    ],
    denied: [
      "credential.read",
      "system.modify",
      "external.message.send",
      "root.execute",
      "network.write",
    ],
    approvalRequired: [
      "package.install",
      "deployment.execute",
      "git.force_push",
      "workspace.bulk_delete",
    ],
    resourceLimits: {
      cpuSeconds: 60,
      memoryMB: 512,
      maxProcesses: 8,
      diskQuotaMB: 250,
      executionTimeoutMs: 8000,
    },
    networkAllowlist: [
      "registry.npmjs.org",
      "api.github.com",
    ],
  },

  "research-agent": {
    contractId: "CONTRACT-RES-001",
    agent: "research-agent",
    role: "Market & Document Intelligence",
    version: "1.0.0",
    capabilities: [
      "workspace.read",
      "workspace.write",
      "network.read",
    ],
    denied: [
      "process.execute",
      "credential.read",
      "system.modify",
      "external.message.send",
      "network.write",
    ],
    approvalRequired: [
      "external.api.paid_query",
    ],
    resourceLimits: {
      cpuSeconds: 30,
      memoryMB: 256,
      maxProcesses: 2,
      diskQuotaMB: 100,
      executionTimeoutMs: 5000,
    },
    networkAllowlist: [
      "en.wikipedia.org",
      "api.github.com",
      "arxiv.org",
    ],
  },

  "security-agent": {
    contractId: "CONTRACT-SEC-001",
    agent: "security-agent",
    role: "Read-Only Security & Audit Inspector",
    version: "1.0.0",
    capabilities: [
      "workspace.read",
      "workspace.list",
      "process.execute",
      "telemetry.read",
    ],
    denied: [
      "workspace.write",
      "credential.read",
      "system.modify",
      "external.message.send",
      "network.write",
    ],
    approvalRequired: [
      "security.remediation.apply",
    ],
    resourceLimits: {
      cpuSeconds: 45,
      memoryMB: 512,
      maxProcesses: 4,
      diskQuotaMB: 50,
      executionTimeoutMs: 6000,
    },
  },
};

export class CapabilityContractValidator {
  /**
   * Evaluates whether an agent action complies with its Capability Contract
   */
  public static evaluateAction(
    contract: CapabilityContract,
    action: {
      capability: string;
      target: string;
      isWrite?: boolean;
    }
  ): {
    allowed: boolean;
    requiresApproval: boolean;
    rule: string;
    reason: string;
  } {
    const { capability, target } = action;

    // 1. Check Hard-Denied Capabilities
    for (const deniedCap of contract.denied) {
      if (capability.startsWith(deniedCap) || capability === deniedCap) {
        return {
          allowed: false,
          requiresApproval: false,
          rule: "CONTRACT_DENIED_RULE",
          reason: `Action "${capability}" is explicitly denied in agent contract ${contract.contractId}.`,
        };
      }
    }

    // 2. Check Human Approval Triggers
    for (const approvalCap of contract.approvalRequired) {
      if (capability.startsWith(approvalCap) || capability === approvalCap) {
        return {
          allowed: false,
          requiresApproval: true,
          rule: "CONTRACT_APPROVAL_REQUIRED",
          reason: `Action "${capability}" requires explicit Human Approval under contract ${contract.contractId}.`,
        };
      }
    }

    // 3. Check Allowed Capabilities
    const hasCapability = contract.capabilities.some(
      (c) => capability.startsWith(c) || capability === c || c === "*"
    );

    if (!hasCapability) {
      return {
        allowed: false,
        requiresApproval: false,
        rule: "CONTRACT_UNAUTHORIZED_CAPABILITY",
        reason: `Capability "${capability}" is not granted to agent in contract ${contract.contractId}.`,
      };
    }

    return {
      allowed: true,
      requiresApproval: false,
      rule: "CONTRACT_AUTHORIZED",
      reason: `Action "${capability}" authorized under contract ${contract.contractId}.`,
    };
  }
}
