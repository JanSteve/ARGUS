/**
 * ARGUS AI Provider Index
 *
 * Factory, hooks, and localStorage config management.
 */

import { useState, useEffect, useCallback } from "react";
import { ollamaProvider } from "./ollamaProvider";
import { openrouterProvider } from "./openrouterProvider";
import { duckchatProvider } from "./duckchatProvider";
import { pollinationsProvider } from "./pollinationsProvider";
import type {
  AIConfig,
  AIProvider,
  OllamaModel,
  OllamaStatus,
  AIMessage,
} from "./types";
import { DEFAULT_AI_CONFIG, AI_CONFIG_KEY } from "./types";

// ─── Re-export everything ─────────────────────────────────────────────────────

export * from "./types";
export { ollamaProvider } from "./ollamaProvider";
export { openrouterProvider } from "./openrouterProvider";
export { duckchatProvider } from "./duckchatProvider";
export { pollinationsProvider } from "./pollinationsProvider";

// ─── Config Persistence ───────────────────────────────────────────────────────

export function loadAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (!raw) return { ...DEFAULT_AI_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AIConfig>;
    return { ...DEFAULT_AI_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_AI_CONFIG };
  }
}

export function saveAIConfig(config: AIConfig): void {
  // SECURITY: API keys live only in localStorage, never committed to git.
  // groqApiKey is stored here but MUST NOT appear in source code.
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
}

// ─── Provider Factory ─────────────────────────────────────────────────────────

/**
 * Returns the active provider based on current config.
 * Supports: ollama (local), openrouter, duckchat (keyless), pollinations (keyless).
 */
export function getActiveProvider(config: AIConfig): AIProvider {
  if (config.mode === "local") {
    return ollamaProvider;
  }
  if (config.remoteProvider === "openrouter") {
    return openrouterProvider;
  }
  if (config.remoteProvider === "pollinations") {
    return pollinationsProvider;
  }
  if (config.remoteProvider === "duckchat") {
    return duckchatProvider;
  }
  // Default keyless fallback
  return duckchatProvider;
}

// ─── useAIConfig Hook ─────────────────────────────────────────────────────────

export function useAIConfig() {
  const [config, setConfigState] = useState<AIConfig>(() => loadAIConfig());

  const updateConfig = useCallback((updates: Partial<AIConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...updates };
      saveAIConfig(next);
      return next;
    });
  }, []);

  return { config, updateConfig };
}

// ─── useOllamaStatus Hook ─────────────────────────────────────────────────────

export function useOllamaStatus(config: AIConfig) {
  const [status, setStatus] = useState<OllamaStatus>("checking");
  const [models, setModels] = useState<OllamaModel[]>([]);

  const check = useCallback(async () => {
    setStatus("checking");
    try {
      const result = await ollamaProvider.checkAvailability(config);
      const ollamaResult = result as OllamaStatus;
      setStatus(ollamaResult);

      if (ollamaResult !== "offline" && ollamaResult !== "not_installed") {
        const discovered = await ollamaProvider.listModels(config);
        setModels(discovered);
      } else {
        setModels([]);
      }
    } catch {
      setStatus("offline");
      setModels([]);
    }
  }, [config.ollamaEndpoint, config.model]);

  useEffect(() => {
    check();
  }, [check]);

  return { status, models, recheck: check };
}

// ─── useStreamingChat Hook ────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  error?: boolean;
}

export function useStreamingChat(config: AIConfig) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const stop = useCallback(() => {
    abortController?.abort();
    setIsStreaming(false);
  }, [abortController]);

  const send = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isStreaming) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userText,
      };

      const assistantId = `asst-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const ctrl = new AbortController();
      setAbortController(ctrl);

      const provider = getActiveProvider(config);

      // Build message history for context (last 20 messages max)
      const history: AIMessage[] = messages
        .slice(-20)
        .concat(userMsg)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        let accumulated = "";

        for await (const chunk of provider.streamChat(history, config, ctrl.signal)) {
          if (ctrl.signal.aborted) break;
          accumulated += chunk.content;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: accumulated, streaming: !chunk.done }
                : m
            )
          );

          if (chunk.done) break;
        }
      } catch (err) {
        // Fallback to keyless cloud AI engine seamlessly
        try {
          let fallbackAccumulated = "";
          const fallbackProvider = pollinationsProvider;
          for await (const chunk of fallbackProvider.streamChat(history, config, ctrl.signal)) {
            if (ctrl.signal.aborted) break;
            fallbackAccumulated += chunk.content;

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: fallbackAccumulated, streaming: !chunk.done, error: false }
                  : m
              )
            );
            if (chunk.done) break;
          }
        } catch (fallbackErr) {
          let userFacingError = "Something went wrong. Please try again.";

          if (err instanceof Error) {
            if (err.name === "AbortError") {
              userFacingError = "Generation stopped.";
            } else {
              userFacingError = err.message;
            }
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: userFacingError, streaming: false, error: true }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        setAbortController(null);
      }
    },
    [messages, config, isStreaming]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isStreaming, send, stop, clearMessages };
}
