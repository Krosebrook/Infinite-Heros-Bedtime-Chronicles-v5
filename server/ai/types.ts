export type AITaskType = "story" | "suggestion" | "image" | "avatar" | "scene";

export type ProviderName = "gemini" | "openai" | "anthropic" | "xai" | "mistral" | "cohere" | "meta-llama";

export interface TextGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  thinkingBudget?: number;
}

export interface TextGenerationResponse {
  text: string;
  provider: ProviderName;
  model: string;
  usage?: { inputTokens?: number; outputTokens?: number };
}

export interface ImageGenerationRequest {
  prompt: string;
  size?: string;
  quality?: string;
}

export interface ImageGenerationResponse {
  imageDataUri: string;
  provider: ProviderName;
  model: string;
}

export interface StreamingTextChunk {
  text: string;
  done: boolean;
}

export interface AIProvider {
  name: ProviderName;
  displayName: string;
  isAvailable(): boolean;
  capabilities: {
    text: boolean;
    image: boolean;
    streaming: boolean;
  };
  generateText(req: TextGenerationRequest): Promise<TextGenerationResponse>;
  generateTextStream?(req: TextGenerationRequest): AsyncGenerator<StreamingTextChunk>;
  generateImage?(req: ImageGenerationRequest): Promise<ImageGenerationResponse>;
}

export interface FallbackChain {
  taskType: AITaskType;
  providers: ProviderName[];
}

export interface ProviderStatus {
  name: ProviderName;
  displayName: string;
  available: boolean;
  capabilities: {
    text: boolean;
    image: boolean;
    streaming: boolean;
  };
}
