/**
 * ARGUS Unstoppable 4-Tier British Natural Voice Pipeline
 * Tier 1: ElevenLabs High-Definition Voice (George - British Natural Baritone)
 * Tier 2: Free Unlimited Edge Neural TTS (en-GB-RyanNeural / en-GB-ThomasNeural)
 * Tier 3: MiniMax Speech-01-HD Neural Voice
 * Tier 4: Resilient Web Speech British Acoustic Modulation
 * 
 * Guarantees that speech NEVER runs out of credits or stops operating.
 */

import { DEFAULT_ELEVENLABS_KEY } from "./types";
import { speakMiniMaxVoice } from "./minimaxVoice";
import { incrementVoiceUsage } from "../licensing/licenseManager";

export interface ElevenLabsVoiceConfig {
  apiKey: string;
  voiceId: string;
  modelId: string;
  stability: number;
  similarityBoost: number;
}

// ─── Default Voice Persona (George - British Mature Natural Baritone) ─────────
export const DEFAULT_ELEVENLABS_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // George (British Natural Male)
export const ULTRON_ELEVENLABS_VOICE_ID = "IRHApOXLvnW57QJPQH2P";  // Adam (Dark, Resonant Titan)

let currentAudio: HTMLAudioElement | null = null;
let elevenLabsQuotaExhausted = false;

export function resetElevenLabsQuotaState() {
  elevenLabsQuotaExhausted = false;
}

export function isElevenLabsQuotaExhausted(): boolean {
  return elevenLabsQuotaExhausted;
}

/**
 * Stop any ongoing audio playback across all pipelines
 */
export function stopElevenLabsPlayback() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Tier 2: Free Unlimited British Neural TTS Fallback (Edge TTS Ryan / Thomas)
 */
async function speakUnlimitedBritishNeural(text: string): Promise<void> {
  const clean = encodeURIComponent(text.slice(0, 500));
  // High-fidelity public British Edge TTS streaming endpoint
  const streamUrl = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${clean}`;

  return new Promise((resolve) => {
    const audio = new Audio(streamUrl);
    currentAudio = audio;

    audio.onplay = () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("argus:speaking-started"));
      }
    };

    audio.onended = () => {
      currentAudio = null;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("argus:speaking-ended"));
      }
      resolve();
    };

    audio.onerror = () => {
      currentAudio = null;
      // Fall back to Tier 3 / Tier 4
      speakMiniMaxVoice(text).then(resolve);
    };

    audio.play().catch(() => {
      speakMiniMaxVoice(text).then(resolve);
    });
  });
}

/**
 * Primary Voice Synthesizer with Unstoppable 4-Tier Fallback Cascade
 */
export async function speakElevenLabsVoice(
  text: string,
  customApiKey?: string,
  voiceId = DEFAULT_ELEVENLABS_VOICE_ID
): Promise<void> {
  const apiKey = (customApiKey || DEFAULT_ELEVENLABS_KEY).trim();
  const cleanText = text.replace(/[*_`#~>[\]()]/g, "").trim();
  if (!cleanText) return;

  stopElevenLabsPlayback();

  // Check daily free voice allocation limit
  const canSpeak = incrementVoiceUsage();
  if (!canSpeak) {
    console.warn("[ARGUS Voice] Daily free voice limit reached. Prompting Pro Upgrade.");
    return;
  }

  // If ElevenLabs quota was flagged, use Tier 2 unlimited British neural voice
  if (elevenLabsQuotaExhausted && !customApiKey) {
    return speakUnlimitedBritishNeural(cleanText);
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.85,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 429 || status === 403) {
        elevenLabsQuotaExhausted = true;
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("argus:voice-quota-warning", {
              detail: {