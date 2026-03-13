/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * FIXES APPLIED (March 2026):
 * - FIX #3: Updated model from gemini-2.5-flash-preview-05-20 → gemini-2.5-flash (stable GA)
 * - FIX #5: Added responseSchema to enforce consistent StoryFull JSON structure
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { withMiddleware, validateString } from './_middleware';

// FIX #5: Enforce consistent JSON output matching StoryFull interface
const STORY_RESPONSE_SCHEMA = {
  type: 'object' as const,
  properties: {
    title: { type: 'string' as const, description: 'The story title' },
    parts: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          text: { type: 'string' as const, description: 'The story text for this part' },
          choices: {
            type: 'array' as const,
            items: { type: 'string' as const },
            description: 'Array of choice strings (empty array for sleep mode or final part)'
          },
          partIndex: { type: 'number' as const, description: 'Zero-based index of this part' }
        },
        required: ['text', 'choices', 'partIndex'] as const,
      },
      description: 'Array of story parts with text, choices, and index'
    },
    vocabWord: {
      type: 'object' as const,
      properties: {
        word: { type: 'string' as const },
        definition: { type: 'string' as const }
      },
      required: ['word', 'definition'] as const,
    },
    joke: { type: 'string' as const, description: 'A child-friendly joke related to the story' },
    lesson: { type: 'string' as const, description: 'The moral or lesson of the story' },
    tomorrowHook: { type: 'string' as const, description: 'A teaser for a potential sequel story' },
    rewardBadge: {
      type: 'object' as const,
      properties: {
        emoji: { type: 'string' as const },
        title: { type: 'string' as const },
        description: { type: 'string' as const }
      },
      required: ['emoji', 'title', 'description'] as const,
    }
  },
  required: ['title', 'parts', 'vocabWord', 'joke', 'lesson', 'tomorrowHook', 'rewardBadge'] as const,
};

export default withMiddleware(async (req: VercelRequest, res: VercelResponse) => {
  const systemInstruction = validateString(req.body.systemInstruction, 5000);
  const userPrompt = validateString(req.body.userPrompt, 2000);

  if (!systemInstruction || !userPrompt) {
    return res.status(400).json({ error: 'Invalid request parameters.' });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // FIX #3: Stable GA model instead of date-stamped preview
  // FIX #5: responseSchema enforces StoryFull structure — no more parsing failures
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: STORY_RESPONSE_SCHEMA,
    },
  });

  res.status(200).json({ text: result.text });
});
