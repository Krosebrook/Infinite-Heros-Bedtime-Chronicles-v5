/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * FIXES APPLIED (March 2026):
 * - FIX #3: Updated model from gemini-2.0-flash-preview-image-generation → gemini-2.5-flash-image (stable Nano Banana)
 * - FIX #3: Added required responseModalities config for new model
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from '@google/genai';
import { withMiddleware, validateString } from './_middleware';

export default withMiddleware(async (req: VercelRequest, res: VercelResponse) => {
  const prompt = validateString(req.body.prompt, 2000);

  if (!prompt) {
    return res.status(400).json({ error: 'Invalid request parameters.' });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // FIX #3: Stable Nano Banana model + required responseModalities
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: unknown }) => p.inlineData
  );
  if (!part?.inlineData) {
    throw new Error('No image data received');
  }

  res.status(200).json({
    mimeType: (part.inlineData as { mimeType: string; data: string }).mimeType,
    data: (part.inlineData as { mimeType: string; data: string }).data,
  });
});
