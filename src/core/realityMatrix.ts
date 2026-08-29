/**
 * ARGUS 2.0 Reality Matrix Introspector
 * 
 * Exposes honest capability status: REAL, PARTIAL, SIMULATED, DEMO_ONLY, PLANNED.
 */

export type RealityStatus = "REAL" | "PARTIAL" | "SIMULATED" | "DEMO_ONLY" | "PLANNED";

export interface SubsystemReality {
  name: string;
  category: string;
  status: RealityStatus;
  mechanism: string;
  verifiedBy: string;
}

export const REALITY_CAPABILITIES: SubsystemReality[] = [
  {
    name: "Workspace Jail Enclosure",
    category: "Filesystem",
    status: "REAL",
    mechanism: "Strict canonical path resolution (fs.realpathSync / path.normalize). Rejects '../' traversals.",
    verifiedBy: "argus security-test #1, #4",
  },
  {
    name: "Sensitive Credential Shield",
    category: "Security",
    status: "REAL",
    mechanism: "Path interceptor blocking /etc/shadow, /etc/passwd, ~/.ssh/id_*, .env, .aws.",
    verifiedBy: "argus security-test #2, #3",
  },
  {
    name: "Command & Binary Blackshield",
    category: "Security",
    status: "REAL",
    mechanism: "Command tokenization blocking sudo, rm -rf /, chmod 777, mkfs, fork bombs.",
    verifiedBy: "argus security-test #5, #7",
  },
  {
    name: "Adversarial Injection Defense",
    category: "Security",
    status: "REAL",
    mechanism: "Programmatic regex & signature filtering of prompt policy override directives.",
    verifiedBy: "argus security-test #6",
  },
  {
    name: "SSRF & Metadata Egress Shield",
    category: "Network",
    status: "REAL",
    mechanism: "Blocks access to 169.254.169.254, loopback (127.0.0.1), and private subnets.",
    verifiedBy: "argus security-test #8",
  },
  {
    name: "Independent Cryptographic Verifier",
    category: "Verification",
    status: "REAL",
    mechanism: "Calculates SHA-256 signatures, byte-level file assertions, and existence verification on disk.",
    verifiedBy: "argus security-test #1, #10",
  },
  {
    name: "Black-Box Flight Recorder",
    category: "Telemetry",
    status: "REAL",
    mechanism: "Immutable JSON session traces storing every capability, policy rule, and execution outcome.",
    verifiedBy: "argus audit / argus replay",
  },
  {
    name: "Autonomous Developer Agent",
    category: "Agent Engine",
    status: "REAL",
    mechanism: "Full-cycle repository diagnosis, real file patching on disk, test execution, and evidence compilation.",
    verifiedBy: "argus mission run",
  },
  {
    name: "Host Process Execution & Limits",
    category: "Execution",
    status: "REAL",
    mechanism: "Real POSIX subprocess execution with timeout and buffer constraints.",
    verifiedBy: "argus run",
  },
  {
    name: "Local AI Inference (Ollama)",
    category: "AI",
    status: "REAL",
    mechanism: "Direct HTTP interface to Ollama local daemon (127.0.0.1:11434).",
    verifiedBy: "argus models",
  },
  {
    name: "Human Approval Gate",
    category: "Governance",
    status: "REAL",
    mechanism: "Explicit clearance barrier for high-risk operations (file deletion, network access).",
    verifiedBy: "argus approve / argus deny",
  },
  {
    name: "Linux Namespaces (unshare)",
    category: "Isolation",
    status: "PARTIAL",
    mechanism: "Workspace jail active; kernel CLONE_NEWPID / CLONE_NEWNET active on Linux hosts.",
    verifiedBy: "argus doctor",
  },
  {
    name: "Linux Seccomp Filter",
    category: "Isolation",
    status: "PARTIAL",
    mechanism: "System call restrictions active where supported by host kernel; subprocess policy on non-Linux.",
    verifiedBy: "argus doctor",
  },
  {
    name: "Linux Cgroups Resource Limits",
    category: "Isolation",
    status: "PARTIAL",
    mechanism: "Execution timeouts active; kernel cgroups v2 limits configured for daemon deployment.",
    verifiedBy: "argus doctor",
  },
  {
    name: "Landlock LSM Sandbox",
    category: "Isolation",
    status: "PLANNED",
    mechanism: "Linux 5.13+ unprivileged filesystem confinement ruleset in development.",
    verifiedBy: "Roadmap Phase 6",
  },
  {
    name: "Host-Wide System Rollback",
    category: "Recovery",
    status: "PLANNED",
    mechanism: "Workspace-level rollback is REAL; full host-wide filesystem rollback requires Btrfs/ZFS snapshots.",
    verifiedBy: "Roadmap Phase 16",
  },
];

export function formatRealityMatrix(): string {
  const lines: string[] = [];
  lines.push("\n\x1b[36m========================================================================================================\x1b[0m");
  lines.push("\x1b[36m                                  ARGUS 2.0 CAPABILITY REALITY MATRIX                                   \x1b[0m");
  lines.push("\x1b[36m========================================================================================================\x1b[0m");
  lines.push(
    ` ${"CAPABILITY / SUBSYSTEM".padEnd(38)} | ${"STATUS".padEnd(9)} | ${"MECHANISM".padEnd(46)}`
  );
  lines.push("--------------------------------------------------------------------------------------------------------");

  for (const cap of REALITY_CAPABILITIES) {
    const statusColor =
      cap.status === "REAL"
        ? "\x1b[32mREAL     \x1b[0m"
        : cap.status === "PARTIAL"
        ? "\x1b[33mPARTIAL  \x1b[0m"
        : cap.status === "PLANNED"
        ? "\x1b[34mPLANNED  \x1b[0m"
        : "\x1b[31m" + cap.status.padEnd(9) + "\x1b[0m";

    lines.push(
      ` ${cap.name.padEnd(38)} | ${statusColor} | ${cap.mechanism.slice(0, 46).padEnd(46)}`
    );
  }

  lines.push("\x1b[36m========================================================================================================\x1b[0m\n");
  return lines.join("\n");
}
