import type {
  AIProvider,
  AITaskType,
  ProviderName,
  TextGenerationRequest,
  TextGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  StreamingTextChunk,
  FallbackChain,
} from "./types";

const DEFAULT_CHAINS: FallbackChain[] = [
  { taskType: "story", providers: ["anthropic", "gemini", "openai", "meta-llama", "xai", "mistral", "cohere"] },
  { taskType: "suggestion", providers: ["gemini", "mistral", "anthropic", "meta-llama", "xai", "cohere"] },
  { taskType: "image", providers: ["gemini", "openai"] },
  { taskType: "avatar", providers: ["gemini", "openai"] },
  { taskType: "scene", providers: ["gemini", "openai"] },
];

export class AIRouter {
  private providers: Map<ProviderName, AIProvider> = new Map();
  private chains: FallbackChain[] = DEFAULT_CHAINS;

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: ProviderName): AIProvider | undefined {
    return this.providers.get(name);
  }

  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isAvailable());
  }

  private getChain(taskType: AITaskType): ProviderName[] {
    const chain = this.chains.find((c) => c.taskType === taskType);
    return chain?.providers || ["gemini", "openai"];
  }

  private getAvailableChain(taskType: AITaskType, capability: "text" | "image"): AIProvider[] {
    const chain = this.getChain(taskType);
    const available: AIProvider[] = [];
    for (const name of chain) {
      const provider = this.providers.get(name);
      if (provider && provider.isAvailable() && provider.capabilities[capability]) {
        available.push(provider);
      }
    }
    return available;
  }

  async generateText(
    taskType: AITaskType,
    req: TextGenerationRequest
  ): Promise<TextGenerationResponse> {
    const chain = this.getAvailableChain(taskType, "text");
    if (chain.length === 0) {
      throw new Error(`No AI providers available for text generation (task: ${taskType})`);
    }

    let lastError: Error | null = null;
    for (const provider of chain) {
      try {
        const response = await provider.generateText(req);

        if (req.jsonMode) {
          let cleaned = response.text.trim();
          cleaned = cleaned.replace(/```json\s*/g, "").replace(/```\s*/g, "");
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.error(`[AI Router] ${provider.displayName} returned non-JSON for ${taskType}, trying next provider`);
            lastError = new Error(`${provider.displayName} returned invalid JSON`);
            continue;
          }
          try {
            JSON.parse(jsonMatch[0]);
          } catch {
            console.error(`[AI Router] ${provider.displayName} returned unparseable JSON for ${taskType}, trying next provider`);
            lastError = new Error(`${provider.displayName} returned malformed JSON`);
            continue;
          }
        }

        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[AI Router] ${provider.displayName} failed for ${taskType}: ${lastError.message}`);
      }
    }

    throw lastError || new Error("All providers failed");
  }

  async *generateTextStream(
    taskType: AITaskType,
    req: TextGenerationRequest
  ): AsyncGenerator<StreamingTextChunk & { provider: ProviderName; model: string }> {
    const chain = this.getAvailableChain(taskType, "text");
    if (chain.length === 0) {
      throw new Error(`No AI providers available for streaming text generation (task: ${taskType})`);
    }

    let lastError: Error | null = null;
    for (const provider of chain) {
      if (!provider.generateTextStream || !provider.capabilities.streaming) {
        continue;
      }
      try {
        const stream = provider.generateTextStream(req);
        for await (const chunk of stream) {
          yield { ...chunk, provider: provider.name, model: provider.name };
        }
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[AI Router] ${provider.displayName} streaming failed for ${taskType}: ${lastError.message}`);
      }
    }

    throw lastError || new Error("All streaming providers failed");
  }

  async generateImage(
    taskType: AITaskType,
    req: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    const chain = this.getAvailableChain(taskType, "image");
    if (chain.length === 0) {
      throw new Error(`No AI providers available for image generation (task: ${taskType})`);
    }

    let lastError: Error | null = null;
    for (const provider of chain) {
      if (!provider.generateImage) continue;
      try {
        const response = await provider.generateImage(req);
        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.error(`[AI Router] ${provider.displayName} image failed for ${taskType}: ${lastError.message}`);
      }
    }

    throw lastError || new Error("All image providers failed");
  }
}
