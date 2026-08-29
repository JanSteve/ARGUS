/**
 * ARGUS 2.0 Identity & Capability Token System (Defense Layers 1 & 2)
 * 
 * Enforces:
 * 1. Agent Identity (No anonymous execution)
 * 2. Scoped Capability Tokens (Strict whitelist grants, no self-escalation)
 */

import crypto from "crypto";

export interface AgentIdentity {
  agentId: string;
  name: string;
  role: string;
  riskTier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  createdAt: string;
}

export interface CapabilityScope {
  filesystem?: {
    read?: string[];
    write?: string[];
    delete?: string[];
  };
  process?: {
    allowed?: string[];
  };
  network?: {
    allowedDomains?: string[];
  };
}

export interface CapabilityToken {
  tokenId: string;
  agentId: string;
  missionId: string;
  scopes: CapabilityScope;
  issuedAt: string;
  expiresAt: string;
  signature: string;
}

// Master secret known only to the ARGUS daemon (never exposed to LLMs)
const DAEMON_TOKEN_SECRET = crypto.randomBytes(32).toString("hex");

export class CapabilityTokenManager {
  /**
   * Mint a cryptographically signed Capability Token for an Agent
   */
  public static issueToken(
    agent: AgentIdentity,
    missionId: string,
    scopes: CapabilityScope,
    validDurationMs = 1000 * 60 * 30 // 30 minutes
  ): CapabilityToken {
    const tokenId = `CAP-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + validDurationMs).toISOString();

    const payload = `${tokenId}:${agent.agentId}:${missionId}:${JSON.stringify(scopes)}:${issuedAt}:${expiresAt}`;
    const signature = crypto
      .createHmac("sha256", DAEMON_TOKEN_SECRET)
      .update(payload)
      .digest("hex");

    return {
      tokenId,
      agentId: agent.agentId,
      missionId,
      scopes,
      issuedAt,
      expiresAt,
      signature,
    };
  }

  /**
   * Validate token signature, expiry, and scope
   */
  public static validateToken(token: CapabilityToken, requiredCapability: {
    tool: string;
    target: string;
  }): { valid: boolean; reason: string } {
    // 1. Expiry Check
    if (new Date(token.expiresAt).getTime() < Date.now()) {
      return { valid: false, reason: "Capability token has expired." };
    }

    // 2. Cryptographic Signature Verification
    const payload = `${token.tokenId}:${token.agentId}:${token.missionId}:${JSON.stringify(token.scopes)}:${token.issuedAt}:${token.expiresAt}`;
    const expectedSig = crypto
      .createHmac("sha256", DAEMON_TOKEN_SECRET)
      .update(payload)
      .digest("hex");

    if (token.signature !== expectedSig) {
      return { valid: false, reason: "TAMPER DETECTED: Capability token signature invalid." };
    }

    // 3. Granular Scope Verification
    const { tool, target } = requiredCapability;

    if (tool === "filesystem.read") {
      const allowedPaths = token.scopes.filesystem?.read || [];
      const match = allowedPaths.some((p) => target.startsWith(p) || p === "*");
      if (!match) {
        return { valid: false, reason: `Target "${target}" outside token read scope (${allowedPaths.join(", ")})` };
      }
    }

    if (tool === "filesystem.write") {
      const allowedPaths = token.scopes.filesystem?.write || [];
      const match = allowedPaths.some((p) => target.startsWith(p) || p === "*");
      if (!match) {
        return { valid: false, reason: `Target "${target}" outside token write scope (${allowedPaths.join(", ")})` };
      }
    }

    if (tool === "process.exec") {
      const allowedBins = token.scopes.process?.allowed || [];
      const binary = target.trim().split(" ")[0];
      const match = allowedBins.some((b) => b === binary || b === "*");
      if (!match) {
        return { valid: false, reason: `Binary "${binary}" outside token process scope (${allowedBins.join(", ")})` };
      }
    }

    if (tool === "network.fetch" || tool === "network.connect") {
      const allowedDomains = token.scopes.network?.allowedDomains || [];
      try {
        const url = new URL(target);
        const match = allowedDomains.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`));
        if (!match) {
          return { valid: false, reason: `Domain "${url.hostname}" outside token network scope (${allowedDomains.join(", ")})` };
        }
      } catch {
        return { valid: false, reason: `Invalid network target URL "${target}"` };
      }
    }

    return { valid: true, reason: "Capability token scope satisfied." };
  }
}
