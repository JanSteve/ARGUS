import Link from "next/link";
import { siteConfig } from "@/content/site";

export function Footer() {
  return (
    <footer className="bg-ink-navy border-t border-gazette-brass/30 text-slate">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate/20">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-sm bg-ink-navy border border-gazette-brass/60 flex items-center justify-center text-gazette-brass font-display text-base font-medium">
                V
              </div>
              <span className="font-display text-lg font-medium text-court-paper tracking-wide">
                VERDIKT
              </span>
            </div>
            <p className="font-sans text-sm text-slate leading-relaxed max-w-sm">
              {siteConfig.footer.description}
            </p>
          </div>

          {/* Nav Columns */}
          <div>
            <h3 className="font-sans text-xs font-semibold text-gazette-brass uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-2.5">
              {siteConfig.footer.columns.Company.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="font-sans text-sm text-slate hover:text-court-paper hover:underline underline-offset-4 decoration-gazette-brass transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gazette-brass rounded-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-sans text-xs font-semibold text-gazette-brass uppercase tracking-wider mb-4">
              Connect
            </h3>
            <ul className="space-y-2.5">
              {siteConfig.footer.columns.Connect.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="font-sans text-sm text-slate hover:text-court-paper hover:underline underline-offset-4 decoration-gazette-brass transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gazette-brass rounded-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-sans text-xs font-semibold text-gazette-brass uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2.5">
              {siteConfig.footer.columns.Legal.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="font-sans text-sm text-slate hover:text-court-paper hover:underline underline-offset-4 decoration-gazette-brass transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gazette-brass rounded-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-slate/80">
          <p>{siteConfig.footer.copyright}</p>
          <div className="flex items-center gap-6">
            <Link
              href="#privacy"
              className="hover:text-court-paper hover:underline underline-offset-4 decoration-gazette-brass"
            >
              Privacy
            </Link>
            <Link
              href="#terms"
              className="hover:text-court-paper hover:underline underline-offset-4 decoration-gazette-brass"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
