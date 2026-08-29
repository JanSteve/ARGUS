/**
 * ARGUS Sovereign Memory Architecture (M4)
 * Three-Tier Sovereign Memory:
 * 1. Working Context: Active DAG execution, variables, tool outputs
 * 2. Episodic Memory: Historical objectives, user decisions, execution traces
 * 3. Semantic Memory: Extracted facts, entities, project knowledge
 * 
 * Cryptography: Encrypted with AES-256-GCM at rest in local enclave
 */

import { encryptAESGCM, decryptAESGCM } from "../auth/sovereignIdentity";

export interface EpisodicMemoryRecord {
  id: string;
  objectiveId: string;
  goal: string;
  planSummary: string;
  toolsUsed: string[];
  userDecisions: Array<{ actionId: string; decision: string }>;
  verificationOutcome: string;
  timestamp: string;
}

export interface SemanticFactRecord {
  id: string;
  entity: string;
  relation: string;
  value: string;
  confidence: number;
  sourceObjectiveId: string;
  updatedAt: string;
}

export interface SovereignMemoryVault {
  episodic: EpisodicMemoryRecord[];
  semantic: SemanticFactRecord[];
  preferences: Record<string, any>;
}

const STORAGE_KEY_MEMORY_VAULT = "argus_sovereign_memory_vault_v1";
const MEMORY_SECRET = "ARGUS_SECURE_LOCAL_ENCLAVE_2026";

class SovereignMemoryEngine {
  private vault: SovereignMemoryVault = {
    episodic: [],
    semantic: [],
    preferences: {
      defaultVoiceRate: 1.0,
      defaultRiskThreshold: "MEDIUM",
      autoVerify: true,
      dataSovereigntyMode: "STRICT_LOCAL",
    },
  };

  private isLoaded = false;

  constructor() {
    this.load();
  }

  private async load() {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY_MEMORY_VAULT);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.ciphertext && parsed.iv && parsed.salt) {
            const decrypted = await decryptAESGCM(parsed, MEMORY_SECRET);
            this.vault = JSON.parse(decrypted);
          } else {
            this.vault = parsed;
          }
        }
      }
    } catch {
      // Initialize fresh if empty or migration needed
    }
    this.isLoaded = true;
  }

  private async save() {
    try {
      if (typeof window !== "undefined") {
        const plaintext = JSON.stringify(this.vault);
        const encrypted = await encryptAESGCM(plaintext, MEMORY_SECRET);
        localStorage.setItem(STORAGE_KEY_MEMORY_VAULT, JSON.stringify(encrypted));
      }
    } catch {}
  }

  /**
   * Store completed objective in Episodic Memory
   */
  public async recordEpisode(record: Omit<EpisodicMemoryRecord, "id" | "timestamp">): Promise<void> {
    if (!this.isLoaded) await this.load();
    const episode: EpisodicMemoryRecord = {
      id: `ep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...record,
      timestamp: new Date().toISOString(),
    };
    this.vault.episodic.unshift(episode);
    if (this.vault.episodic.length > 100) this.vault.episodic = this.vault.episodic.slice(0, 100);
    await this.save();
  }

  /**
   * Store extracted entity/fact in Semantic Memory
   */
  public async storeFact(entity: string, relation: string, value: string, sourceObjectiveId: string): Promise<void> {
    if (!this.isLoaded) await this.load();
    const existing = this.vault.semantic.find(
      (f) => f.entity.toLowerCase() === entity.toLowerCase() && f.relation.toLowerCase() === relation.toLowerCase()
    );

    if (existing) {
      existing.value = value;
      existing.updatedAt = new Date().toISOString();
    } else {
      this.vault.semantic.push({
        id: `fact_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        entity,
        relation,
        value,
        confidence: 0.95,
        sourceObjectiveId,
        updatedAt: new Date().toISOString(),
      });
    }
    await this.save();
  }

  /**
   * Retrieve relevant memory context for a new goal (Semantic Search / Keyword Filter)
   */
  public async retrieveRelevantContext(goal: string): Promise<{ relevantEpisodes: EpisodicMemoryRecord[]; relevantFacts: SemanticFactRecord[] }> {
    if (!this.isLoaded) await this.load();
    const terms = goal.toLowerCase().split(/\s+/).filter((t) => t.length > 3);

    const relevantEpisodes = this.vault.episodic.filter((ep) =>
      terms.some((t) => ep.goal.toLowerCase().includes(t) || ep.planSummary.toLowerCase().includes(t))
    ).slice(0, 3);

    const relevantFacts = this.vault.semantic.filter((fact) =>
      terms.some((t) => fact.entity.toLowerCase().includes(t) || fact.value.toLowerCase().includes(t))
    ).slice(0, 10);

    return { relevantEpisodes, relevantFacts };
  }

  public getEpisodicMemory(): EpisodicMemoryRecord[] {
    return [...this.vault.episodic];
  }

  public getSemanticMemory(): SemanticFactRecord[] {
    return [...this.vault.semantic];
  }

  public async purgeMemory(): Promise<void> {
    this.vault.episodic = [];
    this.vault.semantic = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY_MEMORY_VAULT);
    }
  }
}

export const SovereignMemory = new SovereignMemoryEngine();
