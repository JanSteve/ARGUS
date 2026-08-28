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

import {
  loadVoiceConfig,
  saveVoiceConfig,
  speakVoice,
  PERSONA_SETTINGS,
  type VoicePersona,
  type VoiceConfig,
} from "../../lib/ai";

type Section = "ai" | "voice" | "profile" | "display" | "about";

export const SettingsApp: React.FC = () => {
  const [activeSection, setActiveSection] = React.useState<Section>("ai");
  const { config, updateConfig } = useAIConfig();
  const { status, models, recheck } = useOllamaStatus(config);
  const [voiceConfig, setVoiceConfig] = React.useState<VoiceConfig>(loadVoiceConfig);
  const [testPlaying, setTestPlaying] = React.useState(false);
  const endpointRef = useRef<HTMLInputElement>(null);

  const updateVoice = (partial: Partial<VoiceConfig>) => {
    const updated = { ...voiceConfig, ...partial };
    setVoiceConfig(updated);
    saveVoiceConfig(updated);
  };

  const handleTestVoice = async () => {
    setTestPlaying(true);
    await speakVoice(
      `ARGUS Sovereign OS voice synthesis verified. Persona ${PERSONA_SETTINGS[voiceConfig.persona].label} online.`,
      voiceConfig
    );
    setTimeout(() => setTestPlaying(false), 2000);
  };

  const sections: Array<{ id: Section; label: string; icon: string }> = [
    {
      id: "ai",
      label: "AI Engine",
      icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    },
    {
      id: "voice",
      label: "Voice & Persona",
      icon: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8",
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
                    maxWidth: "240px",
                  }}
                >
                  <option value="gemini">ARGUS Sovereign Intelligence (Direct Cloud)</option>
                  <option value="pollinations">ARGUS Keyless Engine (Multi-Model)</option>
                  <option value="duckchat">ARGUS Fast Cloud (Keyless)</option>
                  <option value="openrouter">ARGUS Custom Model Router</option>
                </select>
              </div>
            )}

            {/* Cloud API Key input */}
            {config.mode === "remote" && config.remoteProvider === "gemini" && (
              <div style={baseRowStyle}>
                <div>
                  <div style={labelStyle}>ARGUS Cloud Key</div>
                  <div style={subLabelStyle}>Default active key configured · free zero-cost</div>
                </div>
                <input
                  type="password"
                  value={config.geminiApiKey}
                  onChange={(e) => updateConfig({ geminiApiKey: e.target.value })}
                  placeholder="Paste Cloud API Key..."
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
                      {config.remoteProvider === "gemini"
                        ? "Google Gemini Direct Intelligence"
                        : config.remoteProvider === "pollinations"
                        ? "DeepSeek & OpenAI Keyless Routing"
                        : config.remoteProvider === "duckchat"
                        ? "Keyless Cloud model routing"
                        : "OpenRouter model routing"}
                    </div>
                  </div>
                  <select
                    value={
                      config.remoteProvider === "gemini"
                        ? config.model
                        : config.openrouterModel
                    }
                    onChange={(e) => {
                      if (config.remoteProvider === "gemini") {
                        updateConfig({ model: e.target.value });
                      } else {
                        updateConfig({ openrouterModel: e.target.value });
                      }
                    }}
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
                    {config.remoteProvider === "gemini" ? (
                      <>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest · Recommended)</option>
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning)</option>
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      </>
                    ) : config.remoteProvider === "pollinations" ? (
                      <>
                        <option value="openai">OpenAI GPT-4o (Keyless)</option>
                        <option value="deepseek-reasoner">DeepSeek R1 (Keyless)</option>
                        <option value="mistral">Mistral Large (Keyless)</option>
                        <option value="qwen">Qwen 2.5 72B (Keyless)</option>
                      </>
                    ) : config.remoteProvider === "duckchat" ? (
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

        {/* ─── VOICE & PERSONA ─── */}
        {activeSection === "voice" && (
          <div style={sectionStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
                Voice Persona & Neural Synthesis
              </h3>
              <button
                onClick={handleTestVoice}
                disabled={testPlaying}
                style={{
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {testPlaying ? "🔊 Testing Voice..." : "🔊 Test Persona"}
              </button>
            </div>

            <div style={{ fontSize: "12px", color: "var(--fg-muted)", marginBottom: "16px" }}>
              Select ARGUS's personal voice identity. Powered by ElevenLabs British High-Definition Neural Engine with natural human cadence, MiniMax Speech-01-HD, and resilient Web Speech fallback.
            </div>

            {/* Persona Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {(["argus", "ultron", "sovereign"] as VoicePersona[]).map((p) => {
                const setting = PERSONA_SETTINGS[p];
                const isSelected = voiceConfig.persona === p;
                return (
                  <div
                    key={p}
                    onClick={() => updateVoice({ persona: p })}
                    style={{
                      padding: "12px 14px",
                      background: isSelected ? "rgba(99, 102, 241, 0.12)" : "rgba(255, 255, 255, 0.02)",
                      border: isSelected ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid rgba(255, 255, 255, 0.06)",
                      borderRadius: "10px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "13px", color: isSelected ? "#818cf8" : "inherit" }}>
                        {setting.label}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--fg-muted)", marginTop: "2px" }}>
                        {setting.description}
                      </div>
                    </div>
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        border: isSelected ? "4px solid #6366f1" : "2px solid rgba(255,255,255,0.2)",
                        background: isSelected ? "#fff" : "transparent",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* ElevenLabs API Settings */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={labelStyle}>ElevenLabs High-Definition Voice (Primary)</span>
                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>● Active</span>
              </div>

              {/* Notice & Credits */}
              <div
                style={{
                  background: "rgba(6, 182, 212, 0.08)",
                  border: "1px solid rgba(6, 182, 212, 0.25)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "11px",
                  color: "#38bdf8",
                  marginBottom: "12px",
                  lineHeight: "1.45",
                }}
              >
                ⚡ <strong>10,000 monthly credits per ElevenLabs account</strong>. Uses human British natural voice for ARGUS. If credits reach the limit, ARGUS automatically alerts you and switches to the secondary neural voice engine so speech never stops. You can paste a new key anytime below.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "11.5px", color: "var(--fg-muted)" }}>ElevenLabs API Key:</label>
                <input
                  type="password"
                  value={config.elevenlabsApiKey || ""}
                  onChange={(e) => updateConfig({ elevenlabsApiKey: e.target.value })}
                  placeholder="Paste ElevenLabs API Key (sk_...)..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                />
              </div>
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
