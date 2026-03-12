import OpenAI from "openai";
import type { AIProvider, TextGenerationRequest, TextGenerationResponse, ImageGenerationRequest, ImageGenerationResponse } from "../types";

function getIntegrationsClient(): OpenAI | null {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  if (!apiKey || !baseURL) return null;
  return new OpenAI({ apiKey, baseURL });
}

function getDirectClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export const openaiProvider: AIProvider = {
  name: "openai",
  displayName: "OpenAI",
  capabilities: { text: true, image: true, streaming: true },

  isAvailable(): boolean {
    return !!(
      (process.env.AI_INTEGRATIONS_OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) ||
      process.env.OPENAI_API_KEY
    );
  },

  async generateText(req: TextGenerationRequest): Promise<TextGenerationResponse> {
    const client = getIntegrationsClient() || getDirectClient();
    if (!client) throw new Error("OpenAI not configured");

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: req.systemPrompt },
      { role: "user", content: req.userPrompt },
    ];

    const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
      model: "gpt-4o-mini",
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
      provider: "openai",
      model: "gpt-4o-mini",
      usage: {
        inputTokens: response.usage?.prompt_tokens,
        outputTokens: response.usage?.completion_tokens,
      },
    };
  },

  async generateImage(req: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const client = getDirectClient() || getIntegrationsClient();
    if (!client) throw new Error("OpenAI not configured for image generation");

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: req.prompt,
      size: (req.size as "1536x1024") || "1536x1024",
      quality: (req.quality as "low") || "low",
      n: 1,
    });

    const imageData = response.data?.[0];
    if (!imageData) throw new Error("OpenAI returned no image data");

    const imageRecord = imageData as Record<string, unknown>;
    if (imageRecord.b64_json) {
      return {
        imageDataUri: `data:image/png;base64,${imageRecord.b64_json}`,
        provider: "openai",
        model: "gpt-image-1",
      };
    }
    if (imageData.url) {
      return {
        imageDataUri: imageData.url,
        provider: "openai",
        model: "gpt-image-1",
      };
    }
    throw new Error("OpenAI returned no usable image");
  },
};
