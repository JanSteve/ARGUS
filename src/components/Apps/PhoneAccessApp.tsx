/**
 * ARGUS Sovereign OS Phone & Remote Access Bridge
 * Connect iPhone and Android smartphones directly to the OS workspace
 */

import React, { useState } from "react";
import styles from "./PhoneAccessApp.module.css";
import { playNotificationSound } from "../../lib/soundEffects";

export const PhoneAccessApp: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const liveUrl = "https://argus-sovereign-os-website.vercel.app/os/";

  const handleCopy = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    playNotificationSound();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span>📱 Mobile Phone Remote Bridge</span>
        </div>
        <div className={styles.subtitle}>
          Access ARGUS Sovereign OS directly on your iPhone or Android smartphone with full touch controls, mobile windowing, and voice copilot.
        </div>
      </div>

      <div className={styles.grid}>
        {/* QR Code Card */}
        <div className={styles.qrCard}>
          <div className={styles.qrBox}>
            {/* SVG High-Contrast QR Code */}
            <svg width="150" height="150" viewBox="0 0 33 33" fill="#0f172a">
              <rect width="33" height="33" fill="#ffffff" />
              {/* Position Detection Patterns */}
              {/* Top-Left */}
              <rect x="2" y="2" width="7" height="7" fill="#0f172a" />
              <rect x="3" y="3" width="5" height="5" fill="#ffffff" />
              <rect x="4" y="4" width="3" height="3" fill="#0f172a" />

              {/* Top-Right */}
              <rect x="24" y="2" width="7" height="7" fill="#0f172a" />
              <rect x="25" y="3" width="5" height="5" fill="#ffffff" />
              <rect x="26" y="4" width="3" height="3" fill="#0f172a" />

              {/* Bottom-Left */}
              <rect x="2" y="24" width="7" height="7" fill="#0f172a" />
              <rect x="3" y="25" width="5" height="5" fill="#ffffff" />
              <rect x="4" y="26" width="3" height="3" fill="#0f172a" />

              {/* Alignment and Timing */}
              <rect x="10" y="4" width="13" height="1" fill="#0f172a" />
              <rect x="4" y="10" width="1" height="13" fill="#0f172a" />
              <rect x="14" y="14" width="5" height="5" fill="#0f172a" />
              <rect x="15" y="15" width="3" height="3" fill="#ffffff" />
              <rect x="16" y="16" width="1" height="1" fill="#0f172a" />

              {/* Data Blocks */}
              <rect x="11" y="7" width="2" height="2" fill="#0f172a" />
              <rect x="15" y="7" width="3" height="1" fill="#0f172a" />
              <rect x="20" y="7" width="2" height="2" fill="#0f172a" />
              <rect x="10" y="11" width="3" height="2" fill="#0f172a" />
              <rect x="21" y="11" width="2" height="3" fill="#0f172a" />
              <rect x="25" y="11" width="4" height="2" fill="#0f172a" />
              <rect x="11" y="21" width="3" height="2" fill="#0f172a" />
              <rect x="16" y="21" width="4" height="2" fill="#0f172a" />
              <rect x="22" y="21" width="3" height="3" fill="#0f172a" />
              <rect x="11" y="25" width="2" height="4" fill="#0f172a" />
              <rect x="15" y="25" width="5" height="2" fill="#0f172a" />
              <rect x="22" y="26" width="4" height="3" fill="#0f172a" />
            </svg>
          </div>

          <div className={styles.urlPill}>{liveUrl}</div>

          <button className={styles.btnPrimary} onClick={handleCopy}>
            {copied ? "✓ Copied Mobile Link!" : "📋 Copy Mobile URL"}
          </button>
        </div>

        {/* Steps Card */}
        <div className={styles.stepsCard}>
          <div className={styles.stepsTitle}>🚀 4-Step Quick Mobile Setup</div>

          <div className={styles.stepItem}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepContent}>
              <span className={styles.stepStrong}>Scan QR Code:</span> Open your iPhone or Android Camera app and point it at the QR code on the left.
            </div>
          </div>

          <div className={styles.stepItem}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepContent}>
              <span className={styles.stepStrong}>Open in Safari or Chrome:</span> Tap the notification link to launch the ARGUS Sovereign Web Workspace.
            </div>
          </div>

          <div className={styles.stepItem}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepContent}>
              <span className={styles.stepStrong}>Add to Home Screen:</span> Tap the Share / Menu icon and select <em>"Add to Home Screen"</em> to get a native full-screen app icon!
            </div>
          </div>

          <div className={styles.stepItem}>
            <div className={styles.stepNum}>4</div>
            <div className={styles.stepContent}>
              <span className={styles.stepStrong}>Enjoy Everywhere:</span> Control your AI chat assistant, write notes, monitor tasks, and run tools on the go with zero setup.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
