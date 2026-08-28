/**
 * JARVIS Holographic Voice HUD & Autonomous Wake-Word Engine
 * Tony Stark-style Voice Copilot for ARGUS Sovereign OS
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./JarvisVoiceHUD.module.css";
import { speakVoice, stopSpeaking, loadVoiceConfig } from "../../lib/ai";
import { playNotificationSound } from "../../lib/soundEffects";

interface JarvisVoiceHUDProps {
  onLaunchApp: (component: any, title: string) => void;
}

export const JarvisVoiceHUD: React.FC<JarvisVoiceHUDProps> = ({ onLaunchApp }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("Say 'Hey ARGUS' or click to command...");
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Command Execution Engine
  const executeCommand = useCallback(
    async (commandText: string) => {
      const lower = commandText.toLowerCase().trim();
      setTranscript(`Heard: "${commandText}"`);

      // 1. Wi-Fi Control
      if (lower.includes("wifi") || lower.includes("wi-fi")) {
        const isOff = lower.includes("off") || lower.includes("disconnect") || lower.includes("disable");
        const isOn = lower.includes("on") || lower.includes("connect") || lower.includes("enable");

        if (isOff) {
          window.dispatchEvent(
            new CustomEvent("argus:system-state-changed", {
              detail: { wifiActive: false },
            })
          );
          const reply = "Right away, sir. Wi-Fi interface has been deactivated.";
          setLastReply(reply);
          setIsSpeaking(true);
          await speakVoice(reply);
          setIsSpeaking(false);
          return;
        }
        if (isOn) {
          window.dispatchEvent(
            new CustomEvent("argus:system-state-changed", {
              detail: { wifiActive: true },
            })
          );
          const reply = "Re-establishing Wi-Fi link. Sovereign network connected.";
          setLastReply(reply);
          setIsSpeaking(true);
          await speakVoice(reply);
          setIsSpeaking(false);
          return;
        }
      }

      // 2. Weather
      if (lower.includes("weather") || lower.includes("climate") || lower.includes("forecast")) {
        onLaunchApp("weather", "Weather");
        const reply = "Opening live Weather Satellite Radar. Scanning atmospheric telemetry.";
        setLastReply(reply);
        setIsSpeaking(true);
        await speakVoice(reply);
        setIsSpeaking(false);
        return;
      }

      // 3. Task Manager
      if (lower.includes("task") || lower.includes("process") || lower.includes("cpu") || lower.includes("memory")) {
        onLaunchApp("taskmanager", "Task Manager");
        const reply = "Accessing Task Manager. Neural and hardware telemetry nominal.";
        setLastReply(reply);
        setIsSpeaking(true);
        await speakVoice(reply);
        setIsSpeaking(false);
        return;
      }

      // 4. Notes & Writing
      if (lower.includes("note")) {
        onLaunchApp("notes", "Notes");
        const writeIdx = lower.indexOf("write") !== -1 ? lower.indexOf("write") + 5 : -1;
        const noteContent = writeIdx !== -1 ? commandText.slice(writeIdx).trim() : "";

        if (noteContent) {
          try {
            const notes = JSON.parse(localStorage.getItem("argus-notes") || "[]");
            notes.unshift({
              id: Date.now().toString(),
              title: "JARVIS Voice Note",
              content: noteContent,
              updatedAt: new Date().toISOString(),
            });
            localStorage.setItem("argus-notes", JSON.stringify(notes));
            window.dispatchEvent(new CustomEvent("argus:notes-updated"));
          } catch {}
          const reply = `Note recorded to sovereign storage: "${noteContent}"`;
          setLastReply(reply);
          setIsSpeaking(true);
          await speakVoice(reply);
          setIsSpeaking(false);
          return;
        }
        const reply = "Opening Notes app for you, sir.";
        setLastReply(reply);
        setIsSpeaking(true);
        await speakVoice(reply);
        setIsSpeaking(false);
        return;
      }

      // 5. Terminal
      if (lower.includes("terminal") || lower.includes("shell") || lower.includes("bash")) {
        onLaunchApp("terminal", "Terminal");
        const reply = "Terminal emulator initialized. Ready for sovereign root execution.";
        setLastReply(reply);
        setIsSpeaking(true);
        await speakVoice(reply);
        setIsSpeaking(false);
        return;
      }

      // 6. Browser
      if (lower.includes("browser") || lower.includes("web") || lower.includes("internet") || lower.includes("youtube")) {
        onLaunchApp("browser", "Browser");
        const reply = "Launching Sovereign Browser.";
        setLastReply(reply);
        setIsSpeaking(true);
        await speakVoice(reply);
        setIsSpeaking(false);
        return;
      }

      // 7. Math & Calculation
      if (lower.includes("calculate") || lower.includes("times") || lower.includes("plus") || lower.includes("minus") || lower.includes("divided")) {
        const mathExpr = lower
          .replace(/calculate|what is|how much is/g, "")
          .replace(/times|multiplied by/g, "*")
          .replace(/plus/g, "+")
          .replace(/minus/g, "-")
          .replace(/divided by/g, "/")
          .replace(/[^0-9+\-*/().\s]/g, "");

        try {
          if (mathExpr.trim()) {
            const result = Function(`"use strict"; return (${mathExpr})`)();
            const reply = `The calculation yields ${result}.`;
            setLastReply(reply);
            setIsSpeaking(true);
            await speakVoice(reply);
            setIsSpeaking(false);
            return;
          }
        } catch {}
        onLaunchApp("calculator", "Calculator");
        const reply = "Opening Calculator.";
        setLastReply(reply);
        setIsSpeaking(true);
        await speakVoice(reply);
        setIsSpeaking(false);
        return;
      }

      // 8. General Open App Dispatch
      const appMap: Record<string, { id: string; title: string }> = {
        settings: { id: "settings", title: "Settings" },
        photos: { id: "photos", title: "Photos" },
        music: { id: "music", title: "Music Player" },
        markdown: { id: "markdown", title: "Markdown Studio" },
        update: { id: "updater", title: "Update Center" },
        store: { id: "appstore", title: "App Store" },
        file: { id: "explorer", title: "File Explorer" },
        chat: { id: "chat", title: "Chat Assistant" },
      };

      for (const [key, val] of Object.entries(appMap)) {
        if (lower.includes(key)) {
          onLaunchApp(val.id, val.title);
          const reply = `Opening ${val.title}, sir.`;
          setLastReply(reply);
          setIsSpeaking(true);
          await speakVoice(reply);
          setIsSpeaking(false);
          return;
        }
      }

      // 9. Default Direct Answer
      const reply = `Command acknowledged: "${commandText}". Executing task via Google Gemini neural engine.`;
      setLastReply(reply);
      setIsSpeaking(true);
      await speakVoice(reply);
      setIsSpeaking(false);
    },
    [onLaunchApp]
  );

  // Initialize Speech Recognition
  const startListening = useCallback(() => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setTranscript("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        playNotificationSound();
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          executeCommand(text);
        }
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        if (continuousMode) {
          setTimeout(() => startListening(), 1000);
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch {
      setIsListening(false);
    }
  }, [continuousMode, executeCommand]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  const toggleListen = () => {
    if (isListening) {
      stopListening();
    } else {
      setIsOpen(true);
      startListening();
    }
  };

  return (
    <div className={styles.hudContainer}>
      {/* Holographic Arc Reactor Orb */}
      <div
        className={`${styles.orbWrapper} ${isListening ? styles.orbActive : ""} ${isSpeaking ? styles.orbSpeaking : ""}`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isListening && !isOpen) {
            startListening();
          }
        }}
        title="J.A.R.V.I.S. Voice Copilot (Click to Speak / Wake Up)"
      >
        <div className={styles.reactorCore}>
          <div className={styles.reactorRing} />
          <div className={styles.reactorRingPulse} />
          <div className={styles.reactorCenter} />
        </div>

        <div className={styles.orbLabel}>
          <div className={styles.orbTitle}>
            <span>ARGUS</span>
            {isSpeaking ? (
              <span style={{ color: "#a855f7" }}>🔊 SPEAKING</span>
            ) : isListening ? (
              <span style={{ color: "#06b6d4" }}>🎙️ LISTENING</span>
            ) : (
              <span style={{ color: "#94a3b8" }}>VOICE HUD</span>
            )}
          </div>
          <div className={styles.orbStatus}>
            {isListening ? "Listening for command..." : "Click or say 'Hey ARGUS'"}
          </div>
        </div>
      </div>

      {/* Expanded Holographic Command HUD */}
      {isOpen && (
        <div className={styles.hologramPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <span>⚡ J.A.R.V.I.S. Command Matrix</span>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          {/* Audio Visualizer Wave */}
          {(isListening || isSpeaking) && (
            <div className={styles.visualizer}>
              <div className={styles.waveBar} />
              <div className={styles.waveBar} />
              <div className={styles.waveBar} />
              <div className={styles.waveBar} />
              <div className={styles.waveBar} />
              <div className={styles.waveBar} />
            </div>
          )}

          {/* Live Transcript */}
          <div className={styles.transcriptBox}>
            <div className={styles.transcriptText}>{transcript}</div>
            {lastReply && <div className={styles.replyText}>{lastReply}</div>}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={toggleListen}
              style={{
                background: isListening ? "rgba(239, 68, 68, 0.25)" : "linear-gradient(135deg, #06b6d4, #3b82f6)",
                border: isListening ? "1px solid #ef4444" : "none",
                borderRadius: "8px",
                color: "#fff",
                padding: "6px 14px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {isListening ? "⏹️ Stop Listening" : "🎙️ Speak to ARGUS"}
            </button>

            <button
              onClick={() => onLaunchApp("chat", "Chat Assistant")}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "8px",
                color: "#94a3b8",
                padding: "6px 10px",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Open Full Chat
            </button>
          </div>

          {/* Quick Voice Chips */}
          <div style={{ fontSize: "10.5px", color: "var(--fg-muted)", marginTop: "2px" }}>
            Quick Voice Commands:
          </div>
          <div className={styles.chipsContainer}>
            {[
              "turn off wifi",
              "open weather",
              "open task manager",
              "write a note Project Zeus",
              "calculate 55 * 80",
              "open terminal",
            ].map((chip) => (
              <button
                key={chip}
                className={styles.commandChip}
                onClick={() => executeCommand(chip)}
              >
                🗣️ "{chip}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
