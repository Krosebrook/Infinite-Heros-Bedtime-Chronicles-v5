const SUNO_API_BASE = "https://api.sunoapi.org/api/v1";

function getHeaders() {
  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) throw new Error("SUNO_API_KEY not configured");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

const MODE_MUSIC_STYLES: Record<string, { style: string; title: string; prompt: string }> = {
  classic: {
    style: "Orchestral, Fantasy, Cinematic, Gentle",
    title: "Hero's Gentle Adventure",
    prompt: "A gentle orchestral adventure theme for a children's bedtime story. Soft strings, warm woodwinds, twinkling bells, and a sense of wonder. Calm but magical, like floating through a starlit sky. No vocals.",
  },
  madlibs: {
    style: "Playful, Whimsical, Comedy, Children's Music",
    title: "Silly Story Time",
    prompt: "A playful, bouncy, and silly instrumental track for a funny children's story. Pizzicato strings, xylophone, quirky flutes, and gentle percussion. Light-hearted and giggly. No vocals.",
  },
  sleep: {
    style: "Ambient, Lullaby, Meditation, Piano",
    title: "Dreamtime Lullaby",
    prompt: "An extremely soft and soothing lullaby for a child falling asleep. Gentle piano, soft pads, distant wind chimes, slow tempo. Deeply calming and hypnotic, like being rocked to sleep under the stars. No vocals.",
  },
};

interface SunoGenerateResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    [key: string]: any;
  };
}

interface SunoTrack {
  id: string;
  audio_url: string;
  stream_audio_url?: string;
  title: string;
  duration?: number;
  [key: string]: any;
}

interface SunoStatusResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: string;
    response?: {
      data: SunoTrack[];
    };
    [key: string]: any;
  };
}

const musicCache = new Map<string, { audioUrl: string; generatedAt: number }>();
const CACHE_TTL = 12 * 60 * 60 * 1000;

export async function generateMusic(mode: string): Promise<string | null> {
  const cacheKey = mode;
  const cached = musicCache.get(cacheKey);
  if (cached && Date.now() - cached.generatedAt < CACHE_TTL) {
    console.log(`[Suno] Cache hit for mode: ${mode}`);
    return cached.audioUrl;
  }

  const config = MODE_MUSIC_STYLES[mode] || MODE_MUSIC_STYLES.classic;

  try {
    console.log(`[Suno] Generating music for mode: ${mode}`);
    const genResponse = await fetch(`${SUNO_API_BASE}/generate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        customMode: true,
        instrumental: true,
        model: "V4",
        style: config.style,
        title: config.title,
        prompt: config.prompt,
        negativeTags: "Heavy Metal, Scary, Intense, Loud, Aggressive",
      }),
    });

    if (!genResponse.ok) {
      const errText = await genResponse.text();
      console.error(`[Suno] Generate request failed: ${genResponse.status} ${errText}`);
      return null;
    }

    const genData = (await genResponse.json()) as SunoGenerateResponse;
    const taskId = genData.data?.taskId;
    if (!taskId) {
      console.error("[Suno] No taskId in response:", genData);
      return null;
    }

    console.log(`[Suno] Task created: ${taskId}, polling for completion...`);

    const maxWait = 180000;
    const pollInterval = 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(
        `${SUNO_API_BASE}/generate/record-info?taskId=${taskId}`,
        { headers: getHeaders() }
      );

      if (!statusResponse.ok) continue;

      const statusData = (await statusResponse.json()) as SunoStatusResponse;
      const status = statusData.data?.status;

      if (status === "SUCCESS" || status === "completed") {
        const tracks = statusData.data?.response?.data;
        if (tracks && tracks.length > 0) {
          const audioUrl = tracks[0].audio_url || tracks[0].stream_audio_url;
          if (audioUrl) {
            console.log(`[Suno] Music ready: ${audioUrl}`);
            musicCache.set(cacheKey, { audioUrl, generatedAt: Date.now() });
            return audioUrl;
          }
        }
        console.error("[Suno] Success but no audio URL found:", statusData);
        return null;
      }

      if (status === "FAILED") {
        console.error("[Suno] Generation failed:", statusData);
        return null;
      }
    }

    console.error("[Suno] Timed out waiting for music generation");
    return null;
  } catch (error) {
    console.error("[Suno] Error:", error);
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
