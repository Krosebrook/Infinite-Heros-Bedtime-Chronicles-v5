import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import type { Express } from "express";
import type { Server } from "node:http";

// Mock the AI module before importing routes
vi.mock("../../server/ai", () => {
  const mockRouter = {
    generateText: vi.fn(async () => ({
      text: JSON.stringify({
        title: "Test Story",
        parts: [
          { text: "Once upon a time...", choices: ["Go left", "Go right", "Stay"], partIndex: 0 },
          { text: "The end.", choices: [], partIndex: 1 },
        ],
        vocabWord: { word: "brave", definition: "showing courage" },
        joke: "Why did the hero cross the road?",
        lesson: "Be kind to others",
        tomorrowHook: "Next time we'll explore the forest!",
        rewardBadge: { emoji: "x", title: "Test Badge", description: "A test badge" },
      }),
      provider: "gemini",
      model: "gemini-test",
    })),
    generateImage: vi.fn(async () => ({
      imageDataUri: "data:image/png;base64,mockimage",
      provider: "gemini",
      model: "gemini-image-test",
    })),
    generateTextStream: vi.fn(async function* () {
      yield { text: '{"title":"streamed"}', done: false, provider: "gemini", model: "gemini-test" };
      yield { text: "", done: true, provider: "gemini", model: "gemini-test" };
    }),
  };

  return {
    getAIRouter: () => mockRouter,
    getProviderStatuses: () => [
      { name: "gemini", displayName: "Gemini", available: true, capabilities: { text: true, image: true, streaming: true } },
    ],
    logProviderStatus: vi.fn(),
  };
});

// Mock elevenlabs
vi.mock("../../server/elevenlabs", () => ({
  generateSpeech: vi.fn(async () => Buffer.from("mock-audio")),
  VOICE_MAP: {
    moonbeam: {
      id: "test-id",
      name: "Laura",
      characterName: "Moonbeam",
      description: "Warm",
      accent: "American",
      personality: "Calm",
      category: "sleep",
      previewText: "Hello",
      settings: { stability: 0.9, similarity_boost: 0.8, style: 0.05, use_speaker_boost: false },
    },
  },
  MODE_DEFAULT_VOICES: { sleep: "moonbeam", classic: "captain", madlibs: "giggles" },
  getVoicesForMode: vi.fn(() => ["moonbeam"]),
}));

// Mock suno
vi.mock("../../server/suno", () => ({
  getMusicFilePath: vi.fn(() => "/tmp/nonexistent.mp3"),
  getMusicFileName: vi.fn(() => "classic.mp3"),
}));

// Mock video
vi.mock("../../server/video", () => ({
  isVideoAvailable: vi.fn(() => false),
  createVideoJob: vi.fn(async () => ({ jobId: "test-job" })),
  getVideoJob: vi.fn(() => null),
  getVideoFilePath: vi.fn(() => null),
}));

// Mock the audio routes registration
vi.mock("../../server/replit_integrations/audio", () => ({
  registerAudioRoutes: vi.fn(),
}));

import { registerRoutes } from "../../server/routes";

let app: Express;
let server: Server;

beforeAll(async () => {
  app = express();
  app.use(express.json());
  server = await registerRoutes(app);
});

afterAll(() => {
  server?.close();
});

describe("GET /api/health", () => {
  it("returns status ok with timestamp", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeTypeOf("number");
  });
});

describe("GET /api/ai-providers", () => {
  it("returns provider list", async () => {
    const res = await request(app).get("/api/ai-providers");
    expect(res.status).toBe(200);
    expect(res.body.providers).toBeInstanceOf(Array);
    expect(res.body.providers[0].name).toBe("gemini");
  });
});

describe("GET /api/voices", () => {
  it("returns voice list with defaults", async () => {
    const res = await request(app).get("/api/voices");
    expect(res.status).toBe(200);
    expect(res.body.voices).toBeInstanceOf(Array);
    expect(res.body.defaults).toBeDefined();
    expect(res.body.defaults.sleep).toBe("moonbeam");
  });
});

describe("GET /api/video-available", () => {
  it("returns availability status", async () => {
    const res = await request(app).get("/api/video-available");
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
  });
});

describe("POST /api/generate-story", () => {
  it("returns a valid story when heroName provided", async () => {
    const res = await request(app)
      .post("/api/generate-story")
      .send({
        heroName: "Nova",
        heroTitle: "Guardian of Light",
        heroPower: "Starlight Shield",
        heroDescription: "Protects sleeping children",
        duration: "medium",
        mode: "classic",
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Test Story");
    expect(res.body.parts).toBeInstanceOf(Array);
    expect(res.body.parts.length).toBeGreaterThan(0);
    expect(res.body.vocabWord).toBeDefined();
    expect(res.body.joke).toBeDefined();
    expect(res.body.lesson).toBeDefined();
  });

  it("returns 400 when heroName is missing", async () => {
    const res = await request(app)
      .post("/api/generate-story")
      .send({ mode: "classic" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Hero name");
  });

  it("falls back to classic mode for invalid mode", async () => {
    const res = await request(app)
      .post("/api/generate-story")
      .send({ heroName: "Nova", mode: "invalid" });

    expect(res.status).toBe(200);
  });

  it("falls back to medium duration for invalid duration", async () => {
    const res = await request(app)
      .post("/api/generate-story")
      .send({ heroName: "Nova", duration: "invalid" });

    expect(res.status).toBe(200);
  });
});

describe("POST /api/generate-avatar", () => {
  it("returns image data when heroName provided", async () => {
    const res = await request(app)
      .post("/api/generate-avatar")
      .send({ heroName: "Nova", heroTitle: "Guardian", heroPower: "Shield", heroDescription: "Hero" });

    expect(res.status).toBe(200);
    expect(res.body.image).toContain("data:image");
  });

  it("returns 400 when heroName is missing", async () => {
    const res = await request(app)
      .post("/api/generate-avatar")
      .send({ heroTitle: "Guardian" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Hero name");
  });
});

describe("POST /api/generate-scene", () => {
  it("returns image for valid scene text", async () => {
    const res = await request(app)
      .post("/api/generate-scene")
      .send({ heroName: "Nova", sceneText: "A magical forest", heroDescription: "Guardian" });

    expect(res.status).toBe(200);
    expect(res.body.image).toBeDefined();
  });

  it("returns 400 when sceneText is missing", async () => {
    const res = await request(app)
      .post("/api/generate-scene")
      .send({ heroName: "Nova", sceneText: "" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Scene text");
  });
});

describe("POST /api/tts", () => {
  it("returns 400 when text is missing", async () => {
    const res = await request(app)
      .post("/api/tts")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Text is required");
  });

  it("returns 400 when text exceeds max length", async () => {
    const res = await request(app)
      .post("/api/tts")
      .send({ text: "a".repeat(5001) });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("too long");
  });
});

describe("GET /api/tts-audio/:file", () => {
  it("rejects invalid file names", async () => {
    const res = await request(app).get("/api/tts-audio/..%2F..%2Fetc%2Fpasswd");
    expect([400, 404]).toContain(res.status);
  });

  it("rejects non-hex filenames", async () => {
    const res = await request(app).get("/api/tts-audio/notahex.mp3");
    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent valid filename", async () => {
    const res = await request(app).get("/api/tts-audio/deadbeef.mp3");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/music/:mode", () => {
  it("rejects invalid mode", async () => {
    const res = await request(app).get("/api/music/invalid");
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid mode");
  });
});

describe("POST /api/suggest-settings", () => {
  it("returns suggestion with valid fields or 429 if rate limited", async () => {
    // Override the mock for this test to return a proper suggestion JSON
    const { getAIRouter } = await import("../../server/ai");
    const mockRouter = getAIRouter() as any;
    const originalFn = mockRouter.generateText;
    mockRouter.generateText = vi.fn(async () => ({
      text: JSON.stringify({ mode: "classic", duration: "medium", speed: "medium", voice: "moonbeam", tip: "Great time for a story!" }),
      provider: "gemini",
      model: "gemini-test",
    }));

    const res = await request(app)
      .post("/api/suggest-settings")
      .send({ heroName: "Nova", heroPower: "Shield", heroDescription: "Hero" });

    // May be rate-limited by earlier tests sharing the same IP
    if (res.status === 200) {
      expect(res.body.mode).toBeDefined();
      expect(res.body.duration).toBeDefined();
    } else {
      expect(res.status).toBe(429);
    }

    // Restore
    mockRouter.generateText = originalFn;
  });
});

describe("POST /api/generate-video", () => {
  it("returns 400 when sceneText is missing (or 429 if rate limited)", async () => {
    const res = await request(app)
      .post("/api/generate-video")
      .send({ heroName: "Nova" });

    // May be rate-limited by earlier tests
    expect([400, 429]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.error).toContain("Scene text");
    }
  });
});

describe("GET /api/video-status/:id", () => {
  it("returns 404 for unknown job", async () => {
    const res = await request(app).get("/api/video-status/nonexistent");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/video/:id", () => {
  it("rejects non-hex video ID", async () => {
    const res = await request(app).get("/api/video/not-hex!");
    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent video", async () => {
    const res = await request(app).get("/api/video/deadbeef");
    expect(res.status).toBe(404);
  });
});

describe("Rate limiting", () => {
  it("returns 429 after exceeding rate limit", async () => {
    // Make many requests quickly to trigger rate limit
    const promises = Array.from({ length: 15 }, () =>
      request(app)
        .post("/api/generate-story")
        .send({ heroName: "Nova" })
    );

    const results = await Promise.all(promises);
    const rateLimited = results.filter((r) => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
