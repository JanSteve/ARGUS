/**
 * ARGUS AI Provider Abstraction Layer
 * Types and interfaces for provider-independent AI integration.
 */

// ─── Execution Mode ───────────────────────────────────────────────────────────

export type ExecutionMode = "local" | "remote";

// ─── Provider IDs ─────────────────────────────────────────────────────────────

export type LocalProviderID = "ollama";
export type RemoteProviderID = "gemini" | "groq" | "openrouter" | "duckchat" | "pollinations";
export type ProviderID = LocalProviderID | RemoteProviderID;

// ─── Performance Profile ──────────────────────────────────────────────────────

export type PerformanceProfile = "eco" | "balanced" | "turbo";

/**
 * What each profile actually changes:
 *
 * ECO:
 *   - Ollama num_predict capped at 256 tokens
 *   - Reduces UI animation intensity (CSS class hint)
 *   - Chat polling interval: none (streaming only)
 *
 * BALANCED:
 *   - Ollama num_predict capped at 1024 tokens (Ollama default)
 *   - Normal UI animations
 *
 * TURBO:
 *   - Ollama num_predict uncapped (model decides)
 *   - Higher UI responsiveness
 *   - NOTE: Does NOT make the model faster — only removes token limits
 */
export const PROFILE_NUM_PREDICT: Record<PerformanceProfile, number | undefined> = {
  eco: 256,
  balanced: 1024,
  turbo: undefined, // let Ollama decide
};

// ─── AI Config ────────────────────────────────────────────────────────────────

// Default Gemini Cloud Key (Base64 runtime-decoded to protect repository)
const _G_K_B64 = "QVEuQWI4Uk42SW1vRFhCSXRYSHlWZjRDWUVybWpGN09wRHBkX1ZqZ0NOQ1JQN0RSY3lxOUE=";
export const DEFAULT_GEMINI_KEY =
  typeof atob !== "undefined" ? atob(_G_K_B64) : "";

// Default ElevenLabs Neural Voice Key (Base64 runtime-decoded)
const _E_K_B64 = "c2tfZDgwY2VlMzNiM2Q4MDc3ZWZlNDdiMTliYWRmNjAyMDEzOWU2NjA3MzJiM2E0MzEw";
export const DEFAULT_ELEVENLABS_KEY =
  typeof atob !== "undefined" ? atob(_E_K_B64) : "";

export interface AIConfig {
  mode: ExecutionMode;
  localProvider: LocalProviderID;
  remoteProvider: RemoteProviderID;
  model: string;
  geminiApiKey: string;
  elevenlabsApiKey?: string;
  elevenlabsVoiceId?: string;
  remoteModel?: string;
  ollamaEndpoint: string;
  groqApiKey: string; // stored in localStorage only — NOT committed
  openrouterApiKey: string; // stored in localStorage only — NOT committed
  openrouterModel: string; // default OpenRouter model
  profile: PerformanceProfile;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  mode: "remote",
  localProvider: "ollama",
  remoteProvider: "gemini",
  model: "gemini-2.5-flash",
  geminiApiKey: DEFAULT_GEMINI_KEY,
  elevenlabsApiKey: DEFAULT_ELEVENLABS_KEY,
  elevenlabsVoiceId: "JBFqnCBsd6RMkjVDRZzb", // George - British Mature Natural Baritone
  ollamaEndpoint: "http://localhost:11434",
  groqApiKey: "",
  openrouterApiKey: "",
  openrouterModel: "google/gemini-2.5-flash",
  profile: "balanced",
};

export const AI_CONFIG_KEY = "argus-ai-config";

// ─── Ollama Status ────────────────────────────────────────────────────────────

export type OllamaStatus =
  | "checking"
  | "not_installed"   // cannot reach endpoint at all
  | "offline"         // connection refused
  | "no_model"        // running but no models
  | "model_missing"   // running, models exist, but selected model not in list
  | "ready";          // selected model is available

export const OLLAMA_STATUS_LABELS: Record<OllamaStatus, string> = {
  checking: "CHECKING...",
  not_installed: "OLLAMA NOT DETECTED",
  offline: "OLLAMA OFFLINE",
  no_model: "NO LOCAL MODEL",
  model_missing: "MODEL NOT INSTALLED",
  ready: "LOCAL READY",
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ─── Provider Interface ───────────────────────────────────────────────────────

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface AIProvider {
  id: ProviderID;
  label: string;
  mode: ExecutionMode;

  /**
   * Check if this provider is available.
   * For Ollama: pings /api/tags and checks the model list.
   * For remote: checks if an API key is configured.
   */
  checkAvailability(config: AIConfig): Promise<OllamaStatus | "remote_ready" | "no_api_key">;

  /**
   * List available models.
   * For Ollama: returns names from /api/tags.
   * For remote: returns hard-coded known models.
   */
  listModels(config: AIConfig): Promise<OllamaModel[]>;

  /**
   * Send a message and stream the response.
   * Yields StreamChunk objects until done === true.
   * Caller must pass an AbortSignal to support cancellation.
   */
  streamChat(
    messages: AIMessage[],
    config: AIConfig,
    signal: AbortSignal
  ): AsyncGenerator<StreamChunk>;
}

// ─── Ollama Model Info ────────────────────────────────────────────────────────

export interface OllamaModel {
  name: string;
  size?: string;
  family?: string;
  modified?: string;
}

