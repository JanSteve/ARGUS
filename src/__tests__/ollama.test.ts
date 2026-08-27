/**
 * Tests for Ollama provider — network boundary mocked.
 * These tests NEVER require a real Ollama instance.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ollamaProvider } from "../lib/ai/ollamaProvider";
import { DEFAULT_AI_CONFIG } from "../lib/ai/types";
import type { AIConfig } from "../lib/ai/types";

const config: AIConfig = {
  ...DEFAULT_AI_CONFIG,
  model: "llama3.2",
  ollamaEndpoint: "http://localhost:11434",
};

// ─── checkAvailability tests ─────────────────────────────────────────────────

describe("ollamaProvider.checkAvailability", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 'offline' when fetch throws (Ollama not running)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));
    const status = await ollamaProvider.checkAvailability(config);
    expect(status).toBe("offline");
  });

  it("returns 'offline' when server returns non-OK status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);
    const status = await ollamaProvider.checkAvailability(config);
    expect(status).toBe("offline");
  });

  it("returns 'no_model' when Ollama is running but has no models", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [] }),
    } as unknown as Response);
    const status = await ollamaProvider.checkAvailability(config);
    expect(status).toBe("no_model");
  });

  it("returns 'model_missing' when running but selected model not installed", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [{ name: "mistral:latest", size: 4_000_000_000 }],
      }),
    } as unknown as Response);
    const cfg = { ...config, model: "llama3.2" };
    const status = await ollamaProvider.checkAvailability(cfg);
    expect(status).toBe("model_missing");
  });

  it("returns 'ready' when Ollama is running and selected model is available", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [{ name: "llama3.2:latest", size: 2_000_000_000 }],
      }),
    } as unknown as Response);
    const status = await ollamaProvider.checkAvailability(config);
    expect(status).toBe("ready");
  });
});

// ─── listModels tests ─────────────────────────────────────────────────────────

describe("ollamaProvider.listModels", () => {
  it("returns empty array when Ollama is unavailable", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const models = await ollamaProvider.listModels(config);
    expect(models).toEqual([]);
  });

  it("returns parsed model list with size formatting", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          { name: "llama3.2:latest", size: 2_000_000_000, details: { family: "llama" } },
          { name: "mistral:latest", size: 4_700_000_000, details: { family: "mistral" } },
        ],
      }),
    } as unknown as Response);

    const models = await ollamaProvider.listModels(config);
    expect(models).toHaveLength(2);
    expect(models[0].name).toBe("llama3.2:latest");
    expect(models[0].size).toBe("2.0 GB");
    expect(models[0].family).toBe("llama");
    expect(models[1].size).toBe("4.7 GB");
  });
});

// ─── streamChat tests ─────────────────────────────────────────────────────────

describe("ollamaProvider.streamChat", () => {
  it("throws user-friendly error when Ollama is unavailable", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    const ctrl = new AbortController();
    const gen = ollamaProvider.streamChat(
      [{ role: "user", content: "hello" }],
      config,
      ctrl.signal
    );

    await expect(async () => {
      for await (const _chunk of gen) {
        // should throw before yielding
      }
    }).rejects.toThrow("Ollama unavailable");
  });

  it("yields content chunks from streaming response", async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({ message: { content: "Hello" }, done: false }) + "\n"
          )
        );
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({ message: { content: " world" }, done: false }) + "\n"
          )
        );
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({ message: { content: "" }, done: true }) + "\n"
          )
        );
        controller.close();
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: mockStream,
    } as unknown as Response);

    const ctrl = new AbortController();
    const chunks: string[] = [];

    for await (const chunk of ollamaProvider.streamChat(
      [{ role: "user", content: "hi" }],
      config,
      ctrl.signal
    )) {
      chunks.push(chunk.content);
      if (chunk.done) break;
    }

    const combined = chunks.join("");
    expect(combined).toContain("Hello");
    expect(combined).toContain("world");
  });

  it("yields done=true when AbortController is signalled (stop button)", async () => {
    const ctrl = new AbortController();
    // Pre-abort before call
    ctrl.abort();

    global.fetch = vi.fn().mockRejectedValue(
      Object.assign(new Error("AbortError"), { name: "AbortError" })
    );

    const chunks: Array<{ content: string; done: boolean }> = [];
    for await (const chunk of ollamaProvider.streamChat(
      [{ role: "user", content: "test" }],
      config,
      ctrl.signal
    )) {
      chunks.push(chunk);
    }

    // Should yield done without throwing
    expect(chunks.some((c) => c.done)).toBe(true);
  });

  it("throws error with status when server returns HTTP error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => "model not found",
    } as unknown as Response);

    const ctrl = new AbortController();
    const gen = ollamaProvider.streamChat(
      [{ role: "user", content: "test" }],
      config,
      ctrl.signal
    );

    await expect(async () => {
      for await (const _c of gen) {/**/}
    }).rejects.toThrow("404");
  });
});
