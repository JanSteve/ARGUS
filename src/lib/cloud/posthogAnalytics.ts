/**
 * ARGUS Sovereign OS — PostHog Product Analytics & Telemetry Engine
 * Project Token: phc_yqAcvHnuubp9kc57djzz5dRTpGzV7xprsbNfZh7LZFy3
 * Ingestion Host: https://us.i.posthog.com
 */

export const POSTHOG_PROJECT_TOKEN =
  import.meta.env.VITE_POSTHOG_KEY || "phc_yqAcvHnuubp9kc57djzz5dRTpGzV7xprsbNfZh7LZFy3";

export const POSTHOG_HOST =
  import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

let isPostHogInitialized = false;

/**
 * Initialize PostHog Analytics Script in Browser
 */
export function initPostHog(): void {
  if (typeof window === "undefined" || isPostHogInitialized) return;

  try {
    const posthogObj = ((window as any).posthog = (window as any).posthog || []);
    if (!posthogObj.__loaded) {
      posthogObj.__loaded = true;

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.src = "https://us-assets.i.posthog.com/static/array.js";
      script.onload = () => {
        if ((window as any).posthog?.init) {
          (window as any).posthog.init(POSTHOG_PROJECT_TOKEN, {
            api_host: POSTHOG_HOST,
            person_profiles: "identified_only",
            capture_pageview: true,
            capture_performance: true,
            autocapture: true,
          });
        }
      };
      document.head.appendChild(script);
      isPostHogInitialized = true;
    }
  } catch (err) {
    console.warn("PostHog initialization notice:", err);
  }
}

/**
 * Track Custom Event to PostHog
 */
export function trackEvent(eventName: string, properties: Record<string, any> = {}): void {
  try {
    const payload = {
      $current_url: window.location.href,
      timestamp: new Date().toISOString(),
      app_version: "v0.2.4",
      os_environment: typeof window !== "undefined" && (window as any).__TAURI__ ? "tauri_native" : "web_cloud",
      ...properties,
    };

    if ((window as any).posthog?.capture) {
      (window as any).posthog.capture(eventName, payload);
    } else {
      // Direct PostHog HTTP Ingest Fallback
      fetch(`${POSTHOG_HOST}/capture/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: POSTHOG_PROJECT_TOKEN,
          event: eventName,
          properties: {
            distinct_id: localStorage.getItem("argus_client_id") || "anon_sovereign_user",
            ...payload,
          },
        }),
      }).catch(() => {});
    }
  } catch (err) {
    // Silently continue
  }
}

/**
 * Convenience Event Helpers
 */
export const Analytics = {
  boot: () => trackEvent("os_booted"),
  appLaunched: (appId: string, title?: string) => trackEvent("app_launched", { appId, title }),
  voiceCommand: (phrase: string) => trackEvent("voice_command_executed", { phrase }),
  proUpgradeClicked: (tier: string) => trackEvent("pro_upgrade_clicked", { tier }),
  aiQuery: (provider: string, promptLength: number) => trackEvent("ai_inference_run", { provider, promptLength }),
  investorPitchSent: (fundName: string, partner: string) => trackEvent("investor_pitch_dispatched", { fundName, partner }),
};
