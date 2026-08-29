# 🌌 ARGUS 2.0 — Sovereign AI Agent & Governance Layer for Linux

<div align="center">

[![Release](https://img.shields.io/github/v/release/JanSteve/ARGUS?color=06b6d4&label=Release&style=for-the-badge)](https://github.com/JanSteve/ARGUS/releases/latest)
[![Security Suite](https://img.shields.io/badge/Security%20Validation-100%25%20PASS%20(10%2F10)-10b981?style=for-the-badge&logo=shield)](https://github.com/JanSteve/ARGUS)
[![Live Demo](https://img.shields.io/badge/Live%20Web%20OS-Vercel%20Preview-8b5cf6?style=for-the-badge&logo=vercel)](https://argus-sovereign-os-website.vercel.app/os/)
[![Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-blue?style=for-the-badge&logo=linux)](https://argus-sovereign-os-website.vercel.app/)
[![License](https://img.shields.io/badge/License-Source--Available-green?style=for-the-badge)](LICENSE)

### **"ARGUS does not replace Linux. It makes Linux agent-native."**
*A sovereign execution runtime, zero-trust policy kernel, and verification framework that empowers AI agents to operate computers safely.*

[🌐 Marketing Portal](https://argus-sovereign-os-website.vercel.app/) • [📱 Interactive Web Client](https://argus-sovereign-os-website.vercel.app/os/) • [🏛️ Architecture Specification](ARCHITECTURE.md) • [💼 Pitch Deck](docs/startup/PITCH_DECK.md)

</div>

---

## ⚡ The Central Thesis

Instead of trying to recreate 30 years of operating system engineering from scratch, **ARGUS leverages the mature power of Linux** (kernel, namespaces, cgroups, seccomp, drivers, GPU acceleration, and filesystems) and provides the critical missing tier for the intelligence era:

> **How should an AI agent be allowed to operate a computer?**

```text
                 ARGUS SOVEREIGN LAYER
      ┌─────────────────────────────────────────┐
      │ AI Agent Runtime & DAG Planner          │
      │ Mission Control & Agent Swarm           │
      │ Tool Fabric (FS, Shell, Web, Vault)     │
      │ Zero-Trust Policy Kernel (Firewall)     │
      │ Permission Engine & Capability Tokens   │
      │ Independent Cryptographic Verifier      │
      │ 3-Tier Encrypted Memory (AES-256-GCM)   │
      │ Black-Box Flight Recorder               │
      │ Developer SDK (@argus/sdk)              │
      └────────────────────┬────────────────────┘
                           │
                     Linux Platform
      ┌────────────────────┴────────────────────┐
      │ Kernel, cgroups, namespaces, seccomp    │
      │ POSIX Filesystem & Workspace Sandbox    │
      │ Networking & Packet Filters             │
      │ GPU Acceleration (CUDA / ROCm / Vulkan) │
      │ Device Drivers & Hardware Bridge        │
      └─────────────────────────────────────────┘
```

---

## 🔄 Real Execution Pipeline

```text
                    ARGUS 2.0
                        │
                  User Objective
                        ↓
                   AI Planner
                        ↓
                Capability Request
                        ↓
              🛡️ ARGUS Policy Kernel
                  ↙          ↘
               ALLOW         DENY
                 ↓             ↓
          Linux Sandbox     Evidence
                 ↓
          Real Execution
                 ↓
            Verification
                 ↓
          Flight Recorder
```

---

## 🧪 Security Validation Suite (100% PASS)

Run the real automated security and adversarial suite directly on any machine:

```bash
npm run test:security
```

```text
================================================================================
               ARGUS 2.0 LINUX NATIVE CORE SECURITY TEST SUITE                 
================================================================================
Workspace Sandbox Jail: ./workspace_test

[PASS] #1 [Filesystem] Milestone 1: Allowed Workspace Write & Verification ('hello.txt')
[PASS] #2 [Adversarial Attack] Attempt to read '/etc/shadow' -> BLOCKED
[PASS] #3 [Adversarial Attack] Attempt to read SSH Key '~/.ssh/id_ed25519' -> BLOCKED
[PASS] #4 [Security Firewall] Path Traversal '../../outside/secret_data.txt' -> BLOCKED
[PASS] #5 [Security Firewall] Dangerous Command 'sudo rm -rf /' -> BLOCKED
[PASS] #6 [Adversarial Attack] Prompt Injection / Security Policy Override -> BLOCKED
[PASS] #7 [Security Firewall] Fork Bomb Execution ':(){ :|:& };:' -> BLOCKED
[PASS] #8 [Security Firewall] SSRF Cloud Metadata Endpoint Access -> BLOCKED
[PASS] #9 [Filesystem] Sandbox Process Execution: 'echo ARGUS 2.0 Linux Core Active'
[PASS] #10 [Telemetry] Black-Box Flight Recorder: Verifiable JSON Execution Trace

STATUS: VERIFIED SOVEREIGN EXECUTION CORE (10/10 PASS)
================================================================================
```

---

## 🗺️ Evolutionary Development Roadmap

```text
Existing Linux (Ubuntu/Debian/Fedora) ➔ ARGUS Runtime ➔ ARGUS Desktop ➔ ARGUS Linux ISO Distribution
```

1. **Phase A — Linux Core & Policy Engine:** Zero-Trust Policy Kernel, Sandbox Jail, Independent Verifier, Flight Recorder. *(Complete ✓)*
2. **Phase B — Autonomous Agents:** Developer, Research, Security, and Business Swarm.
3. **Phase C — Sovereign Memory:** 3-Tier working, episodic, and semantic memory enclaves.
4. **Phase D — Desktop Client:** Mission Control, Code Studio, Browser, Terminal, and Telemetry as clients of the runtime.
5. **Phase E — ARGUS Linux ISO:** Turnkey bootable operating system with hardened agent-native kernel defaults.

---

## 📄 License & Attribution

ARGUS is source-available under the [ARGUS Sovereign Software License](LICENSE).  
Created by **R Jan Steve Daniel** (2026).
