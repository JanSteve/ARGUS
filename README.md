# ARGUS

**A local-first, privacy-focused AI operating environment.**

> ⚠️ **Status: Architecture & Planning Phase** — This project is currently in the planning stage. No application code has been written yet. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for details.

---

## What Is ARGUS?

ARGUS is a desktop application that provides a unified interface for interacting with AI models — both local and remote. It runs on your machine, keeps your data under your control, and makes the distinction between local and remote processing explicit.

### Key Principles

- **Local-first:** Run AI inference on your own hardware when you choose to
- **Privacy-aware:** Always know whether your data stays local or goes to the cloud
- **Provider-agnostic:** Switch between AI providers (Ollama, Groq, future providers) through a common interface
- **Cross-platform:** macOS, Linux, and Windows

### Planned Features (v1.0)

- Text chat with AI models (streaming responses)
- Local AI via Ollama
- Remote AI via Groq API
- Provider switching with clear local/remote indicators
- Conversation history
- Secure API key management

### Future Features

- Voice input/output (local ASR/TTS via VibeVoice)
- Document and file analysis
- Persistent AI memory
- Plugin/extension system

## Project Structure

```
argus/
├── PROJECT_OVERVIEW.md     # What ARGUS is and why
├── REQUIREMENTS.md         # Functional and non-functional requirements
├── ARCHITECTURE.md         # System design and component architecture
├── ROADMAP.md              # Development phases and milestones
├── DECISIONS.md            # Architecture Decision Records
├── DEVELOPMENT.md          # Development setup and workflow
├── PROJECT_STATUS.md       # Current state of the project
└── docs/                   # Extended documentation
    ├── architecture/       # Architecture deep dives
    ├── api/                # API contracts
    ├── guides/             # Developer and user guides
    └── decisions/          # Extended decision records
```

## Getting Started

To clone the repository, validate system dependencies (Node.js, Rust, Ollama), install node modules, and bootstrap the project in one command, run the following for your platform:

### macOS / Linux
```bash
git clone https://github.com/JanSteve/ARGUS.git && cd ARGUS && git checkout batman && chmod +x setup.sh && ./setup.sh
```

### Windows (PowerShell)
```powershell
git clone https://github.com/JanSteve/ARGUS.git; cd ARGUS; git checkout batman; .\setup.ps1
```

> **Note:** The `git checkout batman` step is only required during the active planning phase. Once Phase 1 is completed and merged, you will be able to run this directly from the `main` branch.


## Documentation

| Document | Description |
|:---|:---|
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Vision, objectives, and scope |
| [REQUIREMENTS.md](REQUIREMENTS.md) | What ARGUS must do |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How ARGUS is designed |
| [ROADMAP.md](ROADMAP.md) | Development phases |
| [DECISIONS.md](DECISIONS.md) | Why we chose what we chose |
| [DEVELOPMENT.md](DEVELOPMENT.md) | How to develop ARGUS |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Where we are now |

## Contributing

Contributions are welcome once the project reaches Phase 1. See [DEVELOPMENT.md](DEVELOPMENT.md) for the development workflow.

## License

Proprietary & Source-Available License. Copyright (c) 2026 Jan Steve Daniel. All rights reserved. 

This software is for personal evaluation, educational, and non-commercial development use only. Commercial redistribution, hosting as a service, or unauthorized resale of the software or its modifications is strictly prohibited. See the [LICENSE](LICENSE) file for the full legal terms.

## Security

If you discover a security vulnerability, please report it responsibly. Do not open a public issue. See [SECURITY.md](SECURITY.md) for details.

