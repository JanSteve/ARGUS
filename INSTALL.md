# Installing ARGUS Sovereign OS

This guide provides step-by-step instructions to download, install, and run **ARGUS Sovereign OS** on macOS, Windows, and Linux.

---

## 1. Quick One-Command Installation (Recommended)

To install ARGUS Sovereign OS automatically (including system prerequisites, dependencies, and environment setup), open your terminal and run the command for your platform:

### macOS and Linux
```bash
git clone https://github.com/JanSteve/ARGUS.git && cd ARGUS && git checkout batman && chmod +x setup.sh && ./setup.sh
```

### Windows (PowerShell)
```powershell
git clone https://github.com/JanSteve/ARGUS.git; cd ARGUS; git checkout batman; .\setup.ps1
```

> **Note:** The `git checkout batman` step is only required during the active planning phase. Once the project is merged to the main branch, this step can be omitted.

---

## 2. Manual Installation (Step-by-Step)

If you prefer to install prerequisites manually, follow the steps below:

### Step 1: Install System Prerequisites
Ensure the following tools are installed on your system:
- **Node.js:** Version 22.0 or higher ([Download Node.js](https://nodejs.org/))
- **Git:** Version 2.x or higher ([Download Git](https://git-scm.com/))
- **Rust Toolchain:** Required to build the native desktop shell ([Download Rustup](https://rustup.rs/))
- **Platform-Specific Dependencies:**
  - **macOS:** Install Xcode Command Line Tools:
    ```bash
    xcode-select --install
    ```
  - **Linux (Ubuntu/Debian):** Install compilation packages and WebKit development libraries:
    ```bash
    sudo apt-get update
    sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
    ```
  - **Windows:** Install Visual Studio C++ Build Tools and WebView2.

### Step 2: Install Local AI Engine (Optional, for local mode)
ARGUS runs AI models locally using **Ollama**:
1. Download and install Ollama from [Ollama.com](https://ollama.com/).
2. Start the Ollama application.
3. Download a model of your choice in your terminal (e.g., Llama 3.2):
   ```bash
   ollama run llama3.2
   ```

### Step 3: Setup and Run ARGUS
1. Clone this repository:
   ```bash
   git clone https://github.com/JanSteve/ARGUS.git
   cd ARGUS
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Launch the desktop application in development mode:
   ```bash
   npm run tauri dev
   ```

---

## 3. Troubleshooting & FAQs

### "Repository not found" error during Git Clone
If you receive a repository access error, ensure you have:
1. Logged into your GitHub account using the GitHub CLI: `gh auth login`.
2. Verified that your SSH keys or HTTPS credentials have access to the private repository.

### Tauri fails to build on Windows
If Tauri fails during compilation on Windows, verify that **Visual Studio Build Tools** with the "Desktop development with C++" workload is fully installed and up to date.

### Ollama is not detected by ARGUS
Make sure the Ollama server is running locally on port `11434`. You can test this by opening `http://localhost:11434` in your browser. It should output: `"Ollama is running"`.
