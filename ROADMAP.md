# ARGUS — Roadmap

Development is organized into clearly defined phases. Each phase has specific deliverables and acceptance criteria. No dates are promised — quality over speed.

---

## Phase 0: Architecture & Planning ← CURRENT

**Objective:** Establish the project foundation before writing application code.

**Deliverables:**
- Project overview and vision document
- Requirements specification
- Architecture design
- Technology evaluation and decisions
- Development workflow guide
- Roadmap
- Professional README

**Acceptance Criteria:**
- All planning documents reviewed and approved
- Technology stack decision finalized (or explicitly marked OPEN)
- Repository structure is clean and documented
- .gitignore is appropriate for the chosen stack

**Tests Required:** None (no application code yet)

**Documentation Required:** All planning documents listed above

---

## Phase 1: Foundation

**Objective:** Create a working desktop application shell with CI, testing, a basic UI, and one-command environment setup scripts.

**Deliverables:**
- Project scaffolded with chosen framework (Tauri or Electron)
- Vite + React + TypeScript configured
- OS-like Desktop Shell interface (wallpaper canvas, taskbar, start-menu launcher)
- React Window Manager managing floating, draggable, resizable window frames
- Floating application window shells: ChatView, SettingsView
- CSS design system (custom properties, dark theme, window styles)
- Vitest configured with happy-dom
- CI pipeline (lint, test, build)
- .env.example with documented variables
- Native setup/bootstrap scripts (`setup.sh` for macOS/Linux, `setup.ps1` for Windows)

**Dependencies:** Phase 0 approved

**Acceptance Criteria:**
- `npm run dev` starts the desktop app with hot-reload
- `npm test` passes all tests
- `npm run lint` passes
- `npm run build` produces a runnable application
- Running `setup.sh` or `setup.ps1` successfully validates the environment and bootstraps all dependencies
- CI passes on push to main
- Application renders the Desktop Shell UI, and windows can be opened, dragged, and resized

**Tests Required:**
- Application renders without crashing
- Window manager correctly opens, closes, drags, and focuses window elements
- Navigation from taskbar and start menu works
- All UI components render correctly

**Documentation Required:**
- Updated README with setup instructions
- Updated DEVELOPMENT.md with actual commands


---

## Phase 2: AI Core

**Objective:** Implement the first real AI provider and streaming chat.

**Deliverables:**
- Provider abstraction (AIProvider interface)
- Groq provider implementation
- Streaming chat UI (token-by-token rendering)
- Chat input with send/cancel controls
- Provider status display in UI
- API key configuration in settings
- Error handling for missing keys, network errors

**Dependencies:** Phase 1 complete

**Acceptance Criteria:**
- User can send a message and receive a streaming response from Groq
- User can cancel an in-progress response
- Missing API key shows a clear error
- Network errors are handled gracefully
- Provider status is visible in the UI

**Tests Required:**
- Provider interface contract tests (with mocks)
- Chat UI renders messages correctly
- Streaming response rendering works
- Error states render correctly
- Cancel functionality works

**Documentation Required:**
- Provider abstraction API documented
- How to add a new provider documented

---

## Phase 3: Local AI

**Objective:** Add Ollama as a local AI provider.

**Deliverables:**
- Ollama provider implementation
- Connectivity detection (is Ollama running?)
- Local model discovery
- Model selection UI
- Provider switching (Groq ↔ Ollama)
- Privacy indicator (LOCAL vs. REMOTE)
- Settings for Ollama base URL

**Dependencies:** Phase 2 complete

**Acceptance Criteria:**
- User can chat with a locally running Ollama model
- User can switch between Groq and Ollama
- UI clearly shows LOCAL or REMOTE mode
- Disconnected Ollama shows clear error (no silent fallback)
- Model selection works

**Tests Required:**
- Ollama provider tests (with mocked HTTP)
- Provider switching tests
- Connectivity detection tests
- UI state tests for local/remote modes

**Documentation Required:**
- How to set up Ollama for ARGUS
- Privacy architecture explanation

---

## Phase 4: Persistence & Polish

**Objective:** Persist conversations and polish the user experience.

**Deliverables:**
- Conversation persistence (SQLite or equivalent)
- Conversation list in sidebar
- New conversation / rename / delete
- Dark/light theme toggle
- Keyboard shortcuts
- Loading states and animations
- Error recovery improvements

**Dependencies:** Phase 3 complete

**Acceptance Criteria:**
- Conversations persist across app restarts
- User can manage conversations (create, rename, delete)
- Theme switching works
- Application feels polished and responsive

**Tests Required:**
- Persistence layer tests
- Conversation management UI tests
- Theme switching tests

**Documentation Required:**
- Data storage explanation
- User guide

---

## Phase 5: Cross-Platform Packaging

**Objective:** Package ARGUS for distribution on macOS, Linux, and Windows.

**Deliverables:**
- macOS .dmg installer
- Linux .AppImage / .deb
- Windows .msi / .exe installer
- Auto-update mechanism (if using Tauri)
- Release workflow in CI

**Dependencies:** Phase 4 complete

**Acceptance Criteria:**
- Install and run on macOS (ARM + Intel)
- Install and run on Ubuntu 22.04+
- Install and run on Windows 10+
- Application starts correctly from installed package

**Tests Required:**
- Installation smoke tests on each platform
- Application launch tests

**Documentation Required:**
- Installation guide per platform
- Troubleshooting guide

---

## Future Phases (Not Scheduled)

These are planned but not yet scoped:

- **Voice Intelligence** — Local ASR (VibeVoice) and TTS
- **Memory** — Persistent, user-controlled AI memory
- **Tools** — Document analysis, file operations
- **Plugin System** — Extensible architecture for third-party tools
- **Multi-Provider Management** — Concurrent providers, routing rules
