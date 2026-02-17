// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";
import { GoogleGenAI, Modality } from "@google/genai";

// server/elevenlabs.ts
import { ElevenLabsClient } from "elevenlabs";
var connectionSettings;
async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? "repl " + process.env.REPL_IDENTITY : process.env.WEB_REPL_RENEWAL ? "depl " + process.env.WEB_REPL_RENEWAL : null;
  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found for repl/depl");
  }
  connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=elevenlabs",
    {
      headers: {
        "Accept": "application/json",
        "X_REPLIT_TOKEN": xReplitToken
      }
    }
  ).then((res) => res.json()).then((data) => data.items?.[0]);
  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error("ElevenLabs not connected");
  }
  return connectionSettings.settings.api_key;
}
async function getElevenLabsClient() {
  const apiKey = await getCredentials();
  return new ElevenLabsClient({ apiKey });
}
var VOICE_MAP = {
  "kore": { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Soothing" },
  "aoede": { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", description: "Melodic" },
  "zephyr": { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Gentle" },
  "leda": { id: "jBpfuIE2acCO8z3wKNLl", name: "Gigi", description: "Ethereal" },
  "puck": { id: "jsCqWAovK2LkecY7zXl4", name: "Freya", description: "Playful" },
  "charon": { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", description: "Deep" },
  "fenrir": { id: "CYw3kZ02Hs0563khs1Fj", name: "Dave", description: "Bold" }
};
async function generateSpeech(text, voiceKey) {
  const client = await getElevenLabsClient();
  const voiceInfo = VOICE_MAP[voiceKey.toLowerCase()] || VOICE_MAP["kore"];
  const audioStream = await client.textToSpeech.convert(voiceInfo.id, {
    text,
    model_id: "eleven_multilingual_v2",
    output_format: "mp3_44100_128",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.8,
      style: 0.45,
      use_speaker_boost: true
    }
  });
  const chunks = [];
  for await (const chunk of audioStream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

// server/suno.ts
import path from "node:path";
var MODE_MUSIC_FILES = {
  classic: "classic.mp3",
  madlibs: "madlibs.mp3",
  sleep: "sleep.mp3"
};
function getMusicFilePath(mode) {
  const file = MODE_MUSIC_FILES[mode] || MODE_MUSIC_FILES.classic;
  return path.resolve("assets", "music", file);
}

// server/routes.ts
import crypto from "node:crypto";
import fs from "node:fs";
import path2 from "node:path";
var TTS_CACHE_DIR = path2.resolve("/tmp/tts-cache");
if (!fs.existsSync(TTS_CACHE_DIR)) {
  fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });
}
var ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL
  }
});
var CHILD_SAFETY_RULES = `
CRITICAL SAFETY RULES (non-negotiable):
- NEVER include violence, weapons, fighting, battles, or physical conflict of any kind
- NEVER include scary, frightening, dark, or horror elements \u2014 no monsters, villains, or threats
- NEVER reference real-world brands, products, celebrities, or copyrighted characters
- NEVER include death, injury, illness, abandonment, or loss themes
- NEVER include bullying, meanness, exclusion, or unkind behavior that isn't immediately resolved
- NEVER use language that could cause anxiety, fear, or nightmares
- Every choice the hero makes leads to a positive, heroic, or interesting outcome \u2014 there are no failures
- Keep all content 100% appropriate for children ages 3-9
- Focus on themes of courage, kindness, friendship, wonder, imagination, and comfort
- All conflicts should be gentle (e.g., solving puzzles, helping friends, finding lost items) and resolve peacefully`;
function getPartCount(duration) {
  switch (duration) {
    case "short":
      return 3;
    case "medium-short":
      return 4;
    case "medium":
      return 5;
    case "long":
      return 6;
    case "epic":
      return 7;
    default:
      return 5;
  }
}
function getWordCount(duration) {
  switch (duration) {
    case "short":
      return "200-300";
    case "medium-short":
      return "350-450";
    case "medium":
      return "500-650";
    case "long":
      return "750-950";
    case "epic":
      return "1000-1300";
    default:
      return "500-650";
  }
}
function getStorySystemPrompt(mode, partCount) {
  const modeRules = mode === "madlibs" ? `You are a hilarious bedtime storyteller. Create wildly funny, silly bedtime stories.
Additional Mad Libs rules:
- Use ALL provided Mad Libs words naturally, making them integral to the plot
- Make the story absurdly funny \u2014 kids should giggle
- Include silly situations, unexpected twists, and playful humor
- Despite being funny, wind down to a peaceful, sleepy ending
- Use the hero's powers in creative, silly ways` : mode === "sleep" ? `You are a gentle, hypnotic bedtime narrator creating the most soothing story possible.
Additional Sleep Mode rules:
- Write in an extremely slow, calming, almost meditative voice
- Use heavy repetition of soothing phrases and rhythmic language
- Include progressive relaxation cues woven into the story
- Use zero-conflict narratives \u2014 absolutely no tension or obstacles
- The story should feel like a guided meditation disguised as a story
- Use shorter sentences that get progressively slower and sleepier` : `You are a master bedtime storyteller. Create magical, soothing bedtime stories.
Additional Classic Mode rules:
- Write in a gentle, calming narrative voice
- Include sensory details (soft sounds, warm lights, gentle breezes)
- The story should gradually become more peaceful toward the end
- Include themes of courage, kindness, friendship, or wonder`;
  const choiceInstructions = mode === "sleep" ? `Since this is Sleep Mode, do NOT include choices. Each part should flow naturally into the next with calming transitions.` : `For each part EXCEPT the last one, include exactly 3 choices the child can make. Choices should be fun, creative, and age-appropriate. Every choice leads to a positive outcome. The last part is the conclusion with no choices.`;
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
function getStoryUserPrompt(mode, heroName, heroTitle, heroPower, heroDescription, wordCount, partCount, madlibWords) {
  let prompt = `Create a bedtime story featuring the hero "${heroName}" who is the "${heroTitle}" with the power of "${heroPower}".
Hero background: ${heroDescription}
Total story length: approximately ${wordCount} words spread across ${partCount} parts.`;
  if (mode === "madlibs" && madlibWords) {
    const wordsList = Object.entries(madlibWords).map(([key, value]) => `${key}: "${value}"`).join(", ");
    prompt += `

The child provided these Mad Libs words that MUST appear naturally in the story: ${wordsList}`;
  }
  if (mode === "sleep") {
    prompt += `

This is a Sleep Mode story. Make it extremely calming with progressive relaxation cues. No choices needed \u2014 parts flow naturally.`;
  }
  return prompt;
}
async function registerRoutes(app2) {
  app2.post("/api/generate-story", async (req, res) => {
    try {
      const { heroName, heroTitle, heroPower, heroDescription, duration, mode, madlibWords } = req.body;
      if (!heroName) {
        return res.status(400).json({ error: "Hero name is required" });
      }
      const storyMode = mode || "classic";
      const wordCount = getWordCount(duration || "medium");
      const partCount = getPartCount(duration || "medium");
      const systemPrompt = getStorySystemPrompt(storyMode, partCount);
      const userPrompt = getStoryUserPrompt(storyMode, heroName, heroTitle, heroPower, heroDescription, wordCount, partCount, madlibWords);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: userPrompt }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: storyMode === "sleep" ? 0.7 : 0.9,
          maxOutputTokens: 8192,
          responseMimeType: "application/json"
        }
      });
      const content = response.text;
      if (!content) {
        return res.status(500).json({ error: "No response from AI" });
      }
      const story = JSON.parse(content);
      if (!story.parts || !Array.isArray(story.parts)) {
        return res.status(500).json({ error: "Invalid story structure" });
      }
      story.parts = story.parts.map((part, i) => ({
        text: part.text || "",
        choices: storyMode === "sleep" ? void 0 : part.choices || void 0,
        partIndex: i
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
  app2.post("/api/generate-avatar", async (req, res) => {
    try {
      const { heroName, heroTitle, heroPower, heroDescription } = req.body;
      if (!heroName) {
        return res.status(400).json({ error: "Hero name is required" });
      }
      const prompt = `Create a cute, friendly, child-safe cartoon avatar of a superhero character named "${heroName}" who is "${heroTitle}" with the power of "${heroPower}". ${heroDescription}. 
Style: Adorable Pixar/Disney-inspired character design, round friendly features, big expressive eyes, vibrant colors, cosmic/starry background, suitable for ages 3-9. No scary elements, no weapons. Circular portrait composition.`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE]
        }
      });
      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find(
        (part) => part.inlineData
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
  app2.post("/api/generate-scene", async (req, res) => {
    try {
      const { heroName, sceneText, heroDescription } = req.body;
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
          responseModalities: [Modality.TEXT, Modality.IMAGE]
        }
      });
      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find(
        (part) => part.inlineData
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
  app2.post("/api/tts", async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }
      const voiceKey = (voice || "kore").toLowerCase();
      const hash = crypto.createHash("md5").update(`${voiceKey}:${text}`).digest("hex");
      const fileName = `${hash}.mp3`;
      const filePath = path2.join(TTS_CACHE_DIR, fileName);
      if (!fs.existsSync(filePath)) {
        const audioBuffer = await generateSpeech(text, voiceKey);
        fs.writeFileSync(filePath, audioBuffer);
      }
      res.json({ audioUrl: `/api/tts-audio/${fileName}` });
    } catch (error) {
      console.error("TTS error:", error?.message || error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });
  app2.get("/api/tts-audio/:file", (req, res) => {
    const filePath = path2.join(TTS_CACHE_DIR, req.params.file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Audio not found" });
    }
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(filePath);
  });
  app2.get("/api/music/:mode", (req, res) => {
    const mode = req.params.mode || "classic";
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
  app2.get("/api/voices", (_req, res) => {
    const voices = Object.entries(VOICE_MAP).map(([key, val]) => ({
      id: key,
      name: val.name,
      description: val.description
    }));
    res.json({ voices });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs2 from "fs";
import * as path3 from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path4 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path4.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path3.resolve(process.cwd(), "app.json");
    const appJsonContent = fs2.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path3.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs2.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs2.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path3.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs2.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path3.resolve(process.cwd(), "assets")));
  app2.use(express.static(path3.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
