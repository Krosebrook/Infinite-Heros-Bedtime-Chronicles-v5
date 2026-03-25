import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIRouter } from './router';
import type { AIProvider, TextGenerationRequest, TextGenerationResponse } from './types';

/**
 * Creates a mock AIProvider for testing.
 * Note: Default chains are defined in router.ts — tests must use task types
 * that include the registered provider names in their chain.
 *
 * Key chains:
 *   story:      anthropic → gemini → openai → meta-llama → xai → mistral → cohere
 *   suggestion: gemini → mistral → anthropic → meta-llama → xai → cohere
 *   image:      gemini → openai
 *   avatar:     gemini → openai
 */
function createMockProvider(
  overrides: Partial<AIProvider> & { name: AIProvider['name'] }
): AIProvider {
  return {
    displayName: overrides.name.charAt(0).toUpperCase() + overrides.name.slice(1),
    isAvailable: () => true,
    capabilities: { text: true, image: false, streaming: false },
    generateText: vi.fn().mockResolvedValue({
      text: `Response from ${overrides.name}`,
      provider: overrides.name,
      model: `${overrides.name}-model`,
    } satisfies TextGenerationResponse),
    ...overrides,
  };
}

const DEFAULT_REQUEST: TextGenerationRequest = {
  systemPrompt: 'You are a helpful assistant.',
  userPrompt: 'Tell me a story.',
};

describe('AIRouter', () => {
  let router: AIRouter;

  beforeEach(() => {
    router = new AIRouter();
  });

  describe('registerProvider / getProvider', () => {
    it('registers and retrieves a provider by name', () => {
      const provider = createMockProvider({ name: 'gemini' });
      router.registerProvider(provider);
      expect(router.getProvider('gemini')).toBe(provider);
    });

    it('returns undefined for unregistered provider', () => {
      expect(router.getProvider('openai')).toBeUndefined();
    });
  });

  describe('getAvailableProviders', () => {
    it('returns only providers where isAvailable() is true', () => {
      const available = createMockProvider({ name: 'gemini', isAvailable: () => true });
      const unavailable = createMockProvider({ name: 'openai', isAvailable: () => false });
      router.registerProvider(available);
      router.registerProvider(unavailable);

      const result = router.getAvailableProviders();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('gemini');
    });
  });

  describe('generateText', () => {
    it('returns response from the first available provider in the chain', async () => {
      // suggestion chain: gemini → mistral → anthropic → ...
      const gemini = createMockProvider({ name: 'gemini' });
      const anthropic = createMockProvider({ name: 'anthropic' });
      router.registerProvider(gemini);
      router.registerProvider(anthropic);

      const result = await router.generateText('suggestion', DEFAULT_REQUEST);
      expect(result.provider).toBe('gemini');
      expect(gemini.generateText).toHaveBeenCalledOnce();
      expect(anthropic.generateText).not.toHaveBeenCalled();
    });

    it('falls back to the next provider when the first one fails', async () => {
      // story chain: anthropic → gemini → openai → ...
      const anthropic = createMockProvider({
        name: 'anthropic',
        generateText: vi.fn().mockRejectedValue(new Error('API rate limited')),
      });
      const gemini = createMockProvider({ name: 'gemini' });
      router.registerProvider(anthropic);
      router.registerProvider(gemini);

      const result = await router.generateText('story', DEFAULT_REQUEST);
      expect(result.provider).toBe('gemini');
      expect(anthropic.generateText).toHaveBeenCalledOnce();
      expect(gemini.generateText).toHaveBeenCalledOnce();
    });

    it('throws when no providers are available', async () => {
      await expect(router.generateText('story', DEFAULT_REQUEST)).rejects.toThrow(
        /No AI providers available/
      );
    });

    it('throws when all providers fail', async () => {
      // suggestion chain: gemini → mistral → anthropic → ...
      // Register gemini and anthropic; both fail. Last error should be from anthropic.
      const gemini = createMockProvider({
        name: 'gemini',
        generateText: vi.fn().mockRejectedValue(new Error('Gemini down')),
      });
      const anthropic = createMockProvider({
        name: 'anthropic',
        generateText: vi.fn().mockRejectedValue(new Error('Anthropic down')),
      });
      router.registerProvider(gemini);
      router.registerProvider(anthropic);

      await expect(router.generateText('suggestion', DEFAULT_REQUEST)).rejects.toThrow('Anthropic down');
    });

    it('skips unavailable providers in the chain', async () => {
      // suggestion chain: gemini → mistral → anthropic → ...
      const gemini = createMockProvider({ name: 'gemini', isAvailable: () => false });
      const anthropic = createMockProvider({ name: 'anthropic' });
      router.registerProvider(gemini);
      router.registerProvider(anthropic);

      const result = await router.generateText('suggestion', DEFAULT_REQUEST);
      expect(result.provider).toBe('anthropic');
      expect(gemini.generateText).not.toHaveBeenCalled();
    });

    it('skips providers without text capability', async () => {
      // suggestion chain: gemini → mistral → anthropic → ...
      const gemini = createMockProvider({
        name: 'gemini',
        capabilities: { text: false, image: true, streaming: false },
      });
      const anthropic = createMockProvider({ name: 'anthropic' });
      router.registerProvider(gemini);
      router.registerProvider(anthropic);

      const result = await router.generateText('suggestion', DEFAULT_REQUEST);
      expect(result.provider).toBe('anthropic');
    });
  });

  describe('generateText with jsonMode', () => {
    it('accepts valid JSON responses', async () => {
      const gemini = createMockProvider({
        name: 'gemini',
        generateText: vi.fn().mockResolvedValue({
          text: '{"title": "A Great Story", "content": "Once upon a time..."}',
          provider: 'gemini',
          model: 'gemini-2.5-flash',
        }),
      });
      router.registerProvider(gemini);

      const result = await router.generateText('story', { ...DEFAULT_REQUEST, jsonMode: true });
      expect(result.text).toContain('"title"');
    });

    it('strips markdown code fences from JSON responses', async () => {
      const gemini = createMockProvider({
        name: 'gemini',
        generateText: vi.fn().mockResolvedValue({
          text: '```json\n{"title": "A Story"}\n```',
          provider: 'gemini',
          model: 'gemini-2.5-flash',
        }),
      });
      router.registerProvider(gemini);

      const result = await router.generateText('story', { ...DEFAULT_REQUEST, jsonMode: true });
      expect(result.provider).toBe('gemini');
    });

    it('falls back when provider returns non-JSON in jsonMode', async () => {
      // story chain: anthropic → gemini → openai → ...
      const anthropic = createMockProvider({
        name: 'anthropic',
        generateText: vi.fn().mockResolvedValue({
          text: 'This is not JSON at all, just plain text without any braces.',
          provider: 'anthropic',
          model: 'claude-sonnet',
        }),
      });
      const gemini = createMockProvider({
        name: 'gemini',
        generateText: vi.fn().mockResolvedValue({
          text: '{"title": "Fallback Story"}',
          provider: 'gemini',
          model: 'gemini-2.5-flash',
        }),
      });
      router.registerProvider(anthropic);
      router.registerProvider(gemini);

      const result = await router.generateText('story', {
        ...DEFAULT_REQUEST,
        jsonMode: true,
      });
      expect(result.provider).toBe('gemini');
    });

    it('falls back when provider returns malformed JSON in jsonMode', async () => {
      // story chain: anthropic → gemini → openai → ...
      const anthropic = createMockProvider({
        name: 'anthropic',
        generateText: vi.fn().mockResolvedValue({
          text: '{"title": "broken json',
          provider: 'anthropic',
          model: 'claude-sonnet',
        }),
      });
      const gemini = createMockProvider({
        name: 'gemini',
        generateText: vi.fn().mockResolvedValue({
          text: '{"title": "Valid"}',
          provider: 'gemini',
          model: 'gemini-2.5-flash',
        }),
      });
      router.registerProvider(anthropic);
      router.registerProvider(gemini);

      const result = await router.generateText('story', {
        ...DEFAULT_REQUEST,
        jsonMode: true,
      });
      expect(result.provider).toBe('gemini');
    });
  });

  describe('generateImage', () => {
    it('returns image from the first available provider', async () => {
      const gemini = createMockProvider({
        name: 'gemini',
        capabilities: { text: true, image: true, streaming: false },
        generateImage: vi.fn().mockResolvedValue({
          imageDataUri: 'data:image/png;base64,abc123',
          provider: 'gemini',
          model: 'gemini-2.5-flash',
        }),
      });
      router.registerProvider(gemini);

      const result = await router.generateImage('image', { prompt: 'A superhero flying' });
      expect(result.imageDataUri).toBe('data:image/png;base64,abc123');
    });

    it('throws when no image providers are available', async () => {
      const gemini = createMockProvider({
        name: 'gemini',
        capabilities: { text: true, image: false, streaming: false },
      });
      router.registerProvider(gemini);

      await expect(
        router.generateImage('image', { prompt: 'A superhero flying' })
      ).rejects.toThrow(/No AI providers available/);
    });

    it('falls back on image generation failure', async () => {
      const gemini = createMockProvider({
        name: 'gemini',
        capabilities: { text: true, image: true, streaming: false },
        generateImage: vi.fn().mockRejectedValue(new Error('Image generation failed')),
      });
      const openai = createMockProvider({
        name: 'openai',
        capabilities: { text: true, image: true, streaming: false },
        generateImage: vi.fn().mockResolvedValue({
          imageDataUri: 'data:image/png;base64,openai123',
          provider: 'openai',
          model: 'dall-e-3',
        }),
      });
      router.registerProvider(gemini);
      router.registerProvider(openai);

      const result = await router.generateImage('image', { prompt: 'A hero' });
      expect(result.provider).toBe('openai');
    });
  });
});
