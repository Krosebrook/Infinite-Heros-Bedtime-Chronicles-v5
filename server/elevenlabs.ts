import { ElevenLabsClient } from 'elevenlabs';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=elevenlabs',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error('ElevenLabs not connected');
  }
  return connectionSettings.settings.api_key;
}

export async function getElevenLabsClient() {
  const apiKey = await getCredentials();
  return new ElevenLabsClient({ apiKey });
}

export const VOICE_MAP: Record<string, { id: string; name: string; description: string }> = {
  "kore": { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Soothing" },
  "aoede": { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", description: "Melodic" },
  "zephyr": { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Gentle" },
  "leda": { id: "jBpfuIE2acCO8z3wKNLl", name: "Gigi", description: "Ethereal" },
  "puck": { id: "jsCqWAovK2LkecY7zXl4", name: "Freya", description: "Playful" },
  "charon": { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", description: "Deep" },
  "fenrir": { id: "CYw3kZ02Hs0563khs1Fj", name: "Dave", description: "Bold" },
};

export async function generateSpeech(text: string, voiceKey: string): Promise<Buffer> {
  const client = await getElevenLabsClient();
  const voiceInfo = VOICE_MAP[voiceKey.toLowerCase()] || VOICE_MAP["kore"];

  const audioStream = await client.textToSpeech.convert(voiceInfo.id, {
    text,
    model_id: "eleven_multilingual_v2",
    output_format: "mp3_44100_128",
    voice_settings: {
      stability: 0.75,
      similarity_boost: 0.75,
      style: 0.15,
      use_speaker_boost: false,
    },
  });

  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
