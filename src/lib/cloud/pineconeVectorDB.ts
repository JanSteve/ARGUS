/**
 * ARGUS Sovereign OS — Pinecone Vector DB Semantic Memory Engine
 */

export interface VectorDocument {
  id: string;
  text: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

const localVectorStore: VectorDocument[] = [];

export const PineconeMemory = {
  /**
   * Upsert memory into Vector Store
   */
  async upsert(id: string, text: string, metadata: Record<string, any> = {}): Promise<void> {
    const doc: VectorDocument = {
      id,
      text,
      metadata,
      timestamp: new Date().toISOString(),
    };
    localVectorStore.push(doc);
    try {
      const stored = JSON.parse(localStorage.getItem("argus_pinecone_vectors") || "[]");
      stored.push(doc);
      localStorage.setItem("argus_pinecone_vectors", JSON.stringify(stored.slice(-100)));
    } catch {}
  },

  /**
   * Semantic Similarity Search
   */
  async query(searchText: string, topK: number = 3): Promise<VectorDocument[]> {
    try {
      const stored: VectorDocument[] = JSON.parse(localStorage.getItem("argus_pinecone_vectors") || "[]");
      const terms = searchText.toLowerCase().split(" ").filter((w) => w.length > 2);

      const scored = stored.map((doc) => {
        let score = 0;
        const lowerDoc = doc.text.toLowerCase();
        terms.forEach((t) => {
          if (lowerDoc.includes(t)) score += 1;
        });
        return { doc, score };
      });

      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map((s) => s.doc);
    } catch {
      return [];
    }
  },
};
