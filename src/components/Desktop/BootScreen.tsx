import React, { useState, useEffect } from "react";
import styles from "./BootScreen.module.css";

interface BootScreenProps {
  onBootComplete: () => void;
}

/**
 * Cinematic ARGUS Sovereign OS boot animation.
 * Shows a professional loading sequence before revealing the desktop.
 */
export const BootScreen: React.FC<BootScreenProps> = ({ onBootComplete }) => {
  const [phase, setPhase] = useState<"logo" | "loading" | "done">("logo");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing kernel...");

  useEffect(() => {
    // Phase 1: Logo reveal (0-800ms)
    const logoTimer = setTimeout(() => {
      setPhase("loading");
    }, 800);

    return () => clearTimeout(logoTimer);
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;

    const statusMessages = [
      { at: 10, text: "Loading system modules..." },
      { at: 25, text: "Initializing neural voice engine..." },
      { at: 40, text: "Mounting encrypted filesystem..." },
      { at: 55, text: "Connecting AI inference pipeline..." },
      { at: 70, text: "Starting desktop compositor..." },
      { at: 85, text: "Loading applications..." },
      { at: 95, text: "System ready." },
    ];

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2;
        const msg = statusMessages.find(
          (s) => next >= s.at && prev < s.at
        );
        if (msg) setStatusText(msg.text);

        if (next >= 100) {
          clearInterval(interval);
          setPhase("done");
          setTimeout(onBootComplete, 400);
          return 100;
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [phase, onBootComplete]);

  return (
    <div
      className={`${styles.bootScreen} ${phase === "done" ? styles.fadeOut : ""}`}
    >
      {/* Radial glow backdrop */}
      <div className={styles.glow} />

      {/* Logo + Ring */}
      <div
        className={`${styles.logoContainer} ${phase !== "logo" ? styles.logoSmall : ""}`}
      >
        {/* Animated ring */}
        <svg
          className={styles.ring}
          viewBox="0 0 120 120"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="rgba(6, 182, 212, 0.15)"
            strokeWidth="2"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="url(#boot-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="340"
            strokeDashoffset={340 - (340 * progress) / 100}
            className={styles.progressRing}
          />
          <defs>
            <linearGradient
              id="boot-gradient"
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>

        {/* ARGUS Logo Mark */}
        <div className={styles.logoMark}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="boot-logo" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <polygon
              points="24,4 44,40 4,40"
              fill="none"
              stroke="url(#boot-logo)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="28" r="5" fill="url(#boot-logo)" />
          </svg>
        </div>
      </div>

      {/* Brand text */}
      <div className={styles.brandText}>
        <h1 className={styles.title}>
          ARGUS <span className={styles.titleSub}>SOVEREIGN</span>
        </h1>
        <p className={styles.version}>v2.0.0</p>
      </div>

      {/* Progress bar area */}
      {phase === "loading" && (
        <div className={styles.progressArea}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressBar}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={styles.statusText}>{statusText}</p>
        </div>
      )}
    </div>
  );
};
