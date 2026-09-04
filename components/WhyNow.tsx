import { statsData } from "@/content/stats";

export function WhyNow() {
  const { intro, statsRowPrimary, statsRowSecondary } = statsData;

  return (
    <section id="why-now" className="bg-ink-navy text-court-paper py-20 md:py-28 border-b border-slate/20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
        {/* Intro */}
        <div className="max-w-3xl space-y-4 text-left">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-court-paper">
            {intro.heading}
          </h2>
          <p className="font-sans text-base sm:text-lg text-slate leading-relaxed">
            {intro.body}
          </p>
        </div>

        {/* Primary Stats Ledger - 4 col desktop, 2 col mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {statsRowPrimary.map((stat) => (
            <div key={stat.label} className="border-b border-slate/30 pb-6 space-y-2">
              <div className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal text-gazette-brass tabular-nums tracking-tight">
                {stat.value}
              </div>
              <p className="font-sans text-xs sm:text-sm text-slate leading-snug">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Secondary Stats Ledger - 4 col desktop, 2 col mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 pt-4">
          {statsRowSecondary.map((stat) => (
            <div key={stat.label} className="border-b border-slate/20 pb-6 space-y-2">
              <div className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-gazette-brass/90 tabular-nums tracking-tight">
                {stat.value}
              </div>
              <p className="font-sans text-xs sm:text-sm text-slate/90 leading-snug">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
