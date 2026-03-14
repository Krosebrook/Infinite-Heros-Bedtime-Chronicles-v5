import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { generateSpeech, VOICE_MAP, MODE_DEFAULT_VOICES, getVoicesForMode, type VoiceConfig } from "./elevenlabs";
import { getMusicFilePath, getMusicTrackCount } from "./suno";
import { createVideoJob, getVideoJob, getVideoFilePath, isVideoAvailable } from "./video";
import { getAIRouter, getProviderStatuses, logProviderStatus } from "./ai";
import { registerAudioRoutes } from "./replit_integrations/audio";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const TTS_CACHE_DIR = path.resolve("/tmp/tts-cache");
if (!fs.existsSync(TTS_CACHE_DIR)) {
  fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });
}

const TTS_CACHE_MAX_AGE_MS = parseInt(process.env.TTS_CACHE_MAX_AGE_MS || String(24 * 60 * 60 * 1000), 10);

async function cleanTtsCache() {
  try {
    const files = await fs.promises.readdir(TTS_CACHE_DIR);
    const now = Date.now();
    let removed = 0;
    for (const file of files) {
      const filePath = path.join(TTS_CACHE_DIR, file);
      const stat = await fs.promises.stat(filePath);
      if (now - stat.mtimeMs > TTS_CACHE_MAX_AGE_MS) {
        await fs.promises.unlink(filePath);
        removed++;
      }
    }
    if (removed > 0) {
      console.log(`[Cache] Cleaned ${removed} expired TTS files`);
    }
  } catch (err) {
    console.error("[Cache] Cleanup error:", err);
  }
}

setInterval(cleanTtsCache, 60 * 60 * 1000);
cleanTtsCache();

const MAX_TTS_TEXT_LENGTH = 5000;
const MAX_INPUT_STRING_LENGTH = 500;
const VALID_MODES = ["classic", "madlibs", "sleep"];
const VALID_DURATIONS = ["short", "medium-short", "medium", "long", "epic"];

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(60 * 1000), 10);
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "10", 10);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

function sanitizeString(val: unknown, maxLen: number): string {
  if (typeof val !== "string") return "";
  return val.slice(0, maxLen).trim();
}

const aiRouter = getAIRouter();

const ART_STYLES = [
  'soft watercolor illustration with dreamy washes and gentle color bleeds',
  'bold cel-shaded cartoon style with thick outlines and flat vibrant colors',
  'textured paper cutout collage with layered shapes and handmade feel',
  'warm gouache painting style with rich opaque colors and visible brushstrokes',
  'playful crayon drawing style with textured strokes and childlike energy',
  'luminous digital painting with glowing light effects and soft gradients',
  'retro storybook illustration style reminiscent of 1960s picture books',
  'whimsical ink and wash style with fine linework and splashy color accents',
  'cozy pastel illustration with muted tones and rounded soft forms',
  'vibrant pop art style with halftone dots and high contrast primary colors',
  'gentle chalk on dark paper illustration with soft dusty textures',
  'modern flat design with geometric shapes and clean bold colors',
];

function getRandomStyle(): string {
  return ART_STYLES[Math.floor(Math.random() * ART_STYLES.length)];
}

const STORY_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    title: { type: 'string' as const },
    parts: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          text: { type: 'string' as const },
          choices: { type: 'array' as const, items: { type: 'string' as const } },
          partIndex: { type: 'number' as const },
        },
        required: ['text', 'choices', 'partIndex'] as const,
      },
    },
    vocabWord: {
      type: 'object' as const,
      properties: {
        word: { type: 'string' as const },
        definition: { type: 'string' as const },
      },
      required: ['word', 'definition'] as const,
    },
    joke: { type: 'string' as const },
    lesson: { type: 'string' as const },
    tomorrowHook: { type: 'string' as const },
    rewardBadge: {
      type: 'object' as const,
      properties: {
        emoji: { type: 'string' as const },
        title: { type: 'string' as const },
        description: { type: 'string' as const },
      },
      required: ['emoji', 'title', 'description'] as const,
    },
  },
  required: ['title', 'parts', 'vocabWord', 'joke', 'lesson', 'tomorrowHook', 'rewardBadge'] as const,
};

const CHILD_SAFETY_RULES = `
CRITICAL SAFETY RULES (non-negotiable):
- NEVER include violence, weapons, fighting, battles, or physical conflict of any kind
- NEVER include scary, frightening, dark, or horror elements — no monsters, villains, or threats
- NEVER reference real-world brands, products, celebrities, or copyrighted characters
- NEVER include death, injury, illness, abandonment, or loss themes
- NEVER include bullying, meanness, exclusion, or unkind behavior that isn't immediately resolved
- NEVER use language that could cause anxiety, fear, or nightmares
- Every choice the hero makes leads to a positive, heroic, or interesting outcome — there are no failures
- Keep all content 100% appropriate for children ages 3-9
- Focus on themes of courage, kindness, friendship, wonder, imagination, and comfort
- All conflicts should be gentle (e.g., solving puzzles, helping friends, finding lost items) and resolve peacefully`;

function getPartCount(duration: string): number {
  switch (duration) {
    case "short": return 3;
    case "medium-short": return 4;
    case "medium": return 5;
    case "long": return 6;
    case "epic": return 7;
    default: return 5;
  }
}

function getWordCount(duration: string): string {
  switch (duration) {
    case "short": return "200-300";
    case "medium-short": return "350-450";
    case "medium": return "500-650";
    case "long": return "750-950";
    case "epic": return "1000-1300";
    default: return "500-650";
  }
}

function getStorySystemPrompt(mode: string, partCount: number): string {
  const modeRules = mode === "madlibs"
    ? `You are a hilarious bedtime storyteller. Create wildly funny, silly bedtime stories.
Additional Mad Libs rules:
- Use ALL provided Mad Libs words naturally, making them integral to the plot
- Make the story absurdly funny — kids should giggle
- Include silly situations, unexpected twists, and playful humor
- Despite being funny, wind down to a peaceful, sleepy ending
- Use the hero's powers in creative, silly ways`
    : mode === "sleep"
    ? `You are a gentle, hypnotic bedtime narrator creating the most soothing story possible.
Additional Sleep Mode rules:
- Write in an extremely slow, calming, almost meditative voice
- Use heavy repetition of soothing phrases and rhythmic language
- Include progressive relaxation cues woven into the story
- Use zero-conflict narratives — absolutely no tension or obstacles
- The story should feel like a guided meditation disguised as a story
- Use shorter sentences that get progressively slower and sleepier`
    : `You are a master bedtime storyteller. Create magical, soothing bedtime stories.
Additional Classic Mode rules:
- Write in a gentle, calming narrative voice
- Include sensory details (soft sounds, warm lights, gentle breezes)
- The story should gradually become more peaceful toward the end
- Include themes of courage, kindness, friendship, or wonder`;

  const choiceInstructions = mode === "sleep"
    ? `Since this is Sleep Mode, do NOT include choices. Each part should flow naturally into the next with calming transitions.`
    : `For each part EXCEPT the last one, include exactly 3 choices the child can make. Choices should be fun, creative, and age-appropriate. Every choice leads to a positive outcome. The last part is the conclusion with no choices.`;

  return `${modeRules}

${CHILD_SAFETY_RULES}

You MUST respond with valid JSON matching this exact structure:
{
  "title": "A short magical title (3-6 words)",
  "parts": [
    {
      "text": "The story text for this part (2-4 paragraphs)",
      "choices": ["Choice A", "Choice B", "Choice C"],
      "partIndex": 0
    }
  ],
  "vocabWord": { "word": "A fun vocabulary word from the story", "definition": "Simple child-friendly definition" },
  "joke": "A short, age-appropriate joke related to the story theme",
  "lesson": "A gentle life lesson from the story (1-2 sentences)",
  "tomorrowHook": "A teaser for what adventure could happen next time (1 sentence)",
  "rewardBadge": { "emoji": "A single emoji representing the achievement", "title": "Badge Name (2-3 words)", "description": "What the child earned (1 sentence)" }
}

The story MUST have exactly ${partCount} parts. ${choiceInstructions}
Parts should have partIndex starting from 0.`;
}

function getStoryUserPrompt(
  mode: string,
  heroName: string,
  heroTitle: string,
  heroPower: string,
  heroDescription: string,
  wordCount: string,
  partCount: number,
  madlibWords?: Record<string, string>,
  soundscape?: string,
  setting?: string,
  tone?: string,
  childName?: string,
  sidekick?: string,
  problem?: string,
): string {
  let prompt = `Create a bedtime story featuring the hero "${heroName}" who is the "${heroTitle}" with the power of "${heroPower}".
Hero background: ${heroDescription}
Total story length: approximately ${wordCount} words spread across ${partCount} parts.`;

  if (childName) {
    prompt += `\nThe story is being told for a child named "${childName}" — weave their name naturally into the narrative when it feels right.`;
  }

  if (mode === "classic") {
    if (setting) {
      prompt += `\nAdventure setting: The story takes place in ${setting}. Bring this location to life with vivid sensory details.`;
    }
    if (tone) {
      const toneDescriptions: Record<string, string> = {
        gentle: "gentle and soothing — calming language, soft pacing, warm and cozy atmosphere",
        adventurous: "adventurous and exciting — energetic pacing, bold descriptions, heroic moments",
        funny: "funny and silly — include humor, playful wordplay, unexpected comic twists",
        mysterious: "mysterious and wonder-filled — intriguing atmosphere, surprising discoveries, a sense of magic",
      };
      prompt += `\nNarration tone: ${toneDescriptions[tone] || tone}.`;
    }
    if (sidekick && sidekick !== "none") {
      prompt += `\nSidekick companion: ${sidekick} accompanies the hero throughout the adventure. Give them a distinct personality and meaningful role in the story.`;
    }
    if (problem) {
      prompt += `\nCentral challenge: The story revolves around ${problem}. This is the main obstacle the hero must resolve.`;
    }
  }

  if (mode === "madlibs" && madlibWords) {
    const wordsList = Object.entries(madlibWords)
      .slice(0, 20)
      .map(([key, value]) => `${sanitizeString(key, 50)}: "${sanitizeString(value, 100)}"`)
      .join(", ");
    prompt += `\n\nThe child provided these Mad Libs words that MUST appear naturally in the story: ${wordsList}`;
  }

  if (mode === "sleep") {
    const soundscapeDescriptions: Record<string, string> = {
      rain: "the soft patter of rain on the windowsill",
      ocean: "the gentle rhythm of ocean waves",
      crickets: "the peaceful chirping of crickets in the night",
      wind: "a soft breeze rustling through the leaves",
      fire: "the warm crackling of a cozy fire",
      forest: "the quiet sounds of a moonlit forest",
    };
    const soundAnchor = soundscape && soundscapeDescriptions[soundscape]
      ? soundscapeDescriptions[soundscape]
      : "peaceful quiet";
    prompt += `\n\nThis is a Sleep Mode story. Make it extremely calming with progressive relaxation cues. No choices needed — parts flow naturally into deeper calm.
Sensory anchor: Weave in the sounds of "${soundAnchor}" throughout the story — the hero hears it and it deepens their sense of peace and safety.`;
  }

  return prompt;
}

export async function registerRoutes(app: Express): Promise<Server> {
  logProviderStatus();

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  app.get("/api/ai-providers", (_req, res) => {
    res.json({ providers: getProviderStatuses() });
  });

  app.post("/api/generate-story", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    try {
      const heroName = sanitizeString(req.body.heroName, MAX_INPUT_STRING_LENGTH);
      const heroTitle = sanitizeString(req.body.heroTitle, MAX_INPUT_STRING_LENGTH);
      const heroPower = sanitizeString(req.body.heroPower, MAX_INPUT_STRING_LENGTH);
      const heroDescription = sanitizeString(req.body.heroDescription, MAX_INPUT_STRING_LENGTH);
      const duration = sanitizeString(req.body.duration, 20);
      const mode = sanitizeString(req.body.mode, 20);
      const madlibWords = req.body.madlibWords;
      const soundscape = sanitizeString(req.body.soundscape, 30) || undefined;
      const setting = sanitizeString(req.body.setting, 100) || undefined;
      const tone = sanitizeString(req.body.tone, 50) || undefined;
      const childName = sanitizeString(req.body.childName, 50) || undefined;
      const sidekick = sanitizeString(req.body.sidekick, 100) || undefined;
      const problem = sanitizeString(req.body.problem, 100) || undefined;

      if (!heroName) {
        return res.status(400).json({ error: "Hero name is required" });
      }

      const storyMode = VALID_MODES.includes(mode) ? mode : "classic";
      const storyDuration = VALID_DURATIONS.includes(duration) ? duration : "medium";
      const wordCount = getWordCount(storyDuration);
      const partCount = getPartCount(storyDuration);

      const systemPrompt = getStorySystemPrompt(storyMode, partCount);
      const userPrompt = getStoryUserPrompt(storyMode, heroName, heroTitle, heroPower, heroDescription, wordCount, partCount, madlibWords, soundscape, setting, tone, childName, sidekick, problem);

      const aiResponse = await aiRouter.generateText("story", {
        systemPrompt,
        userPrompt,
        temperature: storyMode === "sleep" ? 0.7 : 0.9,
        maxTokens: 8192,
        jsonMode: true,
        responseSchema: STORY_RESPONSE_SCHEMA,
      });

      const content = aiResponse.text;
      if (!content) {
        return res.status(500).json({ error: "No response from AI" });
      }

      console.log(`[Story] Generated by ${aiResponse.provider} (${aiResponse.model})`);

      let rawJson = content.trim();
      rawJson = rawJson.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(500).json({ error: "Invalid story response" });
      }

      const story = JSON.parse(jsonMatch[0]);

      if (!story.parts || !Array.isArray(story.parts)) {
        return res.status(500).json({ error: "Invalid story structure" });
      }

      story.parts = story.parts.map((part: { text?: string; choices?: string[] }, i: number) => ({
        text: part.text || "",
        choices: storyMode === "sleep" ? undefined : (part.choices || undefined),
        partIndex: i,
      }));

      if (story.parts.length > 0 && storyMode !== "sleep") {
        delete story.parts[story.parts.length - 1].choices;
      }

      res.json(story);
    } catch (error) {
      console.error("Error generating story:", error);
      res.status(500).json({ error: "Failed to generate story" });
    }
  });

  app.post("/api/generate-story-stream", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    try {
      const heroName = sanitizeString(req.body.heroName, MAX_INPUT_STRING_LENGTH);
      const heroTitle = sanitizeString(req.body.heroTitle, MAX_INPUT_STRING_LENGTH);
      const heroPower = sanitizeString(req.body.heroPower, MAX_INPUT_STRING_LENGTH);
      const heroDescription = sanitizeString(req.body.heroDescription, MAX_INPUT_STRING_LENGTH);
      const duration = sanitizeString(req.body.duration, 20);
      const mode = sanitizeString(req.body.mode, 20);
      const madlibWords = req.body.madlibWords;
      const soundscape = sanitizeString(req.body.soundscape, 30) || undefined;
      const setting = sanitizeString(req.body.setting, 100) || undefined;
      const tone = sanitizeString(req.body.tone, 50) || undefined;
      const childName = sanitizeString(req.body.childName, 50) || undefined;
      const sidekick = sanitizeString(req.body.sidekick, 100) || undefined;
      const problem = sanitizeString(req.body.problem, 100) || undefined;

      if (!heroName) {
        return res.status(400).json({ error: "Hero name is required" });
      }

      const storyMode = VALID_MODES.includes(mode) ? mode : "classic";
      const storyDuration = VALID_DURATIONS.includes(duration) ? duration : "medium";
      const wordCount = getWordCount(storyDuration);
      const partCount = getPartCount(storyDuration);

      const systemPrompt = getStorySystemPrompt(storyMode, partCount);
      const userPrompt = getStoryUserPrompt(storyMode, heroName, heroTitle, heroPower, heroDescription, wordCount, partCount, madlibWords, soundscape, setting, tone, childName, sidekick, problem);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = aiRouter.generateTextStream("story", {
        systemPrompt,
        userPrompt,
        temperature: storyMode === "sleep" ? 0.7 : 0.9,
        maxTokens: 8192,
      });

      let providerInfo = "";
      for await (const chunk of stream) {
        if (!providerInfo) {
          providerInfo = `${chunk.provider}`;
          res.write(`data: ${JSON.stringify({ type: "provider", provider: chunk.provider, model: chunk.model })}\n\n`);
        }
        if (chunk.done) {
          res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ type: "chunk", text: chunk.text })}\n\n`);
        }
      }

      console.log(`[Story Stream] Generated by ${providerInfo}`);
      res.end();
    } catch (error: any) {
      console.error("Error streaming story:", error?.message || error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to generate story" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate story" });
      }
    }
  });

  app.post("/api/generate-avatar", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    try {
      const heroName = sanitizeString(req.body.heroName, MAX_INPUT_STRING_LENGTH);
      const heroTitle = sanitizeString(req.body.heroTitle, MAX_INPUT_STRING_LENGTH);
      const heroPower = sanitizeString(req.body.heroPower, MAX_INPUT_STRING_LENGTH);
      const heroDescription = sanitizeString(req.body.heroDescription, MAX_INPUT_STRING_LENGTH);

      if (!heroName) {
        return res.status(400).json({ error: "Hero name is required" });
      }

      const artStyle = getRandomStyle();
      const prompt = `A children's book illustration portrait of a superhero named "${heroName}" who is "${heroTitle}" with the power of "${heroPower}". ${heroDescription}.
Style: ${artStyle}. Close-up friendly portrait, expressive eyes, child-safe content, suitable for ages 3-9. No scary elements, no weapons. Circular portrait composition with a cosmic/starry background.`;

      const result = await aiRouter.generateImage("avatar", { prompt });
      console.log(`[Avatar] Generated by ${result.provider} (${result.model})`);
      return res.json({ image: result.imageDataUri });
    } catch (error: any) {
      console.error("Error generating avatar:", error?.message);
      res.status(500).json({ error: "Failed to generate avatar" });
    }
  });

  app.post("/api/generate-scene", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    try {
      const heroName = sanitizeString(req.body.heroName, MAX_INPUT_STRING_LENGTH);
      const sceneText = sanitizeString(req.body.sceneText, 2000);
      const heroDescription = sanitizeString(req.body.heroDescription, MAX_INPUT_STRING_LENGTH);

      if (!sceneText) {
        return res.status(400).json({ error: "Scene text is required" });
      }

      const summary = sceneText.substring(0, 300);
      const sceneStyle = getRandomStyle();
      const prompt = `Children's storybook scene illustration for a bedtime story. The hero is "${heroName}": ${heroDescription?.substring(0, 100) || ""}.
Scene: ${summary}
Style: ${sceneStyle}. Wide landscape composition, magical atmosphere, child-safe content, suitable for ages 3-9. No scary elements. Warm, cozy, wonder-filled.`;

      const result = await aiRouter.generateImage("scene", { prompt });
      console.log(`[Scene] Generated by ${result.provider} (${result.model})`);
      return res.json({ image: result.imageDataUri });
    } catch (error: any) {
      console.error("Error generating scene:", error?.message);
      res.status(500).json({ error: "Failed to generate scene" });
    }
  });

  app.post("/api/tts", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    try {
      const { text, voice, mode } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      if (text.length > MAX_TTS_TEXT_LENGTH) {
        return res.status(400).json({ error: `Text too long. Maximum ${MAX_TTS_TEXT_LENGTH} characters.` });
      }

      const voiceKey = sanitizeString(voice || "moonbeam", 20).toLowerCase();
      const storyMode = mode && typeof mode === "string" ? sanitizeString(mode, 20) : undefined;
      const hash = crypto.createHash("md5").update(`${voiceKey}:${storyMode || ""}:${text}`).digest("hex");
      const fileName = `${hash}.mp3`;
      const filePath = path.join(TTS_CACHE_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        const audioBuffer = await generateSpeech(text, voiceKey, storyMode);
        fs.writeFileSync(filePath, audioBuffer);
      }

      res.json({ audioUrl: `/api/tts-audio/${fileName}` });
    } catch (error: any) {
      console.error("TTS error:", error?.message || error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  app.get("/api/tts-audio/:file", (req, res) => {
    const fileName = req.params.file;
    if (!fileName || !/^[a-f0-9]+\.mp3$/.test(fileName)) {
      return res.status(400).json({ error: "Invalid file name" });
    }

    const filePath = path.join(TTS_CACHE_DIR, fileName);
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(TTS_CACHE_DIR)) {
      return res.status(400).json({ error: "Invalid file path" });
    }

    if (!fs.existsSync(resolved)) {
      return res.status(404).json({ error: "Audio not found" });
    }
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(resolved);
  });

  app.get("/api/music/:mode", (req, res) => {
    const mode = sanitizeString(req.params.mode, 20);
    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }
    // Parse optional track index from query param (for cycling through multiple tracks)
    const trackParam = req.query.track;
    const trackIndex = trackParam !== undefined ? parseInt(String(trackParam), 10) : undefined;
    const resolvedTrackIndex = trackIndex !== undefined && !isNaN(trackIndex) ? trackIndex : undefined;
    const filePath = getMusicFilePath(mode, resolvedTrackIndex);
    // Use a short cache so different sessions can receive different random tracks
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Music file error:", err);
        if (!res.headersSent) {
          res.status(404).json({ error: "Music file not found" });
        }
      }
    });
  });

  app.get("/api/music-info/:mode", (req, res) => {
    const mode = sanitizeString(req.params.mode, 20);
    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }
    res.json({ trackCount: getMusicTrackCount(mode) });
  });

  app.post("/api/suggest-settings", async (req, res) => {
    const clientIp = req.ip || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests" });
    }

    try {
      const heroName = sanitizeString(req.body.heroName, MAX_INPUT_STRING_LENGTH);
      const heroPower = sanitizeString(req.body.heroPower, MAX_INPUT_STRING_LENGTH);
      const heroDescription = sanitizeString(req.body.heroDescription, MAX_INPUT_STRING_LENGTH);
      const hour = typeof req.body.hour === "number" ? Math.min(23, Math.max(0, Math.floor(req.body.hour))) : new Date().getHours();
      const childAge = typeof req.body.childAge === "number" ? Math.min(12, Math.max(1, Math.floor(req.body.childAge))) : null;
      const childName = req.body.childName ? sanitizeString(req.body.childName, 30) : null;

      const timeOfDay = hour >= 19 || hour < 6 ? "nighttime/bedtime" : hour >= 17 ? "evening" : hour >= 12 ? "afternoon" : "morning";

      const voiceKeys = Object.keys(VOICE_MAP);
      const sleepVoices = getVoicesForMode("sleep").join(", ");
      const classicVoices = getVoicesForMode("classic").join(", ");
      const funVoices = getVoicesForMode("madlibs").join(", ");

      const ageContext = childAge ? ` Child age: ${childAge} years old.${childAge <= 5 ? " For younger kids, prefer shorter, gentler stories with sleep mode." : " For older kids, classic and madlibs modes with longer stories work great."}` : "";
      const nameContext = childName ? ` Child name: ${childName}.` : "";

      const userPrompt = `Suggest bedtime story settings as JSON. Time: ${timeOfDay}.${ageContext}${nameContext} Hero: ${heroName} (${heroPower}). Modes: classic, madlibs, sleep. Durations: short, medium-short, medium, long, epic. Speeds: gentle, medium, normal. Voice categories - Sleep voices: ${sleepVoices}. Classic voices: ${classicVoices}. Fun/madlibs voices: ${funVoices}. IMPORTANT: Match voice to mode (sleep voices for sleep, classic voices for classic, fun voices for madlibs). Night=sleep+gentle+short. Afternoon=classic/madlibs+medium/normal. Reply ONLY with: {"mode":"...","duration":"...","speed":"...","voice":"...","tip":"short parent-friendly reason"}`;

      const aiResponse = await aiRouter.generateText("suggestion", {
        systemPrompt: "You are a helpful assistant that suggests bedtime story settings. Respond with valid JSON only.",
        userPrompt,
        temperature: 0.7,
        maxTokens: 2048,
        thinkingBudget: 0,
      });

      console.log(`[Suggest] Generated by ${aiResponse.provider} (${aiResponse.model})`);

      let text = aiResponse.text?.trim() || "";
      text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("AI suggest-settings: no JSON in response");
        return res.status(500).json({ error: "Invalid AI response" });
      }

      const suggestion = JSON.parse(jsonMatch[0]);

      if (!VALID_MODES.includes(suggestion.mode)) suggestion.mode = "classic";
      if (!VALID_DURATIONS.includes(suggestion.duration)) suggestion.duration = "medium";
      if (!["gentle", "medium", "normal"].includes(suggestion.speed)) suggestion.speed = "medium";
      if (!voiceKeys.includes(suggestion.voice)) suggestion.voice = MODE_DEFAULT_VOICES[suggestion.mode] || "moonbeam";
      if (typeof suggestion.tip !== "string") suggestion.tip = "A great story awaits!";
      suggestion.tip = suggestion.tip.slice(0, 120);

      res.json(suggestion);
    } catch (error: any) {
      console.error("Suggest settings error:", error?.message || error);
      res.status(500).json({ error: "Failed to generate suggestion" });
    }
  });

  app.get("/api/voices", (_req, res) => {
    const voices = Object.entries(VOICE_MAP).map(([key, val]) => ({
      id: key,
      name: val.name,
      characterName: val.characterName,
      description: val.description,
      accent: val.accent,
      personality: val.personality,
      category: val.category,
    }));
    res.json({ voices, defaults: MODE_DEFAULT_VOICES });
  });

  app.get("/api/video-available", (_req, res) => {
    res.json({ available: isVideoAvailable() });
  });

  app.post("/api/generate-video", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    try {
      const sceneText = sanitizeString(req.body.sceneText, 2000);
      const heroName = sanitizeString(req.body.heroName, MAX_INPUT_STRING_LENGTH);
      const heroDescription = sanitizeString(req.body.heroDescription, MAX_INPUT_STRING_LENGTH);

      if (!sceneText) {
        return res.status(400).json({ error: "Scene text is required" });
      }

      const result = await createVideoJob(sceneText, heroName, heroDescription);
      if ("error" in result) {
        return res.status(503).json({ error: result.error });
      }

      res.json({ jobId: result.jobId });
    } catch (error: any) {
      console.error("Video generation error:", error?.message || error);
      res.status(500).json({ error: "Failed to start video generation" });
    }
  });

  app.get("/api/video-status/:id", (req, res) => {
    const jobId = sanitizeString(req.params.id, 32);
    if (!jobId) {
      return res.status(400).json({ error: "Job ID is required" });
    }

    const job = getVideoJob(jobId);
    if (!job) {
      return res.status(404).json({ error: "Video job not found" });
    }

    res.json({
      status: job.status,
      progress: job.progress,
      error: job.error,
      videoUrl: job.status === "completed" ? `/api/video/${jobId}` : undefined,
    });
  });

  app.get("/api/video/:id", (req, res) => {
    const jobId = req.params.id;
    if (!jobId || !/^[a-f0-9]+$/.test(jobId)) {
      return res.status(400).json({ error: "Invalid video ID" });
    }

    const filePath = getVideoFilePath(jobId);
    if (!filePath) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: "Failed to serve video" });
      }
    });
  });

  app.post("/api/tts-preview", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests" });
    }

    try {
      const voiceKey = sanitizeString(req.body.voice || "moonbeam", 20).toLowerCase();
      const voiceInfo = VOICE_MAP[voiceKey];
      if (!voiceInfo) {
        return res.status(400).json({ error: "Invalid voice" });
      }

      const previewText = voiceInfo.previewText;
      const hash = crypto.createHash("md5").update(`preview:${voiceKey}:${previewText}`).digest("hex");
      const fileName = `${hash}.mp3`;
      const filePath = path.join(TTS_CACHE_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        const audioBuffer = await generateSpeech(previewText, voiceKey);
        fs.writeFileSync(filePath, audioBuffer);
      }

      res.json({ audioUrl: `/api/tts-audio/${fileName}` });
    } catch (error: any) {
      console.error("TTS preview error:", error?.message || error);
      res.status(500).json({ error: "Failed to generate preview" });
    }
  });

  // Register voice chat & conversation routes (replit_integrations)
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.DATABASE_URL) {
    registerAudioRoutes(app);
    console.log("[Routes] Voice chat & conversation routes registered");
  }

  const httpServer = createServer(app);
  return httpServer;
}
