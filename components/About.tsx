import { siteConfig } from "@/content/site";

export function About() {
  const { about } = siteConfig;

  return (
    <section id="about" className="bg-court-paper text-ink-navy py-20 md:py-28 border-b border-slate/20">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-12 items-start">
          {/* Left Column (~60% -> 7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-ink-navy leading-tight">
                {about.heading}
              </h2>
              <p className="font-sans text-lg font-medium text-seal-oxblood mt-3">
                {about.subhead}
              </p>
            </div>

            <p className="font-sans text-base text-ink-navy/80 leading-relaxed max-w-xl">
              {about.body}
            </p>

            {/* Pullquote with vertical seal-oxblood rule instead of quote marks */}
            <div className="pl-6 border-l-2 border-seal-oxblood py-2 my-6">
              <blockquote className="font-display italic text-lg sm:text-xl text-ink-navy leading-relaxed">
                &ldquo;{about.pullQuote.text}&rdquo;
              </blockquote>
              <p className="font-sans text-xs font-semibold text-slate mt-3 tracking-wide">
                — {about.pullQuote.attribution}
              </p>
            </div>

            {/* Values with short 4px brass tick mark (no checkmark icon) */}
            <div className="pt-2">
              <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-slate mb-4">
                Operational Values
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {about.values.map((val) => (
                  <div key={val} className="flex items-center gap-2.5">
                    {/* 4px brass tick mark */}
                    <span className="w-1.5 h-1.5 bg-gazette-brass rounded-sm flex-shrink-0" />
                    <span className="font-sans text-sm font-medium text-ink-navy">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (~40% -> 5 cols) Fact Ledger */}
          <div className="lg:col-span-5 border border-slate/20 bg-court-paper/60 p-8 rounded-sm space-y-6">
            <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-gazette-brass border-b border-slate/20 pb-3">
              Institutional Ledger
            </h3>

            <dl className="space-y-6">
              {about.factLedger.map((fact) => (
                <div key={fact.label} className="space-y-1">
                  <dt className="font-sans text-xs font-bold text-seal-oxblood uppercase tracking-wider">
                    {fact.label}
                  </dt>
                  <dd className="font-sans text-sm text-ink-navy/85 leading-relaxed">
                    {fact.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
