import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { GoogleGenAI, Modality } from "@google/genai";
import { generateSpeech, VOICE_MAP } from "./elevenlabs";
import { getMusicFilePath, getMusicFileName } from "./suno";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const TTS_CACHE_DIR = path.resolve("/tmp/tts-cache");
if (!fs.existsSync(TTS_CACHE_DIR)) {
  fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });
}

const TTS_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function cleanTtsCache() {
  try {
    const files = fs.readdirSync(TTS_CACHE_DIR);
    const now = Date.now();
    let removed = 0;
    for (const file of files) {
      const filePath = path.join(TTS_CACHE_DIR, file);
      const stat = fs.statSync(filePath);
      if (now - stat.mtimeMs > TTS_CACHE_MAX_AGE_MS) {
        fs.unlinkSync(filePath);
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
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;

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

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

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
  madlibWords?: Record<string, string>
): string {
  let prompt = `Create a bedtime story featuring the hero "${heroName}" who is the "${heroTitle}" with the power of "${heroPower}".
Hero background: ${heroDescription}
Total story length: approximately ${wordCount} words spread across ${partCount} parts.`;

  if (mode === "madlibs" && madlibWords) {
    const wordsList = Object.entries(madlibWords)
      .slice(0, 20)
      .map(([key, value]) => `${sanitizeString(key, 50)}: "${sanitizeString(value, 100)}"`)
      .join(", ");
    prompt += `\n\nThe child provided these Mad Libs words that MUST appear naturally in the story: ${wordsList}`;
  }

  if (mode === "sleep") {
    prompt += `\n\nThis is a Sleep Mode story. Make it extremely calming with progressive relaxation cues. No choices needed — parts flow naturally.`;
  }

  return prompt;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
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

      if (!heroName) {
        return res.status(400).json({ error: "Hero name is required" });
      }

      const storyMode = VALID_MODES.includes(mode) ? mode : "classic";
      const storyDuration = VALID_DURATIONS.includes(duration) ? duration : "medium";
      const wordCount = getWordCount(storyDuration);
      const partCount = getPartCount(storyDuration);

      const systemPrompt = getStorySystemPrompt(storyMode, partCount);
      const userPrompt = getStoryUserPrompt(storyMode, heroName, heroTitle, heroPower, heroDescription, wordCount, partCount, madlibWords);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: userPrompt }] },
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: storyMode === "sleep" ? 0.7 : 0.9,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      });

      const content = response.text;
      if (!content) {
        return res.status(500).json({ error: "No response from AI" });
      }

      const story = JSON.parse(content);

      if (!story.parts || !Array.isArray(story.parts)) {
        return res.status(500).json({ error: "Invalid story structure" });
      }

      story.parts = story.parts.map((part: any, i: number) => ({
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

      const prompt = `Create a cute, friendly, child-safe cartoon avatar of a superhero character named "${heroName}" who is "${heroTitle}" with the power of "${heroPower}". ${heroDescription}. 
Style: Adorable Pixar/Disney-inspired character design, round friendly features, big expressive eyes, vibrant colors, cosmic/starry background, suitable for ages 3-9. No scary elements, no weapons. Circular portrait composition.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find(
        (part: any) => part.inlineData
      );

      if (!imagePart?.inlineData?.data) {
        return res.status(500).json({ error: "No image generated" });
      }

      const mimeType = imagePart.inlineData.mimeType || "image/png";
      res.json({ image: `data:${mimeType};base64,${imagePart.inlineData.data}` });
    } catch (error) {
      console.error("Error generating avatar:", error);
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
      const prompt = `Create a magical, child-friendly illustration for a bedtime story scene. The hero is "${heroName}": ${heroDescription?.substring(0, 100) || ""}.
Scene: ${summary}
Style: Dreamy watercolor illustration, soft pastel colors, gentle lighting, magical atmosphere, suitable for ages 3-9. No scary elements. Warm, cozy, wonder-filled. Landscape composition with soft edges.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find(
        (part: any) => part.inlineData
      );

      if (!imagePart?.inlineData?.data) {
        return res.status(500).json({ error: "No image generated" });
      }

      const mimeType = imagePart.inlineData.mimeType || "image/png";
      res.json({ image: `data:${mimeType};base64,${imagePart.inlineData.data}` });
    } catch (error) {
      console.error("Error generating scene:", error);
      res.status(500).json({ error: "Failed to generate scene" });
    }
  });

  app.post("/api/tts", async (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: "Too many requests. Please wait a moment." });
    }

    try {
      const { text, voice } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      if (text.length > MAX_TTS_TEXT_LENGTH) {
        return res.status(400).json({ error: `Text too long. Maximum ${MAX_TTS_TEXT_LENGTH} characters.` });
      }

      const voiceKey = sanitizeString(voice || "kore", 20).toLowerCase();
      const hash = crypto.createHash("md5").update(`${voiceKey}:${text}`).digest("hex");
      const fileName = `${hash}.mp3`;
      const filePath = path.join(TTS_CACHE_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        const audioBuffer = await generateSpeech(text, voiceKey);
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
    const filePath = getMusicFilePath(mode);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Music file error:", err);
        if (!res.headersSent) {
          res.status(404).json({ error: "Music file not found" });
        }
      }
    });
  });

  app.get("/api/voices", (_req, res) => {
    const voices = Object.entries(VOICE_MAP).map(([key, val]) => ({
      id: key,
      name: val.name,
      description: val.description,
    }));
    res.json({ voices });
  });

  const httpServer = createServer(app);
  return httpServer;
}
