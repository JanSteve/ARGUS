/**
 * ARGUS 2.0 Action Explainability Engine ("Why?")
 * 
 * Generates transparent, human-auditable rationales for every action taken by an AI agent.
 */

export interface ActionRationale {
  executionId: string;
  agentId: string;
  agentRole: string;
  missionId: string;
  action: string;
  why: string;
  capabilityTokenId: string;
  policyDecision: {
    allowed: boolean;
    rule: string;
    risk: string;
  };
  dataSentSummary?: string;
  dataReceivedSummary?: string;
  verificationEvidence?: string;
  result: "SUCCESS" | "BLOCKED" | "VERIFICATION_FAILED" | "RUNTIME_ERROR";
  timestamp: string;
}

export class ExplainabilityEngine {
  public static formatRationale(rationale: ActionRationale): string {
    const lines: string[] = [];
    lines.push("\n\x1b[36m================================================================================\x1b[0m");
    lines.push("\x1b[36m                       ARGUS ACTION EXPLAINABILITY LOG                          \x1b[0m");
    lines.push("\x1b[36m================================================================================\x1b[0m");
    lines.push(`Execution ID:          ${rationale.executionId}`);
    lines.push(`Agent:                 ${rationale.agentId} (${rationale.agentRole})`);
    lines.push(`Mission:               ${rationale.missionId}`);
    lines.push(`Action:                ${rationale.action}`);
    lines.push(`\x1b[33mWhy:                   ${rationale.why}\x1b[0m`);
    lines.push(`Capability Token:      ${rationale.capabilityTokenId}`);
    lines.push(`Policy Decision:       ${rationale.policyDecision.allowed ? "\x1b[32mALLOW\x1b[0m" : "\x1b[31mDENY\x1b[0m"} (Rule: ${rationale.policyDecision.rule}, Risk: ${rationale.policyDecision.risk})`);
    
    if (rationale.dataSentSummary) {
      lines.push(`Data Sent:             ${rationale.dataSentSummary}`);
    }
    if (rationale.dataReceivedSummary) {
      lines.push(`Data Received:         ${rationale.dataReceivedSummary}`);
    }
    if (rationale.verificationEvidence) {
      lines.push(`Verification Proof:    \x1b[32m${rationale.verificationEvidence}\x1b[0m`);
    }

    const resultColor = rationale.result === "SUCCESS" ? "\x1b[32m" : "\x1b[31m";
    lines.push(`Final Outcome:         ${resultColor}${rationale.result}\x1b[0m`);
    lines.push(`Timestamp:             ${rationale.timestamp}`);
    lines.push("\x1b[36m================================================================================\x1b[0m\n");

    return lines.join("\n");
  }
}
