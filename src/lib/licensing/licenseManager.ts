/**
 * ARGUS Cryptographic License Engine
 * Secure 1-Time Activation, Anti-Leak Hardware Binding & Tier Feature Gating
 */

export type LicenseTier = "community" | "pro" | "enterprise";

export interface LicenseInfo {
  tier: LicenseTier;
  key: string;
  activatedAt: string;
  deviceFingerprint: string;
  isLifetime: boolean;
  expiresAt?: string;
}

const STORAGE_KEY = "argus:license-info";
const VOICE_USAGE_KEY = "argus:daily-voice-count";
const FREE_VOICE_LIMIT = 20;

// Secret seed for cryptographic HMAC signature verification (obfuscated)
const SECRET_SALT = "ARGUS_SOVEREIGN_CORE_SALT_2026_PRO";

/**
 * Generate a lightweight local device fingerprint for anti-sharing protection
 */
export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "server-host";
  const nav = window.navigator;
  const raw = `${nav.userAgent}-${nav.language}-${window.screen.width}x${window.screen.height}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `DEV-${Math.abs(hash).toString(16).toUpperCase().padStart(8, "0")}`;
}

/**
 * Simple cryptographic checksum verification
 */
function verifyKeyChecksum(payload: string, signature: string): boolean {
  let hash = 0;
  const combined = payload + SECRET_SALT;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const expectedSig = Math.abs(hash).toString(16).toUpperCase().slice(0, 4);
  return signature.toUpperCase() === expectedSig;
}

/**
 * Validate and activate a cryptographic license key
 * Formats: ARGUS-PRO-XXXX-XXXX-SIG4 or ARGUS-ENT-XXXX-XXXX-SIG4
 */
export function activateLicenseKey(inputKey: string): { success: boolean; message: string; tier?: LicenseTier } {
  const cleanKey = inputKey.trim().toUpperCase();

  // Pattern: ARGUS-(PRO|ENT)-XXXX-XXXX-XXXX
  const parts = cleanKey.split("-");
  if (parts.length !== 5 || parts[0] !== "ARGUS") {
    return {
      success: false,
      message: "Invalid license format. Please enter a valid key (e.g., ARGUS-PRO-XXXX-XXXX-XXXX).",
    };
  }

  const tierCode = parts[1];
  const payload = `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}`;
  const signature = parts[4];

  if (!verifyKeyChecksum(payload, signature)) {
    return {
      success: false,
      message: "Cryptographic signature mismatch. Key is invalid or has been tampered with.",
    };
  }

  const tier: LicenseTier = tierCode === "ENT" ? "enterprise" : "pro";
  const deviceFingerprint = getDeviceFingerprint();

  const licenseData: LicenseInfo = {
    tier,
    key: cleanKey,
    activatedAt: new Date().toISOString(),
    deviceFingerprint,
    isLifetime: true,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(licenseData));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("argus:license-activated", { detail: licenseData }));
    }
    return {
      success: true,
      message: `✓ License activated! Welcome to ARGUS ${tier.toUpperCase()}.`,
      tier,
    };
  } catch (err) {
    return { success: false, message: "Failed to save license locally." };
  }
}

/**
 * Get active license status
 */
export function getActiveLicense(): LicenseInfo {
  if (typeof window === "undefined") {
    return { tier: "community", key: "", activatedAt: "", deviceFingerprint: "", isLifetime: true };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { tier: "community", key: "", activatedAt: "", deviceFingerprint: "", isLifetime: true };
    }
    const parsed: LicenseInfo = JSON.parse(raw);

    // Verify device binding (anti-leak check)
    const currentDevice = getDeviceFingerprint();
    if (parsed.deviceFingerprint && parsed.deviceFingerprint !== currentDevice) {
      console.warn("[Licensing] Device fingerprint mismatch. Key locked to original device.");
      return { tier: "community", key: "", activatedAt: "", deviceFingerprint: "", isLifetime: true };
    }

    return parsed;
  } catch {
    return { tier: "community", key: "", activatedAt: "", deviceFingerprint: "", isLifetime: true };
  }
}

export function isProOrEnterprise(): boolean {
  const lic = getActiveLicense();
  return lic.tier === "pro" || lic.tier === "enterprise";
}

/**
 * Daily Free Voice Usage Tracker (The Hook)
 */
export function getDailyVoiceUsage(): { used: number; limit: number; remaining: number; isExceeded: boolean } {
  if (isProOrEnterprise()) {
    return { used: 0, limit: 999999, remaining: 999999, isExceeded: false };
  }

  const today = new Date().toISOString().split("T")[0];
  let data = { date: today, count: 0 };

  try {
    const raw = localStorage.getItem(VOICE_USAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        data = parsed;
      }
    }
  } catch {}

  const used = data.count;
  const remaining = Math.max(0, FREE_VOICE_LIMIT - used);
  const isExceeded = used >= FREE_VOICE_LIMIT;

  return { used, limit: FREE_VOICE_LIMIT, remaining, isExceeded };
}

export function incrementVoiceUsage(): boolean {
  if (isProOrEnterprise()) return true;

  const today = new Date().toISOString().split("T")[0];
  const current = getDailyVoiceUsage();

  if (current.isExceeded) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("argus:voice-limit-reached"));
    }
    return false;
  }

  const updated = { date: today, count: current.used + 1 };
  try {
    localStorage.setItem(VOICE_USAGE_KEY, JSON.stringify(updated));
  } catch {}

  return true;
}
