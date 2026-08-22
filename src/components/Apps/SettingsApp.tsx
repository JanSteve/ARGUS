/**
 * ARGUS Settings Application
 *
 * Allows configuration of:
 * - Execution mode (LOCAL / REMOTE)
 * - AI provider and model
 * - Ollama endpoint
 * - Performance profile
 *
 * All settings are persisted to localStorage.
 * Changes immediately affect Chat.
 */

import React, { useRef } from "react";
import {
  useAIConfig,
  useOllamaStatus,
  OLLAMA_STATUS_LABELS,
  OllamaStatus,
} from "../../lib/ai";
import type { PerformanceProfile } from "../../lib/ai";

const STATUS_COLORS: Record<OllamaStatus, string> = {
  checking: "#94a3b8",
  not_installed: "#ef4444",
  offline: "#ef4444",
  no_model: "#f59e0b",
  model_missing: "#f59e0b",
  ready: "#10b981",
};

const PROFILE_DESCRIPTIONS: Record<PerformanceProfile, string> = {
  eco: "Caps AI output at 256 tokens. Reduces animations. Best for older hardware.",
  balanced: "Standard settings. Up to 1024 tokens. Recommended for most users.",
  turbo: "No token limit — model decides. Maximises response quality on capable hardware.",
};

type Section = "ai" | "profile" | "display" | "about";

export const SettingsApp: React.FC = () => {
  const [activeSection, setActiveSection] = React.useState<Section>("ai");
  const { config, updateConfig } = useAIConfig();
  const { status, models, recheck } = useOllamaStatus(config);
  const endpointRef = useRef<HTMLInputElement>(null);

  const sections: Array<{ id: Section; label: string; icon: string }> = [
    {
      id: "ai",
      label: "AI Engine",
      icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    },
    {
      id: "profile",
      label: "Performance",
      icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    },
    {
      id: "display",
      label: "Display",
      icon: "M2 3h20v14H2zM8 21h8M12 17v4",
    },
    {
      id: "about",
      label: "About",
      icon: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 16v-4M12 8h.01",
    },
  ];

  const baseRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 500,
  };

  const subLabelStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "var(--fg-muted)",
    marginTop: "2px",
  };

  const sectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    paddingBottom: "4px",
  };

  return (
    <div style={{ display: "flex", height: "100%", gap: "0" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "180px",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {sections.map((s) => (
          <div
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: activeSection === s.id ? 600 : 400,
              background:
                activeSection === s.id
                  ? "rgba(99,102,241,0.15)"
                  : "transparent",
              color:
                activeSection === s.id ? "#a5b4fc" : "var(--fg-muted)",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={s.icon} />
            </svg>
            {s.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "16px", overflow: "auto" }}>

        {/* ─── AI ENGINE ─── */}
        {activeSection === "ai" && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
              AI Engine
            </h3>

            {/* Status Banner */}
            {config.mode === "local" ? (
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: `1px solid ${STATUS_COLORS[status]}40`,
                  borderRadius: "10px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: STATUS_COLORS[status],
                    flexShrink: 0,
                    boxShadow:
                      status === "ready"
                        ? `0 0 8px ${STATUS_COLORS[status]}`
                        : "none",
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: STATUS_COLORS[status],
                      letterSpacing: "0.05em",
                    }}
                  >
                    {OLLAMA_STATUS_LABELS[status]}
                  </div>
                  {status === "model_missing" && (
                    <div style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "4px" }}>
                      Install with:{" "}
                      <code
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          padding: "1px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        ollama pull {config.model}
                      </code>
                    </div>
                  )}
                  {status === "no_model" && (
                    <div style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "4px" }}>
                      Pull a model:{" "}
                      <code
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          padding: "1px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        ollama pull llama3.2
                      </code>
                    </div>
                  )}
                </div>
                <button
                  onClick={recheck}
                  style={{
                    marginLeft: "auto",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    color: "var(--fg-muted)",
                    fontSize: "11px",
                    padding: "4px 10px",
                    cursor: "pointer",
                  }}
                >
                  Recheck
                </button>
              </div>
            ) : (
              <div
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border:
                    config.remoteProvider === "duckchat" || config.openrouterApiKey.trim()
                      ? "1px solid rgba(16,185,129,0.25)"
                      : "1px solid rgba(245,158,11,0.25)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background:
                      config.remoteProvider === "duckchat" || config.openrouterApiKey.trim()
                        ? "#10b981"
                        : "#f59e0b",
                    flexShrink: 0,
                    boxShadow:
                      config.remoteProvider === "duckchat" || config.openrouterApiKey.trim()
                        ? "0 0 8px #10b981"
                        : "none",
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color:
                        config.remoteProvider === "duckchat" || config.openrouterApiKey.trim()
                          ? "#10b981"
                          : "#f59e0b",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {config.remoteProvider === "duckchat"
                      ? "FREE CLOUD ACTIVE"
                      : config.openrouterApiKey.trim()
                      ? "OPENROUTER ACTIVE"
                      : "API KEY REQUIRED"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "4px" }}>
                    {config.remoteProvider === "duckchat"
                      ? "Prompts routed instantly through keyless DuckChat. Zero setup required."
                      : config.openrouterApiKey.trim()
                      ? "Prompts routed securely to your OpenRouter account."
                      : "Please insert your OpenRouter API key below to connect."}
                  </div>
                </div>
              </div>
            )}

            {/* Execution Mode */}
            <div style={baseRowStyle}>
              <div>
                <div style={labelStyle}>Execution Mode</div>
                <div style={subLabelStyle}>
                  {config.mode === "local"
                    ? "LOCAL — prompts stay on your machine (via Ollama)"
                    : "REMOTE — prompts routed to cloud (via OpenRouter)"}
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["local", "remote"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateConfig({ mode })}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border:
                        config.mode === mode
                          ? "1px solid rgba(99,102,241,0.6)"
                          : "1px solid rgba(255,255,255,0.1)",
                      background:
                        config.mode === mode
                          ? "rgba(99,102,241,0.2)"
                          : "rgba(255,255,255,0.04)",
                      color:
                        config.mode === mode ? "#a5b4fc" : "var(--fg-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Ollama Endpoint */}
            {config.mode === "local" && (
              <div style={baseRowStyle}>
                <div>
                  <div style={labelStyle}>Ollama Endpoint</div>
                  <div style={subLabelStyle}>Default: http://localhost:11434</div>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <input
                    ref={endpointRef}
                    defaultValue={config.ollamaEndpoint}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      color: "var(--fg-default)",
                      width: "180px",
                    }}
                  />
                  <button
                    onClick={() => {
                      if (endpointRef.current) {
                        updateConfig({ ollamaEndpoint: endpointRef.current.value });
                        setTimeout(recheck, 100);
                      }
                    }}
                    style={{
                      padding: "4px 10px",
                      background: "rgba(99,102,241,0.15)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: "6px",
                      color: "#a5b4fc",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {/* Remote Provider select */}
            {config.mode === "remote" && (
              <div style={baseRowStyle}>
                <div>
                  <div style={labelStyle}>Remote Provider</div>
                  <div style={subLabelStyle}>Choose keyless or custom OpenRouter</div>
                </div>
                <select
                  value={config.remoteProvider}
                  onChange={(e) => updateConfig({ remoteProvider: e.target.value as any })}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "12px",
                    color: "var(--fg-default)",
                    maxWidth: "200px",
                  }}
                >
                  <option value="duckchat">Free Cloud (No Key Needed)</option>
                  <option value="openrouter">OpenRouter (API Key Required)</option>
                </select>
              </div>
            )}

            {/* OpenRouter API Key input */}
            {config.mode === "remote" && config.remoteProvider === "openrouter" && (
              <div style={baseRowStyle}>
                <div>
                  <div style={labelStyle}>OpenRouter API Key</div>
                  <div style={subLabelStyle}>Get one from openrouter.ai</div>
                </div>
                <input
                  type="password"
                  value={config.openrouterApiKey}
                  onChange={(e) => updateConfig({ openrouterApiKey: e.target.value })}
                  placeholder="sk-or-v1-..."
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    color: "var(--fg-default)",
                    width: "240px",
                  }}
                />
              </div>
            )}

            {/* Model Selector */}
            <div style={baseRowStyle}>
              {config.mode === "local" ? (
                <>
                  <div>
                    <div style={labelStyle}>Active Model</div>
                    <div style={subLabelStyle}>
                      {models.length === 0
                        ? "No models detected"
                        : `${models.length} model${models.length > 1 ? "s" : ""} installed`}
                    </div>
                  </div>
                  <select
                    value={config.model}
                    onChange={(e) => updateConfig({ model: e.target.value })}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "12px",
                      color: "var(--fg-default)",
                      maxWidth: "200px",
                    }}
                  >
                    {models.length === 0 ? (
                      <option value={config.model}>{config.model} (not found)</option>
                    ) : (
                      models.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name}{m.size ? ` — ${m.size}` : ""}
                        </option>
                      ))
                    )}
                  </select>
                </>
              ) : (
                <>
                  <div>
                    <div style={labelStyle}>Active Cloud Model</div>
                    <div style={subLabelStyle}>
                      {config.remoteProvider === "duckchat"
                        ? "Keyless Cloud model routing"
                        : "OpenRouter model routing"}
                    </div>
                  </div>
                  <select
                    value={config.openrouterModel}
                    onChange={(e) => updateConfig({ openrouterModel: e.target.value })}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "12px",
                      color: "var(--fg-default)",
                      maxWidth: "240px",
                    }}
                  >
                    {config.remoteProvider === "duckchat" ? (
                      <>
                        <option value="gpt-4o-mini">GPT-4o Mini (Default)</option>
                        <option value="claude-3-haiku">Claude 3 Haiku</option>
                        <option value="meta-llama/Llama-3-70b-instruct">Llama 3 70B</option>
                        <option value="mistralai/Mixtral-8x7B-Instruct-v0.1">Mixtral 8x7B</option>
                      </>
                    ) : (
                      <>
                        <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B</option>
                        <option value="deepseek/deepseek-chat">DeepSeek Chat V3</option>
                        <option value="qwen/qwen-2.5-72b-instruct">Qwen 2.5 72B</option>
                        <option value="microsoft/phi-4">Microsoft Phi-4</option>
                      </>
                    )}
                  </select>
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── PERFORMANCE ─── */}
        {activeSection === "profile" && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
              Performance Profile
            </h3>
            <div
              style={{
                fontSize: "12px",
                color: "var(--fg-muted)",
                marginBottom: "16px",
              }}
            >
              Each profile changes documented settings — not fake speed claims.
            </div>

            {(["eco", "balanced", "turbo"] as PerformanceProfile[]).map((p) => (
              <div
                key={p}
                onClick={() => updateConfig({ profile: p })}
                style={{
                  padding: "12px 14px",
                  background:
                    config.profile === p
                      ? "rgba(99,102,241,0.12)"
                      : "rgba(255,255,255,0.02)",
                  border:
                    config.profile === p
                      ? "1px solid rgba(99,102,241,0.35)"
                      : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  cursor: "pointer",
                  marginBottom: "8px",
                  transition: "all 0.15s ease",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color:
                        config.profile === p ? "#a5b4fc" : "var(--fg-default)",
                    }}
                  >
                    {p}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--fg-muted)",
                      marginTop: "4px",
                      maxWidth: "300px",
                    }}
                  >
                    {PROFILE_DESCRIPTIONS[p]}
                  </div>
                </div>
                {config.profile === p && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#10b981",
                      background: "rgba(16,185,129,0.1)",
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    ACTIVE
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── DISPLAY ─── */}
        {activeSection === "display" && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: "16px", fontWeight: 600 }}>Display</h3>
            <p style={{ fontSize: "13px", color: "var(--fg-muted)", marginTop: "8px" }}>
              Use the Control Panel (click the clock in the taskbar) to change
              wallpapers, brightness, and volume.
            </p>
          </div>
        )}

        {/* ─── ABOUT ─── */}
        {activeSection === "about" && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: "16px", fontWeight: 600 }}>
              About ARGUS Sovereign Workspace
            </h3>
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.05)",
                marginTop: "12px",
              }}
            >
              <p style={{ fontSize: "14px", fontWeight: 600 }}>ARGUS</p>
              <p style={{ fontSize: "12px", color: "var(--fg-muted)", marginTop: "4px" }}>
                Version 0.2.0
              </p>
              <p style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "8px" }}>
                AI-Native Sovereign Desktop Workspace.
                <br />
                Built with React 19, TypeScript, Tauri 2, and Rust.
              </p>
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontSize: "11px",
                  color: "var(--fg-muted)",
                }}
              >
                <div>
                  <span style={{ fontWeight: 500, color: "var(--fg-default)" }}>
                    Chat AI
                  </span>{" "}
                  — REAL (Ollama streaming)
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: "var(--fg-default)" }}>
                    Notes
                  </span>{" "}
                  — REAL (localStorage)
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: "var(--fg-default)" }}>
                    Terminal
                  </span>{" "}
                  — SIMULATED (cosmetic shell)
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: "var(--fg-default)" }}>
                    Browser
                  </span>{" "}
                  — PARTIAL (address bar UI only)
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: "var(--fg-default)" }}>
                    File Explorer
                  </span>{" "}
                  — SIMULATED (in-memory filesystem)
                </div>
              </div>
              <p
                style={{
                  fontSize: "11px",
                  color: "var(--fg-muted)",
                  marginTop: "12px",
                }}
              >
                © 2026 R Jan Steve Daniel. Open-Core License.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
