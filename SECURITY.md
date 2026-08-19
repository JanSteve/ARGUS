# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in ARGUS, **please do not open a public issue.**

Instead, report it privately:

1. Email: *(to be configured)*
2. Or use GitHub's private vulnerability reporting feature on this repository

We will acknowledge receipt within 48 hours and provide an estimated timeline for a fix.

## Security Principles

ARGUS follows these security principles:

1. **No telemetry.** ARGUS does not send analytics, usage data, or crash reports to any server.
2. **No silent network requests.** ARGUS does not make network requests unless the user explicitly initiates an action (e.g., sending a chat message to a remote provider).
3. **Credential isolation.** API keys are stored using OS-level credential storage where available and are never logged, included in error messages, or committed to version control.
4. **Sandboxed UI.** The web UI runs in a sandboxed WebView with no direct access to the filesystem, network, or OS APIs.
5. **Minimal dependencies.** We minimize the dependency tree to reduce supply chain risk.
6. **CI security checks.** Every push is scanned for committed secrets and known dependency vulnerabilities.

## Scope

The following are in scope for security reports:

- API key exposure (in logs, error messages, network requests, or stored files)
- Silent fallback from local to remote providers
- Unauthorized network requests
- XSS or code injection in the WebView
- Path traversal or file access beyond intended scope
- Dependency vulnerabilities with a realistic attack vector

## Out of Scope

- Vulnerabilities in Ollama itself (report to the Ollama project)
- Vulnerabilities in third-party AI provider APIs
- Social engineering attacks
- Physical access attacks
