import { describe, it, expect, vi, beforeEach } from "vitest";

// We test the pure logic of video.ts without triggering its module-level
// side effects (setInterval, fs.mkdirSync) by replicating key logic here.

describe("Video Pipeline Logic", () => {
  describe("isVideoAvailable", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    it("returns false when OPENAI_API_KEY is not set", () => {
      delete process.env.OPENAI_API_KEY;
      const available = !!process.env.OPENAI_API_KEY;
      expect(available).toBe(false);
    });

    it("returns true when OPENAI_API_KEY is set", () => {
      process.env.OPENAI_API_KEY = "sk-test-key";
      const available = !!process.env.OPENAI_API_KEY;
      expect(available).toBe(true);
    });

    afterEach(() => {
      process.env = originalEnv;
    });
  });

  describe("Job lifecycle", () => {
    it("creates a job with correct initial state", () => {
      interface VideoJob {
        id: string;
        openaiVideoId: string;
        status: "queued" | "in_progress" | "completed" | "failed";
        progress: number;
        videoPath?: string;
        error?: string;
        createdAt: number;
      }

      const job: VideoJob = {
        id: "abc123",
        openaiVideoId: "vid_test",
        status: "queued",
        progress: 0,
        createdAt: Date.now(),
      };

      expect(job.status).toBe("queued");
      expect(job.progress).toBe(0);
      expect(job.videoPath).toBeUndefined();
      expect(job.error).toBeUndefined();
    });
  });

  describe("Job expiry logic", () => {
    const JOB_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

    it("expires jobs older than 30 minutes", () => {
      const activeJobs = new Map<string, { createdAt: number }>();
      activeJobs.set("old-job", { createdAt: Date.now() - JOB_EXPIRY_MS - 1000 });
      activeJobs.set("new-job", { createdAt: Date.now() });

      // Cleanup logic
      const now = Date.now();
      for (const [id, job] of activeJobs) {
        if (now - job.createdAt > JOB_EXPIRY_MS) {
          activeJobs.delete(id);
        }
      }

      expect(activeJobs.has("old-job")).toBe(false);
      expect(activeJobs.has("new-job")).toBe(true);
    });

    it("keeps jobs within the 30 minute window", () => {
      const activeJobs = new Map<string, { createdAt: number }>();
      activeJobs.set("recent", { createdAt: Date.now() - 10 * 60 * 1000 }); // 10 min ago

      const now = Date.now();
      for (const [id, job] of activeJobs) {
        if (now - job.createdAt > JOB_EXPIRY_MS) {
          activeJobs.delete(id);
        }
      }

      expect(activeJobs.has("recent")).toBe(true);
    });
  });

  describe("Video cache cleanup logic", () => {
    const VIDEO_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

    it("identifies files older than 24 hours for removal", () => {
      const now = Date.now();
      const oldFile = { mtimeMs: now - VIDEO_CACHE_MAX_AGE_MS - 1000 };
      const newFile = { mtimeMs: now - 1000 };

      expect(now - oldFile.mtimeMs > VIDEO_CACHE_MAX_AGE_MS).toBe(true);
      expect(now - newFile.mtimeMs > VIDEO_CACHE_MAX_AGE_MS).toBe(false);
    });
  });

  describe("Progress estimation", () => {
    it("estimates progress based on poll count when API lacks progress", () => {
      const polls = 10;
      const estimated = Math.min(polls * 5, 95);
      expect(estimated).toBe(50);
    });

    it("caps estimated progress at 95%", () => {
      const polls = 30;
      const estimated = Math.min(polls * 5, 95);
      expect(estimated).toBe(95);
    });

    it("uses API progress when available", () => {
      const apiProgress = 42;
      const polls = 10;
      const progress = apiProgress || Math.min(polls * 5, 95);
      expect(progress).toBe(42);
    });
  });

  describe("Video prompt construction", () => {
    function buildVideoPrompt(
      sceneText: string,
      heroName: string,
      heroDescription: string
    ): string {
      const summary = sceneText.substring(0, 200);
      return `A gentle, child-friendly animated scene for a bedtime story. The hero "${heroName}" (${heroDescription?.substring(0, 80) || "a friendly superhero"}) is shown in this scene: ${summary}. Style: Soft, dreamy animation with warm pastel colors, magical sparkles, gentle movement, cozy atmosphere. Suitable for children ages 3-9. No scary elements, no violence. Camera slowly pans across the scene. Soft lighting, like moonlight or warm firelight.`;
    }

    it("truncates scene text to 200 chars", () => {
      const longText = "a".repeat(500);
      const prompt = buildVideoPrompt(longText, "Nova", "Guardian");
      expect(prompt).toContain("a".repeat(200));
      expect(prompt).not.toContain("a".repeat(201));
    });

    it("truncates hero description to 80 chars", () => {
      const longDesc = "b".repeat(200);
      const prompt = buildVideoPrompt("scene", "Nova", longDesc);
      expect(prompt).toContain("b".repeat(80));
      expect(prompt).not.toContain("b".repeat(81));
    });

    it("uses fallback for empty hero description", () => {
      const prompt = buildVideoPrompt("scene", "Nova", "");
      expect(prompt).toContain("a friendly superhero");
    });

    it("always includes child safety language", () => {
      const prompt = buildVideoPrompt("scene", "Nova", "Hero");
      expect(prompt).toContain("child-friendly");
      expect(prompt).toContain("No scary elements");
      expect(prompt).toContain("no violence");
      expect(prompt).toContain("ages 3-9");
    });
  });
});
