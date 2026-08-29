/**
 * ARGUS 2.0 Linux Native Execution Runtime
 * 
 * End-to-End Orchestrator:
 * User Objective → Planner → Capability Request → Policy Kernel → Sandbox Jail → Real Execution → Verification → Flight Recorder
 */

import { PolicyEngine } from "./policyEngine";
import { SandboxExecutor } from "./sandboxExecutor";
import { IndependentVerifier } from "./verifier";
import { FlightRecorder } from "./flightRecorder";
import { CapabilityRequest, PolicyDecision, ExecutionResult, VerificationAssertion, FlightRecordSession } from "./types";

export class ArgusCoreRuntime {
  private policyEngine: PolicyEngine;
  private sandboxExecutor: SandboxExecutor;
  private verifier: IndependentVerifier;
  private flightRecorder: FlightRecorder;
  private workspaceRoot: string;

  constructor(workspaceRoot?: string) {
    this.policyEngine = new PolicyEngine(workspaceRoot);
    this.workspaceRoot = this.policyEngine.getWorkspaceRoot();
    this.sandboxExecutor = new SandboxExecutor(this.workspaceRoot);
    this.verifier = new IndependentVerifier(this.workspaceRoot);
    this.flightRecorder = new FlightRecorder(this.workspaceRoot);
  }

  public getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  /**
   * Execute a single Capability through the complete Zero-Trust Pipeline
   */
  public async dispatchCapability(request: CapabilityRequest, stepIndex = 0): Promise<{
    policy: PolicyDecision;
    execution?: ExecutionResult;
    verification?: VerificationAssertion;
  }> {
    // 1. Evaluate Policy Kernel
    const policy = this.policyEngine.evaluate(request);

    if (!policy.allowed) {
      this.flightRecorder.recordEvent({
        stepIndex,
        capability: request,
        policy,
      });
      return { policy };
    }

    // 2. Real Execution inside Sandbox Jail
    const execution = await this.sandboxExecutor.execute(request);

    // 3. Independent Verification (for filesystem write operations)
    let verification: VerificationAssertion | undefined;
    if (request.tool === "filesystem.write" && execution.success) {
      verification = await this.verifier.verifyFileArtifact(
        request.target,
        typeof request.payload === "string" ? request.payload : undefined
      );
    }

    // 4. Record to Black-Box Flight Recorder
    this.flightRecorder.recordEvent({
      stepIndex,
      capability: request,
      policy,
      execution,
      verification,
    });

    return { policy, execution, verification };
  }

  /**
   * Run an End-to-End Objective Workflow
   */
  public async executeObjective(
    objective: string,
    capabilities: Array<Omit<CapabilityRequest, "id" | "objectiveId" | "timestamp">>
  ): Promise<FlightRecordSession> {
    const session = this.flightRecorder.startSession(objective);
    const objectiveId = session.sessionId;

    let hasFailure = false;
    let hasBlocked = false;

    for (let i = 0; i < capabilities.length; i++) {
      const capReq: CapabilityRequest = {
        ...capabilities[i],
        id: `cap_${Date.now()}_${i}`,
        objectiveId,
        timestamp: new Date().toISOString(),
      };

      const result = await this.dispatchCapability(capReq, i + 1);

      if (!result.policy.allowed) {
        hasBlocked = true;
        break;
      }

      if (result.execution && !result.execution.success) {
        hasFailure = true;
        break;
      }
    }

    const finalStatus = hasBlocked ? "BLOCKED" : hasFailure ? "FAILED" : "VERIFIED";
    return this.flightRecorder.endSession(finalStatus)!;
  }
}
