"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { siteConfig } from "@/content/site";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-ink-navy/95 backdrop-blur-sm border-b transition-colors duration-200 ${
        isScrolled ? "border-gazette-brass/25" : "border-slate/20"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-18 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gazette-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink-navy rounded-sm"
          aria-label="Verdikt by Soulvai Technologies Home"
        >
          {/* Custom Minimalist Brass Stamp Mark (No generic scales emoji) */}
          <div className="w-8 h-8 rounded-sm bg-ink-navy border border-gazette-brass/60 flex items-center justify-center text-gazette-brass font-display text-lg font-medium group-hover:border-gazette-brass transition-colors">
            V
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-medium tracking-wide text-court-paper leading-tight">
              VERDIKT
            </span>
            <span className="font-sans text-[10px] tracking-wider text-slate uppercase">
              Soulvai Technologies
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
          {siteConfig.nav.links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-sans text-sm font-medium text-slate hover:text-court-paper hover:underline underline-offset-4 decoration-gazette-brass transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gazette-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink-navy rounded-sm py-1"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={siteConfig.nav.cta.href}
            className="font-sans text-sm font-semibold text-ink-navy bg-gazette-brass hover:bg-gazette-brass/90 px-4 py-2 rounded-sm transition-colors border border-gazette-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gazette-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink-navy"
          >
            {siteConfig.nav.cta.label}
          </Link>
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate hover:text-court-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gazette-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink-navy rounded-sm"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <svg
            className="w-6 h-6 stroke-current"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.75"
            strokeLinecap="round"
          >
            {mobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Slide-in Panel */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-x-0 top-18 bottom-0 bg-ink-navy border-t border-slate/20 z-40 p-6 flex flex-col justify-between"
          role="dialog"
          aria-modal="true"
        >
          <nav className="flex flex-col gap-6 pt-4" aria-label="Mobile Navigation">
            {siteConfig.nav.links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-display text-2xl text-court-paper hover:text-gazette-brass transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gazette-brass rounded-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="pb-8">
            <Link
              href={siteConfig.nav.cta.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center font-sans text-base font-semibold text-ink-navy bg-gazette-brass hover:bg-gazette-brass/90 py-3 rounded-sm transition-colors border border-gazette-brass"
            >
              {siteConfig.nav.cta.label}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
