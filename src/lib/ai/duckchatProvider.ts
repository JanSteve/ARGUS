import type { AIProvider, AIConfig, AIMessage, StreamChunk, OllamaModel } from "./types";

// Keep active session VQD token cached in-memory
let activeVqdToken: string | null = null;

async function getNewVqdToken(): Promise<string> {
  const response = await fetch("https://duckduckgo.com/duckchat/v1/status", {
    method: "GET",
    headers: {
      "x-vqd-accept": "1",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch DuckChat session token (${response.status})`);
  }

  const token = response.headers.get("x-vqd-4");
  if (!token) {
    throw new Error("No x-vqd-4 token returned in DuckChat status headers");
  }

  return token;
}

export const duckchatProvider: AIProvider = {
  id: "duckchat" as any,
  label: "Free Cloud (Keyless)",
  mode: "remote",

  async checkAvailability(): Promise<"remote_ready"> {
    return "remote_ready";
  },

  async listModels(): Promise<OllamaModel[]> {
    return [
      { name: "gpt-4o-mini", family: "gpt", size: "Cloud" },
      { name: "claude-3-haiku", family: "claude", size: "Cloud" },
      { name: "meta-llama/Llama-3-70b-instruct", family: "llama", size: "Cloud" },
      { name: "mistralai/Mixtral-8x7B-Instruct-v0.1", family: "mistral", size: "Cloud" },
    ];
  },

  async *streamChat(
    messages: AIMessage[],
    config: AIConfig,
    signal: AbortSignal
  ): AsyncGenerator<StreamChunk> {
    try {
      // 1. Resolve active VQD token
      if (!activeVqdToken) {
        activeVqdToken = await getNewVqdToken();
      }

      // Convert messages to DuckChat format
      const formattedMessages = messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

      // Let user specify model, map gemini-2.5-flash to gpt-4o-mini if they came from OpenRouter defaults
      let targetModel = "gpt-4o-mini";
      if (config.openrouterModel.includes("claude")) {
        targetModel = "claude-3-haiku";
      } else if (config.openrouterModel.includes("llama")) {
        targetModel = "meta-llama/Llama-3-70b-instruct";
      }

      let response = await fetch("https://duckduckgo.com/duckchat/v1/chat", {
        method: "POST",
        headers: {
          "x-vqd-4": activeVqdToken,
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
        },
        body: JSON.stringify({
          model: targetModel,
          messages: formattedMessages,
        }),
        signal,
      });

      // If token expired, fetch a new one and retry once
      if (response.status === 403 || response.status === 412) {
        activeVqdToken = await getNewVqdToken();
        response = await fetch("https://duckduckgo.com/duckchat/v1/chat", {
          method: "POST",
          headers: {
            "x-vqd-4": activeVqdToken,
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
          },
          body: JSON.stringify({
            model: targetModel,
            messages: formattedMessages,
          }),
          signal,
        });
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DuckChat API Error (${response.status}): ${errText || response.statusText}`);
      }

      // Read new VQD from headers for future calls
      const nextVqdHeader = response.headers.get("x-vqd-4");
      if (nextVqdHeader) {
        activeVqdToken = nextVqdHeader;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to initialize DuckChat stream reader");
      }

      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const cleaned = line.trim();
            if (!cleaned) continue;

            if (cleaned.startsWith("data:")) {
              const dataStr = cleaned.slice(5).trim();
              if (dataStr === "[DONE]") {
                yield { content: "", done: true };
                return;
              }

              try {
                const parsed = JSON.parse(dataStr);
                
                // Update VQD from JSON payload if present
                if (parsed.vqd) {
                  activeVqdToken = parsed.vqd;
                }

                const text = parsed.message || "";
                if (text) {
                  yield { content: text, done: false };
                }
              } catch {
                // Ignore corrupt chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      yield { content: "", done: true };
    } catch (err: any) {
      if (err.name === "AbortError") {
        yield { content: "", done: true };
        return;
      }
      throw err;
    }
  },
};
