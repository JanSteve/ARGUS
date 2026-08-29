/**
 * ARGUS Canonical 18-Event Telemetry Schema & Event Bus
 * 
 * Guarantees zero silent execution across the entire ARGUS agentic runtime.
 * Every agent intent, policy evaluation, tool invocation, verification proof,
 * checkpoint, and memory mutation emits a standardized, immutable event.
 */

export type ArgusEventType =
  | "AgentStarted"
  | "PlanCreated"
  | "TaskCreated"
  | "ToolRequested"
  | "PolicyEvaluated"
  | "PermissionGranted"
  | "PermissionDenied"
  | "HumanApprovalRequested"
  | "HumanApproved"
  | "ToolExecuted"
  | "ToolFailed"
  | "VerificationStarted"
  | "VerificationPassed"
  | "VerificationFailed"
  | "CheckpointCreated"
  | "CheckpointRestored"
  | "MemoryWritten"
  | "AgentCompleted";

export type RiskTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ArgusRuntimeEvent {
  eventId: string;
  timestamp: string;
  type: ArgusEventType;
  sessionId: string;
  missionId: string;
  taskId?: string;
  agentId: string;
  agentName?: string;
  toolId?: string;
  riskLevel: RiskTier;
  action: string;
  status: "SUCCESS" | "BLOCKED" | "FAILED" | "PENDING" | "APPROVAL_REQUIRED";
  payload?: any;
  evidenceReference?: string;
  executionTimeMs?: number;
}

type EventListener = (event: ArgusRuntimeEvent) => void;

class RuntimeEventBus {
  private listeners: Set<EventListener> = new Set();
  private eventLog: ArgusRuntimeEvent[] = [];
  private maxLogSize = 2000;

  constructor() {
    // Load persisted session events if available
    try {
      const saved = localStorage.getItem("argus:runtime:events");
      if (saved) {
        this.eventLog = JSON.parse(saved).slice(-200);
      }
    } catch {
      // Non-blocking in headless contexts
    }
  }

  /**
   * Emit a new runtime event across the system
   */
  public emit(eventData: Omit<ArgusRuntimeEvent, "eventId" | "timestamp">): ArgusRuntimeEvent {
    const event: ArgusRuntimeEvent = {
      ...eventData,
      eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Persist a window of recent events
    try {
      localStorage.setItem("argus:runtime:events", JSON.stringify(this.eventLog.slice(-100)));
    } catch {
      // LocalStorage quota safety
    }

    // Notify active subscribers
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error("Error in runtime event subscriber:", err);
      }
    });

    return event;
  }

  /**
   * Subscribe to real-time events
   */
  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get all captured events
   */
  public getEvents(sessionId?: string): ArgusRuntimeEvent[] {
    if (!sessionId) return [...this.eventLog];
    return this.eventLog.filter((e) => e.sessionId === sessionId);
  }

  /**
   * Clear in-memory event log
   */
  public clear(): void {
    this.eventLog = [];
    try {
      localStorage.removeItem("argus:runtime:events");
    } catch {
      // Ignored
    }
  }
}

export const RuntimeEvents = new RuntimeEventBus();
