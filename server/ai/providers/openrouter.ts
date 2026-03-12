import OpenAI from "openai";
import type { AIProvider, ProviderName, TextGenerationRequest, TextGenerationResponse, StreamingTextChunk } from "../types";

function getClient(): OpenAI | null {
  const apiKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL;
  if (!apiKey || !baseURL) return null;
  return new OpenAI({ apiKey, baseURL });
}

const PROVIDER_MODELS: Record<string, { model: string; providerName: ProviderName; displayName: string }> = {
  "xai": {
    model: "x-ai/grok-3-mini-beta",
    providerName: "xai",
    displayName: "xAI Grok",
  },
  "mistral": {
    model: "mistralai/mistral-small-3.1-24b-instruct",
    providerName: "mistral",
    displayName: "Mistral",
  },
  "cohere": {
    model: "cohere/command-a-03-2025",
    providerName: "cohere",
    displayName: "Cohere Command",
  },
  "meta-llama": {
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    providerName: "meta-llama",
    displayName: "Meta Llama",
  },
};

function createOpenRouterProvider(providerKey: string): AIProvider {
  const info = PROVIDER_MODELS[providerKey];
  if (!info) throw new Error(`Unknown OpenRouter provider: ${providerKey}`);

  return {
    name: info.providerName,
    displayName: info.displayName,
    capabilities: { text: true, image: false, streaming: true },

    isAvailable(): boolean {
      return !!(process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY && process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL);
    },

    async generateText(req: TextGenerationRequest): Promise<TextGenerationResponse> {
      const client = getClient();
      if (!client) throw new Error(`${info.displayName} not configured (requires OpenRouter)`);

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: req.systemPrompt },
        { role: "user", content: req.userPrompt },
      ];

      const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
        model: info.model,
        messages,
        temperature: req.temperature ?? 0.9,
        max_tokens: req.maxTokens ?? 8192,
      };

      if (req.jsonMode) {
        params.response_format = { type: "json_object" };
      }

      const response = await client.chat.completions.create(params);
      const text = response.choices[0]?.message?.content || "";

      return {
        text,
        provider: info.providerName,
        model: info.model,
        usage: {
          inputTokens: response.usage?.prompt_tokens,
          outputTokens: response.usage?.completion_tokens,
        },
      };
    },

    async *generateTextStream(req: TextGenerationRequest): AsyncGenerator<StreamingTextChunk> {
      const client = getClient();
      if (!client) throw new Error(`${info.displayName} not configured (requires OpenRouter)`);

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: req.systemPrompt },
        { role: "user", content: req.userPrompt },
      ];

      const stream = await client.chat.completions.create({
        model: info.model,
        messages,
        temperature: req.temperature ?? 0.9,
        max_tokens: req.maxTokens ?? 8192,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield { text: content, done: false };
        }
      }
      yield { text: "", done: true };
    },
  };
}

export const xaiProvider = createOpenRouterProvider("xai");
export const mistralProvider = createOpenRouterProvider("mistral");
export const cohereProvider = createOpenRouterProvider("cohere");
export const metaLlamaProvider = createOpenRouterProvider("meta-llama");
