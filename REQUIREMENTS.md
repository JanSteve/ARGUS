# ARGUS — Requirements

## Functional Requirements

### FR-1: AI Chat
- FR-1.1: Users can send text messages and receive AI-generated responses
- FR-1.2: Responses stream token-by-token in real time
- FR-1.3: Users can stop/cancel an in-progress response
- FR-1.4: Conversation history is displayed in the UI
- FR-1.5: Users can start new conversations

### FR-2: Provider Management
- FR-2.1: Support at least one remote provider (Groq API)
- FR-2.2: Support at least one local provider (Ollama)
- FR-2.3: Users can switch between providers in the UI
- FR-2.4: The UI displays which provider is currently active
- FR-2.5: The UI displays whether the current provider is local or remote

### FR-3: Configuration
- FR-3.1: API keys are stored securely on the user's machine
- FR-3.2: Users can configure provider settings through the UI
- FR-3.3: Configuration persists across application restarts
- FR-3.4: Missing or invalid configuration produces clear error messages

### FR-4: Local AI
- FR-4.1: ARGUS connects to a locally running Ollama instance
- FR-4.2: ARGUS discovers available local models
- FR-4.3: Users can select which local model to use
- FR-4.4: ARGUS does not automatically download models
- FR-4.5: When Ollama is not running, the UI displays a clear status

### FR-5: Privacy Indicators
- FR-5.1: The UI clearly labels whether the active mode is LOCAL or REMOTE
- FR-5.2: When in LOCAL mode, no data is sent to external services
- FR-5.3: The UI does not make absolute privacy guarantees (e.g. "100% private")
- FR-5.4: The UI uses precise language (e.g. "Processed locally" or "Sent to Groq API")

### FR-6: One-Command Setup & Installation
- FR-6.1: Users can clone the repository and run a single command to validate their environment, install dependencies, and start the application
- FR-6.2: Provide a native setup script for macOS/Linux (`setup.sh`) that checks for and helps install Node.js, Rust, and Ollama
- FR-6.3: Provide a native setup script for Windows (`setup.ps1`) that performs the equivalent checks and installs
- FR-6.4: The setup scripts run in a safe, non-destructive manner, prompting for confirmation before modifying the system or installing tools

### FR-7: OS GUI / Desktop Shell Simulator
- FR-7.1: The UI must present a simulated desktop environment with a customizable desktop wallpaper background
- FR-7.2: Provide a taskbar at the bottom of the screen containing an App Launcher (Start Menu), a list of open application windows, and system status indicators (clock, connectivity)
- FR-7.3: The App Launcher allows launching individual tools (Chat, Settings, File Explorer) inside separate window frames
- FR-7.4: Each window frame must support dragging by its title bar, resizing from corners/edges, minimizing to the taskbar, maximizing, and closing
- FR-7.5: Windows must stack correctly, with the active/focused window dynamically gaining the highest z-index

### FR-8: System-wide Copyright & Trademark Display
- FR-8.1: The desktop wallpaper area includes an immutable branding watermark overlay that displays: "ARGUS OS • © 2026 Jan Steve Daniel • All Rights Reserved"
- FR-8.2: The App Launcher (Start Menu) must include a prominent "About ARGUS" utility
- FR-8.3: The "About ARGUS" window displays the full copyright statement, proprietary license details, trademark assertions, and platform build version
- FR-8.4: Trademark and copyright metadata are embedded in the compiled application bundle info (Tauri Info plist / Windows Version Resource) to secure host-level trademark visibility




## Non-Functional Requirements

### NFR-1: Performance
- NFR-1.1: Application startup time < 3 seconds on a modern machine
- NFR-1.2: First token latency for streaming responses < 2 seconds (remote) or < 5 seconds (local, model-dependent)
- NFR-1.3: UI remains responsive during AI inference

### NFR-2: Usability
- NFR-2.1: The application is usable without reading documentation
- NFR-2.2: Error messages are human-readable and actionable
- NFR-2.3: The UI follows platform-native conventions where possible

### NFR-3: Portability
- NFR-3.1: Runs on macOS (Apple Silicon and Intel)
- NFR-3.2: Runs on Linux (x86_64)
- NFR-3.3: Runs on Windows (x86_64)
- NFR-3.4: No platform-specific code in the core logic

## Reliability Requirements

- REL-1: Application does not crash when a provider is unreachable
- REL-2: Application does not crash when Ollama is not installed
- REL-3: Application recovers gracefully from network errors during streaming
- REL-4: Application handles malformed API responses without crashing
- REL-5: Application does not silently fall back from local to remote providers

## Security Requirements

- SEC-1: API keys are never committed to version control
- SEC-2: API keys are stored using OS-level credential storage where available
- SEC-3: The application does not make network requests that the user did not initiate
- SEC-4: The application does not send telemetry or analytics
- SEC-5: Dependencies are audited for known vulnerabilities in CI
- SEC-6: No secrets appear in logs

## Developer Experience Requirements

- DX-1: A new developer can set up the project from README instructions in < 15 minutes
- DX-2: All tests can be run with a single command
- DX-3: Linting and formatting are automated and enforced in CI
- DX-4: The project uses conventional commit messages
- DX-5: The development server supports hot-reload

## Documentation Requirements

- DOC-1: README explains what the project is, how to set it up, and how to run it
- DOC-2: Architecture decisions are documented with rationale
- DOC-3: API contracts between components are documented
- DOC-4: A contribution guide exists
- DOC-5: A changelog is maintained

## Demo Requirements

- DEMO-1: A demo can be recorded showing the core chat workflow
- DEMO-2: The demo shows both local and remote provider modes
- DEMO-3: The demo shows provider switching
- DEMO-4: The demo runs entirely on the presenter's machine (no cloud dependencies for local mode)
