import React, { useState, useRef, useEffect } from "react";
import {
  useStreamingChat,
  useOllamaStatus,
  useAIConfig,
  OLLAMA_STATUS_LABELS,
  OllamaStatus,
} from "../../lib/ai";
import type { PerformanceProfile } from "../../lib/ai";

// ─── Slash Command Types ──────────────────────────────────────────────────────

type SlashResult =
  | { type: "calc"; expr: string; result: string }
  | { type: "launch"; app: string }
  | { type: "system"; info: string }
  | { type: "unknown"; cmd: string };

// ─── Slash Command Handler ────────────────────────────────────────────────────

function handleSlashCommand(input: string): SlashResult | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;

  const [cmd, ...args] = trimmed.slice(1).split(" ");
  const rest = args.join(" ").trim();

  switch (cmd.toLowerCase()) {
    case "calc": {
      if (!rest) return { type: "calc", expr: "", result: "Usage: /calc <expression> (e.g. /calc 25 * 17)" };
      try {
        const sanitized = rest.replace(/[^0-9+\-*/().\s%]/g, "");
        if (!sanitized.trim()) {
          return { type: "calc", expr: rest, result: "Invalid expression" };
        }
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${sanitized})`)() as number;
        if (typeof result !== "number" || !isFinite(result)) {
          return { type: "calc", expr: rest, result: "Invalid expression" };
        }
        return { type: "calc", expr: rest, result: String(result) };
      } catch {
        return { type: "calc", expr: rest, result: "Could not evaluate expression" };
      }
    }

    case "notes":
      window.dispatchEvent(new CustomEvent("argus:launch", { detail: { app: "notes" } }));
      return { type: "launch", app: "Notes" };

    case "web":
    case "browser":
      window.dispatchEvent(new CustomEvent("argus:launch", { detail: { app: "browser" } }));
      return { type: "launch", app: "Browser" };

    case "music":
      window.dispatchEvent(new CustomEvent("argus:launch", { detail: { app: "music" } }));
      return { type: "launch", app: "Music Player" };

    case "system":
      return {
        type: "system",
        info: [
          `ARGUS Sovereign Workspace v0.2.1`,
          `Platform: ${navigator.platform}`,
          `User Agent: ${navigator.userAgent.split(")")[0]})`,
          `Language: ${navigator.language}`,
          `Online: ${navigator.onLine ? "Yes" : "No"}`,
          `Memory: ${(performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory
            ? `${Math.round((performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / 1048576)} MB used`
            : "Not available"}`,
          `Time: ${new Date().toLocaleString()}`,
        ].join("\n"),
      };

    default:
      return { type: "unknown", cmd };
  }
}

// ─── Workspace Automation Copilot Parser ──────────────────────────────────────

function executeCopilotCommand(text: string): { animatedReply: string } | null {
  const normalized = text.toLowerCase().trim();

  // 1. Wi-Fi connection controls
  if (normalized.includes("wifi") || normalized.includes("wi-fi")) {
    const isConnect = normalized.includes("connect") || normalized.includes("turn on") || normalized.includes("enable") || normalized.includes("start");
    const isDisconnect = normalized.includes("disconnect") || normalized.includes("turn off") || normalized.includes("disable") || normalized.includes("stop");

    if (isConnect) {
      window.dispatchEvent(new CustomEvent("argus:system-state-changed", {
        detail: { wifiActive: true, bluetoothActive: false, volume: 70, brightness: 85 }
      }));
      try {
        const raw = localStorage.getItem("argus-system-state");
        const next = raw ? JSON.parse(raw) : {};
        next.wifiActive = true;
        localStorage.setItem("argus-system-state", JSON.stringify(next));
      } catch {}
      return { animatedReply: "✓ **Action Executed:** Turned **ON** Wi-Fi connection." };
    }
    if (isDisconnect) {
      window.dispatchEvent(new CustomEvent("argus:system-state-changed", {
        detail: { wifiActive: false, bluetoothActive: false, volume: 70, brightness: 85 }
      }));
      try {
        const raw = localStorage.getItem("argus-system-state");
        const next = raw ? JSON.parse(raw) : {};
        next.wifiActive = false;
        localStorage.setItem("argus-system-state", JSON.stringify(next));
      } catch {}
      return { animatedReply: "✓ **Action Executed:** Turned **OFF** Wi-Fi connection." };
    }
  }

  // 2. Bluetooth controls
  if (normalized.includes("bluetooth")) {
    const isConnect = normalized.includes("connect") || normalized.includes("turn on") || normalized.includes("enable");
    const isDisconnect = normalized.includes("disconnect") || normalized.includes("turn off") || normalized.includes("disable");

    if (isConnect) {
      window.dispatchEvent(new CustomEvent("argus:system-state-changed", {
        detail: { wifiActive: true, bluetoothActive: true, volume: 70, brightness: 85 }
      }));
      try {
        const raw = localStorage.getItem("argus-system-state");
        const next = raw ? JSON.parse(raw) : {};
        next.bluetoothActive = true;
        localStorage.setItem("argus-system-state", JSON.stringify(next));
      } catch {}
      return { animatedReply: "✓ **Action Executed:** Turned **ON** Bluetooth." };
    }
    if (isDisconnect) {
      window.dispatchEvent(new CustomEvent("argus:system-state-changed", {
        detail: { wifiActive: true, bluetoothActive: false, volume: 70, brightness: 85 }
      }));
      try {
        const raw = localStorage.getItem("argus-system-state");
        const next = raw ? JSON.parse(raw) : {};
        next.bluetoothActive = false;
        localStorage.setItem("argus-system-state", JSON.stringify(next));
      } catch {}
      return { animatedReply: "✓ **Action Executed:** Turned **OFF** Bluetooth." };
    }
  }

  // 3. Browser launcher & automations
  if (normalized.includes("browser") || normalized.includes("youtube") || normalized.includes("google") || normalized.includes("wikipedia")) {
    const isLaunch = normalized.includes("open") || normalized.includes("launch") || normalized.includes("go to") || normalized.includes("visit") || normalized.includes("type");
    if (isLaunch) {
      let url = "";
      if (normalized.includes("youtube")) url = "https://youtube.com";
      else if (normalized.includes("google")) url = "https://google.com";
      else if (normalized.includes("wikipedia")) url = "https://en.wikipedia.org";
      else {
        const match = text.match(/(?:go to|visit|open|type)\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
        if (match && match[1]) {
          url = match[1];
        }
      }

      window.dispatchEvent(new CustomEvent("argus:launch", { detail: { app: "browser" } }));
      if (url) {
        if (!/^https?:\/\//i.test(url)) {
          url = "https://" + url;
        }
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("argus:browser-navigate", { detail: { url } }));
        }, 300);
        return { animatedReply: `✓ **Action Executed:** Opened **Browser** and navigated to \`${url}\`` };
      }
      return { animatedReply: "✓ **Action Executed:** Opened **Browser**." };
    }
  }

  // 4. Notes writer
  if (normalized.includes("note")) {
    if (normalized.includes("open") || normalized.includes("launch") || normalized.includes("write") || normalized.includes("create")) {
      window.dispatchEvent(new CustomEvent("argus:launch", { detail: { app: "notes" } }));
      
      const writeIndex = normalized.indexOf("write");
      const createIndex = normalized.indexOf("create");
      const splitIdx = writeIndex !== -1 ? writeIndex + 5 : (createIndex !== -1 ? createIndex + 6 : -1);
      const writeText = splitIdx !== -1 ? text.slice(splitIdx).trim() : "";

      if (writeText) {
        try {
          const notes = JSON.parse(localStorage.getItem("argus-notes") || "[]");
          notes.unshift({
            id: Date.now().toString(),
            title: "Copilot Note",
            content: writeText,
            updatedAt: new Date().toISOString()
          });
          localStorage.setItem("argus-notes", JSON.stringify(notes));
          window.dispatchEvent(new CustomEvent("argus:notes-updated"));
          return { animatedReply: `✓ **Action Executed:** Opened **Notes** and saved note: *"${writeText}"*` };
        } catch {}
      }
      return { animatedReply: "✓ **Action Executed:** Opened **Notes**." };
    }
  }

  // 5. General App launchers
  const apps = [
    { name: "terminal", keywords: ["terminal", "shell", "bash", "command prompt"] },
    { name: "calculator", keywords: ["calculator", "calc", "math"] },
    { name: "music", keywords: ["music", "player", "spotify", "song"] },
    { name: "photos", keywords: ["photos", "gallery", "images", "pictures"] },
    { name: "settings", keywords: ["settings", "control panel", "config"] }
  ];

  for (const app of apps) {
    if (app.keywords.some(keyword => normalized.includes(keyword))) {
      if (normalized.includes("open") || normalized.includes("launch")) {
        window.dispatchEvent(new CustomEvent("argus:launch", { detail: { app: app.name } }));
        const label = app.name.charAt(0).toUpperCase() + app.name.slice(1);
        return { animatedReply: `✓ **Action Executed:** Opened **${label === "Music" ? "Music Player" : label}**.` };
      }
    }
  }

  return null;
}

// ─── Status Colors ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<OllamaStatus, string> = {
  checking: "#94a3b8",
  not_installed: "#ef4444",
  offline: "#ef4444",
  no_model: "#f59e0b",
  model_missing: "#f59e0b",
  ready: "#10b981",
};

// ─── Chat App ─────────────────────────────────────────────────────────────────

export const ChatApp: React.FC = () => {
  const { config } = useAIConfig();
  const { status, recheck } = useOllamaStatus(config);
  const { messages, isStreaming, send, stop, clearMessages } = useStreamingChat(config);
  const [input, setInput] = useState("");
  const [slashResults, setSlashResults] = useState<
    Array<{ id: string; role: "slash"; content: string }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allMessages = [...messages].map((m) => ({ ...m, isSlash: false }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, slashResults]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // 1. Check for slash commands
    const slashResult = handleSlashCommand(trimmed);
    if (slashResult) {
      setInput("");
      let displayContent = "";

      switch (slashResult.type) {
        case "calc":
          displayContent =
            slashResult.expr
              ? `**Calc:** \`${slashResult.expr}\`\n→ **${slashResult.result}**`
              : slashResult.result;
          break;
        case "launch":
          displayContent = `✓ Launched **${slashResult.app}**`;
          break;
        case "system":
          displayContent = `**System Info**\n\`\`\`\n${slashResult.info}\n\`\`\``;
          break;
        case "unknown":
          displayContent = `Unknown command: \`/${slashResult.cmd}\`\n\nAvailable: \`/calc\` \`/notes\` \`/web\` \`/music\` \`/system\``;
          break;
      }

      setSlashResults((prev) => [
        ...prev,
        { id: `slash-${Date.now()}`, role: "slash", content: displayContent },
      ]);
      return;
    }

    // 2. Intercept Copilot automation commands
    const copilotResult = executeCopilotCommand(trimmed);
    if (copilotResult) {
      setInput("");
      const userMsgId = `user-${Date.now()}`;
      setSlashResults((prev) => [
        ...prev,
        { id: userMsgId, role: "slash", content: trimmed },
        { id: `slash-${Date.now()}`, role: "slash", content: copilotResult.animatedReply }
      ]);
      return;
    }

    // 3. Send to LLM
    setInput("");
    send(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayMessages = [...allMessages, ...slashResults.map((s) => ({ ...s, role: "slash" as const }))].sort(
    (a, b) => parseInt(a.id.split("-")[1] || "0") - parseInt(b.id.split("-")[1] || "0")
  );

  // Dynamic remote config status details
  const remoteActive = config.mode === "remote";
  const isDuckChat = config.remoteProvider === "duckchat";
  const remoteReady = isDuckChat || config.openrouterApiKey.trim() !== "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "10px" }}>
      {/* Status Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(0,0,0,0.15)",
          border: `1px solid ${remoteActive ? (remoteReady ? "#10b98130" : "#f59e0b30") : STATUS_COLORS[status] + "30"}`,
          padding: "8px 12px",
          borderRadius: "10px",
          fontSize: "12px",
        }}
      >
        {/* Dot indicator */}
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: remoteActive ? (remoteReady ? "#10b981" : "#f59e0b") : STATUS_COLORS[status],
            flexShrink: 0,
            boxShadow: (remoteActive ? remoteReady : status === "ready") ? `0 0 6px ${remoteActive ? "#10b981" : STATUS_COLORS[status]}` : "none",
          }}
        />

        <div style={{ flex: 1 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: "11px",
              color: remoteActive ? (remoteReady ? "#10b981" : "#f59e0b") : STATUS_COLORS[status],
              letterSpacing: "0.05em",
            }}
          >
            {remoteActive
              ? isDuckChat
                ? "FREE CLOUD READY"
                : remoteReady
                ? "OPENROUTER READY"
                : "API KEY REQUIRED"
              : OLLAMA_STATUS_LABELS[status]}
          </span>
          {remoteActive ? (
            <span style={{ color: "var(--fg-muted)", marginLeft: "8px", fontSize: "11px" }}>
              {isDuckChat ? "gpt-4o-mini" : config.openrouterModel}
            </span>
          ) : (
            status === "ready" && (
              <span style={{ color: "var(--fg-muted)", marginLeft: "8px", fontSize: "11px" }}>
                {config.model} · {config.ollamaEndpoint}
              </span>
            )
          )}
        </div>

        {/* Mode badge */}
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: "6px",
            background:
              config.mode === "local"
                ? "rgba(16,185,129,0.12)"
                : isDuckChat
                ? "rgba(52,211,153,0.12)"
                : "rgba(139,92,246,0.12)",
            color:
              config.mode === "local"
                ? "#10b981"
                : isDuckChat
                ? "#34d399"
                : "#8b5cf6",
          }}
        >
          {config.mode === "local"
            ? "LOCAL · PRIVATE"
            : isDuckChat
            ? "CLOUD · FREE KEYLESS"
            : "CLOUD · OPENROUTER"}
        </div>

        {!remoteActive && (
          <button
            onClick={recheck}
            title="Recheck Ollama connection"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--fg-muted)",
              cursor: "pointer",
              padding: "2px",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        )}
      </div>

      {/* Privacy Notice / Instruction Bar */}
      {config.mode === "local" ? (
        status === "ready" && (
          <div style={{ fontSize: "10px", color: "var(--fg-muted)", textAlign: "center", opacity: 0.6 }}>
            Prompt routed to local Ollama instance · No data leaves your machine
          </div>
        )
      ) : (
        !remoteReady && (
          <div style={{ fontSize: "10.5px", color: "#fbbf24", textAlign: "center", fontWeight: 500 }}>
            ⚠️ Insert your OpenRouter API key in Settings (Start Menu → Settings) to connect.
          </div>
        )
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          borderRadius: "10px",
          background: "rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.04)",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          overflowY: "auto",
        }}
      >
        {displayMessages.length === 0 ? (
          <div style={{ fontSize: "13px", color: "var(--fg-muted)", textAlign: "center", marginTop: "40px" }}>
            <div style={{ marginBottom: "8px", opacity: 0.4 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto", display: "block" }}>
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.52 1.64 4.77 4.2 6.24L5 21l4.32-2.16C10.2 18.94 11.08 19 12 19c5.52 0 10-3.58 10-8s-4.48-8-10-8z" fill="currentColor" />
              </svg>
            </div>
            {config.mode === "remote"
              ? "Start chatting with your OpenRouter cloud assistant."
              : status === "ready"
              ? "Start a conversation with your local AI"
              : status === "checking"
              ? "Checking Ollama..."
              : "Start ARGUS with Ollama running for local AI"}
            <div style={{ marginTop: "12px", fontSize: "11px", opacity: 0.7 }}>
              Try: <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "3px" }}>connect to wifi</code>{" "}
              <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "3px" }}>open youtube</code>{" "}
              <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "3px" }}>open notes and write shopping list</code>
            </div>
          </div>
        ) : (
          displayMessages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                    : msg.role === "slash"
                    ? "rgba(99,102,241,0.08)"
                    : msg.error
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(255,255,255,0.05)",
                border:
                  msg.role === "user"
                    ? "none"
                    : msg.error
                    ? "1px solid rgba(239,68,68,0.25)"
                    : msg.role === "slash"
                    ? "1px solid rgba(99,102,241,0.2)"
                    : "1px solid rgba(255,255,255,0.06)",
                padding: "9px 14px",
                borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                maxWidth: "85%",
                fontSize: "13px",
                lineHeight: "1.55",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.content}
              {msg.streaming && (
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "14px",
                    marginLeft: "2px",
                    verticalAlign: "middle",
                    background: "#a5b4fc",
                    borderRadius: "1px",
                    animation: "blink 0.7s steps(1) infinite",
                  }}
                />
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming || (config.mode === "remote" && !remoteReady)}
          placeholder={
            config.mode === "remote"
              ? isDuckChat
                ? "Message keyless Free Cloud AI... or type commands like 'open browser'"
                : remoteReady
                ? "Message OpenRouter cloud AI... or type commands like 'open browser'"
                : "API key required — configure OpenRouter in Settings"
              : status === "ready"
              ? "Message local AI... or type commands like 'connect wifi'"
              : "Ollama offline — pull models or switch to remote mode"
          }
          rows={1}
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            fontSize: "13px",
            color: "var(--fg-default)",
            resize: "none",
            minHeight: "42px",
            maxHeight: "120px",
            fontFamily: "inherit",
            lineHeight: "1.4",
            overflow: "auto",
          }}
        />

        {isStreaming ? (
          <button
            onClick={stop}
            style={{
              padding: "10px 16px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "12px",
              color: "#f87171",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            ■ Stop
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              padding: "10px 20px",
              background: input.trim() ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "rgba(255,255,255,0.04)",
              border: "none",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "13px",
              color: input.trim() ? "white" : "var(--fg-muted)",
              cursor: input.trim() ? "pointer" : "default",
              transition: "all 0.15s ease",
            }}
          >
            Send
          </button>
        )}
      </div>

      {messages.length > 0 && (
        <button
          onClick={clearMessages}
          style={{
            alignSelf: "center",
            background: "transparent",
            border: "none",
            color: "var(--fg-muted)",
            fontSize: "11px",
            cursor: "pointer",
            opacity: 0.5,
            textDecoration: "underline",
          }}
        >
          Clear conversation
        </button>
      )}

      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
    </div>
  );
};
