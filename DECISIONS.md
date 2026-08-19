# ARGUS — Architecture Decision Records

This document logs significant architecture and technology decisions. Each entry records the context, decision, rationale, and status.

---

## ADR-001: Desktop Application Framework

**Status:** OPEN

**Context:** ARGUS needs a native desktop shell to provide a cross-platform (macOS, Linux, Windows) application with a web-based UI.

**Options Considered:**

| Option | Pros | Cons |
|:---|:---|:---|
| **Tauri v2** | Small binary (~5 MB), uses system WebView, Rust backend for performance/security, no bundled Chromium | Younger ecosystem, Rust learning curve, fewer plugins, WebView inconsistencies across platforms |
| **Electron** | Battle-tested, massive ecosystem, consistent Chromium behavior, familiar Node.js backend | Large binary (~150 MB+), high memory usage, Chromium security surface |
| **Neutralinojs** | Very lightweight, no bundled runtime | Limited features, small community, less mature |
| **Browser-only (localhost server)** | Simplest, no native shell needed | No system tray, no native file dialogs, user must manage server lifecycle |

**Leaning:** Tauri v2 — aligns with ARGUS's values (lightweight, secure, privacy-focused). The Rust backend can handle credential storage and process management without Node.js overhead.

**Decision:** OPEN — will be finalized after Phase 1 prototyping.

**Consequences:** If Tauri is chosen, the team needs Rust competency for the backend layer. If Electron, the backend remains JavaScript/TypeScript throughout.

---

## ADR-002: Frontend Framework

**Status:** DECIDED

**Context:** The UI layer needs a component-based framework for building the chat interface, settings, and provider management.

**Options Considered:**

| Option | Pros | Cons |
|:---|:---|:---|
| **React + TypeScript** | Largest ecosystem, excellent tooling, widely known, strong typing with TS | Large bundle, JSX learning curve for some |
| **Svelte/SvelteKit** | Smaller bundle, less boilerplate, reactive by default | Smaller ecosystem, fewer developers familiar |
| **Vue 3 + TypeScript** | Good balance of simplicity and power, excellent docs | Smaller ecosystem than React |
| **Solid.js** | Best runtime performance, React-like API | Very small ecosystem, fewer libraries |

**Decision:** React + TypeScript

**Rationale:** React has the largest ecosystem, the most available developers, and excellent TypeScript support. For a project that aims to be publishable and maintainable by contributors, React minimizes the barrier to entry.

---

## ADR-003: Build Tool

**Status:** DECIDED

**Context:** The frontend needs a build tool for development (hot-reload) and production (bundling).

**Options Considered:**

| Option | Pros | Cons |
|:---|:---|:---|
| **Vite** | Fast HMR, Rollup-based production builds, first-class Tauri/React support | Rollup plugin ecosystem quirks |
| **Webpack** | Most mature, most plugins | Slower, complex configuration |
| **esbuild** | Fastest builds | Limited plugin ecosystem |
| **Turbopack** | Fast, Vercel-backed | Still maturing, primarily Next.js focused |

**Decision:** Vite

**Rationale:** Vite is the standard build tool for Tauri applications, has excellent React support via `@vitejs/plugin-react`, and provides fast development iteration.

---

## ADR-004: Styling Approach

**Status:** DECIDED

**Context:** The UI needs a styling system that supports theming, dark mode, and component-scoped styles.

**Options Considered:**

| Option | Pros | Cons |
|:---|:---|:---|
| **CSS Modules + Custom Properties** | Zero runtime cost, native CSS, full control, no dependencies | More manual work for design systems |
| **Tailwind CSS** | Rapid prototyping, consistent design tokens | Verbose class names, build-time dependency |
| **Styled Components** | Co-located styles, dynamic theming | Runtime CSS-in-JS overhead |
| **Vanilla Extract** | Zero runtime, TypeScript-first | Smaller ecosystem |

**Decision:** CSS Modules + CSS Custom Properties

**Rationale:** Zero runtime overhead, no external dependencies, full control over the design. CSS custom properties provide theming (dark/light mode) natively. Aligns with the project's preference for minimal dependencies.

---

## ADR-005: Testing Framework

**Status:** DECIDED

**Context:** The project needs unit and integration testing for frontend components.

**Options Considered:**

| Option | Pros | Cons |
|:---|:---|:---|
| **Vitest** | Vite-native, fast, Jest-compatible API, ESM support | Younger than Jest |
| **Jest** | Most popular, battle-tested | Slower, ESM support is fragile |
| **Playwright Test** | Excellent E2E, built-in assertions | Not ideal for unit tests |

**Decision:** Vitest (unit/component) + Playwright (E2E, later)

**Rationale:** Vitest integrates natively with Vite, shares the same configuration, and is significantly faster than Jest for Vite-based projects.

---

## ADR-006: Test Environment

**Status:** DECIDED

**Context:** Frontend tests need a DOM environment. jsdom is the traditional choice but is heavy and slow to initialize.

**Options Considered:**

| Option | Pros | Cons |
|:---|:---|:---|
| **happy-dom** | Fast, lightweight, sufficient for most React testing | Less complete DOM implementation |
| **jsdom** | Most complete DOM simulation | Heavy (~38 packages), slow initialization |

**Decision:** happy-dom

**Rationale:** happy-dom is significantly lighter and faster. React Testing Library works well with it. jsdom caused worker startup timeouts in constrained environments.

---

## ADR-007: Linting

**Status:** DECIDED

**Context:** The project needs linting for code quality and consistency.

**Options Considered:**

| Option | Pros | Cons |
|:---|:---|:---|
| **oxlint** | Extremely fast (Rust-based), zero config, growing rule set | Fewer rules than ESLint |
| **ESLint** | Most rules, most plugins, most mature | Slow, complex configuration |
| **Biome** | Fast, includes formatter | Smaller rule set than ESLint |

**Decision:** oxlint

**Rationale:** Fast, zero-config, and sufficient for the project's needs. Can be replaced with ESLint later if more rules are needed.

---

## ADR-008: AI Provider Abstraction

**Status:** DECIDED

**Context:** ARGUS needs to support multiple AI providers (Groq, Ollama, future providers) through a common interface.

**Decision:** Define a Provider protocol/interface with methods for:
- `getInfo()` — provider metadata (name, type, model, availability)
- `generate(prompt)` — non-streaming completion
- `stream(prompt)` — streaming completion (async iterator)
- `checkAvailability()` — connectivity/health check

New providers implement this interface. A registry resolves provider names to implementations.

**Rationale:** Decouples the UI and chat logic from any specific provider. Adding a new provider requires only implementing the interface and registering it.

---

## ADR-009: Typography

**Status:** DECIDED

**Context:** ARGUS needs readable, professional typography without external network requests.

**Decision:** System font stack

**Rationale:** ARGUS is a privacy-focused application. Loading fonts from Google Fonts (or any CDN) would make network requests on startup. The system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`) is available on all target platforms and looks native.

---

## ADR-010: Database (Conversation Persistence)

**Status:** OPEN

**Context:** ARGUS needs to persist conversation history locally.

**Options Considered:**

| Option | Pros | Cons |
|:---|:---|:---|
| **SQLite** | Mature, reliable, single-file, excellent Tauri/Rust integration | Schema management needed |
| **Flat JSON files** | Simplest, no dependencies | Poor query performance, no transactions |
| **IndexedDB (browser)** | Available in WebView, no backend needed | Size limits, not accessible from Rust backend |

**Leaning:** SQLite — it's the standard choice for local-first desktop applications.

**Decision:** OPEN — will be finalized in Phase 2 or Phase 3.
