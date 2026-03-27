import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIRouter } from './router';
import type { AIProvider, TextGenerationRequest, TextGenerationResponse, ImageGenerationResponse } from './types';

// Helper to create a mock provider
function createMockProvider(
  name: string,
  opts: {
    available?: boolean;
    text?: boolean;
    image?: boolean;
    streaming?: boolean;
    textResponse?: string;
    shouldFail?: boolean;
    failMessage?: string;
  } = {}
): AIProvider {
  const {
    available = true,
    text = true,
    image = false,
    streaming = false,
    textResponse = '{"title":"Test Story"}',
    shouldFail = false,
    failMessage = 'Provider error',
  } = opts;

  return {
    name: name as any,
    displayName: `Mock ${name}`,
    isAvailable: () => available,
    capabilities: { text, image, streaming },
    generateText: shouldFail
      ? vi.fn().mockRejectedValue(new Error(failMessage))
      : vi.fn().mockResolvedValue({
          text: textResponse,
          provider: name,
          model: `${name}-model`,
        } as TextGenerationResponse),
    generateImage: image
      ? shouldFail
        ? vi.fn().mockRejectedValue(new Error(failMessage))
        : vi.fn().mockResolvedValue({
            imageDataUri: 'data:image/png;base64,abc',
            provider: name,
            model: `${name}-model`,
          } as ImageGenerationResponse)
      : undefined,
    generateTextStream: streaming
      ? vi.fn(async function* () {
          yield { text: 'chunk1', done: false };
          yield { text: 'chunk2', done: true };
        })
      : undefined,
  };
}

describe('AIRouter', () => {
  let router: AIRouter;

  beforeEach(() => {
    router = new AIRouter();
  });

  // ── Provider Registration ───────────────────────────────────────
  describe('registerProvider', () => {
    it('registers a single provider', () => {
      const provider = createMockProvider('gemini');
      router.registerProvider(provider);
      expect(router.getProvider('gemini' as any)).toBe(provider);
    });

    it('overwrites a provider with the same name', () => {
      const p1 = createMockProvider('gemini', { textResponse: 'v1' });
      const p2 = createMockProvider('gemini', { textResponse: 'v2' });
      router.registerProvider(p1);
      router.registerProvider(p2);
      expect(router.getProvider('gemini' as any)).toBe(p2);
    });

    it('registers multiple different providers', () => {
      router.registerProvider(createMockProvider('gemini'));
      router.registerProvider(createMockProvider('openai'));
      router.registerProvider(createMockProvider('anthropic'));
      expect(router.getAvailableProviders()).toHaveLength(3);
    });
  });

  // ── getProvider ─────────────────────────────────────────────────
  describe('getProvider', () => {
    it('returns undefined for unregistered provider', () => {
      expect(router.getProvider('gemini' as any)).toBeUndefined();
    });

    it('returns the correct provider by name', () => {
      const p = createMockProvider('openai');
      router.registerProvider(p);
      expect(router.getProvider('openai' as any)).toBe(p);
    });
  });

  // ── getAvailableProviders ───────────────────────────────────────
  describe('getAvailableProviders', () => {
    it('returns empty array when no providers registered', () => {
      expect(router.getAvailableProviders()).toEqual([]);
    });

    it('filters out unavailable providers', () => {
      router.registerProvider(createMockProvider('gemini', { available: true }));
      router.registerProvider(createMockProvider('openai', { available: false }));
      expect(router.getAvailableProviders()).toHaveLength(1);
    });

    it('returns all providers when all available', () => {
      router.registerProvider(createMockProvider('gemini'));
      router.registerProvider(createMockProvider('openai'));
      expect(router.getAvailableProviders()).toHaveLength(2);
    });

    it('returns empty when all providers unavailable', () => {
      router.registerProvider(createMockProvider('gemini', { available: false }));
      router.registerProvider(createMockProvider('openai', { available: false }));
      expect(router.getAvailableProviders()).toEqual([]);
    });
  });

  // ── generateText ────────────────────────────────────────────────
  describe('generateText', () => {
    const baseReq: TextGenerationRequest = {
      systemPrompt: 'You are a storyteller',
      userPrompt: 'Tell me a story',
    };

    it('throws when no providers available', async () => {
      await expect(router.generateText('story', baseReq)).rejects.toThrow(
        /No AI providers available/
      );
    });

    it('throws when providers exist but none available', async () => {
      router.registerProvider(createMockProvider('anthropic', { available: false }));
      await expect(router.generateText('story', baseReq)).rejects.toThrow(
        /No AI providers available/
      );
    });

    it('uses the first available provider in chain', async () => {
      const anthropic = createMockProvider('anthropic');
      const gemini = createMockProvider('gemini');
      router.registerProvider(anthropic);
      router.registerProvider(gemini);
      const result = await router.generateText('story', baseReq);
      expect(anthropic.generateText).toHaveBeenCalledTimes(1);
      expect(gemini.generateText).not.toHaveBeenCalled();
      expect(result.provider).toBe('anthropic');
    });

    it('falls back to next provider on failure', async () => {
      router.registerProvider(createMockProvider('anthropic', { shouldFail: true }));
      router.registerProvider(createMockProvider('gemini'));
      const result = await router.generateText('story', baseReq);
      expect(result.provider).toBe('gemini');
    });

    it('falls back through multiple providers', async () => {
      router.registerProvider(createMockProvider('anthropic', { shouldFail: true }));
      router.registerProvider(createMockProvider('gemini', { shouldFail: true }));
      router.registerProvider(createMockProvider('openai'));
      const result = await router.generateText('story', baseReq);
      expect(result.provider).toBe('openai');
    });

    it('throws last error when all providers fail', async () => {
      router.registerProvider(createMockProvider('anthropic', { shouldFail: true, failMessage: 'A fail' }));
      router.registerProvider(createMockProvider('gemini', { shouldFail: true, failMessage: 'G fail' }));
      await expect(router.generateText('story', baseReq)).rejects.toThrow('G fail');
    });

    it('skips providers without text capability', async () => {
      router.registerProvider(createMockProvider('gemini', { text: false, image: true }));
      router.registerProvider(createMockProvider('openai', { text: true }));
      const result = await router.generateText('story', baseReq);
      expect(result.provider).toBe('openai');
    });

    it('skips unavailable providers in chain', async () => {
      router.registerProvider(createMockProvider('anthropic', { available: false }));
      router.registerProvider(createMockProvider('gemini'));
      const result = await router.generateText('story', baseReq);
      expect(result.provider).toBe('gemini');
    });

    // JSON mode validation
    it('retries next provider when JSON mode returns non-JSON', async () => {
      router.registerProvider(createMockProvider('anthropic', { textResponse: 'not json at all' }));
      router.registerProvider(createMockProvider('gemini', { textResponse: '{"valid": true}' }));
      const result = await router.generateText('story', { ...baseReq, jsonMode: true });
      expect(result.provider).toBe('gemini');
    });

    it('retries next provider when JSON mode returns malformed JSON', async () => {
      router.registerProvider(createMockProvider('anthropic', { textResponse: '{broken json' }));
      router.registerProvider(createMockProvider('gemini', { textResponse: '{"valid": true}' }));
      const result = await router.generateText('story', { ...baseReq, jsonMode: true });
      expect(result.provider).toBe('gemini');
    });

    it('accepts JSON wrapped in markdown code fences', async () => {
      router.registerProvider(createMockProvider('anthropic', {
        textResponse: '```json\n{"title":"Story"}\n```',
      }));
      const result = await router.generateText('story', { ...baseReq, jsonMode: true });
      expect(result.provider).toBe('anthropic');
    });

    it('accepts JSON with leading/trailing whitespace', async () => {
      router.registerProvider(createMockProvider('anthropic', {
        textResponse: '  \n  {"title":"Story"}  \n  ',
      }));
      const result = await router.generateText('story', { ...baseReq, jsonMode: true });
      expect(result.provider).toBe('anthropic');
    });

    it('does not validate JSON when jsonMode is false', async () => {
      router.registerProvider(createMockProvider('anthropic', { textResponse: 'plain text response' }));
      const result = await router.generateText('story', baseReq);
      expect(result.text).toBe('plain text response');
    });

    it('passes request parameters to provider', async () => {
      const provider = createMockProvider('gemini');
      router.registerProvider(provider);
      const req: TextGenerationRequest = {
        systemPrompt: 'sys',
        userPrompt: 'user',
        temperature: 0.7,
        maxTokens: 4096,
        jsonMode: false,
      };
      await router.generateText('story', req);
      expect(provider.generateText).toHaveBeenCalledWith(req);
    });

    // Task type chain selection
    it('uses suggestion chain for suggestion tasks', async () => {
      // suggestion chain: gemini first
      router.registerProvider(createMockProvider('gemini'));
      router.registerProvider(createMockProvider('anthropic'));
      const result = await router.generateText('suggestion', baseReq);
      expect(result.provider).toBe('gemini');
    });

    it('falls back to default chain for unknown task type', async () => {
      router.registerProvider(createMockProvider('gemini'));
      const result = await router.generateText('unknown_task' as any, baseReq);
      expect(result.provider).toBe('gemini');
    });

    // Error handling
    it('converts non-Error throws to Error objects', async () => {
      const provider = createMockProvider('gemini');
      provider.generateText = vi.fn().mockRejectedValue('string error');
      router.registerProvider(provider);
      await expect(router.generateText('story', baseReq)).rejects.toThrow('string error');
    });

    it('preserves Error instances through fallback', async () => {
      router.registerProvider(createMockProvider('anthropic', { shouldFail: true, failMessage: 'specific error' }));
      await expect(router.generateText('story', baseReq)).rejects.toThrow('specific error');
    });
  });

  // ── generateImage ───────────────────────────────────────────────
  describe('generateImage', () => {
    const baseReq = { prompt: 'A friendly dragon' };

    it('throws when no image providers available', async () => {
      router.registerProvider(createMockProvider('gemini', { text: true, image: false }));
      await expect(router.generateImage('image', baseReq)).rejects.toThrow(
        /No AI providers available for image/
      );
    });

    it('uses the first available image provider', async () => {
      router.registerProvider(createMockProvider('gemini', { image: true }));
      router.registerProvider(createMockProvider('openai', { image: true }));
      const result = await router.generateImage('image', baseReq);
      expect(result.provider).toBe('gemini');
    });

    it('falls back on image generation failure', async () => {
      router.registerProvider(createMockProvider('gemini', { image: true, shouldFail: true }));
      router.registerProvider(createMockProvider('openai', { image: true }));
      const result = await router.generateImage('image', baseReq);
      expect(result.provider).toBe('openai');
    });

    it('throws when all image providers fail', async () => {
      router.registerProvider(createMockProvider('gemini', { image: true, shouldFail: true, failMessage: 'G img fail' }));
      router.registerProvider(createMockProvider('openai', { image: true, shouldFail: true, failMessage: 'O img fail' }));
      await expect(router.generateImage('image', baseReq)).rejects.toThrow('O img fail');
    });

    it('skips providers without generateImage function', async () => {
      const noImgProvider = createMockProvider('gemini', { image: true });
      noImgProvider.generateImage = undefined;
      router.registerProvider(noImgProvider);
      router.registerProvider(createMockProvider('openai', { image: true }));
      const result = await router.generateImage('image', baseReq);
      expect(result.provider).toBe('openai');
    });

    it('uses avatar chain for avatar tasks', async () => {
      router.registerProvider(createMockProvider('gemini', { image: true }));
      const result = await router.generateImage('avatar', baseReq);
      expect(result.provider).toBe('gemini');
    });

    it('uses scene chain for scene tasks', async () => {
      router.registerProvider(createMockProvider('gemini', { image: true }));
      const result = await router.generateImage('scene', baseReq);
      expect(result.provider).toBe('gemini');
    });
  });

  // ── generateTextStream ──────────────────────────────────────────
  describe('generateTextStream', () => {
    const baseReq: TextGenerationRequest = {
      systemPrompt: 'sys',
      userPrompt: 'user',
    };

    it('throws when no streaming providers available', async () => {
      router.registerProvider(createMockProvider('gemini', { streaming: false }));
      const gen = router.generateTextStream('story', baseReq);
      await expect(gen.next()).rejects.toThrow(/All streaming providers failed/);
    });

    it('yields chunks from streaming provider', async () => {
      router.registerProvider(createMockProvider('gemini', { streaming: true }));
      const chunks: any[] = [];
      for await (const chunk of router.generateTextStream('story', baseReq)) {
        chunks.push(chunk);
      }
      expect(chunks).toHaveLength(2);
      expect(chunks[0].text).toBe('chunk1');
      expect(chunks[1].text).toBe('chunk2');
    });

    it('adds provider and model to each chunk', async () => {
      router.registerProvider(createMockProvider('gemini', { streaming: true }));
      const chunks: any[] = [];
      for await (const chunk of router.generateTextStream('story', baseReq)) {
        chunks.push(chunk);
      }
      expect(chunks[0].provider).toBe('gemini');
      expect(chunks[0].model).toBe('gemini');
    });

    it('skips providers without streaming capability', async () => {
      router.registerProvider(createMockProvider('anthropic', { streaming: false }));
      router.registerProvider(createMockProvider('gemini', { streaming: true }));
      const chunks: any[] = [];
      for await (const chunk of router.generateTextStream('story', baseReq)) {
        chunks.push(chunk);
      }
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].provider).toBe('gemini');
    });

    it('falls back on streaming error', async () => {
      const failing = createMockProvider('anthropic', { streaming: true });
      failing.generateTextStream = vi.fn(async function* () {
        throw new Error('stream fail');
      });
      router.registerProvider(failing);
      router.registerProvider(createMockProvider('gemini', { streaming: true }));
      const chunks: any[] = [];
      for await (const chunk of router.generateTextStream('story', baseReq)) {
        chunks.push(chunk);
      }
      expect(chunks[0].provider).toBe('gemini');
    });

    it('throws when all streaming providers fail', async () => {
      const failing = createMockProvider('gemini', { streaming: true });
      failing.generateTextStream = vi.fn(async function* () {
        throw new Error('all fail');
      });
      router.registerProvider(failing);
      const gen = router.generateTextStream('story', baseReq);
      await expect(gen.next()).rejects.toThrow('all fail');
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────────
  describe('edge cases', () => {
    const baseReq: TextGenerationRequest = {
      systemPrompt: 'sys',
      userPrompt: 'user',
    };

    it('handles provider becoming unavailable between registration and use', async () => {
      let available = true;
      const provider = createMockProvider('gemini');
      provider.isAvailable = () => available;
      router.registerProvider(provider);

      available = false;
      await expect(router.generateText('story', baseReq)).rejects.toThrow(/No AI providers/);
    });

    it('handles concurrent requests to same router', async () => {
      router.registerProvider(createMockProvider('gemini'));
      const results = await Promise.all([
        router.generateText('story', baseReq),
        router.generateText('story', baseReq),
        router.generateText('story', baseReq),
      ]);
      expect(results).toHaveLength(3);
      results.forEach((r) => expect(r.provider).toBe('gemini'));
    });

    it('handles empty string response from provider', async () => {
      router.registerProvider(createMockProvider('gemini', { textResponse: '' }));
      const result = await router.generateText('story', baseReq);
      expect(result.text).toBe('');
    });

    it('handles very large text response', async () => {
      const largeText = '{"data":"' + 'x'.repeat(100000) + '"}';
      router.registerProvider(createMockProvider('gemini', { textResponse: largeText }));
      const result = await router.generateText('story', baseReq);
      expect(result.text.length).toBeGreaterThan(100000);
    });

    it('handles provider returning non-Error exception', async () => {
      const provider = createMockProvider('gemini');
      provider.generateText = vi.fn().mockRejectedValue(42);
      router.registerProvider(provider);
      await expect(router.generateText('story', baseReq)).rejects.toThrow('42');
    });
  });
});
