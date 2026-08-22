import type { AIProvider, AIConfig, AIMessage, StreamChunk, OllamaModel } from "./types";

export const openrouterProvider: AIProvider = {
  id: "openrouter",
  label: "OpenRouter",
  mode: "remote",

  async checkAvailability(config: AIConfig): Promise<"remote_ready" | "no_api_key"> {
    if (!config.openrouterApiKey || !config.openrouterApiKey.trim()) {
      return "no_api_key";
    }
    return "remote_ready";
  },

  async listModels(): Promise<OllamaModel[]> {
    return [
      { name: "google/gemini-2.5-flash", family: "gemini", size: "Cloud" },
      { name: "meta-llama/llama-3.3-70b-instruct", family: "llama", size: "Cloud" },
      { name: "deepseek/deepseek-chat", family: "deepseek", size: "Cloud" },
      { name: "qwen/qwen-2.5-72b-instruct", family: "qwen", size: "Cloud" },
      { name: "microsoft/phi-4", family: "phi", size: "Cloud" },
    ];
  },

  async *streamChat(
    messages: AIMessage[],
    config: AIConfig,
    signal: AbortSignal
  ): AsyncGenerator<StreamChunk> {
    const apiKey = config.openrouterApiKey || "";
    const model = config.openrouterModel || "google/gemini-2.5-flash";

    if (!apiKey.trim()) {
      throw new Error("OpenRouter API key is missing. Configure it in Settings.");
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://github.com/JanSteve/ARGUS",
          "X-Title": "ARGUS Workspace",
        },
        body: JSON.stringify({
          model: model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter Error (${response.status}): ${errText || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to initialize OpenRouter stream reader");
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
                const choice = parsed.choices?.[0];
                const text = choice?.delta?.content || "";
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
