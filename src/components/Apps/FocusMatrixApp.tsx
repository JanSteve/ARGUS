/**
 * ARGUS Focus Matrix & Deep Work Pomodoro Suite
 * Includes synthetic Web Audio ambient soundscape generator and task tracker
 */

import React, { useState, useEffect, useRef } from "react";
import styles from "./FocusMatrixApp.module.css";
import { playNotificationSound } from "../../lib/soundEffects";

type AmbientType = "none" | "cyberdrone" | "whitenoise" | "rain";

export const FocusMatrixApp: React.FC = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [ambientSound, setAmbientSound] = useState<AmbientType>("none");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  // Timer countdown logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning) {
      timer = setInterval(() => {
        if (seconds > 0) {
          setSeconds((s) => s - 1);
        } else if (minutes > 0) {
          setMinutes((m) => m - 1);
          setSeconds(59);
        } else {
          // Completed
          setIsRunning(false);
          playNotificationSound();
          alert("Focus Session Complete! Great job on your deep work sprint.");
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, minutes, seconds]);

  // Synthetic Web Audio Ambient Soundscapes
  const startAmbientSound = (type: AmbientType) => {
    stopAmbientSound();
    if (type === "none") return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      if (type === "cyberdrone") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(55, ctx.currentTime); // Low A drone
        gain.gain.setValueAtTime(0.04, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(220, ctx.currentTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        oscRef.current = osc;
      }
    } catch {}
  };

  const stopAmbientSound = () => {
    if (oscRef.current) {
      try {
        oscRef.current.stop();
      } catch {}
      oscRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
  };

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
    playNotificationSound();
  };

  const handleResetTimer = (mins = 25) => {
    setIsRunning(false);
    setMinutes(mins);
    setSeconds(0);
    playNotificationSound();
  };

  const handleSelectSound = (type: AmbientType) => {
    setAmbientSound(type);
    startAmbientSound(type);
  };

  useEffect(() => {
    return () => stopAmbientSound();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>ARGUS FOCUS MATRIX</div>
        <div className={styles.subtitle}>Deep Work Sprint Engine & Cyber Acoustic Shield</div>
      </div>

      <div className={styles.timerSection}>
        <div className={styles.timerDisplay}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>

        <div className={styles.controlsRow}>
          <button className={styles.btnPrimary} onClick={handleToggleTimer}>
            {isRunning ? "⏸ Pause Sprint" : "▶ Start Sprint"}
          </button>
          <button className={styles.btnSecondary} onClick={() => handleResetTimer(25)}>
            25m Focus
          </button>
          <button className={styles.btnSecondary} onClick={() => handleResetTimer(50)}>
            50m Deep
          </button>
          <button className={styles.btnSecondary} onClick={() => handleResetTimer(5)}>
            5m Break
          </button>
        </div>
      </div>

      <div className={styles.soundSection}>
        <div style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
          🎧 Ambient Cyber Acoustic Shield
        </div>
        <div className={styles.soundGrid}>
          <div
            className={`${styles.soundCard} ${ambientSound === "none" ? styles.soundCardActive : ""}`}
            onClick={() => handleSelectSound("none")}
          >
            🔇 Silent Mode
          </div>
          <div
            className={`${styles.soundCard} ${ambientSound === "cyberdrone" ? styles.soundCardActive : ""}`}
            onClick={() => handleSelectSound("cyberdrone")}
          >
            🌌 Cyber Drone (55Hz)
          </div>
          <div
            className={`${styles.soundCard} ${ambientSound === "rain" ? styles.soundCardActive : ""}`}
            onClick={() => handleSelectSound("rain")}
          >
            🌧️ Rain Focus
          </div>
        </div>
      </div>
    </div>
  );
};
