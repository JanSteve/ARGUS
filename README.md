# ARGUS Sovereign OS

**A local-first, privacy-focused AI Operating System simulator & desktop workspace.**

[![CI Build Status](https://github.com/JanSteve/ARGUS/actions/workflows/ci.yml/badge.svg)](https://github.com/JanSteve/ARGUS/actions)
[![License: Proprietary Source-Available](https://img.shields.io/badge/License-Proprietary%20Source--Available-blueviolet.svg)](LICENSE)
[![Platform: Cross-Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue.svg)](#getting-started)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-orange.svg)](https://tauri.app)
[![React 19](https://img.shields.io/badge/React-19.0-cyan.svg)](https://react.dev)

---

## 🚀 What is ARGUS Sovereign OS?

ARGUS Sovereign OS is a cross-platform desktop application environment designed from the ground up to give developers and users a beautiful, responsive, and completely private space to run AI assistants. It runs local LLMs (via Ollama) and remote cloud intelligence (via Groq API) under an explicit, security-conscious privacy policy. 

Developed with a modular architecture and premium desktop simulation aesthetics, ARGUS Sovereign OS acts as a sandboxed operating system environment within a native window wrapper. The term **Sovereign** highlights the core philosophy: **complete user ownership of data, models, and computational privacy**, bypassing big tech cloud telemetry.

---

## 🌟 Visual Features & UX Showcase

ARGUS Sovereign OS features a state-of-the-art Web-based OS Desktop environment tailored for a premium user experience:

*   🪟 **Window Manager with Elastic Easing:** Windows animate with smooth spring-like physics (`cubic-bezier(0.34, 1.56, 0.64, 1)`) when spawned, minimized, maximized, or closed.
*   📐 **8-Direction Resizing & Dragging:** Drag any window frame smoothly via its title bar, or resize from borders and corners with custom boundary constraints.
*   ⚡ **Aero Snap (Snap Assist):** Drag a window to the top edge to preview full screen maximization, or drag to the left/right screen edges to snap them to 50% split-screen layouts.
*   鼠标 **Desktop Context Menu:** Right-click anywhere on the desktop wallpaper background to access a context menu to "Refresh Desktop", "Cycle Wallpaper", or launch applications.
*   🎛️ **Quick Settings Control Panel (Action Center):** Click on the taskbar clock tray to launch a Quick Settings panel to toggle Wi-Fi and Bluetooth, adjust volume/brightness, and dynamically select desktop wallpapers.
*   🌌 **Interactive Wallpapers:** Support for four premium dark themes (Deep Space, Aurora Borealis, Midnight Forest, and Crimson Nebula).

---

## ⚙️ One-Command Setup (Getting Started)

ARGUS Sovereign OS includes automated bootstrap scripts to validate your environment (Node.js, Git, Rust, Ollama), download dependencies, and boot the application in one command:

### macOS / Linux
```bash
git clone https://github.com/JanSteve/ARGUS.git && cd ARGUS && git checkout batman && chmod +x setup.sh && ./setup.sh
```

### Windows (PowerShell)
```powershell
git clone https://github.com/JanSteve/ARGUS.git; cd ARGUS; git checkout batman; .\setup.ps1
```

> **Note:** The `git checkout batman` step is only required during the active planning phase. Once Phase 2 is completed and merged to main, this step can be omitted.

For a detailed manual installation guide, please check out **[INSTALL.md](INSTALL.md)**.

---

## 🗂️ Project Structure

```
ARGUS/
├── .github/workflows/      # GitHub Actions CI Configuration
├── docs/                   # Extended design and architecture specifications
├── src-tauri/              # Rust Native Tauri Desktop Backend
├── src/                    # Frontend React + TypeScript Workspace
│   ├── __tests__/          # Vitest Unit Tests
│   ├── components/         # Desktop and Application Components
│   │   └── Desktop/        # Window Manager, Taskbar, StartMenu, ControlPanel
│   ├── hooks/              # custom mouse dragging and resizing hooks
│   ├── assets/             # Logos and Static Media
│   ├── index.css           # Styling Tokens (Glassmorphic Colors & Spring Physics)
│   ├── main.tsx            # React Entry Point
│   └── test/               # Vitest Testing Setup Configs
├── INSTALL.md              # Installation details for MacOS, Windows, Linux
├── LICENSE                 # Proprietary Source-Available License
├── README.md               # Visual Features & Overview
└── setup.sh / setup.ps1    # Cross-platform installation scripts
```

---

## 📊 Development Documentation

| Specification Document | Purpose / Content |
|:---|:---|
| 📖 **[INSTALL.md](INSTALL.md)** | Step-by-step installation guides and troubleshooting tips |
| 📋 **[REQUIREMENTS.md](REQUIREMENTS.md)** | Functional specifications and security criteria |
| 🏛️ **[ARCHITECTURE.md](ARCHITECTURE.md)** | Stacking layers, drag-resize calculations, and provider interfaces |
| 🗓️ **[ROADMAP.md](ROADMAP.md)** | Milestones (Phase 1 to Phase 4) |
| 🛡️ **[SECURITY.md](SECURITY.md)** | Secret keys management and vulnerability reporting instructions |
| 📝 **[DECISIONS.md](DECISIONS.md)** | Architecture Decision Records (ADRs) |
| 📈 **[PROJECT_STATUS.md](PROJECT_STATUS.md)** | Current release milestones status tracking |

---

## 🔒 License & Copyright

Proprietary & Source-Available License. Copyright (c) 2026 **Jan Steve Daniel**. All rights reserved.

This software is for personal evaluation, educational, and non-commercial development use only. Commercial redistribution, hosting as a service, or unauthorized resale of the software or its modifications is strictly prohibited. See the **[LICENSE](LICENSE)** file for full legal terms.
