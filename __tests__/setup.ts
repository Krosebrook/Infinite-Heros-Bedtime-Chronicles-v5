/**
 * Shared test utilities and mock factories.
 */

import { vi } from "vitest";
import type { AIProvider, ProviderName, TextGenerationRequest, TextGenerationResponse, ImageGenerationResponse } from "../server/ai/types";

// ---- AsyncStorage Mock ----
const store = new Map<string, string>();

export const mockAsyncStorage = {
  getItem: vi.fn(async (key: string) => store.get(key) ?? null),
  setItem: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
  removeItem: vi.fn(async (key: string) => { store.delete(key); }),
  clear: vi.fn(async () => { store.clear(); }),
  _getStore: () => store,
};

export function resetStorage() {
  store.clear();
  mockAsyncStorage.getItem.mockClear();
  mockAsyncStorage.setItem.mockClear();
  mockAsyncStorage.removeItem.mockClear();
}

// ---- AI Provider Mock Factory ----
export function createMockProvider(
  name: ProviderName,
  overrides: Partial<AIProvider> = {}
): AIProvider {
  return {
    name,
    displayName: name.charAt(0).toUpperCase() + name.slice(1),
    isAvailable: () => true,
    capabilities: { text: true, image: false, streaming: false },
    generateText: vi.fn(async (req: TextGenerationRequest): Promise<TextGenerationResponse> => ({
      text: '{"title":"Test Story"}',
      provider: name,
      model: `${name}-test-model`,
    })),
    ...overrides,
  };
}

export function createFailingProvider(
  name: ProviderName,
  error: string = "Provider failed"
): AIProvider {
  return createMockProvider(name, {
    generateText: vi.fn(async () => { throw new Error(error); }),
  });
}

export function createJsonProvider(
  name: ProviderName,
  jsonText: string
): AIProvider {
  return createMockProvider(name, {
    generateText: vi.fn(async (): Promise<TextGenerationResponse> => ({
      text: jsonText,
      provider: name,
      model: `${name}-model`,
    })),
  });
}
