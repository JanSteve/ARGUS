/**
 * ARGUS Sovereign OS — Sentry Crash & Exception Monitoring Engine
 */

export const SENTRY_DSN =
  import.meta.env.VITE_SENTRY_DSN ||
  "https://d14a52836f230c26abeb81ecf7d7e1ac@o4508888.ingest.us.sentry.io/4508888";

let isSentryInitialized = false;

/**
 * Initialize Sentry SDK / Global Error Traps
 */
export function initSentry(): void {
  if (typeof window === "undefined" || isSentryInitialized) return;

  // Global uncaught error listener
  window.addEventListener("error", (event) => {
    captureException(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Global unhandled promise rejection listener
  window.addEventListener("unhandledrejection", (event) => {
    captureException(event.reason || new Error("Unhandled Promise Rejection"), {
      type: "unhandledrejection",
    });
  });

  isSentryInitialized = true;
}

/**
 * Capture Exception to Sentry & Anti-Crash Telemetry
 */
export function captureException(error: Error | any, context: Record<string, any> = {}): void {
  try {
    const errorPayload = {
      timestamp: new Date().toISOString(),
      name: error?.name || "UnhandledError",
      message: error?.message || String(error),
      stack: error?.stack || "No stack trace available",
      url: window.location.href,
      userAgent: navigator.userAgent,
      os_version: "v0.2.4",
      context,
    };

    console.warn("[SENTRY LOGGED]:", errorPayload);

    // If Sentry browser bundle loaded, use it
    if ((window as any).Sentry?.captureException) {
      (window as any).Sentry.captureException(error, { extra: context });
    }
  } catch (err) {
    // Silently continue
  }
}

/**
 * Add Breadcrumb for Crash Diagnostics
 */
export function addBreadcrumb(message: string, category: string = "action"): void {
  try {
    if ((window as any).Sentry?.addBreadcrumb) {
      (window as any).Sentry.addBreadcrumb({ message, category, timestamp: Date.now() / 1000 });
    }
  } catch {}
}
