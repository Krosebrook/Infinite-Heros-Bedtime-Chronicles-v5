import { AIRouter } from "./router";
import { geminiProvider } from "./providers/gemini";
import { openaiProvider } from "./providers/openai";
import { anthropicProvider } from "./providers/anthropic";
import { xaiProvider, mistralProvider, cohereProvider, metaLlamaProvider } from "./providers/openrouter";
import type { ProviderStatus } from "./types";

export { AIRouter } from "./router";
export type { AITaskType, ProviderName, TextGenerationRequest, TextGenerationResponse, ImageGenerationRequest, ImageGenerationResponse, ProviderStatus } from "./types";

const allProviders = [
  geminiProvider,
  openaiProvider,
  anthropicProvider,
  xaiProvider,
  mistralProvider,
  cohereProvider,
  metaLlamaProvider,
];

let routerInstance: AIRouter | null = null;

export function getAIRouter(): AIRouter {
  if (!routerInstance) {
    routerInstance = new AIRouter();
    for (const provider of allProviders) {
      routerInstance.registerProvider(provider);
    }
  }
  return routerInstance;
}

export function getProviderStatuses(): ProviderStatus[] {
  const router = getAIRouter();
  return allProviders.map((p) => ({
    name: p.name,
    displayName: p.displayName,
    available: p.isAvailable(),
    capabilities: { ...p.capabilities },
  }));
}

export function logProviderStatus(): void {
  const statuses = getProviderStatuses();
  const available = statuses.filter((s) => s.available);
  const unavailable = statuses.filter((s) => !s.available);

  console.log(`[AI] ${available.length}/${statuses.length} providers available:`);
  for (const s of available) {
    const caps = [];
    if (s.capabilities.text) caps.push("text");
    if (s.capabilities.image) caps.push("image");
    if (s.capabilities.streaming) caps.push("streaming");
    console.log(`  ✓ ${s.displayName} [${caps.join(", ")}]`);
  }
  if (unavailable.length > 0) {
    for (const s of unavailable) {
      console.log(`  ✗ ${s.displayName} (not configured)`);
    }
  }
}
