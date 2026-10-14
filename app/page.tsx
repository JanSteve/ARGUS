"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SystemTelemetry } from "@/components/SystemTelemetry";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { AgentDirectory } from "@/components/AgentDirectory";
import { AgentPlayground } from "@/components/AgentPlayground";
import { WhyNow } from "@/components/WhyNow";
import { InvestorsContact } from "@/components/InvestorsContact";
import { Footer } from "@/components/Footer";
import { PitchDeckModal } from "@/components/PitchDeckModal";

export default function Home() {
  const [isDeckOpen, setIsDeckOpen] = useState(false);

  const handleScrollToPlayground = () => {
    const el = document.getElementById("playground");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleScrollToContact = () => {
    const el = document.getElementById("investors");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-ink-navy flex flex-col">
      <Navbar />
      <SystemTelemetry
        onOpenDeck={() => setIsDeckOpen(true)}
        onScrollToPlayground={handleScrollToPlayground}
      />
      <Hero />
      <About />
      <AgentDirectory />
      <AgentPlayground />
      <WhyNow />
      <InvestorsContact />
      <Footer />

      {/* Interactive Seed Pitch Deck Modal */}
      <PitchDeckModal
        isOpen={isDeckOpen}
        onClose={() => setIsDeckOpen(false)}
        onContactClick={handleScrollToContact}
      />
    </main>
  );
}
