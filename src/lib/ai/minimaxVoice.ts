/**
 * ARGUS Sovereign Voice Intelligence Engine
 * MiniMax Speech-01-HD Neural TTS with JARVIS / Ultron Persona & Resilient Web Speech Fallback
 */

export type VoicePersona = "argus" | "ultron" | "sovereign";

export interface VoiceConfig {
  apiKey: string;
  groupId: string;
  persona: VoicePersona;
  enabled: boolean;
  minimaxEnabled: boolean;
}

export const DEFAULT_MINIMAX_KEY =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJJbmZpbml0eUZvcmdlIEdhbWVzIiwiVXNlck5hbWUiOiJJbmZpbml0eUZvcmdlIEdhbWVzIiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjIwMDI3MDY2MzM2OTE1MDEyMTYiLCJQaG9uZSI6IiIsIkdyb3VwSUQiOiIyMDAyNzA2NjMzNjg3MzExMDA4IiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiaW5maW5pdHlmb3JnZWdAZ21haWwuY29tIiwiQ3JlYXRlVGltZSI6IjIwMjUtMTItMjIgMDA6MTc6MTgiLCJUb2tlblR5cGUiOjIsImlzcyI6Im1pbmltYXgifQ.PmXKQaZV6dq-7_NNsWtph1tBuN8Wfx1WW2Dqz3iVjZkdZNhUd6XYmlwHw3NE3bE8yHgMmwg6dQGqfaKK1AH134kxtUXl-PG3A5u51O_0y4NnHg6oApLRvfIMV9dtR670KShsrd_b8oGvAHrX65CLaGldlo6uyL-nU0w596C7m-oUJTObNXXTimJUlXCnnWoY-ZZYAa313Cb2H4vAM149hDl2-UgdB9CTbbAa9BuC5zCWo01d3tRPNx-58OQmbHSYwITewN5qVTviSLDKIa1e2G2SxzsNhNddAuWglXHd5QrJnqFWls9m0RxyuYnyrKzPKUWG-rJTfJm6VbjARFa0dg";

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  apiKey: DEFAULT_MINIMAX_KEY,
  groupId: "2002706633687311008",
  persona: "argus",
  enabled: true,
  minimaxEnabled: true,
};

export const VOICE_CONFIG_KEY = "argus-voice-config";

// Persona Parameters for MiniMax Speech-01-HD
const PERSONA_SETTINGS: Record<
  VoicePersona,
  { voiceId: string; speed: number; pitch: number; label: string; description: string }
> = {
  argus: {
    voiceId: "male-qn-qingse",
    speed: 1.05,
    pitch: -2,
    label: "ARGUS British Neural (Natural Sophisticated Male)",
    description: "Crisp, hyper-intelligent, calm baritone with British acoustic cadence",
  },
  ultron: {
    voiceId: "audiobook_male_2",
    speed: 0.92,
    pitch: -5,
    label: "ARGUS Titan (Deep Resonant Cybernetic Authority)",
    description: "Deep, powerful, resonant acoustic authority",
  },
  sovereign: {
    voiceId: "presenter_male",
    speed: 1.0,
    pitch: 0,
    label: "ARGUS Sovereign (Professional Broadcast Human)",
    description: "Natural human professional speaking voice",
  },
};

let currentAudio: HTMLAudioElement | null = null;

/**
 * Load Voice Configuration from LocalStorage
 */
export function loadVoiceConfig(): VoiceConfig {
  if (typeof window === "undefined") return DEFAULT_VOICE_CONFIG;
  try {
    const raw = localStorage.getItem(VOICE_CONFIG_KEY);
    if (!raw) return DEFAULT_VOICE_CONFIG;
    return { ...DEFAULT_VOICE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VOICE_CONFIG;
  }
}

/**
 * Save Voice Configuration to LocalStorage
 */
export function saveVoiceConfig(config: VoiceConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VOICE_CONFIG_KEY, JSON.stringify(config));
  } catch {}
}

/**
 * Stop any active voice synthesis playback
 */
export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Helper to convert Hex string to Uint8Array (MiniMax T2A hex output format)
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Fallback Web Speech Synthesis with Deep ARGUS / Ultron Acoustic Modulation
 */
function speakWebSpeechFallback(text: string, persona: VoicePersona = "argus") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const clean = text.replace(/[*_`#~>[\]()]/g, "").trim();
  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  const voices = window.speechSynthesis.getVoices();

  // Pick best available English voice
  const preferredVoice =
    voices.find((v) => v.name.includes("Daniel") || v.name.includes("Oliver") || v.name.includes("Google UK English Male")) ||
    voices.find((v) => v.lang.startsWith("en-GB") && v.name.includes("Male")) ||
    voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Male") || v.name.includes("Guy") || v.name.includes("David"))) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0];

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  if (persona === "argus") {
    utterance.pitch = 0.85; // Deep sophisticated tone
    utterance.rate = 1.05;
  } else if (persona === "ultron") {
    utterance.pitch = 0.65; // Ultra deep cybernetic resonance
    utterance.rate = 0.92;
  } else {
    utterance.pitch = 1.0;
    utterance.rate = 1.0;
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Primary Voice Synthesis: Calls MiniMax Speech-01-HD API, falls back gracefully to Web Speech
 */
export async function speakMiniMaxVoice(
  rawText: string,
  overrideConfig?: Partial<VoiceConfig>
): Promise<{ success: boolean; source: "minimax" | "webspeech"; error?: string }> {
  const config = { ...loadVoiceConfig(), ...overrideConfig };
  if (!config.enabled) return { success: false, source: "webspeech", error: "Voice disabled" };

  stopSpeaking();

  const cleanText = rawText
    .replace(/```[\s\S]*?```/g, "Code snippet omitted.")
    .replace(/[*_`#~>[\]()]/g, "")
    .slice(0, 1000)
    .trim();

  if (!cleanText) return { success: false, source: "webspeech" };

  const personaKey = config.persona || "argus";
  const persona = PERSONA_SETTINGS[personaKey] || PERSONA_SETTINGS.argus;

  // If MiniMax is enabled and key is present, attempt high-fidelity neural synthesis
  if (config.minimaxEnabled && config.apiKey) {
    try {
      const groupId = config.groupId || "2002706633687311008";
      const endpoint = `https://api.minimax.io/v1/t2a_v2?GroupId=${groupId}`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "speech-01-hd",
          text: cleanText,
          stream: false,
          voice_setting: {
            voice_id: persona.voiceId,
            speed: persona.speed,
            vol: 1.0,
            pitch: persona.pitch,
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: "mp3",
            channel: 1,
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        
        // MiniMax return check
        if (json.base_resp?.status_code === 0 && json.data?.audio) {
          // Decode hex audio
          const audioBytes = hexToBytes(json.data.audio);
          const blob = new Blob([audioBytes], { type: "audio/mp3" });
          const audioUrl = URL.createObjectURL(blob);

          const audio = new Audio(audioUrl);
          currentAudio = audio;
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
          };
          await audio.play();
          return { success: true, source: "minimax" };
        } else {
          // MiniMax quota exceeded or token expired (e.g. 1008 insufficient balance)
          const errorMsg = json.base_resp?.status_msg || "MiniMax quota exhausted";
          console.warn("[ARGUS Voice] MiniMax returned:", errorMsg, "Falling back to neural Web Speech.");
          
          // Dispatch warning for UI
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("argus:voice-warning", {
                detail: { message: `MiniMax Voice: ${errorMsg}. Local JARVIS acoustic fallback active.` },
              })
            );
          }
        }
      }
    } catch (err) {
      console.warn("[ARGUS Voice] Network error reaching MiniMax, using Web Speech fallback:", err);
    }
  }

  // Graceful Fallback
  speakWebSpeechFallback(cleanText, personaKey);
  return { success: true, source: "webspeech" };
}

export { PERSONA_SE