/**
 * ARGUS Sovereign Voice Intelligence Engine
 * MiniMax Speech-01-HD Neural TTS with Imposing Queen Persona & Resilient Female Web Speech Fallback
 */

export type VoicePersona = "imposing_queen" | "sovereign_queen" | "cyber_valkyrie" | "argus" | "ultron";

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
  persona: "imposing_queen",
  enabled: true,
  minimaxEnabled: true,
};

export const VOICE_CONFIG_KEY = "argus-voice-config";

const PERSONA_SETTINGS: Record<
  VoicePersona,
  { voiceId: string; speed: number; pitch: number; label: string; description: string; gender: "female" | "male" }
> = {
  imposing_queen: {
    voiceId: "female-queen",
    speed: 1.0,
    pitch: 0,
    label: "Imposing Queen (Steely • Polished • Regal)",
    description: "Commanding, aristocratic female sovereign intelligence with steely composure and regal polish.",
    gender: "female",
  },
  sovereign_queen: {
    voiceId: "presenter_female",
    speed: 1.02,
    pitch: 1,
    label: "Sovereign Empress (High-Precision British Female)",
    description: "Articulate, razor-sharp British female royal cadence.",
    gender: "female",
  },
  cyber_valkyrie: {
    voiceId: "female-yujie",
    speed: 1.05,
    pitch: -1,
    label: "Cyber Valkyrie (Steely Tactical Operative)",
    description: "Disciplined, rapid tactical female neural synthesis.",
    gender: "female",
  },
  argus: {
    voiceId: "male-qn-qingse",
    speed: 1.05,
    pitch: -2,
    label: "ARGUS British Neural (Natural Sophisticated Male)",
    description: "Crisp, hyper-intelligent, calm baritone with British acoustic cadence.",
    gender: "male",
  },
  ultron: {
    voiceId: "audiobook_male_2",
    speed: 0.92,
    pitch: -5,
    label: "ARGUS Titan (Deep Resonant Authority)",
    description: "Deep, powerful, resonant acoustic authority.",
    gender: "male",
  },
};

let currentAudio: HTMLAudioElement | null = null;

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

export function saveVoiceConfig(config: VoiceConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VOICE_CONFIG_KEY, JSON.stringify(config));
  } catch {}
}

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

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function speakWebSpeechFallback(text: string, personaKey: VoicePersona = "imposing_queen") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const clean = text.replace(/[*_`#~>[\]()]/g, "").trim();
  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  const voices = window.speechSynthesis.getVoices();

  const isFemale = PERSONA_SETTINGS[personaKey]?.gender === "female";

  let preferredVoice: SpeechSynthesisVoice | undefined;

  if (isFemale) {
    preferredVoice =
      voices.find((v) => v.name.includes("Victoria") || v.name.includes("Serena") || v.name.includes("Stephanie")) ||
      voices.find((v) => v.name.includes("Google UK English Female") || v.name.includes("en-GB") && v.name.includes("Female")) ||
      voices.find((v) => v.name.includes("Samantha") || v.name.includes("Karen") || v.name.includes("Moira") || v.name.includes("Tessa")) ||
      voices.find((v) => v.lang.startsWith("en-GB") || v.lang.startsWith("en_GB")) ||
      voices.find((v) => v.lang.startsWith("en") && !v.name.includes("Male") && !v.name.includes("David") && !v.name.includes("Guy")) ||
      voices[0];
  } else {
    preferredVoice =
      voices.find((v) => v.name.includes("Daniel") || v.name.includes("Oliver") || v.name.includes("Google UK English Male")) ||
      voices.find((v) => v.lang.startsWith("en-GB") && v.name.includes("Male")) ||
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Male") || v.name.includes("David"))) ||
      voices[0];
  }

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  if (personaKey === "imposing_queen") {
    utterance.pitch = 1.02;
    utterance.rate = 1.0;
  } else if (personaKey === "sovereign_queen") {
    utterance.pitch = 1.08;
    utterance.rate = 1.02;
  } else if (personaKey === "cyber_valkyrie") {
    utterance.pitch = 0.95;
    utterance.rate = 1.08;
  } else if (personaKey === "ultron") {
    utterance.pitch = 0.65;
    utterance.rate = 0.92;
  } else {
    utterance.pitch = 0.88;
    utterance.rate = 1.05;
  }

  window.speechSynthesis.speak(utterance);
}

// In-Memory LRU Audio Cache for instant 0ms playback of frequent phrases
const voiceAudioCache = new Map<string, string>();

export async function speakMiniMaxVoice(
  rawText: string,
  overrideConfig?: Partial<VoiceConfig>
): Promise<{ success: boolean; source: "minimax" | "webspeech" | "cache"; error?: string }> {
  const config = { ...loadVoiceConfig(), ...overrideConfig };
  if (!config.enabled) return { success: false, source: "webspeech", error: "Voice disabled" };

  stopSpeaking();

  const cleanText = rawText
    .replace(/```[\s\S]*?```/g, "Code snippet omitted.")
    .replace(/[*_`#~>[\]()]/g, "")
    .slice(0, 1000)
    .trim();

  if (!cleanText) return { success: false, source: "webspeech" };

  const personaKey = config.persona || "imposing_queen";
  const persona = PERSONA_SETTINGS[personaKey] || PERSONA_SETTINGS.imposing_queen;
  const cacheKey = `${personaKey}_${cleanText}`;

  // 1. Instant Cache Hit (0ms playback)
  if (voiceAudioCache.has(cacheKey)) {
    const cachedUrl = voiceAudioCache.get(cacheKey)!;
    try {
      const audio = new Audio(cachedUrl);
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
      };
      await audio.play();
      return { success: true, source: "cache" };
    } catch {}
  }

  // 2. MiniMax Cloud API with 1800ms Fast Timeout Guard
  if (config.minimaxEnabled && config.apiKey) {
    try {
      const groupId = config.groupId || "2002706633687311008";
      const endpoint = `https://api.minimax.io/v1/t2a_v2?GroupId=${groupId}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);

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

      clearTimeout(timeoutId);

      if (response.ok) {
        const json = await response.json();
        if (json.base_resp?.status_code === 0 && json.data?.audio) {
          const audioBytes = hexToBytes(json.data.audio);
          const blob = new Blob([audioBytes], { type: "audio/mp3" });
          const audioUrl = URL.createObjectURL(blob);

          if (voiceAudioCache.size < 50) {
            voiceAudioCache.set(cacheKey, audioUrl);
          }

          const audio = new Audio(audioUrl);
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
          };
          await audio.play();
          return { success: true, source: "minimax" };
        }
      }
    } catch (e) {
      console.warn("[ARGUS Voice] MiniMax fast failover triggered, switching to instant offline speech:", e);
    }
  }

  // 3. Fallback to High-Precision British/English Female Web Speech
  speakWebSpeechFallback(cleanText, personaKey);
  return { success: true, source: "webspeech" };
}

export { PERSONA_SETTINGS };
