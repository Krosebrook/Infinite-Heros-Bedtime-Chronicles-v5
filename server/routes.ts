import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/generate-story", async (req, res) => {
    try {
      const { heroName, heroTitle, heroPower, heroDescription, duration, voice } = req.body;

      if (!heroName) {
        return res.status(400).json({ error: "Hero name is required" });
      }

      const wordCount = duration === "short" ? "300-400" : duration === "long" ? "700-900" : "450-600";

      const systemPrompt = `You are a master bedtime storyteller for children ages 3-8. Create magical, soothing bedtime stories that help children feel safe, loved, and ready for sleep. 

Rules:
- Write in a gentle, calming narrative voice
- Include sensory details (soft sounds, warm lights, gentle breezes)
- The story should gradually become more peaceful and sleepy toward the end
- End with the character settling down to rest or sleep
- Use simple vocabulary appropriate for young children
- Include themes of courage, kindness, friendship, or wonder
- Never include anything scary, violent, or anxiety-inducing
- The story should feel complete and satisfying`;

      const userPrompt = `Create a unique bedtime story featuring the hero "${heroName}" who is the "${heroTitle}" with the power of "${heroPower}". 

Hero background: ${heroDescription}

Write a story that is approximately ${wordCount} words long. The story should be broken into paragraphs for easy reading aloud.

Format: Write the story as flowing paragraphs separated by blank lines. Start with a captivating opening line. End with a peaceful, sleepy conclusion.`;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        max_tokens: 2048,
        temperature: 0.9,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error generating story:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to generate story" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate story" });
      }
    }
  });

  app.post("/api/generate-title", async (req, res) => {
    try {
      const { heroName, storyText } = req.body;
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Generate a short, magical story title (3-6 words). Return ONLY the title, nothing else.",
          },
          {
            role: "user",
            content: `Generate a bedtime story title for a story about the hero "${heroName}". First paragraph: ${storyText.substring(0, 200)}`,
          },
        ],
        max_tokens: 30,
        temperature: 0.8,
      });

      const title = response.choices[0]?.message?.content?.trim() || `${heroName}'s Bedtime Adventure`;
      res.json({ title });
    } catch (error) {
      console.error("Error generating title:", error);
      res.json({ title: `${req.body.heroName}'s Bedtime Adventure` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
