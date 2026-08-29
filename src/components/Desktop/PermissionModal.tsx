import React, { useState, useEffect } from "react";
import styles from "./PermissionModal.module.css";
import {
  PermissionKernel,
  ActionRequest,
  PermissionDecision,
} from "../../lib/governance/permissionKernel";
import { playNotificationSound } from "../../lib/soundEffects";

export const PermissionModal: React.FC = () => {
  const [currentRequest, setCurrentRequest] = useState<ActionRequest | null>(null);
  const [showPayload, setShowPayload] = useState(false);

  useEffect(() => {
    const handleOpen = (e: CustomEvent<ActionRequest>) => {
      playNotificationSound();
      setCurrentRequest(e.detail);
      setShowPayload(false);
    };

    window.addEventListener("argus:open-permission-modal", handleOpen as EventListener);
    return () => window.removeEventListener("argus:open-permission-modal", handleOpen as EventListener);
  }, []);

  const handleDecision = (decision: PermissionDecision) => {
    if (!currentRequest) return;
    PermissionKernel.resolveRequest(currentRequest.id, decision);
    setCurrentRequest(null);
  };

  if (!currentRequest) return null;

  const getRiskClass = () => {
    switch (currentRequest.riskLevel) {
      case "CRITICAL": return styles.badgeCritical;
      case "HIGH": return styles.badgeHigh;
      case "MEDIUM": return styles.badgeMedium;
      default: return styles.badgeLow;
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <span className={`${styles.badge} ${getRiskClass()}`}>
            ⚠️ {currentRequest.riskLevel} RISK ACTION
          </span>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
            Reversible: <strong>{currentRequest.reversible}</strong>
          </span>
        </div>

        <div>
          <div className={styles.title}>ARGUS Action Request</div>
          <div className={styles.subtitle}>
            An autonomous agent is requesting permission to execute an operation on your host system.
          </div>
        </div>

        {/* Structured Info */}
        <div className={styles.infoGrid}>
          <span className={styles.infoKey}>Agent</span>
          <span className={styles.infoVal}>{currentRequest.agentName} ({currentRequest.agentId})</span>

          <span className={styles.infoKey}>Tool</span>
          <span className={styles.infoVal}>{currentRequest.tool.toUpperCase()}</span>

          <span className={styles.infoKey}>Action</span>
          <span className={styles.infoVal} style={{ color: "#38bdf8", fontWeight: 700 }}>
            {currentRequest.action}
          </span>

          <span className={styles.infoKey}>Target</span>
          <span className={styles.infoVal}>{currentRequest.target}</span>

          <span className={styles.infoKey}>Objective</span>
          <span className={styles.infoVal} style={{ color: "#cbd5e1" }}>
            {currentRequest.why}
          </span>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionRow}>
          <button className={styles.btnAllowOnce} onClick={() => handleDecision("ALLOWED_ONCE")}>
            ✓ Allow Once
          </button>
          <button className={styles.btnAlwaysAllow} onClick={() => handleDecision("ALWAYS_ALLOWED")}>
            ⚡ Always Allow
          </button>
          <button className={styles.btnDeny} onClick={() => handleDecision("DENIED")}>
            ✕ Deny & Block
          </button>
        </div>

        {/* Footer info */}
        <div className={styles.footerNote}>
          🛡️ Governed by ARGUS Sovereign Permission Kernel • Immutable Audit Record Active
        </div>
      </div>
    </div>
  );
};
