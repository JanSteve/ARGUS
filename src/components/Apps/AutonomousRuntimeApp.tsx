import React, { useState, useEffect } from "react";
import styles from "./AutonomousRuntimeApp.module.css";
import {
  AgentRuntime,
  ObjectiveExecutionState,
} from "../../lib/runtime/agentRuntime";
import { playNotificationSound } from "../../lib/soundEffects";

const DEFAULT_DEMO_GOAL =
  "Research top 10 competitors in India AI education, formulate 3 high-margin opportunities, write research dossier to notes, compile landing-page prototype, run test suite, and verify all artifacts.";

export const AutonomousRuntimeApp: React.FC = () => {
  const [goal, setGoal] = useState(DEFAULT_DEMO_GOAL);
  const [runtimeState, setRuntimeState] = useState<ObjectiveExecutionState | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    const unsub = AgentRuntime.subscribe((state) => {
      setRuntimeState(state);
      if (state.phase === "COMPLETED" || state.phase === "FAILED") {
        setIsExecuting(false);
      }
    });
    return unsub;
  }, []);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || isExecuting) return;
    setIsExecuting(true);
    playNotificationSound();
    await AgentRuntime.executeAutonomousObjective(goal.trim());
  };

  const downloadReport = () => {
    if (!runtimeState?.executiveReport) return;
    const blob = new Blob([runtimeState.executiveReport], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ARGUS_Execution_Report_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playNotificationSound();
  };

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <div className={styles.iconBadge}>🦾</div>
          <div>
            <div className={styles.mainTitle}>ARGUS AUTONOMOUS EXECUTION CONTROL</div>
            <div className={styles.subTitle}>End-to-End Real-World Objective Runtime (M9 Engine)</div>
          </div>
        </div>

        {runtimeState && (
          <div className={styles.phaseBadge}>
            PHASE: {runtimeState.phase}
          </div>
        )}
      </div>

      {/* Goal Input Bar */}
      <form onSubmit={handleLaunch} className={styles.goalInputRow}>
        <input
          type="text"
          className={styles.goalInput}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Input real-world objective (e.g. competitor research, scaffold prototype, verify, remember)..."
          disabled={isExecuting}
        />
        <button type="submit" className={styles.btnExecute} disabled={isExecuting}>
          {isExecuting ? "⚡ Executing DAG..." : "🚀 Launch Objective"}
        </button>
      </form>

      {/* Main Execution Grid */}
      <div className={styles.bodyGrid}>
        {/* Left: Execution DAG */}
        <div className={styles.dagPane}>
          <div className={styles.paneTitle}>
            Directed Acyclic Graph (DAG) — {runtimeState?.dag.length || 0} Tasks
          </div>

          {!runtimeState || runtimeState.dag.length === 0 ? (
            <div style={{ color: "#64748b", fontSize: "12px", textAlign: "center", padding: "40px" }}>
              Click "Launch Objective" to decompose this goal into an execution DAG.
            </div>
          ) : (
            runtimeState.dag.map((task, idx) => {
              const isRunning = task.status === "running" || task.status === "authorizing";
              const isVerified = task.status === "verified";
              return (
                <div
                  key={task.id}
                  className={`${styles.dagCard} ${isRunning ? styles.dagCardRunning : ""} ${isVerified ? styles.dagCardVerified : ""}`}
                >
                  <div className={styles.dagCardHeader}>
                    <span className={styles.dagCardName}>
                      {idx + 1}. {task.name}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: isVerified ? "#34d399" : isRunning ? "#38bdf8" : "#94a3b8",
                        textTransform: "uppercase",
                      }}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className={styles.dagCardDesc}>{task.description}</div>
                  <div className={styles.dagCardRule}>🔍 {task.verificationRule}</div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Telemetry, Logs & Artifacts */}
        <div className={styles.logPane}>
          <div className={styles.paneTitle}>Live Execution Stream</div>
          <div className={styles.logBox}>
            {runtimeState?.logs.length === 0 ? (
              <span style={{ color: "#64748b" }}>Waiting for objective launch...</span>
            ) : (
              runtimeState?.logs.map((l, i) => <div key={i}>{l}</div>)
            )}
          </div>

          {/* Artifacts Created */}
          {runtimeState && runtimeState.artifactsCreated.length > 0 && (
            <div>
              <div className={styles.paneTitle}>Real Artifacts Produced</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {runtimeState.artifactsCreated.map((art, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>📁 <strong>{art.name}</strong> ({art.type})</span>
                    <span style={{ color: "#38bdf8" }}>{art.sizeBytes} bytes</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Executive Report Preview */}
          {runtimeState?.executiveReport && (
            <div className={styles.reportBox}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>📑 Boardroom Executive Report</strong>
                <button className={styles.btnDownload} onClick={downloadReport}>
                  📥 Download Report (.md)
                </button>
              </div>
              <div className={styles.reportText}>{runtimeState.executiveReport}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
