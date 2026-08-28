/**
 * ARGUS Pro Upgrade Modal
 * Holographic persuasion prompt triggered when free buffer completes
 */

import React, { useState, useEffect } from "react";
import styles from "./ProUpgradeModal.module.css";
import { speakVoice } from "../../lib/ai";
import { playNotificationSound } from "../../lib/soundEffects";
import { activateLicenseKey } from "../../lib/licensing/licenseManager";

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSaaSStore: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  onOpenSaaSStore,
}) => {
  const [keyInput, setKeyInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      playNotificationSound();
      speakVoice(
        "Sir, your daily free voice allocation is at capacity. Upgrade to ARGUS Pro to unlock Unlimited British Neural Voice and Autonomous Marketing Agents."
      );
    }
  }, [isOpen]);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    playNotificationSound();
    const result = activateLicenseKey(keyInput);
    if (result.success) {
      speakVoice("License verified successfully, sir. Welcome to ARGUS Pro.");
      onClose();
    } else {
      setErrorMsg(result.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <div className={styles.header}>
          <div className={styles.arcBadge}>⚡</div>
          <div className={styles.title}>Unlock ARGUS Pro & Unlimited Intelligence</div>
          <div className={styles.subtitle}>
            Your daily free allocation of 20 voice commands has concluded. Upgrade to experience the full sovereign power of ARGUS.
          </div>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureRow}>
            <span className={styles.check}>✓</span>
            <span><strong>Unlimited British Neural HD Voice</strong> (Zero token restrictions)</span>
          </div>
          <div className={styles.featureRow}>
            <span className={styles.check}>✓</span>
            <span><strong>24/7 Autonomous Marketing Agents</strong> (Viral X, Product Hunt & SEO)</span>
          </div>
          <div className={styles.featureRow}>
            <span className={styles.check}>✓</span>
            <span><strong>Infinite AI Workspaces</strong> & Startup Milestone Roadmaps</span>
          </div>
          <div className={styles.featureRow}>
            <span className={styles.check}>✓</span>
            <span><strong>Mobile Phone Remote Bridge</strong> with Zero Latency</span>
          </div>
        </div>

        <button
          className={styles.btnUpgrade}
          onClick={() => {
            onClose();
            onOpenSaaSStore();
          }}
        >
          🚀 Upgrade to ARGUS Pro (₹1,499/mo · $19/mo)
        </button>

        {/* Quick Key Entry */}
        <form onSubmit={handleActivate} style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Already have a key? Paste ARGUS-PRO-..."
            style={{
              flex: 1,
              background: "rgba(0,0,0,0.35)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#fff",
              fontSize: "11.5px",
              fontFamily: "monospace",
            }}
          />
          <button
            type="submit"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px",
              color: "#fff",
              padding: "8px 14px",
              fontSize: "11.5px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Activate
          </button>
        </form>

        {errorMsg && (
          <div style={{ color: "#f87171", fontSize: "11px", textAlign: "center" }}>
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};
