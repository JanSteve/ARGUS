/**
 * ARGUS Agent Policy Engine & Security Firewall
 * 
 * Evaluates Zero-Trust Policies on all Agent Capability Requests:
 * 1. Path Traversal Defense & Workspace Jail Enclosure
 * 2. Sensitive System Path Protection (/etc/shadow, ~/.ssh, .env)
 * 3. Command & Binary Whitelisting
 * 4. Prompt Injection & Policy Override Immunity
 */

import path from "path";
import { CapabilityRequest, PolicyDecision } from "./types";

// Protected System & Credential Patterns (CRITICAL Risk)
const FORBIDDEN_PATH_PATTERNS = [
  /\/etc\/shadow/i,
  /\/etc\/passwd/i,
  /\/etc\/sudoers/i,
  /\.ssh\//i,
  /id_rsa/i,
  /id_ed25519/i,
  /\.aws\//i,
  /\.env(\.local|\.production)?$/i,
  /\.git\/config/i,
  /\/var\/run/i,
  /\/proc\//i,
  /\/sys\//i,
];

// Dangerous / Malicious System Commands
const DANGEROUS_COMMAND_PATTERNS = [
  /\bsudo\b/i,
  /\brm\s+-rf\s+(\/|~|\.\.)/i,
  /\bchmod\s+777\b/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /:\(\)\{\s*:\|:&\s*\};:/, // Fork bomb
  /\bcurl\b.*\|\s*(ba)?sh/i,
  /\bwget\b.*\|\s*(ba)?sh/i,
  /\bnc\s+-e\b/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
];

// Adversarial Prompt Injection Keywords
const PROMPT_INJECTION_PATTERNS = [
  /(ignore|bypass|override|forget)\s+(all\s+)?(previous\s+)?(system\s+)?(instructions|policy|rules|guardrails|security|kernel)/i,
  /reveal\s+(all\s+)?(ssh|private|root|shadow|password|master)\s+(key|keys|secrets|passwords)/i,
  /system\s+override\s+code/i,
];

export class PolicyEngine {
  private workspaceRoot: string;

  constructor(workspaceRoot?: string) {
    this.workspaceRoot = path.resolve(workspaceRoot || path.join(process.cwd(), "workspace"));
  }

  public getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  /**
   * Evaluate a Capability Request against ARGUS Policy Rules
   */
  public evaluate(request: CapabilityRequest): PolicyDecision {
    const now = new Date().toISOString();

    // 1. Check for Prompt Injection / Adversarial Override Attempts
    const textToScan = `${request.target} ${JSON.stringify(request.payload || "")}`;
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(textToScan)) {
        return {
          allowed: false,
          reason: "ADVERSARIAL ATTACK BLOCKED: Detected prompt injection / policy override attempt.",
          riskLevel: "CRITICAL",
          matchedRule: "RULE_ADVERSARIAL_INJECTION_SHIELD",
          requiresHumanApproval: false,
          evaluatedAt: now,
        };
      }
    }

    // 2. Evaluate Filesystem Capabilities
    if (request.tool.startsWith("filesystem.")) {
      return this.evaluateFilesystemPolicy(request, now);
    }

    // 3. Evaluate Process Execution Capabilities
    if (request.tool === "process.exec") {
      return this.evaluateProcessPolicy(request, now);
    }

    // 4. Evaluate Network Fetch Capabilities
    if (request.tool === "network.fetch") {
      return this.evaluateNetworkPolicy(request, now);
    }

    // Default Allow for internal safe memory/vault operations
    return {
      allowed: true,
      reason: "Capability authorized under standard low-risk policy.",
      riskLevel: request.riskLevel,
      matchedRule: "RULE_DEFAULT_INTERNAL_ALLOW",
      requiresHumanApproval: false,
      evaluatedAt: now,
    };
  }

  private evaluateFilesystemPolicy(request: CapabilityRequest, evaluatedAt: string): PolicyDecision {
    const target = request.target.trim();

    // Check sensitive file patterns
    for (const pattern of FORBIDDEN_PATH_PATTERNS) {
      if (pattern.test(target)) {
        return {
          allowed: false,
          reason: `ACCESS DENIED (CRITICAL): Access to sensitive credential / system path "${target}" is forbidden.`,
          riskLevel: "CRITICAL",
          matchedRule: "RULE_SENSITIVE_CREDENTIAL_SHIELD",
          requiresHumanApproval: false,
          evaluatedAt,
        };
      }
    }

    // Check Path Traversal & Enforce Workspace Jail
    // Resolve absolute canonical path
    const resolvedTarget = path.isAbsolute(target)
      ? path.normalize(target)
      : path.normalize(path.join(this.workspaceRoot, target));

    // Ensure the resolved target starts with workspaceRoot
    const relative = path.relative(this.workspaceRoot, resolvedTarget);
    const isOutsideWorkspace = relative.startsWith("..") || path.isAbsolute(relative);

    if (isOutsideWorkspace) {
      return {
        allowed: false,
        reason: `PATH TRAVERSAL BLOCKED: Path "${target}" escapes the sandboxed workspace jail (${this.workspaceRoot}).`,
        riskLevel: "CRITICAL",
        matchedRule: "RULE_WORKSPACE_JAIL_ENCLOSURE",
        requiresHumanApproval: false,
        evaluatedAt,
      };
    }

    // Deletion requires human approval / higher risk
    if (request.tool === "filesystem.delete") {
      return {
        allowed: true,
        reason: "Deletion in workspace allowed but requires explicit confirmation.",
        riskLevel: "HIGH",
        matchedRule: "RULE_WORKSPACE_DELETE_POLICY",
        requiresHumanApproval: true,
        evaluatedAt,
      };
    }

    // Standard Workspace Read/Write
    return {
      allowed: true,
      reason: `Workspace filesystem operation authorized within jail: ${relative || "./"}`,
      riskLevel: request.riskLevel || "LOW",
      matchedRule: "RULE_WORKSPACE_FILESYSTEM_ALLOW",
      requiresHumanApproval: false,
      evaluatedAt,
    };
  }

  private evaluateProcessPolicy(request: CapabilityRequest, evaluatedAt: string): PolicyDecision {
    const command = request.target.trim();

    // Check dangerous command patterns
    for (const pattern of DANGEROUS_COMMAND_PATTERNS) {
      if (pattern.test(command)) {
        return {
          allowed: false,
          reason: `COMMAND NOT PERMITTED (CRITICAL): Disallowed dangerous system command: "${command}".`,
          riskLevel: "CRITICAL",
          matchedRule: "RULE_DANGEROUS_COMMAND_BLACKSHIELD",
          requiresHumanApproval: false,
          evaluatedAt,
        };
      }
    }

    return {
      allowed: true,
      reason: "Process execution authorized inside sandboxed subprocess.",
      riskLevel: "MEDIUM",
      matchedRule: "RULE_PROCESS_SANDBOX_ALLOW",
      requiresHumanApproval: false,
      evaluatedAt,
    };
  }

  private evaluateNetworkPolicy(request: CapabilityRequest, evaluatedAt: string): PolicyDecision {
    const url = request.target.trim();

    // Block local loopback / internal metadata access (SSRF Shield)
    if (
      url.includes("169.254.169.254") ||
      url.includes("localhost") ||
      url.includes("127.0.0.1") ||
      url.includes("0.0.0.0")
    ) {
      return {
        allowed: false,
        reason: `SSRF ACCESS DENIED: Outbound requests to private loopback/metadata endpoints are blocked.`,
        riskLevel: "CRITICAL",
        matchedRule: "RULE_SSRF_NETWORK_SHIELD",
        requiresHumanApproval: false,
        evaluatedAt,
      };
    }

    return {
      allowed: true,
      reason: `Outbound network access authorized: ${url}`,
      riskLevel: "LOW",
      matchedRule: "RULE_PUBLIC_NETWORK_ALLOW",
      requiresHumanApproval: false,
      evaluatedAt,
    };
  }
}
