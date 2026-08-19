# ARGUS — Technology Evaluation

This document evaluates technology choices for ARGUS across every major decision area. Each section presents the options considered, trade-offs, and recommendation.

---

## 1. Language / Runtime

| Option | Pros | Cons | Verdict |
|:---|:---|:---|:---|
| **TypeScript (Node.js)** | Shared language with frontend, large ecosystem, async-first, npm packages | Single-threaded, not ideal for CPU work | ✅ Primary |
| **Rust** | Performance, memory safety, Tauri-native | Steep learning curve, slower iteration | ✅ Desktop shell (if Tauri) |
| **Python** | ML ecosystem, FastAPI for APIs | GIL, dependency management, packaging complexity | ❌ Not for v1.0 |
| **Go** | Simple, fast compilation, good concurrency | No web UI story, small frontend ecosystem | ❌ Not suitable |

**Recommendation:** TypeScript for all application logic (frontend + backend services). Rust only if Tauri is chosen (minimal Rust code for the native shell).

**Rationale:** Using one language (TypeScript) for both frontend and backend logic minimizes context switching, simplifies the build, and maximizes the contributor pool. Python was used in the prior iteration but added packaging complexity without clear benefit for v1.0 (no ML inference needed — Ollama handles that).

---

## 2. Desktop Application Framework

| Option | Bundle Size | Performance | Ecosystem | Security | Learning Curve |
|:---|:---|:---|:---|:---|:---|
| **Tauri v2** | ~5 MB | Excellent (Rust) | Growing | Strong (sandboxed WebView) | Medium (Rust) |
| **Electron** | ~150 MB | Good (Chromium) | Massive | Moderate (Node.js in main) | Low (JS/TS) |
| **Neutralinojs** | ~2 MB | Good | Small | Moderate | Low |
| **Browser-only** | 0 (no shell) | N/A | Full web | Weak (no native APIs) | Lowest |

**Recommendation:** Tauri v2 (preferred) with Electron as fallback.

**Rationale:** Tauri produces tiny binaries, uses system WebView (privacy-friendly — no Chromium phoning home), and provides secure IPC by default. ARGUS's privacy-focused values align with Tauri's architecture. Electron is the fallback if Tauri's WebView inconsistencies prove problematic. This decision is marked **OPEN** until Phase 1 prototyping validates it.

---

## 3. Frontend Framework

| Option | Ecosystem Size | Bundle Size | TypeScript Support | Learning Curve |
|:---|:---|:---|:---|:---|
| **React** | Largest | Medium | Excellent | Low-Medium |
| **Svelte** | Small-Medium | Smallest | Good | Low |
| **Vue 3** | Medium | Small | Good | Low |
| **Solid.js** | Small | Smallest | Excellent | Medium |

**Recommendation:** React + TypeScript

**Rationale:** Largest ecosystem, most available developers, best tooling. For a publishable open-source project, React minimizes the barrier to contribution.

---

## 4. Build Tool

| Option | Dev Speed | Production Quality | Tauri Integration |
|:---|:---|:---|:---|
| **Vite** | Excellent (HMR) | Good (Rollup) | First-class |
| **Webpack** | Slow | Excellent | Manual setup |
| **Turbopack** | Fast | Maturing | None |

**Recommendation:** Vite

**Rationale:** Native Tauri integration, fastest development experience, standard choice for React + Tauri projects.

---

## 5. Styling

| Option | Runtime Cost | Control | Dependencies |
|:---|:---|:---|:---|
| **CSS Modules + Custom Properties** | Zero | Full | None |
| **Tailwind CSS** | Zero (build-time) | Framework-controlled | tailwindcss |
| **Styled Components** | Runtime | Full | styled-components |

**Recommendation:** CSS Modules + CSS Custom Properties

**Rationale:** Zero runtime cost, zero dependencies, full control over the design system. CSS custom properties handle theming (dark/light mode) natively.

---

## 6. Testing

| Option | Speed | Vite Integration | API Compatibility |
|:---|:---|:---|:---|
| **Vitest** | Fast | Native | Jest-compatible |
| **Jest** | Moderate | None (separate config) | Native |

**Recommendation:** Vitest with happy-dom

**Rationale:** Native Vite integration, faster than Jest, Jest-compatible API. happy-dom chosen over jsdom for lighter weight and faster initialization.

---

## 7. Linting

| Option | Speed | Config Complexity | Rule Coverage |
|:---|:---|:---|:---|
| **oxlint** | Fastest (Rust) | Zero-config | Growing |
| **ESLint** | Slow | Complex (flat config) | Most complete |
| **Biome** | Fast | Low | Growing |

**Recommendation:** oxlint

**Rationale:** Fastest available linter, zero configuration needed. Sufficient rule coverage for the project. Can migrate to ESLint later if advanced rules are needed.

---

## 8. State Management

| Option | Complexity | Bundle Impact | Learning Curve |
|:---|:---|:---|:---|
| **React useState/useReducer** | Lowest | None | Lowest |
| **Zustand** | Low | Tiny (~1 KB) | Low |
| **Redux Toolkit** | Medium | Medium | Medium |
| **Jotai** | Low | Tiny | Low |

**Recommendation:** Start with React built-in state. Evaluate Zustand if state management becomes complex.

**Rationale:** ARGUS v1.0 has simple state needs (active provider, chat messages, settings). Built-in React state is sufficient. Adding a state library before the need is clear would be premature.

---

## 9. Database / Persistence

| Option | Query Power | Reliability | Cross-Platform | Tauri Support |
|:---|:---|:---|:---|:---|
| **SQLite** | SQL queries | Battle-tested | Excellent | Native (tauri-plugin-sql) |
| **Flat JSON files** | None (manual) | Fragile | Excellent | Simple fs operations |
| **IndexedDB** | Limited | Good | Browser-only | WebView only |

**Recommendation:** SQLite (decision OPEN — finalize in Phase 4)

**Rationale:** SQLite is the standard for local-first desktop applications. Tauri has a first-party SQLite plugin. However, this decision can be deferred since Phase 1–3 don't require persistence.

---

## 10. CI/CD

| Option | Free Tier | Ecosystem | Matrix Builds |
|:---|:---|:---|:---|
| **GitHub Actions** | 2000 min/month | Largest | Excellent |
| **GitLab CI** | 400 min/month | Good | Good |

**Recommendation:** GitHub Actions

**Rationale:** Repository is already on GitHub. GitHub Actions has the best integration with GitHub repositories and excellent support for multi-platform matrix builds (macOS, Linux, Windows).

---

## 11. Typography

**Recommendation:** System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)

**Rationale:** No external network requests on startup. Looks native on each platform. Privacy-first.

---

## 12. Backend Architecture (v1.0)

**Recommendation:** No separate backend server.

The prior ARGUS iteration used a FastAPI (Python) backend. For v1.0, this is unnecessary:
- **Groq API:** Called directly from the Tauri/Electron backend process via HTTP
- **Ollama:** Called via HTTP to `localhost:11434`
- **No separate server process to manage**

The Tauri backend (Rust) or Electron main process (Node.js) handles HTTP requests to providers directly. This eliminates the need for a separate Python server, simplifying installation, packaging, and the dependency tree.

If future features (voice, ML inference) require Python, it will be added as an isolated sidecar service — not merged into the core backend.
