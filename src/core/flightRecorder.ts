/**
 * ARGUS 2.0 Black-Box Flight Recorder
 * 
 * Records immutable, verifiable execution traces for every autonomous session.
 */

import fs from "fs";
import path from "path";
import { FlightRecordSession, FlightRecordEvent } from "./types";

export class FlightRecorder {
  private logDir: string;
  private currentSession: FlightRecordSession | null = null;

  constructor(workspaceRoot: string) {
    this.logDir = path.join(path.resolve(workspaceRoot), ".argus", "flight_recorder");
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  public startSession(objective: string): FlightRecordSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.currentSession = {
      sessionId,
      objective,
      startedAt: new Date().toISOString(),
      status: "IN_PROGRESS",
      events: [],
      summary: {
        totalCapabilities: 0,
        allowed: 0,
        blocked: 0,
        verified: 0,
        durationMs: 0,
      },
    };
    return this.currentSession;
  }

  public recordEvent(event: Omit<FlightRecordEvent, "eventId" | "sessionId" | "timestamp">): FlightRecordEvent {
    if (!this.currentSession) {
      this.startSession("Default Objective");
    }

    const fullEvent: FlightRecordEvent = {
      ...event,
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId: this.currentSession!.sessionId,
      timestamp: new Date().toISOString(),
    };

    this.currentSession!.events.push(fullEvent);
    this.currentSession!.summary.totalCapabilities++;
    if (fullEvent.policy.allowed) {
      this.currentSession!.summary.allowed++;
    } else {
      this.currentSession!.summary.blocked++;
    }
    if (fullEvent.verification?.verified) {
      this.currentSession!.summary.verified++;
    }

    this.persist();
    return fullEvent;
  }

  public endSession(status: "VERIFIED" | "FAILED" | "BLOCKED"): FlightRecordSession | null {
    if (!this.currentSession) return null;

    this.currentSession.completedAt = new Date().toISOString();
    this.currentSession.status = status;
    const start = new Date(this.currentSession.startedAt).getTime();
    this.currentSession.summary.durationMs = Date.now() - start;

    this.persist();
    const finished = { ...this.currentSession };
    this.currentSession = null;
    return finished;
  }

  private persist() {
    if (!this.currentSession) return;
    const filePath = path.join(this.logDir, `${this.currentSession.sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(this.currentSession, null, 2), "utf8");
  }
}
