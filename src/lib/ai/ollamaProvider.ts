/**
 * ARGUS Ollama Provider
 *
 * Communicates with a locally running Ollama instance.
 * Default endpoint: http://localhost:11434
 *
 * PRIVACY: No data leaves the local machine in LOCAL mode.
 * All requests go to localhost only.
 *
 * IMPORTANT: This provider NEVER falls back to a remote endpoint.
 * If Ollama is unavailable, it returns an error — it does NOT
 * silently reroute prompts to a cloud provider.
 */

import type {
  AIConfig,
  AIMessage,
  AIProvider,
  OllamaModel,
  OllamaStatus,
  StreamChunk,
} from "./types";
import { PROFILE_NUM_PREDICT } from "./types";

// ─── Ollama API Types ─────────────────────────────────────────────────────────

interface OllamaTagsResponse {
  models: Array<{
    name: string;
    size: number;
    details?: {
      family?: string;
    };
    modified_at?: string;
  }>;
}

interface OllamaChatResponse {
  message?: { content: string };
  done: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${bytes} B`;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: options.signal
        ? // merge with existing signal if provided
          (options.signal as AbortSignal)
        : controller.signal,
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── Ollama Provider ──────────────────────────────────────────────────────────

export const ollamaProvider: AIProvider = {
  id: "ollama",
  label: "Ollama (Local)",
  mode: "local",

  async checkAvailability(config: AIConfig): Promise<OllamaStatus | "remote_ready" | "no_api_key"> {
    const endpoint = config.ollamaEndpoint || "http://localhost:11434";

    let tagsRes: Response;
    try {
      tagsRes = await fetchWithTimeout(`${endpoint}/api/tags`, { method: "GET" }, 4000);
    } catch (err) {
      // Connection refused or network error → offline/not installed
      // We cannot distinguish "not installed" from "installed but not running"
      // from the browser. We report "offline" — user must check manually.
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("abort") || message.includes("timeout")) {
        return "offline";
      }
      return "offline";
    }

    if (!tagsRes.ok) {
      return "offline";
    }

    let data: OllamaTagsResponse;
    try {
      data = (await tagsRes.json()) as OllamaTagsResponse;
    } catch {
      return "offline";
    }

    if (!data.models || data.models.length === 0) {
      return "no_model";
    }

    const selectedModel = config.model;
    const hasModel = data.models.some(
      (m) =>
        m.name === selectedModel ||
        m.name.split(":")[0] === selectedModel.split(":")[0]
    );

    if (!hasModel) {
      return "model_missing";
    }

    return "ready";
  },

  async listModels(config: AIConfig): Promise<OllamaModel[]> {
    const endpoint = config.ollamaEndpoint || "http://localhost:11434";
    try {
      const res = await fetchWithTimeout(`${endpoint}/api/tags`, { method: "GET" }, 4000);
      if (!res.ok) return [];
      const data = (await res.json()) as OllamaTagsResponse;
      return (data.models || []).map((m) => ({
        name: m.name,
        size: m.size ? formatBytes(m.size) : undefined,
        family: m.details?.family,
        modified: m.modified_at,
      }));
    } catch {
      return [];
    }
  },

  async *streamChat(
    messages: AIMessage[],
    config: AIConfig,
    signal: AbortSignal
  ): AsyncGenerator<StreamChunk> {
    const endpoint = config.ollamaEndpoint || "http://localhost:11434";
    const numPredict = PROFILE_NUM_PREDICT[config.profile];

    const body: Record<string, unknown> = {
      model: config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    };

    if (numPredict !== undefined) {
      body.options = { num_predict: numPredict };
    }

    let response: Response;
    try {
      response = await fetch(`${endpoint}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Connection failed";
      if (err instanceof Error && err.name === "AbortError") {
        yield { content: "", done: true };
        return;
      }
      throw new Error(`Ollama unavailable: ${message}`);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "Unknown error");
      throw new Error(`Ollama error ${response.status}: ${text}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Ollama response body is empty");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        if (signal.aborted) {
          reader.cancel();
          yield { content: "", done: true };
          return;
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Each line is a JSON object
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          let chunk: OllamaChatResponse;
          try {
            chunk = JSON.parse(trimmed) as OllamaChatResponse;
          } catch {
            // Malformed JSON line — skip
            continue;
          }

          const content = chunk.message?.content ?? "";
          yield { content, done: chunk.done };

          if (chunk.done) {
            reader.cancel();
            return;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { content: "", done: true };
  },
};
