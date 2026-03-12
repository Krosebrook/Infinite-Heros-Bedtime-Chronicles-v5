import { GoogleGenAI, Modality } from "@google/genai";
import type { AIProvider, TextGenerationRequest, TextGenerationResponse, ImageGenerationRequest, ImageGenerationResponse, StreamingTextChunk } from "../types";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({
      apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
      httpOptions: {
        apiVersion: "",
        baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
      },
    });
  }
  return client;
}

export const geminiProvider: AIProvider = {
  name: "gemini",
  displayName: "Google Gemini",
  capabilities: { text: true, image: true, streaming: true },

  isAvailable(): boolean {
    return !!(process.env.AI_INTEGRATIONS_GEMINI_API_KEY && process.env.AI_INTEGRATIONS_GEMINI_BASE_URL);
  },

  async generateText(req: TextGenerationRequest): Promise<TextGenerationResponse> {
    const ai = getClient();
    const config: Record<string, unknown> = {
      systemInstruction: req.systemPrompt,
      temperature: req.temperature ?? 0.9,
      maxOutputTokens: req.maxTokens ?? 8192,
    };

    if (req.jsonMode) {
      config.responseMimeType = "application/json";
    }

    if (req.thinkingBudget !== undefined) {
      config.thinkingConfig = { thinkingBudget: req.thinkingBudget };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: req.userPrompt }] }],
      config,
    });

    const text = response.text || "";
    return {
      text,
      provider: "gemini",
      model: "gemini-2.5-flash",
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount,
        outputTokens: response.usageMetadata?.candidatesTokenCount,
      },
    };
  },

  async *generateTextStream(req: TextGenerationRequest): AsyncGenerator<StreamingTextChunk> {
    const ai = getClient();
    const config: Record<string, unknown> = {
      systemInstruction: req.systemPrompt,
      temperature: req.temperature ?? 0.9,
      maxOutputTokens: req.maxTokens ?? 8192,
    };

    if (req.thinkingBudget !== undefined) {
      config.thinkingConfig = { thinkingBudget: req.thinkingBudget };
    }

    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: req.userPrompt }] }],
      config,
    });

    for await (const chunk of response) {
      const text = chunk.text || "";
      if (text) {
        yield { text, done: false };
      }
    }
    yield { text: "", done: true };
  },

  async generateImage(req: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const ai = getClient();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: req.prompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidate = response.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part) => part.inlineData);

    if (!imagePart?.inlineData?.data) {
      throw new Error("Gemini returned no image data");
    }

    const mimeType = imagePart.inlineData.mimeType || "image/png";
    return {
      imageDataUri: `data:${mimeType};base64,${imagePart.inlineData.data}`,
      provider: "gemini",
      model: "gemini-2.5-flash-image",
    };
  },
};
