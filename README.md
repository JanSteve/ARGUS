# ARGUS — AI-Native Sovereign Desktop Workspace

> **v0.2.0 · Reality & Release Milestone**

A desktop workspace built with React 19, TypeScript, Vite, Tauri 2, and Rust.  
Runs on macOS (Apple Silicon) and Windows. Connects to a local Ollama instance for private AI inference.

---

## Honest Feature Status

| Feature | Status | Notes |
|---|---|---|
| Window Manager (drag, resize, snap) | ✅ **REAL** | Full Aero Snap, z-index, minimize, maximize |
| Taskbar & Start Menu | ✅ **REAL** | Live clock, running app indicators |
| Context Menu | ✅ **REAL** | Right-click desktop |
| Control Panel | ✅ **REAL** | Wallpaper, brightness, volume sliders |
| **Chat AI (Ollama streaming)** | ✅ **REAL** | Real local inference, streaming, stop button |
| **Settings (AI config)** | ✅ **REAL** | Wired to localStorage, live Ollama status |
| **Ollama Detection** | ✅ **REAL** | 6 explicit states, model discovery |
| **Privacy Indicator** | ✅ **REAL** | Shows LOCAL/REMOTE based on actual provider |
| **Slash Commands** | ✅ **REAL** | /calc, /notes, /web, /music, /system |
| **Performance Profiles** | ✅ **REAL** | ECO/BALANCED/TURBO with documented effects |
| Notes | ✅ **REAL** | localStorage persistence, auto-save |
| Terminal | ⚠️ **SIMULATED** | Cosmetic shell — no real shell access |
| Browser | ⚠️ **PARTIAL** | Address bar UI — cannot load arbitrary URLs |
| File Explorer | ⚠️ **SIMULATED** | In-memory filesystem, not your real disk |
| Calculator | ✅ **REAL** | Functional math evaluation |
| Music Player | ✅ **REAL** | UI working (no audio file loading yet) |
| Photos | ⚠️ **PARTIAL** | Gallery UI, no real filesystem photos |
| Remote AI (Groq) | ❌ **PLANNED** | Not yet implemented |
| Persistent memory | ❌ **PLANNED** | Future milestone |
| Voice interface | ❌ **PLANNED** | Future milestone |
| Multi-agent system | ❌ **PLANNED** | Future milestone |

---

## Architecture

```
ARGUS Desktop
    │
    ├── Window Manager (React)
    │   ├── Desktop + Aero Snap
    │   ├── Taskbar, Start Menu, Control Panel
    │   └── WindowFrame (drag, resize, z-index)
    │
    └── AI Core (src/lib/ai/)
        │
        ├── types.ts         — AIProvider, AIConfig, OllamaStatus interfaces
        ├── ollamaProvider.ts — Real Ollama implementation
        └── index.ts          — Factory, hooks (useAIConfig, useOllamaStatus, useStreamingChat)
                │
                AI Provider abstraction
                │
          ┌────┴────┐
          │         │
        Ollama    Groq (future)
          │
     Local Model
     (stays on your machine)
```

---

## Local AI Setup

ARGUS does **NOT** download Ollama or model weights automatically.  
You must install and start Ollama yourself.

### 1. Install Ollama

Go to [https://ollama.com](https://ollama.com) and download the installer for your OS.

### 2. Start Ollama

```bash
ollama serve
```

### 3. Pull a supported model

```bash
ollama pull llama3.2
```

Other supported models: `mistral`, `llama3.1`, `gemma2`, `phi3`, `qwen2.5`, `deepseek-r1`

### 4. Launch ARGUS

- **macOS**: Open `ARGUS.app` from Applications
- **Dev mode**: `npm run tauri dev`

### 5. Configure in ARGUS

- Open Settings (desktop shortcut or Start Menu)
- Go to **AI Engine**
- Execution Mode → **LOCAL**
- Model → select your installed model
- Status should show **LOCAL READY** with green dot

---

## Ollama Status States

| Status | Meaning |
|---|---|
| `CHECKING...` | Pinging endpoint |
| `OLLAMA NOT DETECTED` | Cannot reach endpoint |
| `OLLAMA OFFLINE` | Connection refused |
| `NO LOCAL MODEL` | Running but no models installed |
| `MODEL NOT INSTALLED` | Running, but selected model missing — install with `ollama pull <model>` |
| `LOCAL READY` | All good, ready to chat |

---

## Slash Commands

In the Chat app, type:

| Command | What it does |
|---|---|
| `/calc 25 * 17` | Evaluates the math expression → `425` |
| `/notes` | Opens the Notes app |
| `/web` | Opens the Browser app |
| `/music` | Opens the Music Player |
| `/system` | Shows ARGUS system info |

---

## Performance Profiles

| Profile | Token Limit | Description |
|---|---|---|
| **ECO** | 256 tokens | Best for slower hardware. Shorter AI responses. |
| **BALANCED** | 1024 tokens | Default. Recommended for most users. |
| **TURBO** | No limit | Let the model decide. Best for capable hardware. |

> ⚠️ TURBO does **not** make the model faster — it removes the token output cap only.

---

## Privacy

In **LOCAL** mode:
- Your prompt is sent only to `http://localhost:11434`
- No data leaves your machine
- No external network request is made
- The Chat UI shows "Prompt routed to local Ollama instance · No data leaves your machine"

In **REMOTE** mode (when implemented):
- The Chat UI will clearly state "Prompt routed to remote provider"
- No silent rerouting — ARGUS never sends LOCAL prompts to remote providers

---

## Installation

### macOS (Apple Silicon)

1. Download `ARGUS_0.2.0_aarch64.dmg` from Releases
2. Open the DMG
3. Drag ARGUS to Applications
4. Open ARGUS
5. Follow the Local AI Setup above

### Windows

1. Download the `.msi` or `.exe` installer from Releases
2. Run the installer
3. Launch ARGUS from Start Menu

### From source

```bash
# Clone
git clone https://github.com/JanSteve/ARGUS.git
cd ARGUS

# Install dependencies
npm install

# Dev mode
npm run tauri dev

# Production build
npm run tauri build
```

---

## CLI

After `npm link` or global install:

```bash
argus       # starts the dev server
argus-ai    # alias
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 |
| Language | TypeScript |
| Build tool | Vite 7 |
| Desktop runtime | Tauri 2 |
| Backend | Rust |
| Testing | Vitest + Testing Library |
| Local AI | Ollama |

---

## License

Open-Core · © 2026 R Jan Steve Daniel  
Source available for personal and educational use.
