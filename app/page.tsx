import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { AgentDirectory } from "@/components/AgentDirectory";
import { WhyNow } from "@/components/WhyNow";
import { InvestorsContact } from "@/components/InvestorsContact";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-ink-navy flex flex-col">
      <Navbar />
      <Hero />
      <About />
      <AgentDirectory />
      <WhyNow />
      <InvestorsContact />
      <Footer />
    </main>
  );
}
