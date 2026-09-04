import Link from "next/link";
import { siteConfig } from "@/content/site";
import { HeroOrchestration } from "./HeroOrchestration";

export function Hero() {
  return (
    <section className="relative bg-ink-navy text-court-paper pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate/20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column (~55% width -> 7 cols) */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-court-paper leading-[1.08]">
              {siteConfig.hero.headline}
            </h1>

            <p className="font-sans text-base sm:text-lg text-slate leading-relaxed max-w-xl">
              {siteConfig.hero.subhead}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href={siteConfig.hero.ctaPrimary.href}
                className="font-sans text-sm font-semibold text-ink-navy bg-gazette-brass hover:bg-gazette-brass/90 px-6 py-3 rounded-sm transition-colors border border-gazette-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gazette-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink-navy"
              >
                {siteConfig.hero.ctaPrimary.label}
              </Link>
              <Link
                href={siteConfig.hero.ctaSecondary.href}
                className="font-sans text-sm font-medium text-court-paper hover:text-gazette-brass bg-transparent hover:bg-slate/10 px-6 py-3 rounded-sm transition-colors border border-slate/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gazette-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink-navy"
              >
                {siteConfig.hero.ctaSecondary.label}
              </Link>
            </div>
          </div>

          {/* Right Column (~45% width -> 5 cols) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <HeroOrchestration />
          </div>
        </div>
      </div>
    </section>
  );
}
