import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIRouter } from "../../server/ai/router";
import { createMockProvider, createFailingProvider, createJsonProvider } from "../setup";
import type { AIProvider, StreamingTextChunk } from "../../server/ai/types";

describe("AIRouter", () => {
  let router: AIRouter;

  beforeEach(() => {
    router = new AIRouter();
  });

  describe("registerProvider / getProvider", () => {
    it("registers and retrieves a provider", () => {
      const provider = createMockProvider("gemini");
      router.registerProvider(provider);
      expect(router.getProvider("gemini")).toBe(provider);
    });

    it("returns undefined for unregistered provider", () => {
      expect(router.getProvider("gemini")).toBeUndefined();
    });
  });

  describe("getAvailableProviders", () => {
    it("filters out unavailable providers", () => {
      router.registerProvider(createMockProvider("gemini"));
      router.registerProvider(createMockProvider("openai", { isAvailable: () => false }));
      const available = router.getAvailableProviders();
      expect(available).toHaveLength(1);
      expect(available[0].name).toBe("gemini");
    });
  });

  describe("generateText", () => {
    const req = {
      systemPrompt: "You are a storyteller.",
      userPrompt: "Tell me a story.",
    };

    it("returns response from first available provider in chain", async () => {
      // Story chain: [anthropic, gemini, openai, ...]
      // Only gemini and openai registered, so gemini is first available
      router.registerProvider(createMockProvider("gemini"));
      router.registerProvider(createMockProvider("openai"));

      const result = await router.generateText("story", req);
      expect(result.provider).toBe("gemini");
    });

    it("falls through to next provider on failure", async () => {
      router.registerProvider(createFailingProvider("anthropic", "API error"));
      router.registerProvider(createMockProvider("gemini"));

      const result = await router.generateText("story", req);
      expect(result.provider).toBe("gemini");
    });

    it("throws when all providers fail", async () => {
      router.registerProvider(createFailingProvider("gemini", "Gemini down"));
      router.registerProvider(createFailingProvider("openai", "OpenAI down"));

      await expect(router.generateText("story", req)).rejects.toThrow();
    });

    it("throws descriptive error when no providers available", async () => {
      await expect(router.generateText("story", req))
        .rejects.toThrow("No AI providers available for text generation");
    });

    it("rejects non-JSON responses in JSON mode", async () => {
      const badJson = createJsonProvider("anthropic", "This is not JSON at all.");
      const goodJson = createJsonProvider("gemini", '{"title":"Good Story"}');
      router.registerProvider(badJson);
      router.registerProvider(goodJson);

      const result = await router.generateText("story", {
        ...req,
        jsonMode: true,
      });
      expect(result.provider).toBe("gemini");
    });

    it("rejects malformed JSON in JSON mode", async () => {
      const malformed = createJsonProvider("anthropic", '{"title": broken}');
      const valid = createJsonProvider("gemini", '{"title":"Valid"}');
      router.registerProvider(malformed);
      router.registerProvider(valid);

      const result = await router.generateText("story", {
        ...req,
        jsonMode: true,
      });
      expect(result.provider).toBe("gemini");
    });

    it("strips markdown code fences from JSON response", async () => {
      const mdJson = createJsonProvider("gemini", '```json\n{"title":"Story"}\n```');
      router.registerProvider(mdJson);

      const result = await router.generateText("story", {
        ...req,
        jsonMode: true,
      });
      expect(result.provider).toBe("gemini");
    });

    it("skips unavailable providers in chain", async () => {
      router.registerProvider(createMockProvider("anthropic", { isAvailable: () => false }));
      router.registerProvider(createMockProvider("gemini"));

      const result = await router.generateText("story", req);
      expect(result.provider).toBe("gemini");
    });

    it("skips providers without text capability", async () => {
      router.registerProvider(createMockProvider("gemini", {
        capabilities: { text: false, image: true, streaming: false },
      }));
      router.registerProvider(createMockProvider("openai"));

      const result = await router.generateText("story", req);
      expect(result.provider).toBe("openai");
    });
  });

  describe("generateTextStream", () => {
    const req = { systemPrompt: "test", userPrompt: "test" };

    it("streams from first available streaming provider", async () => {
      async function* mockStream(): AsyncGenerator<StreamingTextChunk> {
        yield { text: "Hello ", done: false };
        yield { text: "World", done: false };
        yield { text: "", done: true };
      }

      router.registerProvider(createMockProvider("gemini", {
        capabilities: { text: true, image: false, streaming: true },
        generateTextStream: mockStream,
      }));

      const chunks: string[] = [];
      for await (const chunk of router.generateTextStream("story", req)) {
        if (chunk.text) chunks.push(chunk.text);
      }
      expect(chunks.join("")).toBe("Hello World");
    });

    it("skips non-streaming providers", async () => {
      router.registerProvider(createMockProvider("anthropic", {
        capabilities: { text: true, image: false, streaming: false },
      }));

      async function* mockStream(): AsyncGenerator<StreamingTextChunk> {
        yield { text: "streamed", done: false };
        yield { text: "", done: true };
      }

      router.registerProvider(createMockProvider("gemini", {
        capabilities: { text: true, image: false, streaming: true },
        generateTextStream: mockStream,
      }));

      const chunks: string[] = [];
      for await (const chunk of router.generateTextStream("story", req)) {
        if (chunk.text) chunks.push(chunk.text);
      }
      expect(chunks).toContain("streamed");
    });

    it("throws when no streaming providers available", async () => {
      router.registerProvider(createMockProvider("gemini"));
      await expect(async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of router.generateTextStream("story", req)) { /* consume */ }
      }).rejects.toThrow();
    });
  });

  describe("generateImage", () => {
    const req = { prompt: "A hero in a garden" };

    it("returns image from first available provider", async () => {
      router.registerProvider(createMockProvider("gemini", {
        capabilities: { text: true, image: true, streaming: false },
        generateImage: vi.fn(async () => ({
          imageDataUri: "data:image/png;base64,abc123",
          provider: "gemini" as const,
          model: "gemini-image",
        })),
      }));

      const result = await router.generateImage("avatar", req);
      expect(result.imageDataUri).toBe("data:image/png;base64,abc123");
    });

    it("falls through to next provider on image failure", async () => {
      router.registerProvider(createMockProvider("gemini", {
        capabilities: { text: true, image: true, streaming: false },
        generateImage: vi.fn(async () => { throw new Error("Image gen failed"); }),
      }));
      router.registerProvider(createMockProvider("openai", {
        capabilities: { text: true, image: true, streaming: false },
        generateImage: vi.fn(async () => ({
          imageDataUri: "data:image/png;base64,openai",
          provider: "openai" as const,
          model: "dall-e",
        })),
      }));

      const result = await router.generateImage("avatar", req);
      expect(result.provider).toBe("openai");
    });

    it("throws when no image providers available", async () => {
      router.registerProvider(createMockProvider("gemini")); // no image capability
      await expect(router.generateImage("avatar", req))
        .rejects.toThrow("No AI providers available for image generation");
    });
  });
});
