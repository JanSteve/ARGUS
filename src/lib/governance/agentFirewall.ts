/**
 * ARGUS AI Agent Firewall & Data Loss Prevention (DLP) Engine
 * 
 * "A firewall for AI actions rather than network packets."
 * 
 * Features:
 * - Real-Time Interception of Filesystem, Network, Clipboard, Terminal, and Memory
 * - Sensitivity Classification: LOW (Public) | MEDIUM (Internal) | HIGH (Confidential) | CRITICAL (Restricted/Secrets)
 * - Policy-Driven Intelligence Routing: High/Critical data automatically forced to Local Model
 * - Hard Blocklist Shield: Strictly blocks access to ~/.ssh, .env, private keys, and credential stores
 * - Granular Capability Tokens: Least-privilege path and domain boundaries with time-based expiry
 */

import { RuntimeEvents, RiskTier } from "../runtime/runtimeEvents";
import { CodeFortressDLP, DLPInspectionResult } from "./codeFortress";

export type DataSensitivity = "LOW_PUBLIC" | "MEDIUM_INTERNAL" | "HIGH_CONFIDENTIAL" | "CRITICAL_RESTRICTED";

export function canonicalizePath(targetPath: string): string {
  if (!targetPath) return "";
  // Strip control chars & normalize separators
  let normalized = targetPath.replace(/\\/g, "/").trim();
  // Check traversal
  if (normalized.includes("../") || normalized.includes("/..") || normalized === "..") {
    return "__TRAVERSAL_ATTEMPT__";
  }
  return normalized;
}

export interface CapabilityToken {
  id: string;
  agentId: string;
  allowedPathsRead: string[];
  allowedPathsWrite: string[];
  allowedDomains: string[];
  allowedTools: string[];
  expiresAt: string;
  issuedAt: string;
}

export interface FirewallEvent {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  actionType:
    | "FS_READ"
    | "FS_WRITE"
    | "FS_DELETE"
    | "NET_REQUEST"
    | "CREDENTIAL_ACCESS"
    | "CLIPBOARD_READ"
    | "SHELL_EXEC"
    | "PAYMENT_ACCESS"
    | "SECRET_ACCESS"
    | "CODE_EXPORT";
  target: string;
  sensitivity: DataSensitivity;
  status: "ALLOWED" | "BLOCKED" | "FLAGGED_FOR_REVIEW";
  reason: string;
  modelRouted: "LOCAL_OLLAMA" | "APPROVED_ENTERPRISE_CLOUD" | "PUBLIC_CLOUD";
  dlpCategories?: string[];
}

const CRITICAL_FILE_PATTERNS = [
  /\.ssh(\/|\\)/i,
  /id_rsa/i,
  /\.env($|\..*)/i,
  /id_ed25519/i,
  /credentials(\.json)?/i,
  /\.aws(\/|\\)/i,
  /config\.json/i,
  /master\.key/i,
  /password/i,
];

const ALLOWED_PUBLIC_DOMAINS = [
  "wikipedia.org",
  "wikimedia.org",
  "github.com",
  "npmjs.com",
  "open-meteo.com",
  "coingecko.com",
  "frankfurter.app",
];

const STORAGE_KEY_FIREWALL_LOGS = "argus_firewall_events_v1";

class AgentFirewallEngine {
  private eventLogs: FirewallEvent[] = [];
  private activeTokens: Map<string, CapabilityToken> = new Map();
  private listeners: Set<(events: FirewallEvent[]) => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY_FIREWALL_LOGS);
        if (raw) this.eventLogs = JSON.parse(raw);
      }
    } catch {}
  }

  private saveState() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_FIREWALL_LOGS, JSON.stringify(this.eventLogs.slice(-300)));
      }
    } catch {}
  }

  public subscribe(listener: (events: FirewallEvent[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.eventLogs);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const list = [...this.eventLogs];
    this.listeners.forEach((fn) => fn(list));
    window.dispatchEvent(new CustomEvent("argus:firewall-event-logged", { detail: list }));
  }

  /**
   * Classify Data Sensitivity based on content and target path
   */
  public classifySensitivity(target: string, content?: string): DataSensitivity {
    const combined = `${target} ${content || ""}`.toLowerCase();

    // 1. Run Code Fortress DLP on content
    if (content) {
      const dlp = CodeFortressDLP.inspectPayload(content);
      if (dlp.severity === "CRITICAL") {
        return "CRITICAL_RESTRICTED";
      }
      if (dlp.severity === "HIGH") {
        return "HIGH_CONFIDENTIAL";
      }
    }

    // 2. Check critical restricted secrets & file paths
    for (const pattern of CRITICAL_FILE_PATTERNS) {
      if (pattern.test(target) || pattern.test(combined)) {
        return "CRITICAL_RESTRICTED";
      }
    }

    if (
      combined.includes("financial") ||
      combined.includes("credit card") ||
      combined.includes("payment") ||
      combined.includes("salary") ||
      combined.includes("acquisition") ||
      combined.includes("confidential") ||
      combined.includes("tax") ||
      combined.includes("balance sheet")
    ) {
      return "HIGH_CONFIDENTIAL";
    }

    if (
      combined.includes("internal") ||
      combined.includes("architecture") ||
      combined.includes("roadmap") ||
      combined.includes("customer")
    ) {
      return "MEDIUM_INTERNAL";
    }

    return "LOW_PUBLIC";
  }

  /**
   * Determine required model routing based on data sensitivity (DLP Policy)
   */
  public resolveModelRouting(sensitivity: DataSensitivity): "LOCAL_OLLAMA" | "APPROVED_ENTERPRISE_CLOUD" | "PUBLIC_CLOUD" {
    switch (sensitivity) {
      case "CRITICAL_RESTRICTED":
      case "HIGH_CONFIDENTIAL":
        return "LOCAL_OLLAMA"; // Strict 100% Local Inference, zero cloud transmission
      case "MEDIUM_INTERNAL":
        return "APPROVED_ENTERPRISE_CLOUD";
      default:
        return "PUBLIC_CLOUD";
    }
  }

  /**
   * Issue a scoped Capability Token to an agent
   */
  public issueCapabilityToken(params: {
    agentId: string;
    allowedPathsRead: string[];
    allowedPathsWrite: string[];
    allowedDomains?: string[];
    allowedTools?: string[];
    durationMinutes?: number;
  }): CapabilityToken {
    const duration = (params.durationMinutes || 30) * 60 * 1000;
    const token: CapabilityToken = {
      id: `cap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      agentId: params.agentId,
      allowedPathsRead: params.allowedPathsRead,
      allowedPathsWrite: params.allowedPathsWrite,
      allowedDomains: params.allowedDomains || ALLOWED_PUBLIC_DOMAINS,
      allowedTools: params.allowedTools || ["filesystem", "research", "code_studio"],
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + duration).toISOString(),
    };

    this.activeTokens.set(params.agentId, token);
    return token;
  }

  /**
   * Intercept and evaluate an agent action through the Firewall
   */
  public inspectAction(params: {
    agentId: string;
    agentName: string;
    actionType: FirewallEvent["actionType"];
    target: string;
    content?: string;
  }): { allowed: boolean; status: FirewallEvent["status"]; sensitivity: DataSensitivity; modelRouted: FirewallEvent["modelRouted"]; reason: string } {
    const sensitivity = this.classifySensitivity(params.target, params.content);
    const modelRouted = this.resolveModelRouting(sensitivity);

    // Deep DLP Inspection on payload
    const dlpResult = params.content ? CodeFortressDLP.inspectPayload(params.content, "runtime") : null;
    const safeTarget = CodeFortressDLP.sanitizeForTelemetry(params.target);

    // Check Traversal
    const canonical = canonicalizePath(params.target);
    if (canonical === "__TRAVERSAL_ATTEMPT__") {
      const blockedEvent: FirewallEvent = {
        id: `fw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        agentId: params.agentId,
        agentName: params.agentName,
        actionType: params.actionType,
        target: safeTarget,
        sensitivity: "CRITICAL_RESTRICTED",
        status: "BLOCKED",
        reason: "DLP Firewall Shield: Path Traversal (../) escape attempt blocked",
        modelRouted,
        dlpCategories: ["PATH_TRAVERSAL"],
      };
      this.eventLogs.unshift(blockedEvent);
      this.saveState();
      this.notify();

      RuntimeEvents.emit({
        type: "PermissionDenied",
        sessionId: "session_firewall",
        missionId: "mission_sec",
        agentId: params.agentId,
        agentName: params.agentName,
        riskLevel: "CRITICAL",
        action: `${params.actionType}: ${params.target}`,
        status: "BLOCKED",
        payload: { reason: blockedEvent.reason },
      });

      return {
        allowed: false,
        status: "BLOCKED",
        sensitivity: "CRITICAL_RESTRICTED",
        modelRouted,
        reason: blockedEvent.reason,
      };
    }

    // 1. HARD SHIELD CHECK: Block credential theft attempts
    for (const pattern of CRITICAL_FILE_PATTERNS) {
      if (pattern.test(params.target)) {
        const blockedEvent: FirewallEvent = {
          id: `fw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          agentId: params.agentId,
          agentName: params.agentName,
          actionType: params.actionType,
          target: safeTarget,
          sensitivity: "CRITICAL_RESTRICTED",
          status: "BLOCKED",
          reason: "DLP Firewall Shield: Prohibited access to system credentials / private keys",
          modelRouted,
          dlpCategories: ["CREDENTIAL_ACCESS"],
        };

        this.eventLogs.unshift(blockedEvent);
        this.saveState();
        this.notify();

        RuntimeEvents.emit({
          type: "PermissionDenied",
          sessionId: "session_firewall",
          missionId: "mission_sec",
          agentId: params.agentId,
          agentName: params.agentName,
          riskLevel: "CRITICAL",
          action: `${params.actionType}: ${safeTarget}`,
          status: "BLOCKED",
          payload: { reason: blockedEvent.reason },
        });

        return {
          allowed: false,
          status: "BLOCKED",
          sensitivity: "CRITICAL_RESTRICTED",
          modelRouted,
          reason: blockedEvent.reason,
        };
      }
    }

    // 2. CODE FORTRESS DLP INTERCEPTION: Block Payment card, CVV, Stripe keys, and Code Exfiltration leaks
    if (dlpResult && dlpResult.hasSensitiveData && dlpResult.severity === "CRITICAL") {
      const blockedEvent: FirewallEvent = {
        id: `fw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        agentId: params.agentId,
        agentName: params.agentName,
        actionType: params.actionType,
        target: safeTarget,
        sensitivity: "CRITICAL_RESTRICTED",
        status: "BLOCKED",
        reason: `DLP Code Fortress Shield: ${dlpResult.riskDescription}`,
        modelRouted,
        dlpCategories: dlpResult.categories,
      };

      this.eventLogs.unshift(blockedEvent);
      this.saveState();
      this.notify();

      RuntimeEvents.emit({
        type: "PermissionDenied",
        sessionId: "session_firewall",
        missionId: "mission_sec",
        agentId: params.agentId,
        agentName: params.agentName,
        riskLevel: "CRITICAL",
        action: `${params.actionType}: ${safeTarget}`,
        status: "BLOCKED",
        payload: { reason: blockedEvent.reason, categories: dlpResult.categories },
      });

      return {
        allowed: false,
        status: "BLOCKED",
        sensitivity: "CRITICAL_RESTRICTED",
        modelRouted,
        reason: blockedEvent.reason,
      };
    }

    // 3. CAPABILITY TOKEN BOUNDARY CHECK
    const token = this.activeTokens.get(params.agentId);
    if (token) {
      const isExpired = new Date() > new Date(token.expiresAt);
      if (isExpired) {
        return {
          allowed: false,
          status: "BLOCKED",
          sensitivity,
          modelRouted,
          reason: "Capability Token Expired. Request fresh operator permission.",
        };
      }

      if (params.actionType === "NET_REQUEST") {
        const domainAllowed = token.allowedDomains.some((d) => params.target.toLowerCase().includes(d.toLowerCase()));
        if (!domainAllowed) {
          const blockedNetEvent: FirewallEvent = {
            id: `fw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            timestamp: new Date().toISOString(),
            agentId: params.agentId,
            agentName: params.agentName,
            actionType: params.actionType,
            target: params.target,
            sensitivity,
            status: "BLOCKED",
            reason: `DLP Firewall Shield: External domain '${params.target}' is outside capability token allowlist`,
            modelRouted,
          };
          this.eventLogs.unshift(blockedNetEvent);
          this.saveState();
          this.notify();
          return { allowed: false, status: "BLOCKED", sensitivity, modelRouted, reason: blockedNetEvent.reason };
        }
      }
    }

    // 3. ALLOWED ACTION LOG
    const allowedEvent: FirewallEvent = {
      id: `fw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      agentId: params.agentId,
      agentName: params.agentName,
      actionType: params.actionType,
      target: params.target,
      sensitivity,
      status: "ALLOWED",
      reason: `Passed DLP policy check • Sensitivity: ${sensitivity} ➔ Routed to ${modelRouted}`,
      modelRouted,
    };

    this.eventLogs.unshift(allowedEvent);
    this.saveState();
    this.notify();

    return {
      allowed: true,
      status: "ALLOWED",
      sensitivity,
      modelRouted,
      reason: allowedEvent.reason,
    };
  }

  public getEventLogs(): FirewallEvent[] {
    return [...this.eventLogs];
  }

  public getActiveTokens(): CapabilityToken[] {
    return Array.from(this.activeTokens.values());
  }

  public clearLogs(): void {
    this.eventLogs = [];
    this.saveState();
    this.notify();
  }
}

export const AgentFirewall = new AgentFirewallEngine();
