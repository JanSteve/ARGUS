"use client";

import { useState, useEffect } from "react";

interface PitchDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactClick?: () => void;
}

interface Slide {
  number: string;
  tag: string;
  title: string;
  subtitle: string;
  points: Array<{ title: string; desc: string }>;
  statHighlight?: { metric: string; label: string };
}

const DECK_SLIDES: Slide[] = [
  {
    number: "01",
    tag: "The Market Problem",
    title: "India’s 50M Pending Cases & The Legal Productivity Crisis",
    subtitle: "1.4 billion people, 1.8 million advocates, and an overwhelmed judicial system.",
    points: [
      {
        title: "70% Time Lost to Manual Drafting",
        desc: "Advocates spend 5+ hours daily cross-referencing Central/State Acts, extracting High Court citations, and formatting procedural affidavits.",
      },
      {
        title: "Generalist LLMs Fail Indian Law",
        desc: "Western legal AI hallucinate on Indian statutes (BNSS 2023, BNS, BSA), conflate state High Court jurisdictions, and risk client confidentiality breaches.",
      },
      {
        title: "No Native Sovereign Solution",
        desc: "Indian law chambers refuse to upload sensitive client data to unencrypted US cloud endpoints.",
      },
    ],
    statHighlight: { metric: "5.1 Crore", label: "Pending cases in Indian courts requiring automated legal workflow infrastructure" },
  },
  {
    number: "02",
    tag: "The Solution & Moat",
    title: "12 Specialist Agents Orchestrated Into One Sovereign Core",
    subtitle: "Not a chatbot wrapper. A domain-specific multi-agent legal intelligence platform.",
    points: [
      {
        title: "Domain-Isolated Training",
        desc: "12 distinct models trained specifically on their respective statutes (Corporate, Criminal, IP, Tax, Banking, Constitutional, etc.).",
      },
      {
        title: "Statutory Graph RAG",
        desc: "Deterministic cross-referencing across 4,280+ Central & State Acts and 1.2M+ verified High Court & Supreme Court precedents.",
      },
      {
        title: "Zero-Knowledge Sovereign Privacy",
        desc: "Client documents remain on local or sovereign-hosted encrypted clusters. Absolute advocate-client privilege preserved.",
      },
    ],
    statHighlight: { metric: "142ms", label: "Sub-second multi-agent consensus latency on high-complexity queries" },
  },
  {
    number: "03",
    tag: "Market Size & TAM",
    title: "₹18,000 Crore Indian LegalTech Opportunity",
    subtitle: "High-margin B2B SaaS with exceptional retention in a digitizing legal economy.",
    points: [
      {
        title: "1.8 Million Registered Advocates",
        desc: "Rapidly digitizing chamber practices across Tier-1, Tier-2, and Tier-3 district courts nationwide.",
      },
      {
        title: "120,000 Corporate In-House Legal Teams",
        desc: "Enterprise compliance departments managing GST notices, contract disputes, and SEBI regulations.",
      },
      {
        title: "Government & Bar Association Digitization",
        desc: "State bar councils and public judicial registries adopting AI-assisted case summarization and filing triage.",
      },
    ],
    statHighlight: { metric: "₹18,000 Cr", label: "Total Addressable Market across Indian legal practitioners & corporate departments" },
  },
  {
    number: "04",
    tag: "Business Model",
    title: "High-Margin Tiered SaaS with Chamber & Enterprise Expansion",
    subtitle: "Predictable recurring revenue with expansion into on-premise law firm clusters.",
    points: [
      {
        title: "Chamber Pro (₹4,999 / month)",
        desc: "Individual practitioners & small chambers. Full access to 12 agents, citation grounding, and automated brief drafting.",
      },
      {
        title: "Law Firm Enterprise (₹24,999 / month)",
        desc: "Multi-seat law firm suites with shared team memory, precedent vaults, and custom firm templates.",
      },
      {
        title: "Sovereign On-Premise Cluster (₹12L - ₹25L / year)",
        desc: "Air-gapped local GPU hardware deployment for top-tier law firms and corporate banks requiring strict zero-cloud compliance.",
      },
    ],
    statHighlight: { metric: "88%+", label: "Target Gross Margins with proprietary localized SLMs & prompt caching" },
  },
  {
    number: "05",
    tag: "The Seed Ask",
    title: "Raising ₹1.5 – 1.8 Crore Seed Round",
    subtitle: "Fueling 18 months of aggressive technical moat building and bar council distribution.",
    points: [
      {
        title: "45% — Sovereign Compute & Fine-Tuning",
        desc: "High-throughput GPU clusters and continuous ingestion pipeline for daily Supreme Court & High Court judgment streams.",
      },
      {
        title: "35% — Specialized Legal Engineering Team",
        desc: "Advocate-engineers pairing domain litigation experience with Rust, Next.js, and multi-agent systems.",
      },
      {
        title: "20% — Bar Association Pilot Deployments",
        desc: "Direct institutional partnerships, bar council demonstrations, and high-conversion advocate chamber onboarding.",
      },
    ],
    statHighlight: { metric: "₹1.5 - 1.8 Cr", label: "Target seed round with clear 18-month profitability & Series A milestones" },
  },
];

export function PitchDeckModal({ isOpen, onClose, onContactClick }: PitchDeckModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") {
        setCurrentSlideIndex((prev) => (prev < DECK_SLIDES.length - 1 ? prev + 1 : prev));
      }
      if (e.key === "ArrowLeft") {
        setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentSlide = DECK_SLIDES[currentSlideIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-navy/85 backdrop-blur-md animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide Container */}
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-ink-navy text-court-paper border border-gazette-brass/40 shadow-2xl rounded-sm p-6 sm:p-10 z-10 space-y-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-slide-title"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate/30 pb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-gazette-brass font-semibold">
              SOULVAI TECHNOLOGIES · SEED ROUND
            </span>
            <span className="text-slate text-xs">|</span>
            <span className="text-xs font-sans text-slate">
              Slide {currentSlide.number} of 0{DECK_SLIDES.length}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate hover:text-court-paper hover:bg-slate/10 rounded-sm transition-colors"
            aria-label="Close pitch deck"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Slide Content */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-verdigris font-semibold block mb-1">
              {currentSlide.tag}
            </span>
            <h3 id="deck-slide-title" className="font-display text-2xl sm:text-3xl lg:text-4xl text-court-paper font-medium">
              {currentSlide.title}
            </h3>
            <p className="font-sans text-sm sm:text-base text-slate mt-2">{currentSlide.subtitle}</p>
          </div>

          {/* Key Points Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {currentSlide.points.map((pt, idx) => (
              <div key={idx} className="bg-ink-navy/70 border border-slate/25 p-5 rounded-sm space-y-2">
                <span className="text-xs font-mono text-gazette-brass block">0{idx + 1}.</span>
                <h4 className="font-sans text-sm font-semibold text-court-paper">{pt.title}</h4>
                <p className="font-sans text-xs text-slate leading-relaxed">{pt.desc}</p>
              </div>
            ))}
          </div>

          {/* Stat Highlight Banner */}
          {currentSlide.statHighlight && (
            <div className="bg-gazette-brass/10 border border-gazette-brass/30 p-5 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-widest text-gazette-brass font-semibold block">
                  Key Institutional Metric
                </span>
                <p className="font-sans text-xs text-court-paper/90 mt-0.5">
                  {currentSlide.statHighlight.label}
                </p>
              </div>
              <span className="font-display text-2xl sm:text-3xl font-medium text-gazette-brass shrink-0">
                {currentSlide.statHighlight.metric}
              </span>
            </div>
          )}
        </div>

        {/* Slide Navigation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate/30 pt-4">
          {/* Slide Indicator Dots */}
          <div className="flex items-center gap-2">
            {DECK_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentSlideIndex === idx
                    ? "bg-gazette-brass w-6"
                    : "bg-slate/40 hover:bg-slate/70"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentSlideIndex === 0}
              className="px-4 py-2 text-xs font-sans font-medium text-court-paper bg-court-paper/10 hover:bg-court-paper/20 border border-slate/40 rounded-sm transition-colors disabled:opacity-30"
            >
              Previous
            </button>

            {currentSlideIndex < DECK_SLIDES.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => Math.min(DECK_SLIDES.length - 1, prev + 1))}
                className="px-5 py-2 text-xs font-sans font-semibold text-ink-navy bg-gazette-brass hover:bg-gazette-brass/90 border border-gazette-brass rounded-sm transition-colors"
              >
                Next Slide
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onContactClick) onContactClick();
                }}
                className="px-5 py-2 text-xs font-sans font-semibold text-ink-navy bg-gazette-brass hover:bg-gazette-brass/90 border border-gazette-brass rounded-sm transition-colors"
              >
                Join Seed Round →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
