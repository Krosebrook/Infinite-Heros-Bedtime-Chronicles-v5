import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, TextGenerationRequest, TextGenerationResponse, StreamingTextChunk } from "../types";

function getClient(): Anthropic | null {
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  if (!apiKey || !baseURL) return null;
  return new Anthropic({ apiKey, baseURL });
}

export const anthropicProvider: AIProvider = {
  name: "anthropic",
  displayName: "Anthropic Claude",
  capabilities: { text: true, image: false, streaming: true },

  isAvailable(): boolean {
    return !!(process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY && process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL);
  },

  async generateText(req: TextGenerationRequest): Promise<TextGenerationResponse> {
    const client = getClient();
    if (!client) throw new Error("Anthropic not configured");

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: req.maxTokens ?? 8192,
      system: req.systemPrompt,
      messages: [{ role: "user", content: req.userPrompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const text = textBlock?.type === "text" ? textBlock.text : "";

    return {
      text,
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      usage: {
        inputTokens: message.usage?.input_tokens,
        outputTokens: message.usage?.output_tokens,
      },
    };
  },

  async *generateTextStream(req: TextGenerationRequest): AsyncGenerator<StreamingTextChunk> {
    const client = getClient();
    if (!client) throw new Error("Anthropic not configured");

    const stream = client.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: req.maxTokens ?? 8192,
      system: req.systemPrompt,
      messages: [{ role: "user", content: req.userPrompt }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { text: event.delta.text, done: false };
      }
    }
    yield { text: "", done: true };
  },
};
