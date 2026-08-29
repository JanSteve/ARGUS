/**
 * ARGUS 2.0 Live Telemetry Streamer (Phase 1.5)
 * 
 * Renders real-time, millisecond-precision execution logs for DAG missions and capability requests.
 */

export interface TelemetryEvent {
  elapsedMs: number;
  type:
    | "PLAN_CREATED"
    | "CAPABILITY_REQUEST"
    | "POLICY_DECISION"
    | "HUMAN_APPROVAL_REQUIRED"
    | "HUMAN_APPROVED"
    | "EXECUTION_STARTED"
    | "TESTS_DETECTED_FAILURE"
    | "PATCH_APPLIED"
    | "TESTS_PASSED"
    | "VERIFICATION_PASSED"
    | "VERIFICATION_FAILED"
    | "FLIGHT_RECORDER_STORED"
    | "EVIDENCE_GENERATED";
  details: string;
  metadata?: any;
}

export class LiveTelemetryStream {
  private startTime: number;
  private events: TelemetryEvent[] = [];

  constructor() {
    this.startTime = Date.now();
  }

  public reset(): void {
    this.startTime = Date.now();
    this.events = [];
  }

  public emit(type: TelemetryEvent["type"], details: string, metadata?: any): TelemetryEvent {
    const elapsedMs = Date.now() - this.startTime;
    const event: TelemetryEvent = { elapsedMs, type, details, metadata };
    this.events.push(event);

    const timeFormatted = this.formatElapsed(elapsedMs);
    const colorBadge = this.getColorBadge(type);

    console.log(`\x1b[90m[${timeFormatted}]\x1b[0m ${colorBadge} ${details}`);
    return event;
  }

  private formatElapsed(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    const millis = String(ms % 1000).padStart(3, "0");
    return `${minutes}:${seconds}.${millis}`;
  }

  private getColorBadge(type: TelemetryEvent["type"]): string {
    switch (type) {
      case "PLAN_CREATED":
        return "\x1b[35m[PLAN_CREATED]\x1b[0m           ";
      case "CAPABILITY_REQUEST":
        return "\x1b[33m[CAPABILITY_REQUEST]\x1b[0m     ";
      case "POLICY_DECISION":
        return "\x1b[32m[POLICY_DECISION]\x1b[0m        ";
      case "HUMAN_APPROVAL_REQUIRED":
        return "\x1b[31m[HUMAN_APPROVAL_REQ]\x1b[0m     ";
      case "EXECUTION_STARTED":
        return "\x1b[36m[EXECUTION_STARTED]\x1b[0m      ";
      case "TESTS_DETECTED_FAILURE":
        return "\x1b[31m[TESTS_FAIL_DETECTED]\x1b[0m   ";
      case "PATCH_APPLIED":
        return "\x1b[32m[PATCH_APPLIED]\x1b[0m          ";
      case "TESTS_PASSED":
        return "\x1b[32m[TESTS_PASSED]\x1b[0m           ";
      case "VERIFICATION_PASSED":
        return "\x1b[32m[VERIFICATION_PASSED]\x1b[0m    ";
      case "VERIFICATION_FAILED":
        return "\x1b[31m[VERIFICATION_FAILED]\x1b[0m    ";
      case "FLIGHT_RECORDER_STORED":
        return "\x1b[34m[FLIGHT_RECORDER]\x1b[0m        ";
      case "EVIDENCE_GENERATED":
        return "\x1b[32m[EVIDENCE_GENERATED]\x1b[0m     ";
      default:
        return "\x1b[37m[EVENT]\x1b[0m                  ";
    }
  }

  public getEvents(): TelemetryEvent[] {
    return this.events;
  }
}
