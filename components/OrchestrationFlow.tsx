import { siteConfig } from "@/content/site";

export function OrchestrationFlow() {
  return (
    <div className="py-12">
      <div className="border border-slate/20 bg-court-paper/40 p-6 sm:p-8 rounded-sm">
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-seal-oxblood mb-6">
          Query Processing Sequence
        </h3>

        {/* Connected Flow Diagram */}
        <div className="relative">
          {/* Desktop connecting hairline line */}
          <div
            className="hidden lg:block absolute top-1/2 left-4 right-4 h-px bg-slate/30 -translate-y-1/2 z-0"
            aria-hidden="true"
          />

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 lg:gap-3 relative z-10 list-none p-0 m-0">
            {siteConfig.flow.map((step, idx) => (
              <li key={step} className="flex flex-col items-start lg:items-center text-left lg:text-center">
                <div className="flex items-center gap-3 lg:flex-col lg:gap-2">
                  <div className="w-8 h-8 rounded-sm bg-court-paper border border-gazette-brass/70 text-ink-navy flex items-center justify-center font-sans text-xs font-semibold shadow-none">
                    0{idx + 1}
                  </div>
                  <span className="font-sans text-xs font-medium text-ink-navy max-w-[130px] leading-snug">
                    {step}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
