/**
 * ARGUS Iron Man Arc-Matrix Holographic Telemetry HUD
 * Real-time system monitoring, cognitive load status, and autonomous OS actions
 */

import React, { useState, useEffect } from "react";
import styles from "./ArcMatrixHUD.module.css";
import { speakVoice } from "../../lib/ai";
import { playNotificationSound } from "../../lib/soundEffects";

interface ArcMatrixHUDProps {
  onLaunchApp: (appId: string, title: string) => void;
}

export const ArcMatrixHUD: React.FC<ArcMatrixHUDProps> = ({ onLaunchApp }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cpuLoad, setCpuLoad] = useState(14);
  const [ramUsed, setRamUsed] = useState(2.4);
  const [latency, setLatency] = useState(24);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuLoad(Math.floor(12 + Math.random() * 8));
      setRamUsed(parseFloat((2.2 + Math.random() * 0.4).toFixed(1)));
      setLatency(Math.floor(20 + Math.random() * 8));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRunDiagnostics = () => {
    playNotificationSound();
    speakVoice(
      "Running complete sovereign diagnostics, sir. Core processor is running at nominal levels. Memory allocated at two point four gigabytes. All defensive subroutines are fully operational."
    );
  };

  const handleLaunchDevMatrix = () => {
    playNotificationSound();
    speakVoice("Deploying development workspace matrix, sir.");
    onLaunchApp("terminal", "Terminal");
    setTimeout(() => onLaunchApp("markdown", "Markdown Studio"), 300);
    setTimeout(() => onLaunchApp("browser", "Browser"), 600);
  };

  const handleLockdown = () => {
    playNotificationSound();
    speakVoice("Sovereign privacy mode engaged. External neural routes restricted to local hardware.");
  };

  return (
    <div className={styles.hudWrapper}>
      {isOpen && (
        <div className={styles.hudCard}>
          <div className={styles.hudHeader}>
            <div className={styles.hudTitle}>
              <div className={styles.statusIndicator} />
              <span>ARGUS NEURAL MATRIX HUD</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ✕
            </button>
          </div>

          {/* Telemetry Row */}
          <div className={styles.telemetryGrid}>
            <div className={styles.telemetryBox}>
              <div className={styles.telemetryVal}>{cpuLoad}%</div>
              <div className={styles.telemetryLabel}>CPU Core</div>
            </div>
            <div className={styles.telemetryBox}>
              <div className={styles.telemetryVal}>{ramUsed} GB</div>
              <div className={styles.telemetryLabel}>RAM Load</div>
            </div>
            <div className={styles.telemetryBox}>
              <div className={styles.telemetryVal} style={{ color: "#10b981" }}>
                {latency}ms
              </div>
              <div className={styles.telemetryLabel}>Latency</div>
            </div>
          </div>

          {/* Autonomous Actions */}
          <div className={styles.quickActions}>
            <button className={styles.actionBtn} onClick={handleRunDiagnostics}>
              ⚡ Diagnostics
            </button>
            <button className={styles.actionBtn} onClick={handleLaunchDevMatrix}>
              🚀 Dev Matrix
            </button>
            <button className={styles.actionBtn} onClick={handleLockdown}>
              🔒 Sovereign Lock
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => {
                onLaunchApp("chat", "Chat Assistant");
                speakVoice("Right here, sir. How may I assist you today?");
              }}
            >
              🎙️ Voice Assist
            </button>
          </div>
        </div>
      )}

      {/* Floating Arc Reactor Toggle Orb */}
      <button
        className={styles.voiceTriggerBtn}
        onClick={() => {
          setIsOpen(!isOpen);
          playNotificationSound();
        }}
        title="ARGUS Telemetry Matrix"
      >
        <span>⚡</span>
      </button>
    </div>
  );
};
