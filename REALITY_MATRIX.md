# 🔍 ARGUS 2.0 — Reality Classification Matrix

> **"Never represent simulated functionality as production functionality. Never fake execution."**

ARGUS adheres to strict engineering honesty. Every feature and security mechanism in the codebase is categorized according to its actual implementation reality.

---

## 📊 Subsystem Reality Status

| Subsystem / Capability | Reality Status | Mechanism / Implementation Details | Verified By |
| :--- | :---: | :--- | :--- |
| **Workspace Jail Enclosure** | `REAL` | Strict canonical path resolution (`fs.realpathSync` / `path.normalize`). Rejects all `../` traversals outside `./workspace`. | `argus security-test` (#1, #4) |
| **Sensitive Credential Shield** | `REAL` | Pattern & exact path interceptor blocking `/etc/shadow`, `/etc/passwd`, `~/.ssh/id_*`, `.env`, `.aws`. | `argus security-test` (#2, #3) |
| **Command & Binary Blackshield** | `REAL` | AST & regex command filter blocking `sudo`, `rm -rf /`, `chmod 777`, `mkfs`, fork bombs, reverse shells. | `argus security-test` (#5, #7) |
| **Adversarial Prompt Injection Defense** | `REAL` | Heuristic and signature-based filtering of policy override directives. | `argus security-test` (#6) |
| **SSRF & Network Egress Shield** | `REAL` | Blocks access to `169.254.169.254`, loopback (`127.0.0.1`), and private subnets (`10.0.0.0/8`, `192.168.0.0/16`). | `argus security-test` (#8) |
| **Independent Cryptographic Verifier** | `REAL` | Computes SHA-256 signatures, byte-level file assertions, and existence verification on disk. | `argus security-test` (#1, #10) |
| **Black-Box Flight Recorder** | `REAL` | Immutable JSON session traces storing every capability request, policy decision, and execution result. | `argus audit` / `argus replay` |
| **Autonomous Developer Agent** | `REAL` | Full-cycle diagnosis, real file patching on disk, test execution, and evidence compilation. | `argus mission run` |
| **Host Process Execution & Timeout** | `REAL` | Real POSIX subprocess execution with timeout and buffer constraints. | `argus run` |
| **Local AI Inference (Ollama)** | `REAL` | Direct HTTP interface to Ollama local daemon (`127.0.0.1:11434`). | `argus models` |
| **Human-in-the-Loop Approval Gate** | `REAL` | Explicit clearance barrier for high-risk operations (file deletion, network access). | `argus approve` / `argus deny` |
| **Linux Namespaces (`unshare`)** | `PARTIAL` | Workspace jail active; kernel `CLONE_NEWPID` / `CLONE_NEWNET` namespaces implemented in native Linux helper. | `argus doctor` |
| **Linux Seccomp Filter** | `PARTIAL` | System call restrictions active where supported by host kernel; falls back to subprocess policy filter on non-Linux. | `argus doctor` |
| **Linux Cgroups Resource Limits** | `PARTIAL` | Execution timeouts and buffer limits active; kernel cgroups v2 memory/CPU limits configured for daemon deployment. | `argus doctor` |
| **Landlock LSM Sandbox** | `PLANNED` | Linux 5.13+ unprivileged filesystem confinement ruleset in development. | `argus doctor` |
| **Host-Wide System Rollback** | `PLANNED` | Workspace-level rollback is `REAL`; full host-wide filesystem rollback requires Btrfs/ZFS snapshot integration. | `argus doctor` |
| **ARGUS Desktop Reference UI** | `REAL` | React + TypeScript management interface and telemetry viewer. | Live Web OS |

---

## 🏷️ Classification Definitions

- **`REAL`**: Fully implemented with real host execution, automated tests, and cryptographic or system verification.
- **`PARTIAL`**: Core functionality works (e.g. workspace jail, timeout limits), with deeper kernel-level integration active when supported by the host.
- **`SIMULATED`**: Simulated for demonstration/prototyping purposes only. (ARGUS has **0** simulated execution capabilities).
- **`DEMO_ONLY`**: Fixed mock scenarios strictly for visual layout.
- **`PLANNED`**: In architecture roadmap, scheduled for upcoming release.
