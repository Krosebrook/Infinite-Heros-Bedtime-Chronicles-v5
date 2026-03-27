import express, { type Express, type Request, type Response } from "express";
import { chatStorage } from "../chat/storage";
import { openai, speechToText, ensureCompatibleFormat } from "./client";
import { requireAuth } from "../../auth";

// Body parser with 10MB limit for audio payloads (reduced from 50MB to mitigate DoS)
const audioBodyParser = express.json({ limit: "10mb" });

const VOICE_CHAT_SAFETY_PROMPT = `You are a friendly, gentle storytelling companion for children ages 3-9.
CRITICAL RULES:
- NEVER discuss violence, weapons, scary topics, or anything inappropriate for young children
- NEVER reference real brands, celebrities, or copyrighted characters
- Keep all responses warm, encouraging, and age-appropriate
- If a child asks about something inappropriate, gently redirect to a fun, safe topic
- Use simple vocabulary appropriate for young children
- Be encouraging and positive in all interactions`;

export function registerAudioRoutes(app: Express): void {
  function parseConversationId(req: Request, res: Response): number | null {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({ error: "Invalid conversation ID" });
      return null;
    }
    return id;
  }

  // Get all conversations
  app.get("/api/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      // TODO: Add userId column to conversations table and verify req.user.uid === conversation.userId
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseConversationId(req, res);
      if (id === null) return;

      // TODO: Add userId column to conversations table and verify req.user.uid === conversation.userId
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseConversationId(req, res);
      if (id === null) return;

      // TODO: Add userId column to conversations table and verify req.user.uid === conversation.userId
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send voice message and get streaming audio response
  // Auto-detects audio format and converts WebM/MP4/OGG to WAV
  // Uses gpt-4o-mini-transcribe for STT, gpt-4o-audio-preview for voice response
  app.post("/api/conversations/:id/messages", requireAuth, audioBodyParser, async (req: Request, res: Response) => {
    try {
      const id = parseConversationId(req, res);
      if (id === null) return;

      const conversationId = id;
      const { audio, voice = "alloy" } = req.body;

      if (!audio) {
        return res.status(400).json({ error: "Audio data (base64) is required" });
      }

      // 1. Auto-detect format and convert to OpenAI-compatible format
      const rawBuffer = Buffer.from(audio, "base64");
      const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(rawBuffer);

      // 2. Transcribe user audio
      const userTranscript = await speechToText(audioBuffer, inputFormat);

      // 3. Save user message
      // TODO: Add userId column to conversations table and verify req.user.uid === conversation.userId
      await chatStorage.createMessage(conversationId, "user", userTranscript);

      // 4. Get conversation history
      const existingMessages = await chatStorage.getMessagesByConversation(conversationId);
      const chatHistory = existingMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // 5. Prepend child safety system prompt and cap history
      const messagesWithSafety = [
        { role: "system" as const, content: VOICE_CHAT_SAFETY_PROMPT },
        ...chatHistory.slice(-20), // Cap at 20 messages to prevent unbounded token usage
      ];

      // 6. Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ type: "user_transcript", data: userTranscript })}\n\n`);

      // 7. Stream audio response from gpt-4o-audio-preview
      const stream = await openai.chat.completions.create({
        model: "gpt-4o-audio-preview",
        modalities: ["text", "audio"],
        audio: { voice, format: "pcm16" },
        messages: messagesWithSafety,
        stream: true,
      });

      let assistantTranscript = "";

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta as any;
        if (!delta) continue;

        if (delta?.audio?.transcript) {
          assistantTranscript += delta.audio.transcript;
          res.write(`data: ${JSON.stringify({ type: "transcript", data: delta.audio.transcript })}\n\n`);
        }

        if (delta?.audio?.data) {
          res.write(`data: ${JSON.stringify({ type: "audio", data: delta.audio.data })}\n\n`);
        }
      }

      // 8. Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", assistantTranscript);

      res.write(`data: ${JSON.stringify({ type: "done", transcript: assistantTranscript })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error processing voice message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to process voice message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process voice message" });
      }
    }
  });
}
