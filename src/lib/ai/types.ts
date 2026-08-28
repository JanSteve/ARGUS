/**
 * ARGUS AI Provider Abstraction Layer
 * Types and interfaces for provider-independent AI integration.
 */

export type ExecutionMode = "local" | "remote";

export type LocalProviderID = "ollama";
export type RemoteProviderID = "gemini" | "groq" | "openrouter" | "duckchat" | "pollinations";
export type ProviderID = LocalProviderID | RemoteProviderID;

export type PerformanceProfile = "eco" | "balanced" | "turbo";

export const PROFILE_NUM_PREDICT: Record<PerformanceProfile, number | undefined> = {
  eco: 256,
  balanced: 1024,
  turbo: undefined,
};

const _G_K_B64 = "QVEuQWI4Uk42SW1vRFhCSXRYSHlWZjRDWUVybWpGN09wRHBkX1ZqZ0NOQ1JQN0RSY3lxOUE=";
export const DEFAULT_GEMINI_KEY =
  typeof atob !== "undefined" ? atob(_G_K_B64) : "";

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
  groqApiKey: string;
  openrouterApiKey: string;
  openrouterModel: string;
  profile: PerformanceProfile;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  mode: "remote",
  localProvider: "ollama",
  remoteProvider: "gemini",
  model: "gemini-2.5-flash",
  geminiApiKey: DEFAULT_GEMINI_KEY,
  elevenlabsApiKey: DEFAULT_ELEVENLABS_KEY,
  elevenlabsVoiceId: "JBFqnCBsd6RMkjVDRZzb",
  ollamaEndpoint: "http://localhost:11434",
  groqApiKey: "",
  openrouterApiKey: "",
  openrouterModel: "google/gemini-2.5-flash",
  profile: "balanced",
};

export const AI_CONFIG_KEY = "argus-ai-config";

export type OllamaStatus =
  | "checking"
  | "not_installed"
  | "offline"
  | "no_model"
  | "model_missing"
  | "ready";

export const OLLAMA_STATUS_LABELS: Record<OllamaStatus, string> = {
  checking: "CHECKING...",
  not_installed: "OLLAMA NOT DETECTED",
  offline: "OLLAMA OFFLINE",
  no_model: "NO LOCAL MODEL",
  model_missing: "MODEL NOT INSTALLED",
  ready: "LOCAL READY",
};

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface AIProvider {
  id: ProviderID;
  label: string;
  mode: ExecutionMode;
  checkAvailability(config: AIConfig): Promise<OllamaStatus | "remote_ready" | "no_api_key">;
  listModels(config: AIConfig): Promise<OllamaModel[]>;
  streamChat(
    messages: AIMessage[],
    config: AIConfig,
    signal: AbortSignal
  ): AsyncGenerator<StreamChunk>;
}

export interface OllamaModel {
  name: string;
  size?: string;
  family?: string;
  modified?: string;
}
