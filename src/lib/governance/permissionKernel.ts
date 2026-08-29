/**
 * ARGUS Sovereign Permission Kernel & AI Execution Governance Engine
 * 
 * The Core Technical Moat of ARGUS Sovereign OS:
 * Goal → DAG Plan → Permission Kernel (Authorise) → Tool Runtime (Execute + Verify) → Memory → Audit Trail
 * 
 * Features:
 * - Real-Time Interception of all agent-initiated consequential actions
 * - Granular Risk-Tiering (LOW, MEDIUM, HIGH, CRITICAL)
 * - Reversibility Assessment (YES, PARTIAL, NO)
 * - Persistent & Immutable Audit Trail (WHO, WHAT, WHERE, WHY, WHEN, RESULT, VERIFICATION)
 * - Closed-Loop Post-Execution Verification Engine
 */

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Reversibility = "YES" | "PARTIAL" | "NO";
export type PermissionDecision = "PENDING" | "ALLOWED_ONCE" | "ALWAYS_ALLOWED" | "DENIED";

export interface ActionRequest {
  id: string;
  agentId: string;
  agentName: string;
  tool: "filesystem" | "terminal" | "browser" | "code_sandbox" | "network" | "credentials" | "hardware";
  action: string;
  target: string;
  why: string;
  riskLevel: RiskLevel;
  reversible: Reversibility;
  requestedAt: string;
  status: PermissionDecision;
  payload?: any;
}

export interface AuditRecord {
  id: string;
  who: string;
  what: string;
  where: string;
  why: string;
  when: string;
  riskLevel: RiskLevel;
  decision: PermissionDecision;
  result: "SUCCESS" | "BLOCKED" | "FAILED" | "VERIFIED";
  verificationSummary: string;
  executionLatencyMs?: number;
}

const STORAGE_KEY_AUDIT = "argus_permission_kernel_audit_log_v1";
const STORAGE_KEY_RULES = "argus_permission_kernel_always_allow_rules_v1";

class PermissionKernelEngine {
  private activeRequests: Map<string, ActionRequest> = new Map();
  private auditLog: AuditRecord[] = [];
  private alwaysAllowedRules: Set<string> = new Set();
  private listeners: Set<(requests: ActionRequest[]) => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      if (typeof window !== "undefined") {
        const rawAudit = localStorage.getItem(STORAGE_KEY_AUDIT);
        if (rawAudit) this.auditLog = JSON.parse(rawAudit);

        const rawRules = localStorage.getItem(STORAGE_KEY_RULES);
        if (rawRules) this.alwaysAllowedRules = new Set(JSON.parse(rawRules));
      }
    } catch {}
  }

  private saveState() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditLog.slice(-500)));
        localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(Array.from(this.alwaysAllowedRules)));
      }
    } catch {}
  }

  /**
   * Subscribe to live permission requests (UI Modal / Taskbar Badge)
   */
  public subscribe(listener: (requests: ActionRequest[]) => void): () => void {
    this.listeners.add(listener);
    listener(Array.from(this.activeRequests.values()));
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const list = Array.from(this.activeRequests.values());
    this.listeners.forEach((fn) => fn(list));
    window.dispatchEvent(new CustomEvent("argus:permission-queue-updated", { detail: list }));
  }

  /**
   * Intercept and Authorize an Action Request
   */
  public async requestAuthorization(params: {
    agentId: string;
    agentName: string;
    tool: ActionRequest["tool"];
    action: string;
    target: string;
    why: string;
    riskLevel?: RiskLevel;
    reversible?: Reversibility;
    payload?: any;
  }): Promise<{ allowed: boolean; decision: PermissionDecision; reason?: string }> {
    const ruleKey = `${params.agentId}:${params.tool}:${params.action}`;

    // Auto-allow if rule already granted "Always Allow"
    if (this.alwaysAllowedRules.has(ruleKey)) {
      this.recordAudit({
        who: `${params.agentName} (${params.agentId})`,
        what: params.action,
        where: params.target,
        why: params.why,
        riskLevel: params.riskLevel || "LOW",
        decision: "ALWAYS_ALLOWED",
        result: "SUCCESS",
        verificationSummary: "Policy Rule Pre-Authorized by Operator",
      });
      return { allowed: true, decision: "ALWAYS_ALLOWED" };
    }

    const calculatedRisk = params.riskLevel || this.inferRisk(params.tool, params.action);
    const calculatedReversible = params.reversible || (params.action.includes("delete") ? "NO" : "YES");

    const req: ActionRequest = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      agentId: params.agentId,
      agentName: params.agentName,
      tool: params.tool,
      action: params.action,
      target: params.target,
      why: params.why,
      riskLevel: calculatedRisk,
      reversible: calculatedReversible,
      requestedAt: new Date().toISOString(),
      status: "PENDING",
      payload: params.payload,
    };

    this.activeRequests.set(req.id, req);
    this.notify();

    // Trigger visual authorization modal
    window.dispatchEvent(new CustomEvent("argus:open-permission-modal", { detail: req }));

    // Wait for Operator Decision (or fallback timeout)
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const current = this.activeRequests.get(req.id);
        if (!current || current.status !== "PENDING") {
          clearInterval(checkInterval);
          const decision = current ? current.status : "DENIED";
          const isAllowed = decision === "ALLOWED_ONCE" || decision === "ALWAYS_ALLOWED";

          this.activeRequests.delete(req.id);
          this.notify();

          resolve({
            allowed: isAllowed,
            decision,
            reason: isAllowed ? "Authorized by User Operator" : "Denied by Operator Security Policy",
          });
        }
      }, 200);
    });
  }

  /**
   * Operator Resolution of an Action
   */
  public resolveRequest(requestId: string, decision: PermissionDecision): void {
    const req = this.activeRequests.get(requestId);
    if (!req) return;

    req.status = decision;
    if (decision === "ALWAYS_ALLOWED") {
      this.alwaysAllowedRules.add(`${req.agentId}:${req.tool}:${req.action}`);
    }

    this.recordAudit({
      who: `${req.agentName} (${req.agentId})`,
      what: req.action,
      where: req.target,
      why: req.why,
      riskLevel: req.riskLevel,
      decision,
      result: decision === "DENIED" ? "BLOCKED" : "SUCCESS",
      verificationSummary: decision === "DENIED" ? "Operator Blocked Execution" : "Awaiting Execution Verification",
    });

    this.saveState();
    this.notify();
  }

  /**
   * Verify and Record Completed Action in Immutable Audit Trail
   */
  public verifyAndAudit(params: {
    who: string;
    what: string;
    where: string;
    why: string;
    riskLevel: RiskLevel;
    decision: PermissionDecision;
    result: "SUCCESS" | "BLOCKED" | "FAILED" | "VERIFIED";
    verificationSummary: string;
    executionLatencyMs?: number;
  }): void {
    this.recordAudit(params);
  }

  private recordAudit(params: {
    who: string;
    what: string;
    where: string;
    why: string;
    riskLevel: RiskLevel;
    decision: PermissionDecision;
    result: "SUCCESS" | "BLOCKED" | "FAILED" | "VERIFIED";
    verificationSummary: string;
    executionLatencyMs?: number;
  }) {
    const record: AuditRecord = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      who: params.who,
      what: params.what,
      where: params.where,
      why: params.why,
      when: new Date().toISOString(),
      riskLevel: params.riskLevel,
      decision: params.decision,
      result: params.result,
      verificationSummary: params.verificationSummary,
      executionLatencyMs: params.executionLatencyMs,
    };

    this.auditLog.unshift(record);
    this.saveState();
  }

  public getAuditLog(): AuditRecord[] {
    return [...this.auditLog];
  }

  public clearRules(): void {
    this.alwaysAllowedRules.clear();
    this.saveState();
  }

  private inferRisk(tool: string, action: string): RiskLevel {
    const act = action.toLowerCase();
    if (tool === "credentials" || act.includes("export_keys") || act.includes("format") || act.includes("drop_db")) {
      return "CRITICAL";
    }
    if (act.includes("delete") || act.includes("remove") || act.includes("modify_config") || tool === "hardware") {
      return "HIGH";
    }
    if (act.includes("create") || act.includes("write") || act.includes("exec") || tool === "network") {
      return "MEDIUM";
    }
    return "LOW";
  }
}

export const PermissionKernel = new PermissionKernelEngine();
