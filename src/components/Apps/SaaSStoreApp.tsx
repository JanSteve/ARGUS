import React, { useState, useEffect } from "react";
import styles from "./SaaSStoreApp.module.css";
import { speakVoice } from "../../lib/ai";
import { playNotificationSound } from "../../lib/soundEffects";
import {
  activateLicenseKey,
  getActiveLicense,
  getDeviceFingerprint,
  LicenseTier,
} from "../../lib/licensing/licenseManager";

export const SaaSStoreApp: React.FC = () => {
  const [licenseKey, setLicenseKey] = useState("");
  const [currentTier, setCurrentTier] = useState<LicenseTier>("community");
  const [activationMsg, setActivationMsg] = useState<string | null>(null);
  const [deviceSig, setDeviceSig] = useState("");

  useEffect(() => {
    const lic = getActiveLicense();
    setCurrentTier(lic.tier);
    setDeviceSig(getDeviceFingerprint());
  }, []);

  const handleActivateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;

    playNotificationSound();
    const result = activateLicenseKey(licenseKey);
    setActivationMsg(result.message);

    if (result.success && result.tier) {
      setCurrentTier(result.tier);
      speakVoice(
        `Cryptographic license verified for ${result.tier.toUpperCase()} tier, sir. Unlimited British neural voice and autonomous multi-agent systems are now active.`
      );
    } else {
      speakVoice("License verification failed. Signature mismatch or invalid key.");
    }
  };

  const handleSimulateUpgrade = (tier: "pro" | "enterprise") => {
    playNotificationSound();
    const mockKey = tier === "enterprise" ? "ARGUS-ENT-9999-8888-A45B" : "ARGUS-PRO-E45A-074D-4EBF";
    const result = activateLicenseKey(mockKey);
    setActivationMsg(result.message);
    if (result.success && result.tier) {
      setCurrentTier(result.tier);
      speakVoice(`Welcome to ARGUS ${tier.toUpperCase()}. All enterprise features unlocked.`);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>ARGUS Sovereign Pro & Enterprise Hub</div>
        <div className={styles.subtitle}>
          Choose your computing tier. 100% data sovereignty with high-definition neural intelligence.
        </div>
      </div>

      {/* Activation Status Banner */}
      {activationMsg && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "12px",
            color: "#34d399",
            textAlign: "center",
          }}
        >
          {activationMsg}
        </div>
      )}

      {/* Pricing Grid */}
      <div className={styles.pricingGrid}>
        {/* Tier 1: Community Free */}
        <div className={styles.pricingCard}>
          <div>
            <div className={styles.tierName}>Community Edition</div>
            <div className={styles.tierPrice}>
              ₹0 <span className={styles.tierPriceSub}>/ Free Forever</span>
            </div>
            <div className={styles.tierDesc}>
              For developers and students who want complete offline local compute.
            </div>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>100% Local-First via Ollama</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>15+ Built-in Native Desktop Apps</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Standard Web Speech Synthesis</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Universal Cmd+K Spotlight</span>
              </div>
            </div>
          </div>

          <button
            className={`${styles.ctaBtn} ${styles.ctaBtnSecondary}`}
            disabled={currentTier === "community"}
          >
            {currentTier === "community" ? "● Active Plan" : "Downgrade"}
          </button>
        </div>

        {/* Tier 2: ARGUS Pro (Most Popular) */}
        <div className={`${styles.pricingCard} ${styles.cardFeatured}`}>
          <div className={styles.badgePopular}>MOST POPULAR</div>
          <div>
            <div className={styles.tierName}>ARGUS Pro</div>
            <div className={styles.tierPrice}>
              ₹1,499 <span className={styles.tierPriceSub}>/ mo ($19/mo)</span>
            </div>
            <div className={styles.tierDesc}>
              For power users, creators, and founders who demand the ultimate Iron Man OS.
            </div>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span><strong>Unlimited British Neural HD Voice</strong></span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Zero-Latency Cloud Neural Stream</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Autonomous Multi-Channel Marketing Agents</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>AI Workspaces & Startup Hub</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Mobile Phone Remote Bridge</span>
              </div>
            </div>
          </div>

          <button
            className={`${styles.ctaBtn} ${styles.ctaBtnPrimary}`}
            onClick={() => handleSimulateUpgrade("pro")}
          >
            {currentTier === "pro" ? "● Active Pro Plan" : "🚀 Upgrade to ARGUS Pro"}
          </button>
        </div>

        {/* Tier 3: Sovereign Enterprise */}
        <div className={styles.pricingCard}>
          <div>
            <div className={styles.tierName}>Sovereign Enterprise</div>
            <div className={styles.tierPrice}>
              ₹7,999 <span className={styles.tierPriceSub}>/ mo ($99/mo)</span>
            </div>
            <div className={styles.tierDesc}>
              For startups, teams, and enterprises requiring dedicated infrastructure.
            </div>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Everything in Pro</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Custom Fine-Tuned LLM Models</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Dedicated Cloud Serverless GPU Node</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>Multi-User Team Collaboration</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.checkIcon}>✓</span>
                <span>24/7 Priority SLA Support</span>
              </div>
            </div>
          </div>

          <button
            className={`${styles.ctaBtn} ${styles.ctaBtnSecondary}`}
            onClick={() => handleSimulateUpgrade("enterprise")}
          >
            {currentTier === "enterprise" ? "● Active Enterprise" : "Contact / Upgrade"}
          </button>
        </div>
      </div>

      {/* License Key Activation Section */}
      <div className={styles.licenseSection}>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>
            Have an ARGUS Pro License Key?
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
            Enter your license key to unlock Pro features instantly across your devices.
          </div>
        </div>

        <form onSubmit={handleActivateKey} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="ARGUS-PRO-XXXX-XXXX"
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "8px",
              padding: "8px 12px",
              color: "#fff",
              fontSize: "12px",
              fontFamily: "monospace",
              width: "200px",
            }}
          />
          <button
            type="submit"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Activate
          </button>
        </form>
      </div>

      {/* Hardware Fingerprint Indicator */}
      <div style={{ textAlign: "center", fontSize: "10.5px", color: "#64748b" }}>
        🔒 Device Cryptographic Binding ID: <code style={{ color: "#38bdf8" }}>{deviceSig}</code> • Zero Data Leaks • Offline Verified
      </div>
    </div>
  );
};
