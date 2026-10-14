"use client";

import { useState, useEffect } from "react";

interface TelemetryProps {
  onOpenDeck?: () => void;
  onScrollToPlayground?: () => void;
}

export function SystemTelemetry({ onOpenDeck, onScrollToPlayground }: TelemetryProps) {
  const [latency, setLatency] = useState(142);
  const [pulse, setPulse] = useState(true);

  // Subtle simulated telemetry fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const next = prev + delta;
        return next >= 135 && next <= 152 ? next : 142;
      });
      setPulse((p) => !p);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-ink-navy/95 border-y border-slate/25 py-3 px-6 sm:px-8 text-xs font-sans text-court-paper">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Mesh Status & Agents */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full bg-verdigris transition-opacity duration-700 ${
                pulse ? "opacity-100 shadow-[0_0_8px_#45735F]" : "opacity-60"
              }`}
            />
            <span className="font-medium tracking-wide uppercase text-[11px] text-court-paper">
              ARGUS Mesh: <span className="text-verdigris font-semibold">ONLINE</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate border-l border-slate/30 pl-4">
            <span>Specialist Agents:</span>
            <span className="font-semibold text-gazette-brass tabular-nums">12/12 Synchronized</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-slate border-l border-slate/30 pl-4">
            <span>Consensus Latency:</span>
            <span className="font-semibold text-court-paper tabular-nums">{latency}ms P99</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-slate border-l border-slate/30 pl-4">
            <span>Statutes & Codes:</span>
            <span className="font-semibold text-court-paper tabular-nums">4,280+ Indexed</span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-3">
          {onScrollToPlayground && (
            <button
              type="button"
              onClick={onScrollToPlayground}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-court-paper/10 hover:bg-court-paper/15 text-court-paper border border-slate/40 rounded-sm text-xs font-medium transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-gazette-brass" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>Live Playground</span>
            </button>
          )}

          {onOpenDeck && (
            <button
              type="button"
              onClick={onOpenDeck}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-gazette-brass/20 hover:bg-gazette-brass/30 text-gazette-brass border border-gazette-brass/50 rounded-sm text-xs font-semibold transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Seed Pitch Deck</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
