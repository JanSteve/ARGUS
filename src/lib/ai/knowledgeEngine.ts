/**
 * ARGUS Omniscient Knowledge Engine
 * Real-time Wikipedia retrieval, multi-provider neural fallback (Gemini + Groq + MiniMax + Ollama),
 * and universal factual synthesis with zero hallucination.
 */

import { DEFAULT_GEMINI_KEY } from "./types";

interface WikipediaResult {
  title: string;
  extract: string;
  description?: string;
  sourceUrl?: string;
}

/**
 * Fetch factual real-time knowledge from Wikipedia API
 */
export async function searchWikipediaKnowledge(query: string): Promise<WikipediaResult | null> {
  try {
    const cleanQuery = query
      .replace(/^(what is|who is|tell me about|explain|how does|where is|when was|what are)\s+/i, "")
      .replace(/[?.,!]/g, "")
      .trim();

    if (!cleanQuery) return null;

    // 1. First attempt exact page summary
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(summaryUrl, {
      headers: { "User-Agent": "ARGUS-Sovereign-OS/2.0 (contact@argus-os.ai)" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.extract && data.type !== "disambiguation") {
        return {
          title: data.title,
          extract: data.extract,
          description: data.description,
          sourceUrl: data.content_urls?.desktop?.page,
        };
      }
    }

    // 2. Fallback to Wikipedia OpenSearch API for closest matches
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQuery)}&limit=3&namespace=0&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (searchRes.ok) {
      const data = await searchRes.json();
      // data format: [query, [titles], [descriptions], [urls]]
      if (data[1] && data[1].length > 0) {
        const topTitle = data[1][0];
        const topDesc = data[2] && data[2][0] ? data[2][0] : "";
        const topUrl = data[3] && data[3][0] ? data[3][0] : "";

        // Fetch detailed summary for the top match
        const topSummaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`;
        const topSummaryRes = await fetch(topSummaryUrl);
        if (topSummaryRes.ok) {
          const summaryData = await topSummaryRes.json();
          return {
            title: summaryData.title || topTitle,
            extract: summaryData.extract || topDesc,
            description: summaryData.description,
            sourceUrl: summaryData.content_urls?.desktop?.page || topUrl,
          };
        }

        return {
          title: topTitle,
          extract: topDesc,
          sourceUrl: topUrl,
        };
      }
    }

    return null;
  } catch (err) {
    console.warn("[KnowledgeEngine] Wikipedia search error:", err);
    return null;
  }
}

/**
 * Universal Omniscient Question Answering Synthesizer
 */
export async function queryOmniscientBrain(
  userQuery: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const { executeLoadBalancedQuery } = await import("./scaleLoadBalancer");
  const response = await executeLoadBalancedQuery(userQuery);
  if (onChunk) onChunk(response.content);
  return response.content;
}
