# 🏛️ ARGUS 2.0 / 3.0 — Architecture Specification

> **"ARGUS does not replace Linux. ARGUS makes Linux agent-native."**

---

## ⚡ The Architectural Thesis

ARGUS is not a general-purpose operating system built from scratch. It is a **native Rust-first Agent Governance and Execution Runtime that makes AI agents controllable, auditable, and permission-bounded on Linux**.

Linux provides mature, world-class infrastructure — kernel, cgroups, namespaces, seccomp, filesystems, device drivers, GPU acceleration, and networking.

ARGUS provides the essential layer the modern AI era is missing:
> **How should an AI agent be allowed to operate a computer?**

---

## 🧱 The Native Systems Architecture

```text
                               ARGUS SYSTEM
      ┌─────────────────────────────────────────────────────────────┐
      │                  ARGUS Management Client                    │
      │        • TypeScript / React Web & Desktop Interface         │
      │        • Telemetry HUD, DAG Visualizer, Control Plane       │
      └──────────────────────────────┬──────────────────────────────┘
                                     │ (Unix Domain Socket IPC / RPC)
      ┌──────────────────────────────┴──────────────────────────────┐
      │             ARGUS Native Core (Rust: argusd)                │
      │  • Central Daemon & IPC Listener   • Capability Registry    │
      │  • Deterministic Policy Engine     • Sandbox Supervisor     │
      │  • Hardware SHA-256 Verifier       • Flight Recorder        │
      └──────────────┬──────────────────────────────┬───────────────┘
                     │                              │ (C ABI FFI)
                     │                 ┌────────────┴───────────────┐
                     │                 │   C++ Native Extensions    │
                     │                 │  • GPU Tensor Acceleration │
                     │                 │  • SIMD Hardware Engine    │
                     │                 └────────────────────────────┘
                     │ (Linux Syscalls / bwrap / unshare / cgroups / seccomp)
      ┌──────────────┴──────────────────────────────────────────────┐
      │                        Linux Platform                       │
      │  • Linux Kernel, Namespaces (PID/Mount/Net), cgroups v2     │
      │  • POSIX Filesystem Sandbox Jail & Subprocess Execution     │
      │  • Network Firewall & Packet Filtering                      │
      │  • GPU Drivers (CUDA / ROCm / Vulkan)                       │
      └─────────────────────────────────────────────────────────────┘
```

---

## 🔒 ARGUS Defence-in-Depth Architecture (10 Layers)

| Defense Layer | Subsystem | Language | Responsibility |
| :--- | :--- | :---: | :--- |
| **Layer 1: Identity** | `AgentIdentity` | Rust / TS | Unique `agent_id`, `session_id`, `mission_id`. No anonymous execution. |
| **Layer 2: Capability Tokens** | `CapabilityTokenManager` | Rust (`sha2`/`hmac`) | Cryptographically signed capability tokens bounding explicit actions. |
| **Layer 3: Path Security** | `PolicyEngine` | Rust (`canonicalize`) | Strict path resolution. Rejects `../`, symlinks, and directory escapes. |
| **Layer 4: Process Isolation** | `SandboxSupervisor` | Rust / POSIX | Subprocess isolation, clean environment variables, restricted execution scope. |
| **Layer 5: Resource Limits** | `SandboxSupervisor` | Rust / cgroups | Execution timeouts (8000ms max), buffer limits, CPU/memory confinement. |
| **Layer 6: Network Isolation** | `NetworkShield` | Rust / Policy | Deny-by-default network policy, explicit domain allowlist, SSRF metadata filtering. |
| **Layer 7: Secret Protection** | `CredentialShield` | Rust / Policy | Intercepts `/etc/shadow`, `~/.ssh/id_*`, `.env`, `.aws`, private certificates. |
| **Layer 8: Human Approval Gate** | `ApprovalGate` | Rust / Client | Explicit clearance barrier for high-risk operations (deletion, deployment). |
| **Layer 9: Independent Verification** | `Verifier` | Rust (`sha2`) | Cryptographic SHA-256 signatures, byte-level file assertions on disk. |
| **Layer 10: Immutable Evidence & Why**| `FlightRecorder` | Rust / SQLite | Black-box JSON traces + explainable telemetry (`argus why`, `argus audit`). |

---

## 🔬 Native Verification Commands

```bash
# 1. Run native Rust daemon diagnostics
cargo run --manifest-path crates/argusd/Cargo.toml -- doctor

# 2. Run native Rust security validation test suite
cargo run --manifest-path crates/argusd/Cargo.toml -- security-test

# 3. Run executive CLI diagnostics & 20-point Red Team matrix
node bin/argus.mjs doctor
node bin/argus.mjs security-test

# 4. Run Autonomous Developer Agent live DAG streaming mission
node bin/argus.mjs mission stream "Build calculator, test, patch, verify and report"
```
