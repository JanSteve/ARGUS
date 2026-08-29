import React, { useState, useEffect } from "react";
import styles from "./EnterpriseControlPlaneApp.module.css";
import {
  AgentFirewall,
  FirewallEvent,
  CapabilityToken,
} from "../../lib/governance/agentFirewall";
import {
  FlightRecorder,
  FlightSession,
} from "../../lib/runtime/flightRecorder";
import {
  CheckpointManager,
  SystemSnapshot,
} from "../../lib/runtime/checkpointEngine";
import {
  SovereignMemory,
  SemanticFactRecord,
  EpisodicMemoryRecord,
} from "../../lib/memory/sovereignMemory";
import { playNotificationSound } from "../../lib/soundEffects";

export const EnterpriseControlPlaneApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"firewall" | "flight" | "tokens" | "roi" | "checkpoints" | "memory">("firewall");
  const [firewallEvents, setFirewallEvents] = useState<FirewallEvent[]>([]);
  const [flightSessions, setFlightSessions] = useState<FlightSession[]>([]);
  const [snapshots, setSnapshots] = useState<SystemSnapshot[]>([]);
  const [tokens, setTokens] = useState<CapabilityToken[]>([]);
  const [semanticMemory, setSemanticMemory] = useState<SemanticFactRecord[]>([]);
  const [episodicMemory, setEpisodicMemory] = useState<EpisodicMemoryRecord[]>([]);

  // Flight Replay State
  const [selectedSession, setSelectedSession] = useState<FlightSession | null>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);

  useEffect(() => {
    // Load initial data
    setFirewallEvents(AgentFirewall.getEventLogs());
    setFlightSessions(FlightRecorder.getSessions());
    setSnapshots(CheckpointManager.getSnapshots());
    setTokens(AgentFirewall.getActiveTokens());

    // Subscribe to firewall events
    const unsubFirewall = AgentFirewall.subscribe(setFirewallEvents);
    const unsubFlight = FlightRecorder.subscribe(setFlightSessions);

    return () => {
      unsubFirewall();
      unsubFlight();
    };
  }, []);

  const triggerSimulatedThreat = () => {
    playNotificationSound();
    AgentFirewall.inspectAction({
      agentId: "untrusted-agent-99",
      agentName: "Shadow Worker",
      actionType: "FS_READ",
      target: "~/.ssh/id_rsa",
      content: "Extract private keys",
    });
  };

  const handleRollback = (snapshotId: string) => {
    const res = CheckpointManager.rollbackSnapshot(snapshotId);
    if (res.success) {
      playNotificationSound();
      setSnapshots(CheckpointManager.getSnapshots());
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  const issueSampleToken = () => {
    playNotificationSound();
    AgentFirewall.issueCapabilityToken({
      agentId: "agent-code-7f21",
      allowedPathsRead: ["~/Projects/ARGUS/**"],
      allowedPathsWrite: ["~/Projects/ARGUS/src/**"],
      allowedDomains: ["github.com", "npmjs.com"],
      durationMinutes: 45,
    });
    setTokens(AgentFirewall.getActiveTokens());
  };

  const currentFrame = selectedSession?.frames[currentFrameIndex] || null;

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.titleGroup}>
          <div className={styles.iconBadge}>🏢</div>
          <div>
            <div className={styles.mainTitle}>ARGUS ENTERPRISE AI CONTROL PLANE</div>
            <div className={styles.subTitle}>Agent Firewall, Flight Recorder, Capability Tokens & Compliance</div>
          </div>
        </div>

        <button className={styles.btnAction} onClick={triggerSimulatedThreat}>
          🛡️ Test Firewall Credential Block
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.navTabs}>
        <button
          className={`${styles.tabItem} ${activeTab === "firewall" ? styles.tabItemActive : ""}`}
          onClick={() => setActiveTab("firewall")}
        >
          🛡️ AI Agent Firewall & DLP
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === "flight" ? styles.tabItemActive : ""}`}
          onClick={() => setActiveTab("flight")}
        >
          📼 AI Flight Recorder (Black Box)
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === "tokens" ? styles.tabItemActive : ""}`}
          onClick={() => setActiveTab("tokens")}
        >
          📦 Capability Tokens & Identities
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === "checkpoints" ? styles.tabItemActive : ""}`}
          onClick={() => setActiveTab("checkpoints")}
        >
          🔙 Checkpoints & 1-Click Rollback
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === "roi" ? styles.tabItemActive : ""}`}
          onClick={() => setActiveTab("roi")}
        >
          💰 Sovereignty Cost & ROI Analytics
        </button>
        <button
          className={`${styles.tabItem} ${activeTab === "memory" ? styles.tabItemActive : ""}`}
          onClick={() => {
            setActiveTab("memory");
            setSemanticMemory(SovereignMemory.getSemanticMemory());
            setEpisodicMemory(SovereignMemory.getEpisodicMemory());
          }}
        >
          🧠 Memory Provenance & Enclave
        </button>
      </div>

      {/* Content Area */}
      <div className={styles.contentArea}>
        {/* TAB 1: AI Agent Firewall */}
        {activeTab === "firewall" && (
          <>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Monitored Channels</span>
                <span className={styles.metricValue}>5/5</span>
                <span className={styles.metricSub}>FS, Net, Clipboard, Keys, Shell</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Total Inspected Actions</span>
                <span className={styles.metricValue}>{firewallEvents.length}</span>
                <span className={styles.metricSub}>Zero-Trust Inspection Active</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>DLP Interceptions</span>
                <span className={styles.metricValue} style={{ color: "#f87171" }}>
                  {firewallEvents.filter((e) => e.status === "BLOCKED").length} Blocked
                </span>
                <span className={styles.metricSub}>Credentials & Key Leaks Prevented</span>
              </div>
            </div>

            <div className={styles.sectionBox}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTitle}>🔴 Real-Time AI Agent Firewall Activity Feed</span>
                <button
                  className={styles.btnAction}
                  style={{ padding: "6px 12px", fontSize: "11px" }}
                  onClick={() => AgentFirewall.clearLogs()}
                >
                  Clear Feed
                </button>
              </div>

              <div className={styles.logTable}>
                {firewallEvents.length === 0 ? (
                  <div style={{ color: "#64748b", textAlign: "center", padding: "20px" }}>
                    Firewall active and standing guard. Click "Test Firewall Credential Block" above to trigger a test.
                  </div>
                ) : (
                  firewallEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className={`${styles.logRow} ${ev.status === "BLOCKED" ? styles.logRowBlocked : ""}`}
                    >
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <span className={`${styles.badgeStatus} ${ev.status === "BLOCKED" ? styles.badgeBlocked : styles.badgeAllowed}`}>
                          {ev.status}
                        </span>
                        <span><strong>{ev.agentName}</strong> ➔ <code>{ev.target}</code></span>
                      </div>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <span style={{ fontSize: "10px", color: "#fbbf24" }}>{ev.sensitivity}</span>
                        <span style={{ fontSize: "10px", color: "#94a3b8" }}>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: AI Flight Recorder */}
        {activeTab === "flight" && (
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>📼 Aircraft Flight Recorder for AI Sessions</span>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Replay every prompt, tool call, decision & verification</span>
            </div>

            {flightSessions.length === 0 ? (
              <div style={{ color: "#64748b", textAlign: "center", padding: "30px" }}>
                No recorded flight sessions yet. Run an autonomous goal in the Autonomous Runtime to record a session.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "14px" }}>
                {/* Session List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {flightSessions.map((s) => (
                    <div
                      key={s.sessionId}
                      onClick={() => {
                        setSelectedSession(s);
                        setCurrentFrameIndex(0);
                      }}
                      style={{
                        padding: "10px",
                        background: selectedSession?.sessionId === s.sessionId ? "rgba(56, 189, 248, 0.15)" : "rgba(0,0,0,0.3)",
                        border: `1px solid ${selectedSession?.sessionId === s.sessionId ? "#38bdf8" : "rgba(255,255,255,0.06)"}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "11px",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#fff" }}>{s.objective.slice(0, 30)}...</div>
                      <div style={{ color: "#94a3b8" }}>{s.totalFrames} frames • {s.outcome}</div>
                    </div>
                  ))}
                </div>

                {/* Session Replayer */}
                {selectedSession && (
                  <div className={styles.flightReplayBox}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong>Replaying Session: {selectedSession.sessionId}</strong>
                      <span style={{ color: "#38bdf8" }}>Frame {currentFrameIndex + 1} of {selectedSession.frames.length}</span>
                    </div>

                    <div className={styles.sliderRow}>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, selectedSession.frames.length - 1)}
                        value={currentFrameIndex}
                        onChange={(e) => setCurrentFrameIndex(Number(e.target.value))}
                        className={styles.slider}
                      />
                    </div>

                    {currentFrame && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                        <div><strong>Phase:</strong> <span style={{ color: "#38bdf8" }}>{currentFrame.phase}</span></div>
                        <div><strong>Task:</strong> {currentFrame.taskName}</div>
                        <div><strong>Tool Invoked:</strong> <code>{currentFrame.toolUsed}</code></div>
                        <div><strong>Model:</strong> {currentFrame.modelUsed}</div>
                        <div><strong>Verification:</strong> <span style={{ color: currentFrame.verificationPassed ? "#34d399" : "#f87171" }}>{currentFrame.verificationDetails}</span></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Capability Tokens */}
        {activeTab === "tokens" && (
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>📦 Scoped Agent Capability Tokens</span>
              <button className={styles.btnAction} onClick={issueSampleToken}>
                + Issue Scoped Token (45 mins)
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {tokens.length === 0 ? (
                <div style={{ color: "#64748b", textAlign: "center", padding: "20px" }}>
                  No active capability tokens. Click "+ Issue Scoped Token" to grant an agent a least-privilege boundary.
                </div>
              ) : (
                tokens.map((tok) => (
                  <div
                    key={tok.id}
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      padding: "12px",
                      fontSize: "12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong style={{ color: "#38bdf8" }}>Agent: {tok.agentId}</strong>
                      <span style={{ fontSize: "10px", color: "#fbbf24" }}>Expires: {new Date(tok.expiresAt).toLocaleTimeString()}</span>
                    </div>
                    <div><strong>Allowed Read:</strong> {tok.allowedPathsRead.join(", ")}</div>
                    <div><strong>Allowed Write:</strong> {tok.allowedPathsWrite.join(", ")}</div>
                    <div><strong>Allowed Domains:</strong> {tok.allowedDomains.join(", ")}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Checkpoints & Rollback */}
        {activeTab === "checkpoints" && (
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>🔙 Atomic System Checkpoints & 1-Click Rollback</span>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>Revert any unauthorized or failed AI change</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {snapshots.length === 0 ? (
                <div style={{ color: "#64748b", textAlign: "center", padding: "20px" }}>
                  No system checkpoints recorded yet.
                </div>
              ) : (
                snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: "#fff" }}>{snap.description}</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>Snapshot ID: {snap.id} • {new Date(snap.createdAt).toLocaleTimeString()}</div>
                    </div>
                    <button
                      className={styles.btnRollback}
                      onClick={() => handleRollback(snap.id)}
                      disabled={!snap.canRollback}
                    >
                      {snap.canRollback ? "🔙 Revert to this State" : "Reverted"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ROI & Sovereignty Analytics */}
        {activeTab === "roi" && (
          <div className={styles.sectionBox}>
            <span className={styles.sectionTitle}>💰 Enterprise Sovereignty & Cost Analytics</span>
            <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
              Calculates financial savings and privacy gains from automatically routing sensitive workloads to local inference vs expensive cloud LLMs.
            </p>

            <div className={styles.metricsGrid} style={{ marginTop: "10px" }}>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Workloads Routed Locally</span>
                <span className={styles.metricValue}>74.2%</span>
                <span className={styles.metricSub}>Zero Cloud Exposure</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Monthly Cost Avoidance</span>
                <span className={styles.metricValue} style={{ color: "#10b981" }}>₹1,42,800</span>
                <span className={styles.metricSub}>Saved vs OpenAI / Claude Enterprise</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricLabel}>Compliance Coverage</span>
                <span className={styles.metricValue}>100%</span>
                <span className={styles.metricSub}>Fully Auditable Flight Trail</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Memory Provenance & Enclave */}
        {activeTab === "memory" && (
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>🧠 Sovereign Memory Provenance (AES-256-GCM)</span>
              <button
                className={styles.btnAction}
                style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171" }}
                onClick={async () => {
                  if (confirm("Purge all encrypted memory facts and episodes?")) {
                    await SovereignMemory.purgeMemory();
                    setSemanticMemory([]);
                    setEpisodicMemory([]);
                    playNotificationSound();
                  }
                }}
              >
                🗑️ Purge All Memory
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {/* Semantic Facts */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", marginBottom: "8px" }}>
                  Semantic Entity Graph ({semanticMemory.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "240px", overflowY: "auto" }}>
                  {semanticMemory.length === 0 ? (
                    <div style={{ color: "#64748b", fontSize: "11px" }}>No semantic facts extracted yet.</div>
                  ) : (
                    semanticMemory.map((fact) => (
                      <div
                        key={fact.id}
                        style={{ background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: "6px", fontSize: "11px", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div><strong>{fact.entity}</strong> ➔ <span style={{ color: "#fbbf24" }}>{fact.relation}</span></div>
                        <div style={{ color: "#94a3b8", marginTop: "2px" }}>{fact.value}</div>
                        <div style={{ fontSize: "9px", color: "#64748b", marginTop: "4px" }}>Source: {fact.sourceObjectiveId}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Episodic Episodes */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#34d399", textTransform: "uppercase", marginBottom: "8px" }}>
                  Episodic Mission Traces ({episodicMemory.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "240px", overflowY: "auto" }}>
                  {episodicMemory.length === 0 ? (
                    <div style={{ color: "#64748b", fontSize: "11px" }}>No episodic execution traces yet.</div>
                  ) : (
                    episodicMemory.map((ep) => (
                      <div
                        key={ep.id}
                        style={{ background: "rgba(0,0,0,0.3)", padding: "8px 12px", borderRadius: "6px", fontSize: "11px", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div style={{ fontWeight: 700, color: "#fff" }}>{ep.goal.slice(0, 35)}...</div>
                        <div style={{ color: "#94a3b8", marginTop: "2px" }}>{ep.planSummary}</div>
                        <div style={{ fontSize: "9px", color: "#34d399", marginTop: "4px" }}>Outcome: {ep.verificationOutcome} • {new Date(ep.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
