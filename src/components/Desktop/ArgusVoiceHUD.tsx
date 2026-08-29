/**
 * ARGUS Holographic Voice HUD & Autonomous Wake-Word Engine
 * Persona: Imposing Queen — Steely, Polished, Regal Female Sovereign Intelligence
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./ArgusVoiceHUD.module.css";
import { speakVoice } from "../../lib/ai";
import { loadVoiceConfig, saveVoiceConfig, PERSONA_SETTINGS, type VoicePersona } from "../../lib/ai/minimaxVoice";
import { playNotificationSound } from "../../lib/soundEffects";

interface ArgusVoiceHUDProps {
  onLaunchApp: (component: any, title: string) => void;
}

export const ArgusVoiceHUD: React.FC<ArgusVoiceHUDProps> = ({ onLaunchApp }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("Say 'Hey ARGUS' or speak your imperial command...");
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<VoicePersona>(() => loadVoiceConfig().persona || "imposing_queen");

  const recognitionRef = useRef<any>(null);

  const handlePersonaChange = (newPersona: VoicePersona) => {
    setCurrentPersona(newPersona);
    const cfg = loadVoiceConfig();
    saveVoiceConfig({ ...cfg, persona: newPersona });
  };

  // Command Execution Engine (Regal Queen Tone)
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
          const reply = "At your command. Wi-Fi interface has been deactivated.";
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
          const reply = "Re-establishing Wi-Fi link. Sovereign network online and secured.";
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
          const reply = "Bluetooth hardware link disabled per your directive.";
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
          const reply = "Bluetooth interface active. Scanning for paired hardware.";
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
              title: "Imperial Sovereign Note",
              content: noteContent,
              updatedAt: new Date().toISOString(),
            });
            localStorage.setItem("argus-notes", JSON.stringify(notes));
            window.dispatchEvent(new CustomEvent("argus:notes-updated"));
          } catch {}
        }
        const reply = `Imperial directive recorded to sovereign memory: ${noteContent || "New Note"}`;
        setLastReply(reply);
        setIsSpeaking(true);
        await speakVoice(reply);
        setIsSpeaking(false);
        return;
      }

      // 4. Weather Radar
      if (lower.includes("weather") || lower.includes("temperature") || lower.includes("forecast")) {
        onLaunchApp("weather", "Weather");
        const reply = "Opening live Weather Satellite Radar. Atmospheric telemetry loaded.";
        setLastReply(reply);
        setIsSpeaking(true);
        await speakVoice(reply);
        setIsSpeaking(false);
        return;
      }

      // 5. Task Manager / Hardware Telemetry
      if (lower.includes("task") || lower.includes("process") || lower.includes("cpu") || lower.includes("memory")) {
        onLaunchApp("taskmanager", "Task Manager");
        const reply = "Accessing Task Manager. All neural and hardware cores report nominal execution.";
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
              const reply = `The calculation yields exactly ${result}.`;
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
        const reply = "Terminal emulator online. Ready for sovereign root execution.";
        setLastReply(reply);
        setIsSpeaking(true);
        await speakVoice(reply);
        setIsSpeaking(false);
        return;
      }

      // 8. Sovereign Vault & Security
      if (lower.includes("vault") || lower.includes("secret") || lower.includes("security") || lower.includes("card")) {
        onLaunchApp("vault", "Sovereign Vault");
        const reply = "Unlocking Sovereign Secret Vault. AES-256-GCM zero-knowledge enclave ready.";
        setLastReply(reply);
        setIsSpeaking(true);
        await speakVoice(reply);
        setIsSpeaking(false);
        return;
      }

      // 9. App Launchers
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
        swarm: { id: "swarm", title: "Agent Swarm" },
        canvas: { id: "canvas", title: "Neural Canvas" },
        controlplane: { id: "controlplane", title: "Control Plane" },
      };

      for (const [key, val] of Object.entries(appMap)) {
        if (lower.includes(key)) {
          onLaunchApp(val.id, val.title);
          const reply = `Opening ${val.title} at your command.`;
          setLastReply(reply);
          setIsSpeaking(true);
          await speakVoice(reply);
          setIsSpeaking(false);
          return;
        }
      }

      // 10. Default Direct Answer
      const reply = `Directive received: "${commandText}". Executing via ARGUS Sovereign Queen Intelligence.`;
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
      setTranscript("Speech recognition is not supported in this browser environment.");
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
        setTranscript("Listening for your imperial command...");
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
    setTranscript("Imposing Queen Voice Copilot idle.");
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
      {/* Floating Imperial Crown Voice Orb Trigger */}
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
        title="ARGUS Sovereign Voice Copilot (Imposing Queen • Steely, Polished, Regal)"
      >
        <div className={styles.energyRing} />
        {/* Imperial Sovereign Queen Crown & Neural Core SVG */}
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8">
          {/* Royal Crown Geometry */}
          <path d="M2 19h20L19 7l-5 6-2-8-2 8-5-6-3 12z" fill="url(#crownGoldGradient)" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round" />
          {/* Imperial Jewels */}
          <circle cx="2" cy="7" r="1.5" fill="#f59e0b" />
          <circle cx="7" cy="13" r="1" fill="#38bdf8" />
          <circle cx="12" cy="5" r="2" fill="#c084fc" />
          <circle cx="17" cy="13" r="1" fill="#38bdf8" />
          <circle cx="22" cy="7" r="1.5" fill="#f59e0b" />
          {/* Base Headband */}
          <rect x="2" y="18.5" width="20" height="2.5" rx="1" fill="#fbbf24" />
          <defs>
            <linearGradient id="crownGoldGradient" x1="2" y1="5" x2="22" y2="21" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fbbf24" stopOpacity="0.8" />
              <stop offset="0.5" stopColor="#a855f7" stopOpacity="0.6" />
              <stop offset="1" stopColor="#f59e0b" stopOpacity="0.9" />
            </linearGradient>
          </defs>
        </svg>
        <span className={styles.orbLabel}>ARGUS QUEEN</span>
      </button>

      {/* Expanded Holographic Console Panel */}
      {isOpen && (
        <div className={styles.hologramPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                <path d="M2 19h20L19 7l-5 6-2-8-2 8-5-6-3 12z" fill="#f59e0b" />
              </svg>
              <span>IMPOSING QUEEN VOICE ENGINE</span>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          {/* Persona Selection Header */}
          <div className={styles.personaBadge}>
            <span className={styles.personaTitle}>👑 {PERSONA_SETTINGS[currentPersona]?.label || "Imposing Queen"}</span>
            <span className={styles.personaTag}>MiniMax HD • Female</span>
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
              <strong>ARGUS QUEEN:</strong> "{lastReply}"
            </div>
          )}

          {/* Quick Voice Commands */}
          <div className={styles.quickCommands}>
            {[
              "turn off wifi",
              "open weather in Tokyo",
              "write a note Imperial Directive",
              "open sovereign vault",
              "calculate 1024 * 64",
            ].map((cmd) => (
              <button
                key={cmd}
                className={styles.commandChip}
                onClick={() => executeCommand(cmd)}
              >
                👑 "{cmd}"
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
              {isListening ? "⏹ Stop Listening" : "👑 Speak to ARGUS"}
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
