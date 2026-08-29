# 🛡️ ARGUS 2.0 — Threat Model & Security Specification

This document details the threat actors, attack surfaces, threat vectors, mitigations, residual risks, and automated validation tests for **ARGUS 2.0**.

---

## 🎯 Threat Actors & Scenarios

1. **Compromised AI Model / Untrusted Agent:** Model producing malicious tool invocations, attempting host escape or data theft.
2. **Adversarial User / Prompt Injector:** External inputs designed to trick the agent into bypassing ARGUS security policies.
3. **Malicious Dependency / Poisoned Tool:** A third-party script or package attempting privilege escalation or credential exfiltration.

---

## 🔒 Threat Matrix & Defense Architecture

| Threat # | Threat Vector | Attack Surface | ARGUS Defense Mechanism | Residual Risk | Automated Test |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **T-01** | **Path Traversal Escape** | Filesystem API (`filesystem.*`) | Canonical path resolution (`fs.realpathSync`), relative jail calculation, rejection of `../`. | Symlink race before open (mitigated by O_NOFOLLOW in native backend). | `argus security-test #4` |
| **T-02** | **Credential Harvesting** | Filesystem Read (`filesystem.read`) | Explicit deny list blocking `/etc/shadow`, `/etc/passwd`, `~/.ssh/id_*`, `.env`, `.aws`, `.git/config`. | Non-standard secret file paths (mitigated by workspace jail). | `argus security-test #2, #3` |
| **T-03** | **Dangerous Root Commands** | Process Execution (`process.exec`) | Command tokenization & blackshield blocking `sudo`, `su`, `rm -rf /`, `chmod 777`, `mkfs`, `dd`. | Obfuscated shell encoding (mitigated by direct binary execution without subshell). | `argus security-test #5` |
| **T-04** | **Fork Bomb / DoS** | Subprocess Spawning (`process.exec`) | Syntax interception of `:(){ :|:& };:` + process timeout + buffer limits. | High-CPU tight loops (terminated by execution timeout). | `argus security-test #7` |
| **T-05** | **Cloud Metadata SSRF** | Network Egress (`network.fetch`) | Rejection of `169.254.169.254`, `localhost`, `127.0.0.1`, and private subnets (`10.0.0.0/8`, `192.168.0.0/16`). | DNS rebinding to internal IP (mitigated by pre-flight DNS resolution). | `argus security-test #8` |
| **T-06** | **Prompt Injection Override** | Natural Language Input | Pattern inspection for `"ignore policy"`, `"bypass argus"`, `"reveal master key"`. | Novel semantic evasion (mitigated because policy checks are programmatic, not LLM-dependent). | `argus security-test #6` |
| **T-07** | **Hallucinated Execution Claims** | Task Completion Reports | Independent Verifier checks actual file existence, byte size > 0, and SHA-256 signatures before verification. | Low (zero-trust cryptographic verification). | `argus security-test #1, #10` |
| **T-08** | **Capability Escalation** | Agent Capability Token | Cryptographically signed capability tokens; agents cannot issue or expand their own permissions. | Token theft if daemon memory is compromised. | `argus security-test #14` |
| **T-09** | **Unauthorized Network Exfiltration** | Network Connect (`network.connect`) | Default-deny network policy; agents must declare whitelisted domains; human gate for untrusted URLs. | Approved domains hosting user-generated uploads. | `argus security-test #12` |
| **T-10** | **Audit Log Tampering** | Flight Recorder Logs | Append-only immutable JSON session traces stored outside agent workspace. | Root filesystem compromise. | `argus security-test #10` |

---

## 🚫 Non-Negotiable Security Invariants

1. **Policy is Deterministic:** The AI never decides whether an action is safe. The **ARGUS Agent Policy Engine** evaluates rules programmatically in code.
2. **The AI Cannot Grant Capabilities:** Capability tokens are issued strictly by the host operator or policy engine.
3. **No Blind Trust:** AI claims of success must be independently verified by the **Verification Engine**.
4. **No Root Commands:** ARGUS never executes arbitrary agent-generated commands under `sudo` or as `root`.
