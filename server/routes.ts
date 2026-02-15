import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function getSystemPrompt(mode: string): string {
  if (mode === "madlibs") {
    return `You are a hilarious and imaginative bedtime storyteller for children ages 5-9. Create wildly funny, silly bedtime stories that incorporate specific words provided by the child. 

Rules:
- Use ALL the provided Mad Libs words naturally in the story
- Make the story absurdly funny — kids should giggle
- Include silly situations, unexpected twists, and playful humor
- Despite being funny, the story should still wind down to a peaceful, sleepy ending
- Use the hero's powers in creative, silly ways
- Keep vocabulary age-appropriate but don't be afraid of big silly words
- Never include anything scary, mean-spirited, or anxiety-inducing
- End with the character tired from laughing and ready for sleep`;
  }

  if (mode === "sleep") {
    return `You are a gentle, hypnotic bedtime narrator creating the most soothing, sleep-inducing story possible for children ages 3-8.

Rules:
- Write in an extremely slow, calming, almost meditative voice
- Use heavy repetition of soothing phrases and rhythmic language
- Include extensive sensory details: warm blankets, soft pillows, gentle breathing, floating clouds
- Use progressive relaxation cues woven into the story (heavy eyelids, warm toes, slow breathing)
- The story should feel like a guided meditation disguised as a story
- Include descriptions of gentle sounds: distant rain, soft wind, quiet humming
- Use shorter sentences that get progressively slower and sleepier
- The hero should demonstrate settling down, getting cozy, breathing slowly
- End with complete calm, warmth, and the deepest peace
- This is designed to help children fall asleep — pace accordingly`;
  }

  return `You are a master bedtime storyteller for children ages 3-8. Create magical, soothing bedtime stories that help children feel safe, loved, and ready for sleep. 

Rules:
- Write in a gentle, calming narrative voice
- Include sensory details (soft sounds, warm lights, gentle breezes)
- The story should gradually become more peaceful and sleepy toward the end
- End with the character settling down to rest or sleep
- Use simple vocabulary appropriate for young children
- Include themes of courage, kindness, friendship, or wonder
- Never include anything scary, violent, or anxiety-inducing
- The story should feel complete and satisfying`;
}

function getUserPrompt(mode: string, heroName: string, heroTitle: string, heroPower: string, heroDescription: string, wordCount: string, madlibWords?: Record<string, string>): string {
  if (mode === "madlibs" && madlibWords) {
    const wordsList = Object.entries(madlibWords)
      .map(([key, value]) => `${key}: "${value}"`)
      .join("\n");

    return `Create a hilarious bedtime story featuring the hero "${heroName}" who is the "${heroTitle}" with the power of "${heroPower}".

Hero background: ${heroDescription}

The child has filled in these Mad Libs words that MUST appear in the story:
${wordsList}

Write a story approximately ${wordCount} words long. Make it funny and silly while incorporating every single Mad Libs word naturally. The story should be broken into paragraphs. End with something peaceful despite all the silliness.

Format: Write as flowing paragraphs separated by blank lines. Bold or emphasize the Mad Libs words by wrapping them in *asterisks* when they first appear.`;
  }

  if (mode === "sleep") {
    return `Create the most soothing, sleep-inducing bedtime story featuring the hero "${heroName}" who is the "${heroTitle}" with the power of "${heroPower}".

Hero background: ${heroDescription}

Write a deeply calming story approximately ${wordCount} words long. This story is specifically designed to help a child fall asleep. Use:
- Progressive relaxation (mention body parts becoming warm and heavy)
- Rhythmic, repetitive language
- Descriptions of cozy, safe places
- Gentle breathing cues woven into the narrative
- Countdown-style elements (five soft clouds... four gentle stars... three warm blankets...)
- The hero using their power to create the most peaceful, safe space imaginable

Format: Write as flowing paragraphs separated by blank lines. Use ellipsis (...) for dramatic pauses. Keep sentences short and dreamy toward the end.`;
  }

  return `Create a unique bedtime story featuring the hero "${heroName}" who is the "${heroTitle}" with the power of "${heroPower}". 

Hero background: ${heroDescription}

Write a story that is approximately ${wordCount} words long. The story should be broken into paragraphs for easy reading aloud.

Format: Write the story as flowing paragraphs separated by blank lines. Start with a captivating opening line. End with a peaceful, sleepy conclusion.`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/generate-story", async (req, res) => {
    try {
      const { heroName, heroTitle, heroPower, heroDescription, duration, mode, madlibWords } = req.body;

      if (!heroName) {
        return res.status(400).json({ error: "Hero name is required" });
      }

      const storyMode = mode || "classic";
      const wordCount = duration === "short" ? "300-400" : duration === "long" ? "700-900" : "450-600";

      const systemPrompt = getSystemPrompt(storyMode);
      const userPrompt = getUserPrompt(storyMode, heroName, heroTitle, heroPower, heroDescription, wordCount, madlibWords);

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
        temperature: storyMode === "sleep" ? 0.7 : 0.9,
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
      const { heroName, storyText, mode } = req.body;
      const modeHint = mode === "madlibs" ? " Make the title funny and silly." : mode === "sleep" ? " Make the title dreamy and peaceful." : "";

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Generate a short, magical story title (3-6 words). Return ONLY the title, nothing else.${modeHint}`,
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
