/**
 * ARGUS Sovereign Chat Assistant
 * Powered by Google Gemini 2.5 Flash & J.A.R.V.I.S. Voice Copilot
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "./ChatApp.module.css";
import {
  useStreamingChat,
  useAIConfig,
  speakVoice,
  stopSpeaking,
} from "../../lib/ai";
import { playNotificationSound } from "../../lib/soundEffects";

// Instant ARGUS Acknowledgments for 0-Delay Conversational Pacing
const ARGUS_QUICK_ACKS = [
  "Right away, sir. Let me do that for you.",
  "Working on it now. Coming right up.",
  "Understood. Accessing sovereign neural matrix.",
  "Processing your command immediately, sir.",
  "On it, sir. Stand by.",
];

function getRandomAck(): string {
  return ARGUS_QUICK_ACKS[Math.floor(Math.random() * ARGUS_QUICK_ACKS.length)];
}

// ─── Workspace Automation Copilot Parser ──────────────────────────────────────

function executeCopilotCommand(text: string): { reply: string; spoken: string } | null {
  const lower = text.toLowerCase().trim();

  // 1. Wi-Fi connection controls
  if (lower.includes("wifi") || lower.includes("wi-fi")) {
    const isConnect = lower.includes("connect") || lower.includes("turn on") || lower.includes("enable") || lower.includes("start");
    const isDisconnect = lower.includes("disconnect") || lower.includes("turn off") || lower.includes("disable") || lower.includes("stop");

    if (isConnect) {
      window.dispatchEvent(
        new CustomEvent("argus:system-state-changed", {
          detail: { wifiActive: true },
        })
      );
      return {
        reply: "✓ **Action Executed:** Wi-Fi interface connected to Sovereign Network.",
        spoken: "Re-establishing Wi-Fi link. Sovereign network connected.",
      };
    }
    if (isDisconnect) {
      window.dispatchEvent(
        new CustomEvent("argus:system-state-changed", {
          detail: { wifiActive: false },
        })
      );
      return {
        reply: "✓ **Action Executed:** Wi-Fi interface deactivated for total isolation.",
        spoken: "Right away, sir. Wi-Fi interface has been deactivated.",
      };
    }
  }

  // 2. Bluetooth controls
  if (lower.includes("bluetooth")) {
    const isEnable = lower.includes("on") || lower.includes("enable") || lower.includes("start");
    const isDisable = lower.includes("off") || lower.includes("disable") || lower.includes("stop");

    if (isEnable) {
      window.dispatchEvent(
        new CustomEvent("argus:system-state-changed", {
          detail: { bluetoothActive: true },
        })
      );
      return {
        reply: "✓ **Action Executed:** Bluetooth hardware interface enabled.",
        spoken: "Bluetooth interface enabled.",
      };
    }
    if (isDisable) {
      window.dispatchEvent(
        new CustomEvent("argus:system-state-changed", {
          detail: { bluetoothActive: false },
        })
      );
      return {
        reply: "✓ **Action Executed:** Bluetooth hardware interface disabled.",
        spoken: "Bluetooth interface disabled.",
      };
    }
  }

  // 3. Notes Writer
  if (lower.includes("note")) {
    if (lower.includes("open") || lower.includes("launch") || lower.includes("write") || lower.includes("create")) {
      window.dispatchEvent(new CustomEvent("argus:launch", { detail: { app: "notes" } }));

      const writeIndex = lower.indexOf("write");
      const createIndex = lower.indexOf("create");
      const splitIdx = writeIndex !== -1 ? writeIndex + 5 : (createIndex !== -1 ? createIndex + 6 : -1);
      const writeText = splitIdx !== -1 ? text.slice(splitIdx).trim() : "";

      if (writeText) {
        try {
          const notes = JSON.parse(localStorage.getItem("argus-notes") || "[]");
          notes.unshift({
            id: Date.now().toString(),
            title: "Copilot Note",
            content: writeText,
            updatedAt: new Date().toISOString(),
          });
          localStorage.setItem("argus-notes", JSON.stringify(notes));
          window.dispatchEvent(new CustomEvent("argus:notes-updated"));
          return {
            reply: `✓ **Action Executed:** Opened **Notes** and saved: *"${writeText}"*`,
            spoken: `Note saved to your sovereign workspace: ${writeText}`,
          };
        } catch {}
      }
      return {
        reply: "✓ **Action Executed:** Opened **Notes**.",
        spoken: "Opening Notes app for you, sir.",
      };
    }
  }

  // 4. App Launchers
  const apps = [
    { name: "growth", label: "Growth Command Center", spoken: "Deploying Autonomous Growth and Marketing Agent matrix.", keywords: ["growth", "marketing", "campaign", "twitter agent", "viral", "seo", "investor pitch"] },
    { name: "workspaces", label: "AI Workspaces", spoken: "Opening AI Workspaces and Startup Milestone Hub.", keywords: ["workspace", "workspaces", "startup", "kanban", "milestone", "roadmap", "tasks"] },
    { name: "saas", label: "SaaS Pro Store", spoken: "Opening SaaS Pro Subscription and License Hub.", keywords: ["pricing", "saas", "pro", "subscription", "upgrade", "license", "tier", "store"] },
    { name: "phone", label: "Phone Connect", spoken: "Opening Phone Connect Mobile Bridge QR code.", keywords: ["phone", "mobile", "iphone", "android", "remote access", "qr"] },
    { name: "weather", label: "Weather", spoken: "Opening live Weather Satellite Radar.", keywords: ["weather", "forecast", "climate", "radar"] },
    { name: "taskmanager", label: "Task Manager", spoken: "Accessing Task Manager. Neural and hardware telemetry nominal.", keywords: ["task manager", "processes", "activity monitor", "cpu", "memory"] },
    { name: "terminal", label: "Terminal", spoken: "Terminal emulator initialized. Ready for sovereign root execution.", keywords: ["terminal", "shell", "bash", "command prompt"] },
    { name: "browser", label: "Browser", spoken: "Launching Sovereign Browser.", keywords: ["browser", "web", "internet", "google", "youtube"] },
    { name: "calculator", label: "Calculator", spoken: "Opening Calculator.", keywords: ["calculator", "calc", "math"] },
    { name: "music", label: "Music Player", spoken: "Launching Music Player.", keywords: ["music", "player", "spotify", "song"] },
    { name: "photos", label: "Photos", spoken: "Opening Photos gallery.", keywords: ["photos", "gallery", "images", "pictures"] },
    { name: "markdown", label: "Markdown Studio", spoken: "Opening Markdown Studio editor.", keywords: ["markdown", "code editor", "markdown studio", "editor"] },
    { name: "appstore", label: "App Store", spoken: "Opening App Store catalogue.", keywords: ["app store", "store", "marketplace", "plugins"] },
    { name: "updater", label: "Update Center", spoken: "Checking for system updates on GitHub release channels.", keywords: ["update", "updates", "upgrade", "check update"] },
    { name: "settings", label: "Settings", spoken: "Opening System Settings.", keywords: ["settings", "config", "control panel"] },
    { name: "explorer", label: "File Explorer", spoken: "Opening File Explorer.", keywords: ["files", "explorer", "directory", "documents"] },
  ];

  for (const app of apps) {
    if (app.keywords.some((keyword) => lower.includes(keyword))) {
      if (lower.includes("open") || lower.includes("launch") || lower.includes("show") || lower.includes("check")) {
        window.dispatchEvent(new CustomEvent("argus:launch", { detail: { app: app.name } }));
        return {
          reply: `✓ **Action Executed:** Opened **${app.label}**.`,
          spoken: app.spoken,
        };
      }
    }
  }

  // 5. Direct Calculation
  if (lower.startsWith("calc") || lower.includes("calculate") || lower.includes("times") || lower.includes("divided by")) {
    const expr = lower
      .replace(/calculate|what is|how much is|calc/g, "")
      .replace(/times|multiplied by/g, "*")
      .replace(/plus/g, "+")
      .replace(/minus/g, "-")
      .replace(/divided by/g, "/")
      .replace(/[^0-9+\-*/().\s]/g, "");

    if (expr.trim()) {
      try {
        const result = Function(`"use strict"; return (${expr})`)();
        if (typeof result === "number" && isFinite(result)) {
          return {
            reply: `📐 **Calculation:** \`${expr.trim()}\` = **${result}**`,
            spoken: `The calculation yields ${result}.`,
          };
        }
      } catch {}
    }
  }

  return null;
}

// ─── Main ChatApp Component ───────────────────────────────────────────────────

export const ChatApp: React.FC = () => {
  const { config } = useAIConfig();
  const { messages, isStreaming, send, stop, clearMessages } = useStreamingChat(config);
  const [input, setInput] = useState("");
  const [localHistory, setLocalHistory] = useState<
    Array<{ id: string; role: "user" | "assistant" | "copilot"; content: string }>
  >([]);
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wasStreamingRef = useRef(isStreaming);

  const lastMsg = messages[messages.length - 1];

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, localHistory]);

  // Voice synthesis upon completion
  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming && lastMsg && lastMsg.role === "assistant") {
      playNotificationSound();
      if (ttsEnabled) {
        speakVoice(lastMsg.content);
      }
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, lastMsg, ttsEnabled]);

  // Voice Dictation
  const toggleVoiceDictation = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert("Speech recognition is not supported in this browser environment.");
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, [isListening]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setInput("");

    // 1. Intercept Copilot automation commands
    const copilot = executeCopilotCommand(trimmed);
    if (copilot) {
      setLocalHistory((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", content: trimmed },
        { id: `c-${Date.now()}`, role: "copilot", content: copilot.reply },
      ]);
      if (ttsEnabled) {
        await speakVoice(copilot.spoken);
      }
      return;
    }

    // 2. Instant JARVIS Conversational Acknowledgment
    if (ttsEnabled) {
      speakVoice(getRandomAck());
    }

    // 3. Send to Gemini / Local AI stream
    send(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Combine streaming LLM messages + local copilot actions
  const displayItems = [
    ...localHistory,
    ...messages.map((m) => ({ id: m.id, role: m.role, content: m.content, streaming: m.streaming })),
  ];

  return (
    <div className={styles.container}>
      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={`${styles.statusDot} ${styles.statusDotReady}`} />

        <div className={styles.statusInfo}>
          <span className={styles.statusTitle}>ARGUS SOVEREIGN INTELLIGENCE</span>
          <span className={styles.statusSub}>Neural Core Active · Zero-Latency Stream</span>
        </div>

        <div className={styles.modeBadge}>
          {config.mode === "remote" ? "ARGUS NEURAL" : "SOVEREIGN LOCAL"}
        </div>

        <div className={styles.toolButtons}>
          <button
            className={`${styles.toolBtn} ${ttsEnabled ? styles.toolBtnActive : ""}`}
            onClick={() => {
              if (ttsEnabled) stopSpeaking();
              setTtsEnabled(!ttsEnabled);
            }}
            title={ttsEnabled ? "Voice Output Active (Click to Mute)" : "Voice Output Muted (Click to Enable)"}
          >
            {ttsEnabled ? "🔊 ARGUS Voice ON" : "🔇 Voice Muted"}
          </button>

          {displayItems.length > 0 && (
            <button
              className={styles.toolBtn}
              onClick={() => {
                clearMessages();
                setLocalHistory([]);
              }}
              title="Clear conversation"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages Scrollable Feed */}
      <div className={styles.messagesFeed}>
        {displayItems.length === 0 ? (
          <div className={styles.welcomeCard}>
            <div className={styles.welcomeIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className={styles.welcomeTitle}>ARGUS Sovereign Copilot</div>
            <div className={styles.welcomeDesc}>
              Ask anything with zero latency via ARGUS Sovereign Intelligence, or speak natural commands to control your OS.
            </div>

            <div className={styles.chipsGrid}>
              {[
                "turn off wifi",
                "open weather in Tokyo",
                "open task manager",
                "write a note Project Argus",
                "calculate 240 * 15",
                "open terminal",
              ].map((chip) => (
                <button
                  key={chip}
                  className={styles.promptChip}
                  onClick={() => {
                    setInput(chip);
                  }}
                >
                  ⚡ "{chip}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          displayItems.map((item) => (
            <div
              key={item.id}
              className={`${styles.messageBubble} ${
                item.role === "user"
                  ? styles.userBubble
                  : item.role === "copilot"
                  ? styles.copilotBubble
                  : styles.assistantBubble
              }`}
            >
              {item.content}
              {"streaming" in item && (item as any).streaming && <span className={styles.cursorPulse} />}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <button
          type="button"
          className={`${styles.micBtn} ${isListening ? styles.micBtnActive : ""}`}
          onClick={toggleVoiceDictation}
          title={isListening ? "Listening... (Click to Stop)" : "Click to Speak"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder="Ask ARGUS anything... or say 'open weather', 'turn off wifi'"
          rows={1}
          className={styles.textInput}
        />

        {isStreaming ? (
          <button type="button" className={styles.sendBtn} onClick={stop} title="Stop generation">
            ⏹
          </button>
        ) : (
          <button
            type="button"
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!input.trim()}
            title="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
