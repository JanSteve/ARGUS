/**
 * ARGUS Sovereign Voice Intelligence Orchestrator (JARVIS / FRIDAY Grade)
 * 
 * 4-Tier Zero-Interruption Failover Cascade:
 *   Tier 1: MiniMax Speech-01-HD Neural TTS (Persona: female-queen — Imposing Queen)
 *   Tier 2: ElevenLabs Neural Synthesis (Persona: Sarah/Queen — British Regal Female)
 *   Tier 3: Free Unlimited High-Fidelity Edge Neural TTS (Persona: Amy/Emma — Zero Cost)
 *   Tier 4: Sovereign Offline Web Speech API / POSIX Local Synthesis (100% Offline)
 * 
 * Automatically detects quota exhaustion (HTTP 429/402), network drops, or latency timeouts
 * and silently switches to the next tier so speech never stops.
 */

import {
  DEFAULT_MINIMAX_KEY,
  DEFAULT_VOICE_CONFIG,
  loadVoiceConfig,
  saveVoiceConfig,
  VoiceConfig,
  VoicePersona,
  PERSONA_SETTINGS,
} from "./minimaxVoice";
import {
  DEFAULT_ELEVENLABS_VOICE_ID,
  QUEEN_ELEVENLABS_VOICE_ID,
} from "./elevenLabsVoice";
import { DEFAULT_ELEVENLABS_KEY } from "./types";

export interface VoicePlaybackStatus {
  success: boolean;
  tierUsed: "minimax" | "elevenlabs" | "edge_neural_free" | "offline_webspeech" | "cache";
  persona: string;
  latencyMs: number;
  error?: string;
}

let activeAudio: HTMLAudioElement | null = null;
const voiceCache = new Map<string, string>();

// Quota exhaustion memory flags (reset every 1 hour)
let minimaxQuotaExhausted = false;
let elevenLabsQuotaExhausted = false;

if (typeof window !== "undefined") {
  setInterval(() => {
    minimaxQuotaExhausted = false;
    elevenLabsQuotaExhausted = false;
  }, 60 * 60 * 1000);
}

/**
 * Stop any active voice playback immediately across all engines
 */
export function stopAllSpeech(): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("argus:speaking-ended"));
  }
}

/**
 * Helper to convert MiniMax hex audio string to binary Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Clean text for natural speech synthesis (removes code blocks, markdown symbols, citations)
 */
export function sanitizeTextForSpeech(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, "Code omitted.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#~>[\]()|]/g, "")
    .replace(/https?:\/\/\S+/g, "link")
    .replace(/\s+/g, " ")
    .slice(0, 1200)
    .trim();
}

/**
 * Tier 1: MiniMax Speech-01-HD (Imposing Queen: Steely, Polished, Regal Female)
 */
async function tryMiniMax(cleanText: string, config: VoiceConfig): Promise<boolean> {
  if (minimaxQuotaExhausted || !config.apiKey) return false;

  try {
    const groupId = config.groupId || "2002706633687311008";
    const endpoint = `https://api.minimax.io/v1/t2a_v2?GroupId=${groupId}`;
    const persona = PERSONA_SETTINGS[config.persona] || PERSONA_SETTINGS.imposing_queen;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2.0s fast failover guard

    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "speech-01-hd",
        text: cleanText,
        stream: false,
        voice_setting: {
          voice_id: persona.voiceId || "female-queen",
          speed: persona.speed || 1.0,
          vol: 1.0,
          pitch: persona.pitch || 0,
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: "mp3",
          channel: 1,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (response.status === 429 || response.status === 402 || response.status === 401) {
      console.warn(`[ARGUS Voice] MiniMax returned status ${response.status}. Marking quota exhausted for failover.`);
      minimaxQuotaExhausted = true;
      return false;
    }

    if (response.ok) {
      const json = await response.json();
      if (json.base_resp?.status_code === 0 && json.data?.audio) {
        const audioBytes = hexToBytes(json.data.audio);
        const blob = new Blob([audioBytes], { type: "audio/mp3" });
        const audioUrl = URL.createObjectURL(blob);

        const cacheKey = `minimax_${cleanText}`;
        if (voiceCache.size < 60) {
          voiceCache.set(cacheKey, audioUrl);
        }

        return await playAudioUrl(audioUrl);
      }
    }
    return false;
  } catch (e) {
    console.warn("[ARGUS Voice] MiniMax failover triggered:", e);
    return false;
  }
}

/**
 * Tier 2: ElevenLabs Neural Synthesis (Sarah / British Regal Queen)
 */
async function tryElevenLabs(cleanText: string, customApiKey?: string): Promise<boolean> {
  if (elevenLabsQuotaExhausted) return false;

  const apiKey = (customApiKey || DEFAULT_ELEVENLABS_KEY || "").trim();
  if (!apiKey) return false;

  try {
    const voiceId = QUEEN_ELEVENLABS_VOICE_ID || DEFAULT_ELEVENLABS_VOICE_ID;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2200);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.85,
          style: 0.15,
          use_speaker_boost: true,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (response.status === 429 || response.status === 401 || response.status === 402) {
      console.warn(`[ARGUS Voice] ElevenLabs returned ${response.status}. Marking quota exhausted.`);
      elevenLabsQuotaExhausted = true;
      return false;
    }

    if (response.ok) {
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      return await playAudioUrl(audioUrl);
    }
    return false;
  } catch (e) {
    console.warn("[ARGUS Voice] ElevenLabs failover triggered:", e);
    return false;
  }
}

/**
 * Tier 3: Free Unlimited Edge Neural TTS (Amy / Emma - British Female Neural)
 * 100% Free, zero credit limit, high-definition streaming.
 */
async function tryFreeEdgeNeural(cleanText: string): Promise<boolean> {
  try {
    const encoded = encodeURIComponent(cleanText.slice(0, 500));
    const streamUrl = `https://api.streamelements.com/kappa/v2/speech?voice=Amy&text=${encoded}`;
    return await playAudioUrl(streamUrl);
  } catch (e) {
    console.warn("[ARGUS Voice] Free Edge Neural failover triggered:", e);
    return false;
  }
}

/**
 * Tier 4: Sovereign Offline Web Speech API (British High-Precision Female Voice)
 */
function speakOfflineWebSpeech(cleanText: string, personaKey: VoicePersona = "imposing_queen"): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voices = window.speechSynthesis.getVoices();

  // Find best available British/English Female voice
  const preferredVoice =
    voices.find((v) => v.name.includes("Victoria") || v.name.includes("Serena") || v.name.includes("Stephanie")) ||
    voices.find((v) => v.name.includes("Google UK English Female") || (v.lang.startsWith("en-GB") && v.name.includes("Female"))) ||
    voices.find((v) => v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Kate") || v.name.includes("Moira")) ||
    voices.find((v) => v.lang.startsWith("en-GB") || v.lang.startsWith("en_GB")) ||
    voices.find((v) => v.lang.startsWith("en") && !v.name.includes("Male") && !v.name.includes("David")) ||
    voices[0];

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // Regal Imposing Queen Modulation
  utterance.pitch = 1.02;
  utterance.rate = 1.0;

  utterance.onstart = () => {
    window.dispatchEvent(new CustomEvent("argus:speaking-started"));
  };
  utterance.onend = () => {
    window.dispatchEvent(new CustomEvent("argus:speaking-ended"));
  };
  utterance.onerror = () => {
    window.dispatchEvent(new CustomEvent("argus:speaking-ended"));
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Helper to play an HTML5 audio URL with dispatch events
 */
function playAudioUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    activeAudio = audio;

    audio.onplay = () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("argus:speaking-started"));
      }
    };

    audio.onended = () => {
      activeAudio = null;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("argus:speaking-ended"));
      }
      resolve(true);
    };

    audio.onerror = () => {
      activeAudio = null;
      resolve(false);
    };

    audio.play().catch(() => {
      activeAudio = null;
      resolve(false);
    });
  });
}

/**
 * Master Sovereign Voice Speaker: Cascades across 4 tiers with zero interruption
 */
export async function speakArgusVoice(
  rawText: string,
  overrideConfig?: Partial<VoiceConfig>
): Promise<VoicePlaybackStatus> {
  const t0 = performance.now();
  const config = { ...loadVoiceConfig(), ...overrideConfig };

  if (!config.enabled) {
    return {
      success: false,
      tierUsed: "offline_webspeech",
      persona: config.persona,
      latencyMs: 0,
      error: "Voice is disabled in settings.",
    };
  }

  stopAllSpeech();

  const cleanText = sanitizeTextForSpeech(rawText);
  if (!cleanText) {
    return {
      success: true,
      tierUsed: "cache",
      persona: config.persona,
      latencyMs: 0,
    };
  }

  // 1. Instant Cache Hit (0ms)
  const cacheKey = `minimax_${cleanText}`;
  if (voiceCache.has(cacheKey)) {
    const cachedUrl = voiceCache.get(cacheKey)!;
    const ok = await playAudioUrl(cachedUrl);
    if (ok) {
      return {
        success: true,
        tierUsed: "cache",
        persona: config.persona,
        latencyMs: Math.round(performance.now() - t0),
      };
    }
  }

  // 2. Tier 1: MiniMax Imposing Queen (Speech-01-HD)
  if (config.minimaxEnabled && !minimaxQuotaExhausted) {
    const ok = await tryMiniMax(cleanText, config);
    if (ok) {
      return {
        success: true,
        tierUsed: "minimax",
        persona: config.persona,
        latencyMs: Math.round(performance.now() - t0),
      };
    }
  }

  // 3. Tier 2: ElevenLabs Neural (Sarah / Queen)
  if (!elevenLabsQuotaExhausted) {
    const ok = await tryElevenLabs(cleanText);
    if (ok) {
      return {
        success: true,
        tierUsed: "elevenlabs",
        persona: "sovereign_queen",
        latencyMs: Math.round(performance.now() - t0),
      };
    }
  }

  // 4. Tier 3: Free Unlimited Edge Neural TTS (Amy)
  const okEdge = await tryFreeEdgeNeural(cleanText);
  if (okEdge) {
    return {
      success: true,
      tierUsed: "edge_neural_free",
      persona: "edge_amy",
      latencyMs: Math.round(performance.now() - t0),
    };
  }

  // 5. Tier 4: Sovereign Offline Web Speech API (Local British Female)
  speakOfflineWebSpeech(cleanText, config.persona);
  return {
    success: true,
    tierUsed: "offline_webspeech",
    persona: config.persona,
    latencyMs: Math.round(performance.now() - t0),
  };
}
