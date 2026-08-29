/**
 * ARGUS Capability Registry & Reality Matrix
 * 
 * Provides an uncompromising, empirical status for every capability in the system.
 * Prevents marketing exaggeration and distinguishes genuine execution from prototypes.
 * 
 * Status Categories:
 * - REAL: Genuinely executed, state persisted, cryptographic or network verified.
 * - PARTIAL: Partially functional, combines real primitives with fallback logic.
 * - SIMULATED: Virtualized in memory/JavaScript without native OS kernel integration.
 * - DEMO_ONLY: Sample seeded data used strictly for interface demonstration.
 * - PLANNED: Architected roadmap items not yet wired to runtime.
 */

export type CapabilityStatus = "REAL" | "PARTIAL" | "SIMULATED" | "DEMO_ONLY" | "PLANNED";

export interface CapabilityRecord {
  id: string;
  name: string;
  category: "INFERENCE" | "SECURITY" | "EXECUTION" | "MEMORY" | "ORCHESTRATION" | "OBSERVABILITY";
  status: CapabilityStatus;
  description: string;
  runtimeBoundary: "WebCrypto/Browser" | "Ollama/LocalREST" | "TypeScript/PolicyGateway" | "NativeTauri/Rust" | "CloudAPI";
  evidenceProof: string;
}

export const CAPABILITY_REGISTRY: CapabilityRecord[] = [
  {
    id: "cap-ollama-local",
    name: "Local Offline Ollama Inference",
    category: "INFERENCE",
    status: "REAL",
    description: "Direct HTTP streaming to local Ollama instance (12+ tested architectures) with AbortController.",
    runtimeBoundary: "Ollama/LocalREST",
    evidenceProof: "Verified via http://localhost:11434/api/tags model discovery.",
  },
  {
    id: "cap-crypto-memory",
    name: "AES-256-GCM Memory Enclave",
    category: "MEMORY",
    status: "REAL",
    description: "3-tier memory encrypted at rest using Web Crypto AES-GCM (256-bit key, 96-bit IV) and PBKDF2 (100k rounds).",
    runtimeBoundary: "WebCrypto/Browser",
    evidenceProof: "Verified via crypto.subtle.encrypt / decrypt roundtrips.",
  },
  {
    id: "cap-permission-gateway",
    name: "Application-Level Permission Gateway",
    category: "SECURITY",
    status: "REAL",
    description: "Async execution pauses requiring human approval for high/critical risk tool calls.",
    runtimeBoundary: "TypeScript/PolicyGateway",
    evidenceProof: "Verified via PermissionModal dispatch and state locks.",
  },
  {
    id: "cap-firewall-dlp",
    name: "AI Agent Firewall & DLP Classifier",
    category: "SECURITY",
    status: "REAL",
    description: "Real-time regex checking and path canonicalization blocking sensitive files (.env, ~/.ssh).",
    runtimeBoundary: "TypeScript/PolicyGateway",
    evidenceProof: "Verified via M18 Benchmark Suite Test 02 & 04 passes.",
  },
  {
    id: "cap-real-notes",
    name: "Persistent Notes & Workspace Storage",
    category: "EXECUTION",
    status: "REAL",
    description: "Sandboxed workspace storage with canonical path checking and persistent state.",
    runtimeBoundary: "WebCrypto/Browser",
    evidenceProof: "Verified by reading and writing files in argus://workspace/.",
  },
  {
    id: "cap-web-research",
    name: "Public Market & Wikipedia Research",
    category: "EXECUTION",
    status: "REAL",
    description: "Real-time read-only web research using Wikipedia REST API and public gateways.",
    runtimeBoundary: "CloudAPI",
    evidenceProof: "Verified live HTTP response payloads from api.wikimedia.org.",
  },
  {
    id: "cap-independent-verifier",
    name: "Independent Verification Engine",
    category: "OBSERVABILITY",
    status: "REAL",
    description: "Validates physical file presence, size > 0, checksums, and rejects hallucinated claims.",
    runtimeBoundary: "TypeScript/PolicyGateway",
    evidenceProof: "Verified by M18 Benchmark Test 06 hallucination trap.",
  },
  {
    id: "cap-flight-recorder",
    name: "AI Flight Recorder Black Box",
    category: "OBSERVABILITY",
    status: "PARTIAL",
    description: "Live 18-event telemetry recording with frame-by-frame scrub replayer.",
    runtimeBoundary: "TypeScript/PolicyGateway",
    evidenceProof: "Subscribed to RuntimeEvents bus.",
  },
  {
    id: "cap-crm-provenance",
    name: "Sovereign CRM Pipeline with Provenance",
    category: "EXECUTION",
    status: "PARTIAL",
    description: "Lead tracking engine with ICP scoring and explicit separation of demo vs real leads.",
    runtimeBoundary: "WebCrypto/Browser",
    evidenceProof: "Stored in localStorage with source and confidence metadata.",
  },
  {
    id: "cap-terminal-pty",
    name: "Terminal Shell Environment",
    category: "EXECUTION",
    status: "SIMULATED",
    description: "JavaScript-based command parser with allowlisted commands; not an unrestricted host PTY.",
    runtimeBoundary: "TypeScript/PolicyGateway",
    evidenceProof: "Emulated in terminal state machine.",
  },
  {
    id: "cap-threat-radar",
    name: "Cyber Globe & Threat Telemetry Radar",
    category: "OBSERVABILITY",
    status: "SIMULATED",
    description: "Visual security telemetry radar utilizing static threat feeds and synthetic activity.",
    runtimeBoundary: "WebCrypto/Browser",
    evidenceProof: "Curated dataset visualization.",
  },
  {
    id: "cap-crm-demo-leads",
    name: "Initial Seeded SaaS Leads",
    category: "EXECUTION",
    status: "DEMO_ONLY",
    description: "Sample company profiles (Postman, Razorpay, etc.) used for first-run demonstration.",
    runtimeBoundary: "TypeScript/PolicyGateway",
    evidenceProof: "Marked explicitly with DEMO_ONLY status.",
  },
  {
    id: "cap-social-autopublish",
    name: "Autonomous Social Media Auto-Publishing",
    category: "EXECUTION",
    status: "PLANNED",
    description: "Direct API dispatch to LinkedIn/X (currently held at Human Approval Gate to prevent bans).",
    runtimeBoundary: "CloudAPI",
    evidenceProof: "Held at Human Gate (Zero automated DMs).",
  },
  {
    id: "cap-native-ebpf-kernel",
    name: "Native OS Kernel / eBPF Driver",
    category: "SECURITY",
    status: "PLANNED",
    description: "Kernel-level driver for host-level OS process containment (future C/Rust extension).",
    runtimeBoundary: "NativeTauri/Rust",
    evidenceProof: "Current boundary is Application-Level Policy Gateway.",
  },
];

export class CapabilityRegistryService {
  public static getAll(): CapabilityRecord[] {
    return CAPABILITY_REGISTRY;
  }

  public static getByStatus(status: CapabilityStatus): CapabilityRecord[] {
    return CAPABILITY_REGISTRY.filter((c) => c.status === status);
  }

  public static getSummary(): { real: number; partial: number; simulated: number; demo: number; planned: number } {
    return {
      real: CAPABILITY_REGISTRY.filter((c) => c.status === "REAL").length,
      partial: CAPABILITY_REGISTRY.filter((c) => c.status === "PARTIAL").length,
      simulated: CAPABILITY_REGISTRY.filter((c) => c.status === "SIMULATED").length,
      demo: CAPABILITY_REGISTRY.filter((c) => c.status === "DEMO_ONLY").length,
      planned: CAPABILITY_REGISTRY.filter((c) => c.status === "PLANNED").length,
    };
  }
}
