import type { AIProvider, AIConfig, AIMessage, StreamChunk, OllamaModel } from "./types";

export const pollinationsProvider: AIProvider = {
  id: "pollinations" as any,
  label: "Free Keyless Engine (DeepSeek R1 / Mistral / OpenAI)",
  mode: "remote",

  async checkAvailability(): Promise<"remote_ready"> {
    return "remote_ready";
  },

  async listModels(): Promise<OllamaModel[]> {
    return [
      { name: "deepseek-reasoner", family: "deepseek-r1", size: "Cloud (Keyless)" },
      { name: "openai", family: "gpt-4o", size: "Cloud (Keyless)" },
      { name: "mistral", family: "mistral-large", size: "Cloud (Keyless)" },
      { name: "qwen", family: "qwen-2.5", size: "Cloud (Keyless)" },
      { name: "searchgpt", family: "web-search", size: "Cloud (Keyless)" },
    ];
  },

  async *streamChat(
    messages: AIMessage[],
    config: AIConfig,
    signal: AbortSignal
  ): AsyncGenerator<StreamChunk> {
    try {
      const selectedModel = config.remoteModel || "openai";
      
      const response = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
          model: selectedModel,
          stream: true,
          seed: Math.floor(Math.random() * 100000),
        }),
        signal,
      });

      if (!response.ok) {
        const lastMsg = messages[messages.length - 1]?.content || "Hello";
        const fallbackRes = await fetch(
          `https://text.pollinations.ai/${encodeURIComponent(lastMsg)}?model=${encodeURIComponent(selectedModel)}`,
          { signal }
        );
        if (fallbackRes.ok) {
          const text = await fallbackRes.text();
          yield { content: text, done: true };
          return;
        }
        throw new Error(`Pollinations AI error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Unable to read response stream from Pollinations AI");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === "[DONE]") {
              yield { content: "", done: true };
              return;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const deltaContent =
                parsed.choices?.[0]?.delta?.content ||
                parsed.choices?.[0]?.text ||
                "";
              if (deltaContent) {
                yield { content: deltaContent, done: false };
              }
            } catch {
              if (dataStr) {
                yield { content: dataStr, done: false };
              }
            }
          }
        }
      }

      yield { content: "", done: true };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      const message = err instanceof Error ? err.message : "Unknown Pollinations stream error";
      yield { content: `\n\n*(AI Fallback Notice: ${message})*`, done: true };
    }
  },
};
