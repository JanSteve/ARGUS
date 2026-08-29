/**
 * ARGUS AI Flight Recorder Engine
 * 
 * "An aircraft black box for AI agent execution."
 * 
 * Records every significant agent session:
 * - OBJECTIVE & GOAL
 * - DAG PLAN & TASKS
 * - MODEL USED & SYSTEM PROMPTS
 * - TOOLS CALLED & NETWORK CALLS
 * - PERMISSION DECISIONS & OPERATOR OVERRIDES
 * - VERIFICATION ASSERTIONS & PROOFS
 * - CHECKPOINT SNAPSHOTS & ROLLBACK CAPABILITY
 * - STEP-BY-STEP REPLAY TIMELINE
 */

import { RuntimeEvents, ArgusRuntimeEvent } from "./runtimeEvents";

export interface FlightFrame {
  frameIndex: number;
  timestamp: string;
  phase: string;
  taskName: string;
  toolUsed: string;
  modelUsed: string;
  promptSnippet?: string;
  targetPath?: string;
  permissionDecision?: string;
  networkEndpoint?: string;
  verificationPassed: boolean;
  verificationDetails: string;
  durationMs: number;
}

export interface FlightSession {
  sessionId: string;
  objective: string;
  agentId: string;
  startedAt: string;
  completedAt?: string;
  totalFrames: number;
  modelTier: string;
  checkpointId?: string;
  outcome: "SUCCESS_VERIFIED" | "BLOCKED_BY_OPERATOR" | "EXECUTION_ERROR" | "IN_PROGRESS";
  frames: FlightFrame[];
}

const STORAGE_KEY_FLIGHT_RECORDS = "argus_flight_sessions_v1";

class FlightRecorderEngine {
  private sessions: FlightSession[] = [];
  private activeSession: FlightSession | null = null;
  private listeners: Set<(sessions: FlightSession[]) => void> = new Set();

  constructor() {
    this.loadState();
    // Live Event Subscription
    RuntimeEvents.subscribe((evt: ArgusRuntimeEvent) => {
      this.handleRuntimeEvent(evt);
    });
  }

  private handleRuntimeEvent(evt: ArgusRuntimeEvent) {
    if (!this.activeSession && evt.type === "AgentStarted") {
      this.startSession(evt.action, evt.agentId, "Ollama / Local Hybrid");
    }

    if (this.activeSession) {
      this.recordFrame({
        phase: evt.type,
        taskName: evt.action,
        toolUsed: evt.toolId || "runtime.kernel",
        modelUsed: "Ollama / Local Hybrid",
        permissionDecision: evt.status,
        verificationPassed: evt.status === "SUCCESS",
        verificationDetails: evt.evidenceReference || `Event: ${evt.type}`,
        durationMs: evt.executionTimeMs || 0,
      });

      if (evt.type === "AgentCompleted") {
        this.endSession(evt.status === "SUCCESS" ? "SUCCESS_VERIFIED" : "EXECUTION_ERROR");
      }
    }
  }

  private loadState() {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY_FLIGHT_RECORDS);
        if (raw) this.sessions = JSON.parse(raw);
      }
    } catch {}
  }

  private saveState() {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_FLIGHT_RECORDS, JSON.stringify(this.sessions.slice(-30)));
      }
    } catch {}
  }

  public subscribe(listener: (sessions: FlightSession[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.sessions);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const list = [...this.sessions];
    this.listeners.forEach((fn) => fn(list));
    window.dispatchEvent(new CustomEvent("argus:flight-recorder-updated", { detail: list }));
  }

  /**
   * Start recording a new Flight Session
   */
  public startSession(objective: string, agentId: string, modelTier: string, checkpointId?: string): FlightSession {
    const session: FlightSession = {
      sessionId: `flt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      objective,
      agentId,
      startedAt: new Date().toISOString(),
      totalFrames: 0,
      modelTier,
      checkpointId,
      outcome: "IN_PROGRESS",
      frames: [],
    };

    this.activeSession = session;
    this.sessions.unshift(session);
    this.saveState();
    this.notify();
    return session;
  }

  /**
   * Record a single execution frame into the active Flight Session
   */
  public recordFrame(frame: Omit<FlightFrame, "frameInde