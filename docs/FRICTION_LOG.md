# Amazon Developer Hackathon: Developer Friction Log & Enhancement Proposals

**Project:** ARGUS (Autonomous Voice-Native Linux Agent Daemon & Alexa+ MCP Server)  
**Track:** Alexa+ (Self-Hosted Model Context Protocol MCP Server)  
**Author:** R Jan Steve Daniel  
**Repository:** https://github.com/JanSteve/ARGUS  

---

## Friction Entry 1: Streamable HTTP SSE Session Resumption Under Intermittent Connection

* **Specific Task Attempted:**  
  Streaming real-time agent execution telemetry and continuous speech token synthesis over Streamable HTTP (Server-Sent Events) from a self-hosted Model Context Protocol (MCP) daemon to an Alexa+ client simulator.
* **Steps Taken:**  
  1. Configured an SSE endpoint conforming to the MCP 2025-11-25+ draft specification.
  2. Dispatched a long-running system remediation task (scanning system ports, verifying socket ownership, killing stuck daemon, and restarting process).
  3. Simulated a network hiccup or client disconnect during streaming execution.
* **Expected Result:**  
  The Alexa+ client automatically reconnects using standard `Last-Event-ID` or an MCP session token, smoothly resuming the streaming response without task termination or socket lock.
* **Actual Result:**  
  The broken TCP pipe raised an unhandled `BrokenPipeError` in the transport layer. Because MCP does not currently mandate an idempotency handshake or stateful session replay buffer, the daemon was unable to determine whether the client received earlier diagnostic chunks, leaving the sub-process orphaned.
* **Severity Rating:** **Medium** (affects operational reliability in production network conditions).
* **Workaround Implemented:**  
  Engineered a custom heartbeat watchdog inside `argusd` that buffers the last 64 stream events in memory and auto-cleans child tasks if an SSE connection is severed without reconnection within 5,000ms.
* **Actionable Suggestion / Feature Request:**  
  Add an explicit `session_id` and `event_sequence_ack` handshake directly into the Alexa+ MCP Streamable HTTP transport standard, allowing agents to checkpoint and resume in-flight tool streams seamlessly.

---

## Friction Entry 2: Absence of Operating System Sandboxing Primitives in MCP Tool Schemas

* **Specific Task Attempted:**  
  Exposing mutating system tools (e.g. killing blocking processes, modifying network firewall rules) alongside read-only inspection tools (`system_doctor`, `read_sysinfo`) to the Alexa+ agentic planner.
* **Steps Taken:**  
  1. Defined tool definitions in JSON-RPC 2.0 schema for both query and mutation tools.
  2. Passed tools to the agent orchestrator for autonomous tool selection and execution.
* **Expected Result:**  
  The tool schema standard provides built-in attributes (such as `permission_level`, `requires_user_confirmation`, or `sandbox_mode`) that upstream Alexa+ orchestrators can parse to enforce security boundaries.
* **Actual Result:**  
  The MCP specification only defines input parameter schemas (`type: object`, `properties: ...`). There is no standard metadata field declaring tool danger levels, execution boundaries, or capability tokens.
* **Severity Rating:** **High** for developer system agents (creates risk of destructive command injection if prompt injection occurs).
* **Workaround Implemented:**  
  Built an out-of-band security governance layer inside `argus-linux` and `argus-sandbox` enforcing Linux Landlock LSM, seccomp-bpf, and cryptographic HMAC capability tokens to validate all mutating commands prior to kernel syscall dispatch.
* **Actionable Suggestion / Feature Request:**  
  Extend the MCP Tool Specification with an optional `security_context` object:
  ```json
  {
    "name": "remediate_port",
    "security_context": {
      "mutation": true,
      "required_capabilities": ["CAP_NET_BIND_SERVICE"],
      "requires_confirmation": false,
      "isolation_level": "sandboxed"
    }
  }
  ```

---

## Friction Entry 3: Gated Alexa+ Developer CLI Simulator Tooling

* **Specific Task Attempted:**  
  Testing end-to-end intent matching and voice audio turnaround using the official Alexa+ CLI simulator.
* **Steps Taken:**  
  Attempted to download and authenticate with the official Alexa+ Developer CLI tools mentioned in documentation.
* **Expected Result:**  
  Direct access to a local CLI test runner or emulator for developers building self-hosted MCP servers.
* **Actual Result:**  
  Tools were gated behind private preview partner allowlists, requiring manual sign-up and approval delays.
* **Severity Rating:** **Low / Developer Ergonomics**.
* **Workaround Implemented:**  
  Built our own mock client testbed in TypeScript and Python (`tests/test_gnani_integrity.py` and web SSE harness) that replays Alexa+ JSON-RPC envelopes against the MCP server.
* **Actionable Suggestion / Feature Request:**  
  Provide an unauthenticated, containerized (Docker) mock server that simulates Alexa+'s voice orchestrator, allowing developers to test their MCP servers locally in under 5 minutes from "zero to hello world".
