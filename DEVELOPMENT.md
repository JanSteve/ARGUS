# ARGUS — Development Guide

## Prerequisites

- **Node.js** 22+ (LTS)
- **Rust** (latest stable) — required by Tauri
- **Git** 2.x+
- **Platform-specific:**
  - macOS: Xcode Command Line Tools
  - Linux: `build-essential`, `libwebkit2gtk-4.1-dev`, `libssl-dev`, `libayatana-appindicator3-dev`
  - Windows: Microsoft Visual Studio C++ Build Tools, WebView2

> **Note:** If the final stack decision changes from Tauri to Electron, the Rust prerequisite will be removed and replaced with additional Node.js requirements.

## Repository Structure (Planned)

```
argus/
├── src-tauri/              # Tauri backend (Rust)
│   ├── src/
│   │   └── main.rs         # Application entry point
│   ├── Cargo.toml
│   └── tauri.conf.json     # Tauri configuration
├── src/                    # Frontend (React + TypeScript)
│   ├── components/         # Reusable UI components
│   ├── views/              # Page-level views
│   ├── services/           # API/provider communication
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # State management
│   └── __tests__/          # Frontend tests
├── src-backend/            # Backend services (TypeScript)
│   ├── providers/          # AI provider implementations
│   ├── config/             # Configuration management
│   └── __tests__/          # Backend tests
├── docs/                   # Documentation
├── .github/workflows/      # CI/CD
├── package.json
└── vite.config.ts
```

> This structure is preliminary and will be finalized in Phase 1.

## Development Workflow

1. **Branch from `main`** for all changes
2. **Use conventional commits:** `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
3. **Open a PR** for review before merging
4. **CI must pass** before merge

## Branching Strategy

- `main` — stable, always green
- `feat/<name>` — feature branches
- `fix/<name>` — bug fix branches
- `docs/<name>` — documentation branches

No long-lived branches other than `main`.

## Testing

### Frontend Tests
```bash
npm test              # Run all frontend tests
npm run test:watch    # Run in watch mode
```

### Integration Tests (when applicable)
```bash
npm run test:e2e
```

All tests must pass before merging to `main`.

## Linting & Formatting

```bash
npm run lint          # Run linter
npm run format        # Auto-format code
npm run format:check  # Check formatting without modifying
```

Linting and formatting are enforced in CI. The specific tools will be determined when the stack is finalized.

## Environment Variables

ARGUS uses environment variables for development configuration. A `.env.example` file documents all available variables.

```bash
cp .env.example .env
# Edit .env with your values
```

**Never commit `.env` files.** The `.gitignore` excludes them.

## Secret Handling

- API keys are configured through the application UI or environment variables
- In production, ARGUS will use OS-level credential storage (Keychain on macOS, credential manager on Windows/Linux)
- During development, environment variables or a local `.env` file are acceptable
- **No secrets in source code, logs, or error messages**

## Local Development

To set up the development environment, check system prerequisites, install dependencies, and launch ARGUS, run the single-command setup script:

**macOS/Linux:**
```bash
chmod +x setup.sh && ./setup.sh
```

**Windows:**
```powershell
.\setup.ps1
```

The script will validate your Node.js, Rust, and Ollama installation, guide you through any missing requirements, run `npm install`, and prepare the workspace.

Once setup is complete, use the standard commands:

```bash
# Start development server (with hot-reload)
npm run dev

# Build for production
npm run build
```


## CI/CD Expectations

- Every push to `main` and every PR triggers CI
- CI runs: lint, format check, tests, build
- CI runs on Ubuntu (Linux), macOS, and Windows
- Security scan checks for committed secrets
- Dependency audit checks for known vulnerabilities

## Release Workflow

1. All tests pass on `main`
2. Version is bumped according to semver
3. Changelog is updated
4. A git tag is created
5. CI builds platform-specific installers
6. Installers are published as GitHub Release assets

> Release automation will be configured in a later phase.
