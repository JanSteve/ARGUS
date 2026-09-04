# ARD — Verdikt / Soulvai Technologies Website
**Agent Requirements Document for Google Antigravity**

This is a single, self-contained spec written to be read end-to-end by a coding agent. It extends the same "Gazette & the Grid" design system used for the Stitch mockups, but this document produces real, deployable code rather than a static design — so it adds a tech stack, data models, functional requirements, and acceptance criteria an agent can verify itself against.

---

## 0. Setup — do this before you open Antigravity

**1. Save this file as `ARD.md` in your project's root directory.** Agentic IDEs work best when the spec lives in the repo, not just in the chat — the agent will re-read it across sessions.

**2. Install the `ui-ux-pro-max` skill** (a third-party, open-source design-intelligence skill — not an official Google skill, so skim its contents before running it, as with any third-party CLI):
```bash
uipro init --ai antigravity
```
This gives the agent a library of accessibility checklists, responsive patterns, and Tailwind implementation conventions. **It does not choose your brand's look** — Section 4 below locks that down explicitly, because the skill's default behavior is to pick a style/palette from its own library, which would overwrite the brand work already done.

**3. Antigravity settings for this build:**
- **Mode: Planning**, not Fast — this is an 8-phase, multi-file build, not a one-shot script.
- **Autonomy: Agent-assisted** — let it run terminal commands and write files freely, but review at the end of each phase before it moves to the next. Don't use full Autopilot for a client-facing site on the first pass.
- **Model:** whichever Gemini 3 Pro / reasoning-tier model is set as default is fine — this doesn't need a fast/cheap model.

---

## 1. Project context

Verdikt is a multi-agent legal AI platform built by Soulvai Technologies, an Indian legal-tech startup. Instead of one generalist model, Verdikt has 12 separately trained specialist agents — one for every major domain of Indian law — orchestrated by a central "Verdikt Core" that classifies and routes each query to the right specialist.

**Audience:** institutional/angel investors evaluating a seed round, Indian legal practitioners, bar associations and institutional partners.

**Business goal of this site:** function as the credibility artifact for a pre-seed/seed raise. It needs to read as a real, funded, technically serious product — not a template, not an AI-generated landing page — while staying authentically Indian and legal in its visual language.

---

## 2. Objective & definition of "done"

The build is done when:
- It's a real, deployed, working Next.js site (not a static mockup) with a functioning contact form, live at a Vercel preview URL.
- It passes every check in **Section 9**.
- A person unfamiliar with AI design tools would guess a small studio built this, not a prompt.

---

## 3. Tech stack (fixed — do not substitute)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14+, App Router, TypeScript | Real production stack, strong Lighthouse ceiling, standard Vercel deploy path |
| Styling | Tailwind CSS | Matches `ui-ux-pro-max`'s supported stack list, fast to keep consistent |
| Components | shadcn/ui primitives for form controls (input, select, textarea) only — restyled to match Section 4 tokens, not shadcn's default theme | Accessible, unstyled-enough to skin cleanly |
| Motion | Framer Motion, used only for the one hero animation specified in Section 6 | Keeps the "one animated moment" rule enforceable in code |
| Fonts | `next/font` loading Newsreader + IBM Plex Sans from Google Fonts, self-hosted/subset via next/font, not a CDN `<link>` | Performance — avoids render-blocking font requests |
| Form backend | Web3Forms or Formspree (free tier, no backend needed) for MVP; leave a clearly commented upgrade path to a Next.js API route + Resend if the team wants server-side control later | Zero-config working form now, no blocked launch waiting on email infra |
| Deployment | Vercel | One-command deploy, matches Next.js |

---

## 4. Design system — locked tokens

**Concept: "The Gazette & the Grid."** The bound gravitas of an Indian statute book / government gazette (ink, paper, wax-seal marks, brass lettering, the red cloth "laal fita" tape that binds Indian court files) merged with the precision of a real orchestration system (nodes, routing lines, a classifier). No gavels, no scales-of-justice icons, no purple-to-blue SaaS gradients, no glassmorphism, no emoji used as icons anywhere in the codebase.

```js
// tailwind.config.ts — theme.extend.colors
colors: {
  'ink-navy':      '#101826', // primary dark — nav, hero, footer
  'court-paper':   '#EEEAE0', // content-section background
  'seal-oxblood':  '#7A2A22', // accent — dividers, red-tape motif, secondary CTA
  'gazette-brass': '#AD8A46', // primary accent — CTA fills, seal marks, active states
  'slate':         '#56606E', // secondary text, muted UI
  'verdigris':     '#45735F', // status indicator only, used sparingly
}
```

- **Display/headline font:** Newsreader, weights 400/500. Italic reserved *only* for the direct founder quote in Section 5.2 — never for single-word emphasis inside a headline.
- **UI/body font:** IBM Plex Sans, weights 400/500/600.
- **Numerals:** tabular/lining figures (`font-variant-numeric: tabular-nums`) on every stat in Section 5.5, no monospace font anywhere.
- **Border radius:** 2–4px everywhere (`rounded-sm` at most in Tailwind terms). No pill shapes, no fully rounded cards.
- **Shadows:** none. Hairline 1px borders (`border-slate/20` or `border-gazette-brass/30`) instead of `box-shadow`.
- **Icons:** no emoji, no default icon-pack glyphs (no Lucide/Heroicons dropped in wholesale). Where a mark is needed, use a small custom SVG line glyph or a brass tick/seal mark as specified per-section below.
- **Motion:** exactly one animated element on the entire site — the hero orchestration diagram (Section 6.2). Every other interaction is a simple hover-underline on links; no scroll-triggered fade/slide-up, no card lift-and-shadow hovers. Respect `prefers-reduced-motion` by freezing the hero diagram on its mid-state frame.
- **Layout:** left-aligned, asymmetric compositions throughout. Never a centered headline over three symmetric cards.
- **Explicitly forbidden, even if the `ui-ux-pro-max` skill suggests them:** all-caps tracked-out eyebrow labels, arrow glyphs (→) appended to button/link text, middle-dot-joined meta strings ("A · B · C"), any palette/font pairing other than the one specified above.

---

## 5. Content model & sections

Model this as typed data, not hardcoded JSX per card — the agent list and stats should come from a `content/` data layer (e.g. `content/agents.ts`, `content/stats.ts`) so the components are data-driven and easy to edit later.

### 5.1 Navigation
Sticky bar on `ink-navy`. Logo left. Links: About, Agents, Why Now. Primary button, filled `gazette-brass`, text "Get in touch" (no arrow), links to `#investors`. Mobile: collapses to a hamburger revealing the same items in a slide-in panel, no animation beyond the slide.

### 5.2 Hero
```ts
headline: "Every Indian law. A dedicated agent."
subhead: "Verdikt by Soulvai Technologies — India's first multi-agent legal AI with a separately trained specialist for every domain of Indian law, orchestrated into one seamless platform."
ctaPrimary: { label: "Meet the agents", href: "#agents" }
ctaSecondary: { label: "Work with us", href: "#investors" }
```
Asymmetric ~55/45 layout on `ink-navy`. No badge/eyebrow above the headline. Right side holds the orchestration diagram — see Section 6.2 for its build spec.

### 5.3 About
```ts
heading: "Built on conviction. Rooted in India."
subhead: "Verdikt was built in courtrooms, not boardrooms."
body: "Soulvai Technologies was born from watching talented advocates spend most of their day on paperwork. We built Verdikt — 12 specialist agents, one for every major domain of Indian law — to change that forever."
pullQuote: {
  text: "India's legal practitioners carry the weight of a system that serves 1.4 billion people. Verdikt is our answer — built from the inside of that world, not the outside.",
  attribution: "Soulvai Technologies, on why Verdikt exists"
}
factLedger: [
  { label: "Est.", detail: "2024. Co-founded by practitioners and engineers who believe India deserves legaltech built from the inside out." },
  { label: "Focus", detail: "India-first, always. We don't adapt Western tools. We build from scratch for Indian statutes, courts and languages." },
  { label: "Principle", detail: "Privacy by design. Client confidentiality is sacred; data sovereignty is a core principle, not an afterthought." }
]
values: ["Respect for the profession", "Long-term thinking", "Equity in access", "Responsible AI"]
```
Two-column ~60/40, `court-paper` background. Pull quote in italic Newsreader with a thin vertical `seal-oxblood` rule to its left instead of quotation marks. Values list uses a short 4px brass tick mark, not a checkmark icon.

### 5.4 Agent directory + orchestration flow
**Flow (genuinely sequential — numbering is correct here):**
```ts
flow: [
  "Lawyer's query",
  "Verdikt Core classifier",
  "Domain agent routing",
  "Statute & case law retrieval",
  "Agent reasoning & drafting",
  "Verified legal output"
]
```
Render as a connected horizontal diagram (stacks vertically on mobile) with a single thin line through all six steps.

**Agent directory (NOT a sequence — do not number; group and present as an index/table, not 12 identical cards):**
```ts
const agents = [
  { name: "Corporate Agent", domain: "Corporate & Company Law", group: "Commercial & Regulatory Law",
    desc: "Companies Act 2013, SEBI, MCA filings, M&A, corporate governance & compliance.",
    tags: ["Companies Act", "SEBI", "MCA"] },
  { name: "Civil Agent", domain: "Civil Law & Procedure", group: "Public & Procedural Law",
    desc: "CPC 1908, tort law, contract disputes, injunctions & civil procedures across all High Courts.",
    tags: ["CPC 1908", "Contracts", "Torts"] },
  { name: "Criminal Agent", domain: "Criminal Law & BNSS", group: "Public & Procedural Law",
    desc: "BNSS 2023, BNS 2023, BSA, bail jurisprudence & criminal trial procedures.",
    tags: ["BNSS 2023", "BNS", "IPC"] },
  { name: "Constitutional Agent", domain: "Constitutional Law", group: "Public & Procedural Law",
    desc: "Constitution of India, fundamental rights, DPSPs, PIL jurisprudence & landmark SC judgments.",
    tags: ["Constitution", "PIL", "FRs"] },
  { name: "Family Agent", domain: "Family & Matrimonial Law", group: "Individual & Social Law",
    desc: "Hindu Marriage Act, Special Marriage Act, divorce, custody, maintenance & succession.",
    tags: ["HMA", "Custody", "Succession"] },
  { name: "Labour Agent", domain: "Labour & Employment Law", group: "Individual & Social Law",
    desc: "Labour Codes 2020, Industrial Disputes Act, PF/ESI, wrongful termination & employment contracts.",
    tags: ["Labour Codes", "IDA", "PF/ESI"] },
  { name: "IP Agent", domain: "Intellectual Property", group: "Commercial & Regulatory Law",
    desc: "Patents Act, Trade Marks Act, Copyright Act, GI tags & IP enforcement at High Courts.",
    tags: ["Patents", "Trademarks", "Copyright"] },
  { name: "Tax Agent", domain: "Tax Law — GST & Direct", group: "Commercial & Regulatory Law",
    desc: "Income Tax Act, GST laws, advance rulings & appellate procedures before ITAT & GSTAT.",
    tags: ["Income Tax", "GST", "ITAT"] },
  { name: "Property Agent", domain: "Real Estate & Property", group: "Individual & Social Law",
    desc: "Transfer of Property Act, RERA 2016, stamp duty, land acquisition & tenancy laws.",
    tags: ["RERA", "TPA", "Registration"] },
  { name: "Banking Agent", domain: "Banking & Finance Law", group: "Commercial & Regulatory Law",
    desc: "RBI regulations, SARFAESI Act, IBC 2016, debt recovery & NBFC compliance.",
    tags: ["IBC 2016", "SARFAESI", "RBI"] },
  { name: "Consumer Agent", domain: "Consumer Protection", group: "Individual & Social Law",
    desc: "Consumer Protection Act 2019, e-commerce rules, product liability & NCDRC procedures.",
    tags: ["CPA 2019", "NCDRC", "E-commerce"] },
  { name: "Environment Agent", domain: "Environmental Law", group: "Individual & Social Law",
    desc: "Environment Protection Act, NGT jurisdiction, forest laws & pollution control regulations.",
    tags: ["EPA", "NGT", "Forest Act"] },
];
```
Desktop: a dense table grouped under the three `group` labels. Mobile: an accordion per group. Each row ends in a single small `verdigris` seal dot (no repeated "Trained • Active" text 12 times) — one legend line above the table reads "● Actively trained and updated."

**Stretch feature (Phase 6, only if the core build is solid):** a lightweight client-side filter/search input above the table that filters agents by name, domain, or tag — a small functional upgrade that a static mockup can't offer, and a natural showcase that this is real code.

Close with a centered Newsreader line: "12 agents. Every law. One platform."

### 5.5 Why Now (investor stats)
```ts
intro: {
  heading: "India's legal system is at an inflection point.",
  body: "Millions of cases wait in courts. Economic losses from delay cost billions. And AI adoption in law is just beginning — the founding window for Verdikt is right now."
}
statsRowPrimary: [
  { value: "50M+", label: "Cases pending in Indian courts" },
  { value: "1.5M+", label: "Enrolled advocates underserved by modern tooling" },
  { value: "$42B", label: "Projected India legaltech market by 2034" },
  { value: "<5%", label: "Practitioners using AI today — window wide open" }
]
statsRowSecondary: [
  { value: "2%", label: "GDP lost annually to judicial delay" },
  { value: "57%", label: "Legal professionals already exploring AI tools" },
  { value: "22", label: "Court jurisdictions, each with distinct rules and procedures" },
  { value: "Now", label: "AI, digital courts and a new legal generation have aligned — a rare founding window." }
]
```
`ink-navy` background, ledger-style: large `gazette-brass` numerals in tabular figures, hairline rule beneath each, 4-column grid → 2-column on mobile. No icons above any number.

### 5.6 Investors & contact
```ts
heading: "Join us in building Verdikt."
body: "Soulvai Technologies is raising its seed round to scale Verdikt's 12-agent network. We seek partners who think in years, not quarters."
thesis: [
  "First-mover in a massive market — no India-native multi-agent legal platform at meaningful scale exists yet.",
  "A team that lived the problem — we came from courtrooms and chambers, an edge no outsider can replicate.",
  "Capital-efficient, milestone-driven — raising ₹1.5–1.8 Cr seed with a clear roadmap.",
  "Open to strategic partnerships — bar associations, incubators and institutions who want to co-create India's legal future.",
  "Institutional & impact focus — legal infrastructure is impact investing; returns are societal and financial."
]
form: {
  heading: "Let's talk.",
  subhead: "Investor, partner, advocate, or just curious — we'd love to hear from you.",
  fields: ["First name*", "Last name*", "Email*", "Organisation",
    { select: "I am a…*", options: ["Investor / VC","Angel Investor","Legal Practitioner","Institution / Bar Council","Strategic Partner","Press / Media","Other"] },
    "Message*"],
  submitLabel: "Send message",
  success: "Message sent. Thank you for reaching out — the Soulvai team will get back to you within 24 hours.",
  error: "Couldn't send — email us directly at founder@soulvai.ai"
}
```
Two-column ~45/55 on `court-paper`. Thesis list uses a small square brass seal mark per item, not numbered, not icon cards. Form: real client-side validation (required fields, email format), real submission via the configured form backend (Section 3), disabled+loading state on the submit button while sending, and both success and error states actually wired up — not just styled placeholders.

### 5.7 Footer
```ts
description: "Soulvai Technologies — the company behind Verdikt. 12 specialist agents. Every domain of Indian law. One intelligent platform."
columns: {
  Company: ["About", "Agents", "Mission", "Why Now"],
  Connect: ["Investors", "Partners", "Press", "founder@soulvai.ai"],
  Legal: ["Privacy Policy", "Terms of Use", "Cookie Policy"]
}
copyright: "© 2025 Soulvai Technologies Pvt. Ltd. · All rights reserved. Registered in India · Building for Bharat"
```
`ink-navy`, thin 1px brass rule dividing it from the section above.

---

## 6. Interaction & component build notes

### 6.1 General
- Every interactive element (link, button, form field) has a visible keyboard focus ring in `gazette-brass`, 2px offset — don't rely on the browser default, but don't remove it either.
- All buttons and form controls are real semantic HTML (`<button>`, `<label>` + `<input>`), not styled `<div>`s.

### 6.2 Hero orchestration diagram (the one animated element)
Build as an SVG component with Framer Motion. A central "Verdikt Core" node with thin brass lines radiating to 12 small labeled dots in a ring (one per agent, short labels). Animate a single small `seal-oxblood` dot: it travels from an incoming "Query" marker into the core, out along one highlighted line to a chosen agent node, then out to an "Output" marker — looping every 7–8 seconds, `ease-in-out`, never faster. Wrap the animation in a check for `window.matchMedia('(prefers-reduced-motion: reduce)')` — if true, render the diagram statically with the path pre-highlighted, no animation loop running.

### 6.3 Agent directory table/accordion
Desktop ≥1024px: table. Below that: accordion, one panel per `group`, closed by default, first group open. Keyboard-operable (Enter/Space to toggle, arrow keys to move between headers).

### 6.4 Contact form
Client-side validation with inline error text below each invalid field (not just a red border). Submit button shows a text-only loading state ("Sending…") — no spinner icon. On success, replace the form with the success message and a plain-text "Send another" link that resets the form. On failure, show the error state inline above the form without discarding what the user typed.

---

## 7. Non-functional requirements

- **Performance:** Lighthouse Performance, Accessibility, Best Practices, SEO all ≥ 95 on both mobile and desktop presets. Images via `next/image`. Fonts subset and self-hosted via `next/font`. No unused Tailwind classes shipped (JIT purge working correctly).
- **Accessibility:** WCAG AA minimum. Verify contrast for every text/background pairing actually used — specifically check `gazette-brass` text against `ink-navy` (brass on navy may sit closer to AA-large than AA-normal; if it fails 4.5:1 for body-size text, either darken/adjust the brass shade slightly for that specific use or restrict brass text to large/heading sizes and use `court-paper` for small text on navy instead). All non-decorative images and diagram elements have accessible names.
- **Responsive breakpoints:** 375px (mobile), 768px (tablet), 1280px (desktop), 1536px (wide). Test all six sections at each.
- **Browser support:** latest two versions of Chrome, Safari, Firefox, Edge.
- **SEO:** unique `<title>` and meta description per the copy already on the live site, Open Graph + Twitter card image (generate one static branded OG image, don't leave it default), `sitemap.xml`, `robots.txt`, and `Organization` JSON-LD structured data with the company name, URL, and logo.
- **No console errors or warnings** in the browser console on any page load or interaction, across the breakpoints above.

---

## 8. Build phases

Execute in this order. Pause for review at the end of each phase rather than running straight through.

1. **Scaffold** — Next.js + TypeScript + Tailwind project, `tailwind.config.ts` with the Section 4 tokens, fonts wired via `next/font`, base layout, content data files under `content/`.
2. **Shell** — navigation (desktop + mobile) and footer, both fully responsive.
3. **Hero + About** — including the hero orchestration diagram from Section 6.2.
4. **Agent directory + orchestration flow** — data-driven table/accordion, the six-step flow diagram.
5. **Why Now + Investors/contact** — stats ledger, contact form fully wired to the chosen form backend with real success/error states.
6. **Polish pass** — the stretch filter feature if time allows, plus a full re-check against Section 4's forbidden-patterns list across every screen.
7. **Accessibility + responsive QA** — walk every breakpoint in Section 7 using the built-in browser, fix anything failing WCAG AA or the console-error requirement.
8. **Performance, SEO, deploy** — run Lighthouse, fix anything under 95, add OG image + structured data, push to GitHub, deploy to Vercel, share the preview URL.

---

## 9. Acceptance criteria (verify against this before calling any phase done)

- [ ] Site builds and runs with zero TypeScript errors and zero console errors/warnings
- [ ] No emoji anywhere in the rendered UI
- [ ] No border-radius above 4px anywhere
- [ ] No `box-shadow` anywhere except a focus ring
- [ ] Exactly one animated element site-wide (hero diagram); it respects `prefers-reduced-motion`
- [ ] No button or link has an appended arrow glyph
- [ ] No all-caps tracked-out eyebrow label exists anywhere
- [ ] Agent directory is grouped/indexed, not numbered, not 12 identical cards
- [ ] Contact form actually sends and shows real success/error states, not just styled placeholders
- [ ] All text/background color pairs pass WCAG AA at the size they're used
- [ ] Lighthouse ≥ 95 on Performance, Accessibility, Best Practices, SEO (mobile and desktop)
- [ ] Fully usable by keyboard alone, visible focus state on every interactive element
- [ ] Correct rendering at 375 / 768 / 1280 / 1536px
- [ ] OG image, favicon, sitemap.xml, robots.txt, and Organization structured data all present
