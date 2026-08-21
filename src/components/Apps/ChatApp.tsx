/**
 * ARGUS Chat Application
 *
 * Connects to the local Ollama provider for real AI inference.
 *
 * PRIVACY NOTE:
 * In LOCAL mode, all prompts are sent ONLY to http://localhost:11434
 * No external network request is made.
 *
 * SLASH COMMANDS:
 * /calc <expr>  — evaluate math expression
 * /notes        — open Notes app
 * /web          — open Browser app
 * /music        — open Music Player app
 * /system       — show ARGUS system info
 */

import React, { useState, useRef, useEffect } from "react";
import {
  useStreamingChat,
  useOllamaStatus,
  useAIConfig,
  OLLAMA_STATUS_LABELS,
  OllamaStatus,
} from "../../lib/ai";

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
        // Safe math eval — only numbers, operators, parens, spaces
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
          `ARGUS Sovereign Workspace v0.2.0`,
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

  // Merge real messages with slash command results for display
  const allMessages = [...messages].map((m) => ({ ...m, isSlash: false }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, slashResults]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Check for slash commands first
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

    // Real AI message
    setInput("");
    send(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Combine all messages chronologically
  const displayMessages: Array<{
    id: string;
    role: "user" | "assistant" | "slash";
    content: string;
    streaming?: boolean;
    error?: boolean;
  }> = [...allMessages, ...slashResults.map((s) => ({ ...s, role: "slash" as const }))].sort(
    (a, b) => parseInt(a.id.split("-")[1] || "0") - parseInt(b.id.split("-")[1] || "0")
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "10px" }}>

      {/* Status Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(0,0,0,0.15)",
          border: `1px solid ${STATUS_COLORS[status]}30`,
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
            background: STATUS_COLORS[status],
            flexShrink: 0,
            boxShadow: status === "ready" ? `0 0 6px ${STATUS_COLORS[status]}` : "none",
          }}
        />

        <div style={{ flex: 1 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: "11px",
              color: STATUS_COLORS[status],
              letterSpacing: "0.05em",
            }}
          >
            {OLLAMA_STATUS_LABELS[status]}
          </span>
          {status === "ready" && (
            <span style={{ color: "var(--fg-muted)", marginLeft: "8px", fontSize: "11px" }}>
              {config.model} · {config.ollamaEndpoint}
            </span>
          )}
        </div>

        {/* Privacy indicator */}
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: "6px",
            background: config.mode === "local"
              ? "rgba(16,185,129,0.12)"
              : "rgba(245,158,11,0.12)",
            color: config.mode === "local" ? "#10b981" : "#f59e0b",
          }}
        >
          {config.mode === "local" ? "LOCAL · PRIVATE" : "REMOTE"}
        </div>

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
      </div>

      {/* Privacy Notice */}
      {config.mode === "local" && status === "ready" && (
        <div
          style={{
            fontSize: "10px",
            color: "var(--fg-muted)",
            textAlign: "center",
            opacity: 0.6,
          }}
        >
          Prompt routed to local Ollama instance · No data leaves your machine
        </div>
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
          <div
            style={{
              fontSize: "13px",
              color: "var(--fg-muted)",
              textAlign: "center",
              marginTop: "40px",
            }}
          >
            <div style={{ marginBottom: "8px", opacity: 0.4 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto", display: "block" }}>
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.52 1.64 4.77 4.2 6.24L5 21l4.32-2.16C10.2 18.94 11.08 19 12 19c5.52 0 10-3.58 10-8s-4.48-8-10-8z" fill="currentColor" />
              </svg>
            </div>
            {status === "ready"
              ? "Start a conversation with your local AI"
              : status === "checking"
              ? "Checking Ollama..."
              : "Start ARGUS with Ollama running for local AI"}
            <div style={{ marginTop: "12px", fontSize: "11px", opacity: 0.7 }}>
              Try slash commands: <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "3px" }}>/calc</code>{" "}
              <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "3px" }}>/notes</code>{" "}
              <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: "3px" }}>/system</code>
            </div>
          </div>
        ) : (
          displayMessages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf:
                  msg.role === "user"
                    ? "flex-end"
                    : "flex-start",
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
                borderRadius:
                  msg.role === "user"
                    ? "14px 14px 4px 14px"
                    : "14px 14px 14px 4px",
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
          disabled={isStreaming}
          placeholder={
            status === "ready"
              ? "Message local AI... (Enter to send, Shift+Enter for newline)"
              : status === "checking"
              ? "Checking Ollama..."
              : "Ollama not available — check Settings · Type /system for info"
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
              background:
                input.trim()
                  ? "linear-gradient(135deg, #3b82f6, #6366f1)"
                  : "rgba(255,255,255,0.04)",
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

      {/* Clear button */}
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

      {/* Blinking cursor keyframe */}
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
    </div>
  );
};
