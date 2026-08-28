/**
 * Tests for ARGUS slash commands
 * Verifies /calc, /system, /notes, /web, /music dispatch
 */

import { describe, it, expect, vi } from "vitest";

// ─── Re-implement slash handler for testing (isolated from React component) ──

type SlashResult =
  | { type: "calc"; expr: string; result: string }
  | { type: "launch"; app: string }
  | { type: "system"; info: string }
  | { type: "unknown"; cmd: string };

function handleSlashCommand(input: string): SlashResult | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;

  const [cmd, ...args] = trimmed.slice(1).split(" ");
  const rest = args.join(" ").trim();

  switch (cmd.toLowerCase()) {
    case "calc": {
      if (!rest) return { type: "calc", expr: "", result: "Usage: /calc <expression>" };
      try {
        const sanitized = rest.replace(/[^0-9+\-*/().\s%]/g, "");
        if (!sanitized.trim()) return { type: "calc", expr: rest, result: "Invalid expression" };
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${sanitized})`)() as number;
        if (typeof result !== "number" || !isFinite(result)) {
          return { type: "calc", expr: rest, result: "Invalid expression" };
        }
        return { type: "calc", expr: rest, result: String(result) };
      } catch {
        return { type: "calc", expr: rest, result: "Could not evaluate expression" };
      }
    }
    case "notes":
      window.dispatchEvent(new CustomEvent("argus:launch", { detail: { app: "notes" } }));
      return { type: "launch", app: "Notes" };
    case "web":
    case "browser":
      window.dispatchEvent(new CustomEvent("argus:launch", { detail: { app: "browser" } }));
      return { type: "launch", app: "Browser" };
    case "music":
      window.dispatchEvent(new CustomEvent("argus:launch", { detail: { app: "music" } }));
      return { type: "launch", app: "Music Player" };
    case "system":
      return {
        type: "system",
        info: `ARGUS v0.2.0\nPlatform: ${navigator.platform}`,
      };
    default:
      return { type: "unknown", cmd };
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ARGUS slash commands", () => {
  it("returns null for non-slash input", () => {
    expect(handleSlashCommand("hello world")).toBeNull();
    expect(handleSlashCommand("")).toBeNull();
    expect(handleSlashCommand("calc 2+2")).toBeNull();
  });

  describe("/calc", () => {
    it("evaluates simple arithmetic", () => {
      const result = handleSlashCommand("/calc 25 * 17");
      expect(result?.type).toBe("calc");
      expect((result as { type: "calc"; expr: string; result: string }).result).toBe("425");
    });

    it("evaluates addition", () => {
      const result = handleSlashCommand("/calc 100 + 200");
      expect((result as { type: "calc"; expr: string; result: string }).result).toBe("300");
    });

    it("evaluates parenthesized expressions", () => {
      const result = handleSlashCommand("/calc (10 + 5) * 3");
      expect((result as { type: "calc"; expr: string; result: string }).result).toBe("45");
    });

    it("evaluates division", () => {
      const result = handleSlashCommand("/calc 100 / 4");
      expect((result as { type: "calc"; expr: string; result: string }).result).toBe("25");
    });

    it("sanitizes non-math characters and reports error", () => {
      const result = handleSlashCommand("/calc alert('xss')");
      // sanitized will be empty or produce error
      expect(result?.type).toBe("calc");
      const r = result as { type: "calc"; result: string };
      expect(r.result).toMatch(/invalid|error|NaN|could not evaluate/i);
    });

    it("handles empty /calc gracefully", () => {
      const result = handleSlashCommand("/calc");
      const r = result as { type: "calc"; result: string };
      expect(r.result).toMatch(/usage/i);
    });
  });

  describe("/system", () => {
    it("returns system info string", () => {
      const result = handleSlashCommand("/system");
      expect(result?.type).toBe("system");
      const r = result as { type: "system"; info: string };
      expect(r.info).toContain("ARGUS");
    });
  });

  describe("/notes", () => {
    it("dispatches argus:launch event with app=notes", () => {
      const listener = vi.fn();
      window.addEventListener("argus:launch", listener);
      const result = handleSlashCommand("/notes");
      expect(result?.type).toBe("launch");
      expect((result as { type: "launch"; app: string }).app).toBe("Notes");
      expect(listener).toHaveBeenCalledOnce();
      const evt = listener.mock.calls[0][0] as CustomEvent;
      expect(evt.detail.app).toBe("notes");
      window.removeEventListener("argus:launch", listener);
    });
  });

  describe("/web", () => {
    it("dispatches argus:launch event with app=browser", () => {
      const listener = vi.fn();
      window.addEventListener("argus:launch", listener);
      handleSlashCommand("/web");
      expect(listener).toHaveBeenCalledOnce();
      const evt = listener.mock.calls[0][0] as CustomEvent;
      expect(evt.detail.app).toBe("browser");
      window.removeEventListener("argus:launch", listener);
    });
  });

  describe("/music", () => {
    it("dispatches argus:launch event with app=music", () => {
      const listener = vi.fn();
      window.addEventListener("argus:launch", listener);
      handleSlashCommand("/music");
      expect(listener).toHaveBeenCalledOnce();
      const evt = listener.mock.calls[0][0] as CustomEvent;
      expect(evt.detail.app).toBe("music");
      window.removeEventListener("argus:launch", listener);
    });
  });

  describe("unknown command", () => {
    it("returns type=unknown for unrecognized slash command", () => {
      const result = handleSlashCommand("/foobar");
      expect(result?.type).toBe("unknown");
      expect((result as { type: "unknown"; cmd: string }).cmd).toBe("foobar");
    });
  });
});
