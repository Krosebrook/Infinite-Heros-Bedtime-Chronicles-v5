const DEFAPI_BASE = "https://api.defapi.org/api/suno";

function getApiKey(): string {
  const apiKey = process.env.DEF_API_KEY || process.env.SUNO_API_KEY;
  if (!apiKey) throw new Error("Music API key not configured");
  return apiKey;
}

function getHeaders() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

const MODE_MUSIC_STYLES: Record<string, { tags: string; title: string; prompt: string }> = {
  classic: {
    tags: "Orchestral, Fantasy, Cinematic, Gentle",
    title: "Hero's Gentle Adventure",
    prompt: "A gentle orchestral adventure theme for a children's bedtime story. Soft strings, warm woodwinds, twinkling bells, and a sense of wonder. Calm but magical, like floating through a starlit sky.",
  },
  madlibs: {
    tags: "Playful, Whimsical, Comedy, Children's Music",
    title: "Silly Story Time",
    prompt: "A playful, bouncy, and silly instrumental track for a funny children's story. Pizzicato strings, xylophone, quirky flutes, and gentle percussion. Light-hearted and giggly.",
  },
  sleep: {
    tags: "Ambient, Lullaby, Meditation, Piano",
    title: "Dreamtime Lullaby",
    prompt: "An extremely soft and soothing lullaby for a child falling asleep. Gentle piano, soft pads, distant wind chimes, slow tempo. Deeply calming and hypnotic, like being rocked to sleep under the stars.",
  },
};

interface MusicResult {
  audioUrl: string;
  generatedAt: number;
}

const musicCache = new Map<string, MusicResult>();
const CACHE_TTL = 12 * 60 * 60 * 1000;

const pendingCallbacks = new Map<string, {
  mode: string;
  resolve: (url: string | null) => void;
  timeout: ReturnType<typeof setTimeout>;
}>();

export function handleMusicCallback(taskId: string, data: any): void {
  console.log(`[Music] Callback received for task: ${taskId}`);

  const pending = pendingCallbacks.get(taskId);
  if (!pending) {
    console.log(`[Music] No pending request for task: ${taskId}, storing anyway`);
  }

  try {
    let audioUrl: string | null = null;

    if (data?.output?.clips) {
      const clips = data.output.clips;
      const firstClip = Object.values(clips)[0] as any;
      if (firstClip?.audio_url) {
        audioUrl = firstClip.audio_url;
      }
    }

    if (!audioUrl && data?.data) {
      const items = Array.isArray(data.data) ? data.data : [data.data];
      for (const item of items) {
        if (item?.audio_url) {
          audioUrl = item.audio_url;
          break;
        }
      }
    }

    if (!audioUrl && data?.audio_url) {
      audioUrl = data.audio_url;
    }

    if (!audioUrl && Array.isArray(data)) {
      for (const item of data) {
        if (item?.audio_url) {
          audioUrl = item.audio_url;
          break;
        }
      }
    }

    if (audioUrl && pending) {
      musicCache.set(pending.mode, { audioUrl, generatedAt: Date.now() });
      clearTimeout(pending.timeout);
      pending.resolve(audioUrl);
      pendingCallbacks.delete(taskId);
      console.log(`[Music] Audio URL resolved: ${audioUrl}`);
    } else if (audioUrl) {
      console.log(`[Music] Got audio URL but no pending handler: ${audioUrl}`);
    } else {
      console.log(`[Music] Callback data did not contain audio_url:`, JSON.stringify(data).slice(0, 500));
      if (pending) {
        clearTimeout(pending.timeout);
        pending.resolve(null);
        pendingCallbacks.delete(taskId);
      }
    }
  } catch (err) {
    console.error(`[Music] Error processing callback:`, err);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(null);
      pendingCallbacks.delete(taskId);
    }
  }
}

function getCallbackUrl(): string {
  const domain = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN;
  if (!domain) throw new Error("No domain configured for callback");
  return `https://${domain}:5000/api/music-callback`;
}

export async function generateMusic(mode: string): Promise<string | null> {
  const cached = musicCache.get(mode);
  if (cached && Date.now() - cached.generatedAt < CACHE_TTL) {
    console.log(`[Music] Cache hit for mode: ${mode}`);
    return cached.audioUrl;
  }

  const config = MODE_MUSIC_STYLES[mode] || MODE_MUSIC_STYLES.classic;

  try {
    const callbackUrl = getCallbackUrl();
    console.log(`[Music] Generating for mode: ${mode}, callback: ${callbackUrl}`);

    const genResponse = await fetch(`${DEFAPI_BASE}/generate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        mv: "chirp-v4-5",
        custom_mode: true,
        make_instrumental: true,
        tags: config.tags,
        title: config.title,
        prompt: config.prompt,
        negative_tags: "Heavy Metal, Scary, Intense, Loud, Aggressive",
        callback_url: callbackUrl,
      }),
    });

    if (!genResponse.ok) {
      const errText = await genResponse.text();
      console.error(`[Music] Generate request failed: ${genResponse.status} ${errText}`);
      return null;
    }

    const genData = await genResponse.json() as any;
    const taskId = genData.data?.task_id;
    if (!taskId) {
      console.error("[Music] No task_id in response:", genData);
      return null;
    }

    console.log(`[Music] Task created: ${taskId}, waiting for callback...`);

    return new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => {
        console.error(`[Music] Timeout waiting for callback on task: ${taskId}`);
        pendingCallbacks.delete(taskId);
        resolve(null);
      }, 300000);

      pendingCallbacks.set(taskId, { mode, resolve, timeout });
    });
  } catch (error) {
    console.error("[Music] Error:", error);
    return null;
  }
}

const pendingGenerations = new Map<string, Promise<string | null>>();

export async function generateMusicCached(mode: string): Promise<string | null> {
  const cached = musicCache.get(mode);
  if (cached && Date.now() - cached.generatedAt < CACHE_TTL) {
    return cached.audioUrl;
  }

  const pending = pendingGenerations.get(mode);
  if (pending) {
    return pending;
  }

  const promise = generateMusic(mode).finally(() => {
    pendingGenerations.delete(mode);
  });
  pendingGenerations.set(mode, promise);
  return promise;
}

export function isApiKeyConfigured(): boolean {
  return !!(process.env.DEF_API_KEY || process.env.SUNO_API_KEY);
}
