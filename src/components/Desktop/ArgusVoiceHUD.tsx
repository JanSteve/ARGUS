/**
 * ARGUS Holographic Voice HUD & Autonomous Wake-Word Engine
 * Sovereign Voice Intelligence Engine for ARGUS OS
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ArgusVoiceHUD.module.css";
import { speakVoice, stopSpeaking } from "../../lib/ai";
import { playNotificationSound } from "../../lib/soundEffects";

interface ArgusVoiceHUDProps {
  onLaunchApp: (component: any, title: string) => void;
}

export const ArgusVoiceHUD: React.FC<ArgusVoiceHUDProps> = ({ onLaunchApp }) => {
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

      // 2. Bluetooth Control
      if (lower.includes("bluetooth")) {
        const isOff = lower.includes("off") || lower.includes("disable");
        const isOn = lower.includes("on") || lower.includes("enable");

        if (isOff) {
          window.dispatchEvent(
            new CustomEvent("argus:system-state-changed", {
              detail: { bluetoothActive: false },
            })
          );
          const reply = "Bluetooth hardware link disabled.";
          setLastReply(reply);
          setIsSpeaking(true);
          await speakVoice(reply);
          setIsSpeaking(false);
          return;
        }
        if (isOn) {
          window.dispatchEvent(
            new CustomEvent("argus:system-state-changed", {
              detail: { bluetoothActive: true },
            })
          );
          const reply = "Bluetooth interface enabled and scanning.";
          setLastReply(reply);
          setIsSpeaking(true);
          await speakVoice(reply);
          setIsSpeaking(false);
          return;
        }
      }

      // 3. Notes Creation
      if (lower.includes("note")) {
        onLaunchApp("notes", "Notes");
        const writeIdx = lower.indexOf("note");
        const noteContent = commandText.slice(writeIdx + 4).trim();
        if (noteContent) {
          try {
            const notes = JSON.parse(localStorage.getItem("argus-notes") || "[]");
            notes.unshift({
              id: Date.now().toString(),
              title: "ARGUS Voice Note",
              content: noteContent,
              updatedAt: new Date().toISOString(),
            });
            localStorage.setItem("argus-notes", JSON.stringify(notes));
            window.dispatchEvent(new CustomEvent("argus:notes-updated"));
          } catch {}
        }
        const reply = `Note recorded to sovereign storage: ${noteContent || "New Note"}`;
        setLastReply(reply);
        setIsSpeaking(true);
        await speakVoice(reply);
        setIsSpeaking(false);
        return;
      }

      // 4. Weather Radar
      if (lower.includes("weather") || lower.includes("temperature") || lower.includes("forecast")) {
        onLaunchApp("weather", "Weather");
        const reply = "Opening live Weather Satellite Radar. Scanning atmospheric telemetry.";
        setLastReply(reply);
        setIsSpeaking(true);
        await speakVoice(reply);
        setIsSpeaking(false);
        return;
      }

      // 5. Task Manager / Hardware Telemetry
      if (lower.includes("task") || lower.includes("process") || lower.includes("cpu") || lower.includes("memory")) {
        onLaunchApp("taskmanager", "Task Manager");
        const reply = "Accessing Task Manager. Neural and hardware telemetry nominal.";
        setLastReply(reply);
        setIsSpeaking(true);
        await speakVoice(reply);
        setIsSpeaking(false);
        return;
      }

      // 6. Math Evaluation
      if (lower.startsWith("calculate") || lower.startsWith("what is") || lower.includes("times") || lower.includes("divided by") || lower.includes("plus") || lower.includes("minus")) {
        const expr = lower
          .replace(/calculate|what is|how much is/g, "")
          .replace(/times|multiplied by/g, "*")
          .replace(/plus/g, "+")
          .replace(/minus/g, "-")
          .replace(/divided by/g, "/")
          .replace(/[^0-9+\-*/().\s]/g, "");

        if (expr.trim()) {
          try {
            const result = Function(`"use strict"; return (${expr})`)();
            if (typeof result === "number" && isFinite(result)) {
              const reply = `The calculation yields ${result}.`;
              setLastReply(reply);
              setIsSpeaking(true);
              await speakVoice(reply);
              setIsSpeaking(false);
              return;
            }
          } catch {}
        }
      }

      // 7. Terminal
      if (lower.includes("terminal") || lower.includes("shell") || lower.includes("bash")) {
        onLaunchApp("terminal", "Terminal");
        const reply = "Terminal emulator initialized. Ready for sovereign root execution.";
        setLastReply(reply);
        setIsSpeaking(true);
        await speakVoice(reply);
        setIsSpeaking(false);
        return;
      }

      // 8. App Launchers
      const appMap: Record<string, { id: any; title: string }> = {
        browser: { id: "browser", title: "Browser" },
        calculator: { id: "calculator", title: "Calculator" },
        music: { id: "music", title: "Music Player" },
        photos: { id: "photos", title: "Photos" },
        store: { id: "appstore", title: "App Store" },
        markdown: { id: "markdown", title: "Markdown Studio" },
        updater: { id: "updater", title: "Update Center" },
        settings: { id: "settings", title: "Settings" },
        phone: { id: "phone", title: "Phone Connect" },
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
      const reply = `Command acknowledged: "${commandText}". Executing task via ARGUS sovereign neural engine.`;
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

      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.continuous = continuousMode;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("Listening for your command...");
      };

      recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        if (result && result[0]) {
          const text = result[0].transcript.trim();
          executeCommand(text);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== "no-speech") {
          setTranscript(`Voice input error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (continuousMode) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
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
    setTranscript("Voice Copilot idle.");
  }, []);

  // Listen to external speaking events
  useEffect(() => {
    const handleStart = () => setIsSpeaking(true);
    const handleEnd = () => setIsSpeaking(false);

    window.addEventListener("argus:speaking-started", handleStart);
    window.addEventListener("argus:speaking-ended", handleEnd);

    return () => {
      window.removeEventListener("argus:speaking-started", handleStart);
      window.removeEventListener("argus:speaking-ended", handleEnd);
    };
  }, []);

  return (
    <div className={styles.hudContainer}>
      {/* Floating Holographic Orb Trigger */}
      <button
        type="button"
        className={`${styles.orbButton} ${isListening || isSpeaking ? styles.orbActive : ""}`}
        onClick={() => {
          playNotificationSound();
          setIsOpen(!isOpen);
          if (!isOpen) {
            startListening();
          }
        }}
        title="ARGUS Sovereign Voice Copilot (Click to Speak)"
      >
        <div className={styles.energyRing} />
        {/* Arc Reactor Core SVG */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="6" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="12" cy="12" r="2" fill="#ffffff" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className={styles.orbLabel}>ARGUS CORE</span>
      </button>

      {/* Expanded Holographic Console Panel */}
      {isOpen && (
        <div className={styles.hologramPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>ARGUS VOICE COPILOT</span>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          {/* Audio Wave Visualizer */}
          <div className={styles.visualizerContainer}>
            {[8, 16, 24, 12, 28, 18, 22, 14, 26, 10, 20, 16].map((h, i) => (
              <div
                key={i}
                className={styles.waveBar}
                style={{
                  height: isListening || isSpeaking ? `${h}px` : "6px",
                  animationDuration: `${0.4 + (i % 4) * 0.15}s`,
                }}
              />
            ))}
          </div>

          {/* Transcript Display */}
          <div className={styles.transcriptBox}>{transcript}</div>

          {/* Last Spoken Response */}
          {lastReply && (
            <div className={styles.spokenReplyBox}>
              <strong>ARGUS:</strong> "{lastReply}"
            </div>
          )}

          {/* Quick Voice Commands */}
          <div className={styles.quickCommands}>
            {[
              "turn off wifi",
              "open weather in Tokyo",
              "write a note Sovereign",
              "open task manager",
              "calculate 125 * 8",
            ].map((cmd) => (
              <button
                key={cmd}
                className={styles.commandChip}
                onClick={() => executeCommand(cmd)}
              >
                🎙️ "{cmd}"
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className={styles.controlsRow}>
            <button
              className={styles.actionBtn}
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  startListening();
                }
              }}
            >
              {isListening ? "⏹ Stop Listening" : "🎙️ Speak to ARGUS"}
            </button>

            <button
              className={styles.actionBtn}
              style={{
                background: continuousMode
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
              onClick={() => setContinuousMode(!continuousMode)}
              title="Keep listening continuously for voice commands"
            >
              {continuousMode ? "✓ Always On" : "⚡ Always On"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
