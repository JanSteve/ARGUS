/**
 * ARGUS Google Gemini AI Provider
 * High-speed native streaming via Google Generative AI SSE endpoints
 */

import type { AIProvider, AIConfig, AIMessage, StreamChunk, OllamaModel } from "./types";
import { DEFAULT_GEMINI_KEY } from "./types";

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
    role?: string;
  };
  finishReason?: string;
}

interface GeminiStreamChunk {
  candidates?: GeminiCandidate[];
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export const geminiProvider: AIProvider = {
  id: "gemini" as any,
  label: "Google Gemini 2.5 Flash (Direct Cloud Engine)",
  mode: "remote",

  async checkAvailability(config: AIConfig): Promise<"remote_ready" | "no_api_key"> {
    const key = config.geminiApiKey || DEFAULT_GEMINI_KEY;
    return key.trim() ? "remote_ready" : "no_api_key";
  },

  async listModels(): Promise<OllamaModel[]> {
    return [
      { name: "gemini-2.5-flash", family: "gemini-2.5", size: "Google High-Speed" },
      { name: "gemini-2.5-pro", family: "gemini-2.5", size: "Google Deep Reasoning" },
      { name: "gemini-1.5-flash", family: "gemini-1.5", size: "Google Fast" },
    ];
  },

  async *streamChat(
    messages: AIMessage[],
    config: AIConfig,
    signal: AbortSignal
  ): AsyncGenerator<StreamChunk> {
    const apiKey = (config.geminiApiKey || DEFAULT_GEMINI_KEY).trim();
    if (!apiKey) {
      throw new Error("No Gemini API key available.");
    }

    const model = config.model && config.model.startsWith("gemini-") ? config.model : "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    // Format messages for Gemini API
    const formattedContents = messages
      .filter((m) => m.content && m.content.trim())
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const systemInstruction = {
      parts: [
        {
          text: "You are ARGUS, the world's first sovereign AI desktop operating system copilot. You are embedded directly into the OS shell with access to window management, system hardware controls (Wi-Fi, Bluetooth, volume), file management, live weather satellite, process task manager, and code studio. Be concise, brilliant, proactive, and direct.",
        },
      ],
    };

    const requestBody = {
      contents: formattedContents,
      systemInstruction,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        yield { content: "", done: true };
        return;
      }
      throw new Error(`Gemini network connection failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown Gemini error");
      try {
        const errJson = JSON.parse(errText);
        throw new Error(errJson.error?.message || `Gemini error (${response.status})`);
      } catch {
        throw new Error(`Gemini error ${response.status}: ${errText}`);
      }
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Gemini stream body is unreadable");
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
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const jsonStr = trimmed.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") {
            yield { content: "", done: true };
            return;
          }

          try {
            const data: GeminiStreamChunk = JSON.parse(jsonStr);
            if (data.error) {
              throw new Error(data.error.message);
            }

            const candidate = data.candidates?.[0];
            const textPart = candidate?.content?.parts?.[0]?.text ?? "";
            const isFinished = !!candidate?.finishReason && candidate.finishReason !== "STOP_UNSPECIFIED";

            if (textPart) {
              yield { content: textPart, done: false };
            }

            if (isFinished) {
              reader.cancel();
              yield { content: "", done: true };
              return;
            }
          } catch {
            // Malformed chunk line — skip
            continue;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { content: "", done: true };
  },
};
