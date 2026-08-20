<div align="center">
  <h1>👁️ ARGUS Sovereign Workspace</h1>
  <p><strong>The World's First AI-Native Sovereign Desktop Workspace Wrapper</strong></p>

  <p>
    <img src="https://img.shields.io/badge/version-v2.0.0-blue.svg?style=for-the-badge" alt="Version v2.0.0" />
    <img src="https://img.shields.io/badge/license-Open--Core-green.svg?style=for-the-badge" alt="License: Open-Core" />
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey.svg?style=for-the-badge" alt="Platform" />
    <img src="https://img.shields.io/badge/build-passing-brightgreen.svg?style=for-the-badge" alt="Build passing" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  </p>
</div>

<br />

---

## 💡 What is ARGUS?

**ARGUS** is not a bare-metal operating system; it is a **Sovereign, AI-Native Desktop Environment and Productivity Workspace Wrapper** that runs securely on top of macOS and Windows. 

Current AI tools are isolated in browser tabs or restricted to cloud-dependent OS sidebars that compromise user privacy. ARGUS flips the script by integrating a **100% local, air-gapped AI assistant (powered by Ollama)** directly into a lightweight, glassmorphic window manager built with **React 19, TypeScript, and Tauri 2 / Rust**.

---

## ⚡ Key Architectural Solutions

### 1. Air-Gapped Data Sovereignty
By routing all model queries locally through Ollama, your files, prompts, and notes never touch corporate cloud servers. 

### 2. Micro-Resource Footprint
Unlike heavy, memory-bloated Electron overlays, ARGUS leverages Tauri 2 and Rust native execution. The desktop manager consumes a minimal fraction of your RAM, leaving maximum headroom for your local AI models to run smoothly.

### 3. Integrated AI-App Coordination
The built-in apps are connected to your AI assistant. You can control your workspace, create notes, compute expressions, and surf the web directly through the local AI chat.

---

## 💻 Hardware Prerequisites & Performance Modes

Running large language models locally is computationally heavy. ARGUS includes built-in performance modes to optimize execution based on your computer's limits:

- **Eco Mode:** For lower-end laptops. Caps model context to 2,048 tokens and sleeps inactive apps to save CPU/battery.
- **Balanced Mode (Default):** Tailored for standard multi-tasking and Llama 3.2 models on mid-range setups.
- **Turbo Mode:** Uncaps context limits and fully utilizes dedicated NPU/GPU layers for quick inference.

### Recommended Requirements
- **macOS:** Apple Silicon M1/M2/M3/M4 with 16GB Unified Memory or higher.
- **Windows:** Intel Core i7 / AMD Ryzen 7, 16GB RAM, and a dedicated NVIDIA RTX GPU.

---

## 📱 Built-in App & Local AI Integration

You can interactively direct your desktop suite using slash commands inside the **Chat Assistant**:

*   **💬 Chat Assistant:** Your central workspace manager. Type `/help` inside chat to list desktop shortcuts:
    - `/notes "text"` — Save a new note instantly to the Notes app.
    - `/web "url"` — Navigate the Browser app to a website.
    - `/calc "math"` — Safely compute expressions (e.g. `/calc (243 * 3) / 12`).
    - `/music "play/pause/next"` — Control your audio playback.
    - `/system "Eco/Turbo"` — Toggle performance throttling modes.
*   **🌐 Browser:** A glassmorphic web browser with nav buttons, bookmarks, and AI web page scraping.
*   **💻 Terminal:** A high-speed command terminal with custom UNIX outputs and command listings.
*   **🧮 Calculator:** Clear grid layout, history track, and key-press bindings.
*   **📝 Notes:** Sidebar manager, markdown editing area, and auto-saves backed by localStorage.
*   **🎵 Music Player:** Audio player showing track titles, play/pause toggles, and duration progress.
*   **🖼️ Photos:** Thumbnail gallery with folder sorting and interactive image slideshows.
*   **📂 File Explorer:** Smart navigation panel showing Desktop, Documents, and Pictures.
*   **⚙️ Settings:** Manage AI providers (Ollama, Gemini, Groq) and set Performance Profiles.

---

## 🚀 Quick Start

Get the ARGUS Workspace up and running locally:

```bash
# 1. Clone the repository
git clone https://github.com/janstevedaniel/ARGUS.git
cd ARGUS

# 2. Run the quick setup installer (automatically installs packages & links CLI globally)
./setup.sh
# or setup.ps1 on Windows PowerShell

# 3. Start the environment (from ANY directory!)
argus
```

---

## 🤝 The Open-Core License Model

We believe in full privacy transparency. Because of this, the base desktop workspace wrapper code of ARGUS is **Open-Source (MIT/Source-Available)** so that users can audit the security of the local IPC bridges. Advanced team synchronization, shared local model gateways, and custom workspace themes are available under a commercial enterprise subscription.

**Creator:** [R Jan Steve Daniel](https://github.com/janstevedaniel)
