import React, { useState, useEffect } from "react";
import styles from "./MissionControlApp.module.css";
import {
  BusinessSwarm,
  MissionState,
} from "../../lib/agents/businessAgentSwarm";
import { SalesCRM, SalesLead } from "../../lib/crm/salesCrmEngine";
import { playNotificationSound } from "../../lib/soundEffects";

const FLAGSHIP_MISSION_GOAL =
  "Find 20 Indian SaaS companies that could use our product, research each company, score the leads, create a personalised outreach strategy, prepare LinkedIn content, and create a sales pipeline.";

export const MissionControlApp: React.FC = () => {
  const [goal, setGoal] = useState(FLAGSHIP_MISSION_GOAL);
  const [mission, setMission] = useState<MissionState | null>(null);
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);
  const [mode, setMode] = useState<"AUTO" | "SUPERVISED" | "MANUAL">("SUPERVISED");
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    setLeads(SalesCRM.getLeads());
    const unsubMission = BusinessSwarm.subscribe((m) => {
      setMission(m);
      if (m.activePhase === "COMPLETED") setIsExecuting(false);
    });
    const unsubCrm = SalesCRM.subscribe(setLeads);

    return () => {
      unsubMission();
      unsubCrm();
    };
  }, []);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || isExecuting) return;
    setIsExecuting(true);
    playNotificationSound();
    await BusinessSwarm.executeGrowthMission(goal.trim());
    setIsExecuting(false);
  };

  const handleApprove = () => {
    playNotificationSound();
    BusinessSwarm.approveMissionOutreach();
  };

  const pipeline = SalesCRM.getPipelineSummary();

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <div className={styles.iconBadge}>🎯</div>
          <div>
            <div className={styles.mainTitle}>ARGUS MISSION CONTROL</div>
            <div className={styles.subTitle}>Sovereign Agentic Workflows & Multi-Agent Swarm Orchestrator</div>
          </div>
        </div>

        {/* Human-in-the-Loop Mode Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Governance Mode:</span>
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${mode === "AUTO" ? styles.modeBtnActive : ""}`}
              onClick={() => setMode("AUTO")}
            >
              AUTO
            </button>
            <button
              className={`${styles.modeBtn} ${mode === "SUPERVISED" ? styles.modeBtnActive : ""}`}
              onClick={() => setMode("SUPERVISED")}
            >
              SUPERVISED (HITL)
            </button>
            <button
              className={`${styles.modeBtn} ${mode === "MANUAL" ? styles.modeBtnActive : ""}`}
              onClick={() => setMode("MANUAL")}
            >
              MANUAL
            </button>
          </div>
        </div>
      </div>

      {/* Mission Input Row */}
      <form onSubmit={handleLaunch} className={styles.missionInputRow}>
        <input
          type="text"
          className={styles.missionInput}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Input high-level business objective..."
          disabled={isExecuting}
        />
        <button type="submit" className={styles.btnLaunch} disabled={isExecuting}>
          {isExecuting ? "⚡ Swarm Executing..." : "🚀 Launch Mission"}
        </button>
      </form>

      {/* Progress HUD */}
      {mission && (
        <div className={styles.progressBarContainer}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
            <span><strong>Phase:</strong> <span style={{ color: "#f59e0b" }}>{mission.activePhase}</span></span>
            <span>{mission.progressPercent}% Completed</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${mission.progressPercent}%` }} />
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column: Multi-Agent Swarm & Verification */}
        <div className={styles.leftCol}>
          {/* Multi-Agent Swarm Status */}
          <div>
            <div className={styles.sectionTitle}>Multi-Agent Swarm Matrix</div>
            <div className={styles.agentGrid}>
              {mission?.agents.map((ag, idx) => (
                <div
                  key={idx}
                  className={`${styles.agentCard} ${ag.status === "running" ? styles.agentCardRunning : ""}`}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <strong>{ag.name}</strong>
                    <span style={{ fontSize: "10px", color: ag.status === "verified" ? "#34d399" : "#f59e0b", textTransform: "uppercase" }}>
                      {ag.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>{ag.role}</div>
                  <div style={{ fontSize: "10px", color: "#38bdf8", marginTop: "4px" }}>{ag.currentTask}</div>
                </div>
              )) || (
                <div style={{ color: "#64748b", fontSize: "12px", gridColumn: "span 2", padding: "16px" }}>
                  Launch mission to activate Research, Growth, Sales, and Verification agents.
                </div>
              )}
            </div>
          </div>

          {/* Human-in-the-Loop Approval Gate */}
          {mission?.requiresHumanApproval && (
            <div className={styles.approvalBanner}>
              <strong style={{ color: "#f87171" }}>🛑 Human Approval Required (Policy Gate)</strong>
              <p style={{ fontSize: "12px", margin: 0, color: "#fca5a5" }}>
                ARGUS Sales Agent has prepared 5 outreach drafts and 3 LinkedIn posts. By policy, 0 external communications can be dispatched without explicit operator clearance.
              </p>
              <button className={styles.btnApprove} onClick={handleApprove}>
                ✓ Authorize Campaign & Commit to CRM
              </button>
            </div>
          )}

          {/* Social Posts Prepared */}
          {mission && mission.generatedSocialPosts.length > 0 && (
            <div>
              <div className={styles.sectionTitle}>Campaign Content Drafts ({mission.generatedSocialPosts.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {mission.generatedSocialPosts.map((post, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "8px",
                      padding: "10px",
                      fontSize: "11px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <strong style={{ color: "#38bdf8" }}>{post.platform}</strong>
                      <span style={{ color: "#94a3b8" }}>Target: {post.targetAudience}</span>
                    </div>
                    <div style={{ color: "#e2e8f0", lineHeight: 1.4 }}>{post.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Today's Sales Board & CRM Pipeline */}
        <div className={styles.rightCol}>
          {/* CRM Pipeline Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", padding: "12px", borderRadius: "10px" }}>
              <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>Estimated Pipeline</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#10b981" }}>
                ₹{(pipeline.totalPipelineValueINR / 100000).toFixed(1)}L
              </div>
            </div>
            <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", padding: "12px", borderRadius: "10px" }}>
              <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase" }}>Hot Leads</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#f59e0b" }}>
                {pipeline.hotLeadsCount} / {pipeline.totalLeads}
              </div>
            </div>
          </div>

          {/* Today's Sales Leads */}
          <div>
            <div className={styles.sectionTitle}>Sovereign CRM Leads ({leads.length})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className={styles.leadCard}
                  onClick={() => setSelectedLead(lead)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{lead.company}</strong>
                    <span className={styles.badgeScore}>Score: {lead.leadScore}/100</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {lead.decisionMaker} ({lead.role}) • {lead.industry}
                  </div>
                  <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>
                    Est. Value: ₹{(lead.estimatedValueINR / 100000).toFixed(1)}L • Follow-up: {lead.nextFollowUpDate}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Lead Inspector */}
          {selectedLead && (
            <div style={{ background: "#04060c", border: "1px solid #38bdf8", padding: "14px", borderRadius: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "#fff" }}>{selectedLead.company} Brief</strong>
                <button
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                  onClick={() => setSelectedLead(null)}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>{selectedLead.aiSummary}</div>
              {selectedLead.aiOutreachDraft && (
                <div style={{ marginTop: "8px", background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "6px", fontSize: "11px", whiteSpace: "pre-wrap", color: "#e2e8f0" }}>
                  {selectedLead.aiOutreachDraft}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
