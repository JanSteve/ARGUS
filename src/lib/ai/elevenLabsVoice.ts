/**
 * ARGUS ElevenLabs High-Definition Neural Voice Engine
 * Pure British natural speaking voice with Ultron/Titan depth and zero-delay streaming
 */

import { DEFAULT_ELEVENLABS_KEY } from "./types";
import { speakMiniMaxVoice } from "./minimaxVoice";

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

/**
 * Reset quota flag if user provides a new key
 */
export function resetElevenLabsQuotaState() {
  elevenLabsQuotaExhausted = false;
}

export function isElevenLabsQuotaExhausted(): boolean {
  return elevenLabsQuotaExhausted;
}

/**
 * Stop any ongoing audio playback
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
 * Synthesize and play speech via ElevenLabs Neural Voice API
 * Falls back to MiniMax & Acoustic Web Speech if credits are exhausted
 */
export async function speakElevenLabsVoice(
  text: string,
  customApiKey?: string,
  voiceId = DEFAULT_ELEVENLABS_VOICE_ID
): Promise<void> {
  const apiKey = (customApiKey || DEFAULT_ELEVENLABS_KEY).trim();
  const cleanText = text.replace(/[*_`#~]/g, "").trim();
  if (!cleanText) return;

  stopElevenLabsPlayback();

  // If already flagged as quota exhausted and no custom key provided, fallback immediately
  if (elevenLabsQuotaExhausted && !customApiKey) {
    return speakMiniMaxVoice(cleanText);
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
                message:
                  "ElevenLabs 10,000 monthly credits reached. Switching over to ARGUS British secondary neural engine. You can paste a new ElevenLabs key in Settings anytime.",
              },
            })
          );
        }
      }
      // Fallback to MiniMax / Web Speech
      return speakMiniMaxVoice(cleanText);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      currentAudio = audio;

      audio.onplay = () => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("argus:speaking-started"));
        }
      };

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("argus:speaking-ended"));
        }
        resolve();
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("argus:speaking-ended"));
        }
        speakMiniMaxVoice(cleanText).then(resolve);
      };

      audio.play().catch(() => {
        speakMiniMaxVoice(cleanText).then(resolve);
      });
    });
  } catch (err) {
    console.warn("ElevenLabs TTS network error, using fallback voice:", err);
    return speakMiniMaxVoice(cleanText);
  }
}
