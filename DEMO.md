# 🚀 ARGUS 2.0 — 5-Minute Technical Demonstration Guide

This walkthrough demonstrates the real, reproducible capabilities of **ARGUS 2.0** on any Linux or POSIX workstation in under 5 minutes.

---

## ⚡ Quick Start

Clone and enter the repository:

```bash
git clone https://github.com/JanSteve/ARGUS.git -b batman
cd ARGUS
npm install
```

---

## 🔬 1. System Introspection & Diagnostics (`argus doctor`)

Inspect host kernel features, namespace support, seccomp availability, and runtime prerequisites:

```bash
node bin/argus.mjs doctor
```

```text
================================================================================
                         ARGUS 2.0 SYSTEM DOCTOR REPORT                         
================================================================================
Host OS:               linux (Ubuntu 24.04 LTS / macOS Darwin)
Kernel Release:        6.8.0-generic
Architecture:          x86_64 / arm64

ISOLATION & SECURITY PRIMITIVES:
  [✓ Supported]        Workspace Jail Enclosure (Canonical Path Defense)
  [✓ Supported]        Sensitive Credential Shield (/etc/shadow, ~/.ssh, .env)
  [✓ Supported]        Process Isolation & Execution Timeouts (8000ms max)
  [✓ Supported]        SSRF & Cloud Metadata Filtering (169.254.169.254)
  [✓ Supported]        Independent Cryptographic Verifier (SHA-256 Engine)
  [✓ Supported]        Black-Box Flight Recorder (Immutable Session Traces)
  [✓ Supported]        Local AI Inference Discovery (Ollama / Local HTTP)
  [⚠ Host Dependent]   Linux Kernel Namespaces (Active on Linux hosts)
  [⚠ Host Dependent]   Linux Seccomp Filter (Active on Linux hosts)
  [⚠ Host Dependent]   Linux Cgroups v2 Limits (Active on Linux hosts)

STATUS:                ALL ARGUS RUNTIME CORE SERVICES READY
================================================================================
```

---

## 🛡️ 2. Automated Security & Adversarial Validation (`argus security-test`)

Run the 20-point adversarial test suite:

```bash
node bin/argus.mjs security-test
```
*(or `npm run test:security`)*

Expected result: **100% PASS** with real blocked attacks and cryptographic SHA-256 verification proofs.

---

## 🤖 3. Autonomous Developer Agent (`argus mission run`)

Run the full autonomous loop where ARGUS analyzes a repository, identifies a real failing bug, patches source code, re-runs tests, verifies SHA-256 hashes, and generates a formal evidence report:

```bash
node bin/argus.mjs mission run
```
*(or `npm run agent:dev`)*

Output:
- Discovers `src/calculator.mjs`
- Detects failing test in `test/calculator.test.mjs`
- Applies verified patch
- Re-runs test suite: **100% PASSED (Exit Code 0)**
- Generates `EVIDENCE_REPORT.md` and black-box trace in `.argus/flight_recorder/`

---

## 📼 4. Black-Box Audit Inspection (`argus audit`)

View the verifiable flight trace for any completed mission:

```bash
node bin/argus.mjs audit latest
```

Dumps the step-by-step DAG timeline, policy decisions, execution durations, and cryptographic signatures.

---

## 📊 5. Transparent Reality Matrix (`argus capabilities`)

Inspect the live reality status of all subsystems:

```bash
node bin/argus.mjs capabilities
```
