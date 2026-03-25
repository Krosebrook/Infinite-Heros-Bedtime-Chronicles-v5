import { ElevenLabsClient } from 'elevenlabs';

async function getCredentials(): Promise<string> {
  // Priority 1: Direct API key (most reliable, survives re-wires)
  if (process.env.ELEVENLABS_API_KEY) {
    return process.env.ELEVENLABS_API_KEY;
  }

  // Priority 2: Replit Connectors (dynamic, but fragile)
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!hostname || !xReplitToken) {
    throw new Error('ElevenLabs not configured: set ELEVENLABS_API_KEY or connect via Replit Connectors');
  }

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=elevenlabs',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings?.settings?.api_key) {
    throw new Error('ElevenLabs connector not available — reconnect in Replit Settings → Connectors');
  }
  return connectionSettings.settings.api_key;
}

export async function getElevenLabsClient() {
  const apiKey = await getCredentials();
  return new ElevenLabsClient({ apiKey });
}

export type VoiceCategory = "sleep" | "classic" | "fun";

export interface VoiceConfig {
  id: string;
  name: string;
  characterName: string;
  description: string;
  accent: string;
  personality: string;
  category: VoiceCategory;
  previewText: string;
  settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
}

export const VOICE_MAP: Record<string, VoiceConfig> = {
  "moonbeam": {
    id: "FGY2WhTYpPnrIDTdsKH5",
    name: "Laura",
    characterName: "Moonbeam",
    description: "Warm & soothing lullaby voice",
    accent: "American",
    personality: "Warm, maternal, calming",
    category: "sleep",
    previewText: "Close your eyes, little one. The stars are twinkling just for you tonight.",
    settings: { stability: 0.90, similarity_boost: 0.80, style: 0.05, use_speaker_boost: false },
  },
  "whisper": {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    characterName: "Whisper",
    description: "Soft & gentle dreamy narrator",
    accent: "American",
    personality: "Quiet, dreamy, tender",
    category: "sleep",
    previewText: "Shh... the moon is rising softly, and the world is getting sleepy.",
    settings: { stability: 0.95, similarity_boost: 0.85, style: 0.0, use_speaker_boost: false },
  },
  "stardust": {
    id: "jBpfuIE2acCO8z3wKNLl",
    name: "Gigi",
    characterName: "Stardust",
    description: "Ethereal & magical bedtime guide",
    accent: "American",
    personality: "Mystical, airy, enchanting",
    category: "sleep",
    previewText: "Let the stardust carry you away to a land of peaceful dreams.",
    settings: { stability: 0.88, similarity_boost: 0.78, style: 0.08, use_speaker_boost: false },
  },
  "captain": {
    id: "XB0fDUnXU5powFXDhCwa",
    name: "Charlotte",
    characterName: "Captain Story",
    description: "Dramatic British storyteller",
    accent: "British",
    personality: "Dramatic, expressive, enchanting",
    category: "classic",
    previewText: "Once upon a time, in a kingdom beyond the clouds, a brave hero set forth on an incredible quest!",
    settings: { stability: 0.65, similarity_boost: 0.75, style: 0.30, use_speaker_boost: true },
  },
  "professor": {
    id: "N2lVS1w4EtoT3dr4eOWO",
    name: "Callum",
    characterName: "Professor Nova",
    description: "Deep & wise adventure narrator",
    accent: "British",
    personality: "Wise, warm, authoritative",
    category: "classic",
    previewText: "Now then, pay close attention, for this tale holds secrets that only the bravest will uncover.",
    settings: { stability: 0.70, similarity_boost: 0.72, style: 0.25, use_speaker_boost: true },
  },
  "aurora": {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    characterName: "Aurora",
    description: "Warm & expressive tale weaver",
    accent: "American",
    personality: "Warm, engaging, versatile",
    category: "classic",
    previewText: "Are you ready for an adventure? Because tonight, something truly amazing is about to happen!",
    settings: { stability: 0.68, similarity_boost: 0.78, style: 0.22, use_speaker_boost: true },
  },
  "giggles": {
    id: "jsCqWAovK2LkecY7zXl4",
    name: "Freya",
    characterName: "Giggles",
    description: "Playful & silly fun narrator",
    accent: "American",
    personality: "Giggly, energetic, silly",
    category: "fun",
    previewText: "Oh my goodness, you won't BELIEVE what happened next! It was absolutely bonkers!",
    settings: { stability: 0.45, similarity_boost: 0.70, style: 0.55, use_speaker_boost: true },
  },
  "blaze": {
    id: "CYw3kZ02Hs0563khs1Fj",
    name: "Dave",
    characterName: "Blaze",
    description: "Bold & exciting action voice",
    accent: "American",
    personality: "Bold, heroic, exciting",
    category: "fun",
    previewText: "WHOOOOSH! The hero zoomed through the sky faster than a shooting star!",
    settings: { stability: 0.50, similarity_boost: 0.72, style: 0.45, use_speaker_boost: true },
  },
  "ziggy": {
    id: "XrExE9yKIg1WjnnlVkGX",
    name: "Matilda",
    characterName: "Ziggy",
    description: "Animated & cheerful character voice",
    accent: "British",
    personality: "Animated, cheerful, whimsical",
    category: "fun",
    previewText: "Hellooo there, friend! Ready to make up the silliest story ever? Let's go!",
    settings: { stability: 0.48, similarity_boost: 0.68, style: 0.50, use_speaker_boost: true },
  },
};

export const MODE_DEFAULT_VOICES: Record<string, string> = {
  sleep: "moonbeam",
  classic: "captain",
  madlibs: "giggles",
};

export const MODE_VOICE_CATEGORIES: Record<string, VoiceCategory> = {
  sleep: "sleep",
  classic: "classic",
  madlibs: "fun",
};

export function getVoicesForMode(mode: string): string[] {
  const category = MODE_VOICE_CATEGORIES[mode];
  if (!category) return Object.keys(VOICE_MAP);
  return Object.entries(VOICE_MAP)
    .filter(([_, v]) => v.category === category)
    .map(([k]) => k);
}

export async function generateSpeech(text: string, voiceKey: string, modeOverride?: string): Promise<Buffer> {
  const client = await getElevenLabsClient();
  const voiceInfo = VOICE_MAP[voiceKey.toLowerCase()] || VOICE_MAP["moonbeam"];

  let settings = { ...voiceInfo.settings };

  if (modeOverride === "sleep" && voiceInfo.category !== "sleep") {
    settings.stability = Math.min(settings.stability + 0.15, 0.95);
    settings.style = Math.max(settings.style - 0.10, 0.0);
    settings.use_speaker_boost = false;
  }

  const audioStream = await client.textToSpeech.convert(voiceInfo.id, {
    text,
    model_id: "eleven_multilingual_v2",
    output_format: "mp3_44100_128",
    voice_settings: settings,
  });

  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
