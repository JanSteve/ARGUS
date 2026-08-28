/**
 * ARGUS Sovereign OS — Unified Enterprise Cloud Infrastructure Suite
 * Integrates:
 * 1. Clerk Authentication
 * 2. PostHog Telemetry
 * 3. Sentry Crash Defense
 * 4. Resend Transactional Email
 * 5. Upstash Distributed Redis
 * 6. Pinecone Semantic Vector Memory
 */

export * from "./clerkAuth";
export * from "./posthogAnalytics";
export * from "./sentryMonitoring";
export * from "./resendEmail";
export * from "./upstashRedis";
export * from "./pineconeVectorDB";

import { initPostHog } from "./posthogAnalytics";
import { initSentry } from "./sentryMonitoring";
import { getClerkInstance } from "./clerkAuth";

/**
 * Initialize all cloud services on OS boot
 */
export function initializeStartupCloudInfrastructure(): void {
  if (typeof window === "undefined") return;

  initSentry();
  initPostHog();
  getClerkInstance().catch(() => {});
}
