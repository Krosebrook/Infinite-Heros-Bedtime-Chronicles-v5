import { describe, it, expect, vi } from 'vitest';

// Mock the ElevenLabs SDK to avoid module resolution errors in the SDK internals
vi.mock('elevenlabs', () => ({
  ElevenLabsClient: vi.fn(),
}));

import {
  VOICE_MAP,
  MODE_DEFAULT_VOICES,
  MODE_VOICE_CATEGORIES,
  getVoicesForMode,
  type VoiceConfig,
  type VoiceCategory,
} from './elevenlabs';

describe('VOICE_MAP', () => {
  it('contains all expected voice keys', () => {
    const expectedKeys = [
      'moonbeam', 'whisper', 'stardust',
      'captain', 'professor', 'aurora',
      'giggles', 'blaze', 'ziggy',
    ];
    for (const key of expectedKeys) {
      expect(VOICE_MAP).toHaveProperty(key);
    }
  });

  it('has 9 voices total', () => {
    expect(Object.keys(VOICE_MAP)).toHaveLength(9);
  });

  it('every voice has required fields', () => {
    for (const [key, voice] of Object.entries(VOICE_MAP)) {
      expect(voice.id, `${key} missing id`).toBeTruthy();
      expect(voice.name, `${key} missing name`).toBeTruthy();
      expect(voice.characterName, `${key} missing characterName`).toBeTruthy();
      expect(voice.description, `${key} missing description`).toBeTruthy();
      expect(voice.accent, `${key} missing accent`).toBeTruthy();
      expect(voice.personality, `${key} missing personality`).toBeTruthy();
      expect(voice.category, `${key} missing category`).toBeTruthy();
      expect(voice.previewText, `${key} missing previewText`).toBeTruthy();
      expect(voice.settings, `${key} missing settings`).toBeDefined();
    }
  });

  it('every voice has valid category', () => {
    const validCategories: VoiceCategory[] = ['sleep', 'classic', 'fun'];
    for (const [key, voice] of Object.entries(VOICE_MAP)) {
      expect(validCategories, `${key} has invalid category: ${voice.category}`)
        .toContain(voice.category);
    }
  });

  it('every voice has valid settings', () => {
    for (const [key, voice] of Object.entries(VOICE_MAP)) {
      const { stability, similarity_boost, style, use_speaker_boost } = voice.settings;
      expect(stability, `${key} stability out of range`).toBeGreaterThanOrEqual(0);
      expect(stability, `${key} stability out of range`).toBeLessThanOrEqual(1);
      expect(similarity_boost, `${key} similarity_boost out of range`).toBeGreaterThanOrEqual(0);
      expect(similarity_boost, `${key} similarity_boost out of range`).toBeLessThanOrEqual(1);
      expect(style, `${key} style out of range`).toBeGreaterThanOrEqual(0);
      expect(style, `${key} style out of range`).toBeLessThanOrEqual(1);
      expect(typeof use_speaker_boost).toBe('boolean');
    }
  });

  it('every voice has a unique ElevenLabs ID', () => {
    const ids = Object.values(VOICE_MAP).map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every voice has a unique character name', () => {
    const names = Object.values(VOICE_MAP).map((v) => v.characterName);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('voice categories', () => {
  it('has 3 sleep voices', () => {
    const sleepVoices = Object.values(VOICE_MAP).filter((v) => v.category === 'sleep');
    expect(sleepVoices).toHaveLength(3);
  });

  it('has 3 classic voices', () => {
    const classicVoices = Object.values(VOICE_MAP).filter((v) => v.category === 'classic');
    expect(classicVoices).toHaveLength(3);
  });

  it('has 3 fun voices', () => {
    const funVoices = Object.values(VOICE_MAP).filter((v) => v.category === 'fun');
    expect(funVoices).toHaveLength(3);
  });

  it('sleep voices have higher stability settings', () => {
    const sleepVoices = Object.values(VOICE_MAP).filter((v) => v.category === 'sleep');
    for (const voice of sleepVoices) {
      expect(voice.settings.stability).toBeGreaterThanOrEqual(0.85);
    }
  });

  it('sleep voices have speaker boost disabled', () => {
    const sleepVoices = Object.values(VOICE_MAP).filter((v) => v.category === 'sleep');
    for (const voice of sleepVoices) {
      expect(voice.settings.use_speaker_boost).toBe(false);
    }
  });

  it('fun voices have lower stability for more expressiveness', () => {
    const funVoices = Object.values(VOICE_MAP).filter((v) => v.category === 'fun');
    for (const voice of funVoices) {
      expect(voice.settings.stability).toBeLessThan(0.55);
    }
  });
});

describe('MODE_DEFAULT_VOICES', () => {
  it('has defaults for all three modes', () => {
    expect(MODE_DEFAULT_VOICES).toHaveProperty('sleep');
    expect(MODE_DEFAULT_VOICES).toHaveProperty('classic');
    expect(MODE_DEFAULT_VOICES).toHaveProperty('madlibs');
  });

  it('default voices exist in VOICE_MAP', () => {
    for (const voiceKey of Object.values(MODE_DEFAULT_VOICES)) {
      expect(VOICE_MAP).toHaveProperty(voiceKey);
    }
  });

  it('sleep default is moonbeam', () => {
    expect(MODE_DEFAULT_VOICES.sleep).toBe('moonbeam');
  });

  it('classic default is captain', () => {
    expect(MODE_DEFAULT_VOICES.classic).toBe('captain');
  });

  it('madlibs default is giggles', () => {
    expect(MODE_DEFAULT_VOICES.madlibs).toBe('giggles');
  });

  it('default voice categories match their mode', () => {
    expect(VOICE_MAP[MODE_DEFAULT_VOICES.sleep].category).toBe('sleep');
    expect(VOICE_MAP[MODE_DEFAULT_VOICES.classic].category).toBe('classic');
    expect(VOICE_MAP[MODE_DEFAULT_VOICES.madlibs].category).toBe('fun');
  });
});

describe('MODE_VOICE_CATEGORIES', () => {
  it('maps sleep mode to sleep category', () => {
    expect(MODE_VOICE_CATEGORIES.sleep).toBe('sleep');
  });

  it('maps classic mode to classic category', () => {
    expect(MODE_VOICE_CATEGORIES.classic).toBe('classic');
  });

  it('maps madlibs mode to fun category', () => {
    expect(MODE_VOICE_CATEGORIES.madlibs).toBe('fun');
  });
});

describe('getVoicesForMode', () => {
  it('returns sleep voices for sleep mode', () => {
    const voices = getVoicesForMode('sleep');
    expect(voices).toContain('moonbeam');
    expect(voices).toContain('whisper');
    expect(voices).toContain('stardust');
    expect(voices).toHaveLength(3);
  });

  it('returns classic voices for classic mode', () => {
    const voices = getVoicesForMode('classic');
    expect(voices).toContain('captain');
    expect(voices).toContain('professor');
    expect(voices).toContain('aurora');
    expect(voices).toHaveLength(3);
  });

  it('returns fun voices for madlibs mode', () => {
    const voices = getVoicesForMode('madlibs');
    expect(voices).toContain('giggles');
    expect(voices).toContain('blaze');
    expect(voices).toContain('ziggy');
    expect(voices).toHaveLength(3);
  });

  it('returns all voices for unknown mode', () => {
    const voices = getVoicesForMode('unknown');
    expect(voices).toHaveLength(Object.keys(VOICE_MAP).length);
  });

  it('returns all voices for empty string mode', () => {
    const voices = getVoicesForMode('');
    expect(voices).toHaveLength(Object.keys(VOICE_MAP).length);
  });

  it('does not include cross-category voices', () => {
    const sleepVoices = getVoicesForMode('sleep');
    expect(sleepVoices).not.toContain('captain');
    expect(sleepVoices).not.toContain('giggles');

    const classicVoices = getVoicesForMode('classic');
    expect(classicVoices).not.toContain('moonbeam');
    expect(classicVoices).not.toContain('blaze');

    const funVoices = getVoicesForMode('madlibs');
    expect(funVoices).not.toContain('whisper');
    expect(funVoices).not.toContain('professor');
  });
});

describe('voice lookup behavior', () => {
  it('VOICE_MAP keys are all lowercase', () => {
    for (const key of Object.keys(VOICE_MAP)) {
      expect(key).toBe(key.toLowerCase());
    }
  });

  it('fallback to moonbeam works for unknown voice key', () => {
    // This mirrors the pattern in generateSpeech: VOICE_MAP[key] || VOICE_MAP["moonbeam"]
    const unknownKey = 'nonexistent';
    const voice = VOICE_MAP[unknownKey.toLowerCase()] || VOICE_MAP['moonbeam'];
    expect(voice).toBeDefined();
    expect(voice.characterName).toBe('Moonbeam');
  });

  it('voice lookup is case-insensitive when lowercased', () => {
    const voice = VOICE_MAP['CAPTAIN'.toLowerCase()];
    expect(voice).toBeDefined();
    expect(voice.characterName).toBe('Captain Story');
  });
});

describe('sleep mode voice setting adjustments', () => {
  // Mirror the logic from generateSpeech for sleep mode overrides
  it('adjusts non-sleep voice settings for sleep mode', () => {
    const captainSettings = { ...VOICE_MAP['captain'].settings };
    // Sleep mode override logic
    const adjusted = {
      stability: Math.min(captainSettings.stability + 0.15, 0.95),
      style: Math.max(captainSettings.style - 0.10, 0.0),
      use_speaker_boost: false,
      similarity_boost: captainSettings.similarity_boost,
    };

    expect(adjusted.stability).toBeGreaterThan(captainSettings.stability);
    expect(adjusted.style).toBeLessThan(captainSettings.style);
    expect(adjusted.use_speaker_boost).toBe(false);
  });

  it('caps stability at 0.95', () => {
    // moonbeam already has stability 0.90, adding 0.15 would exceed 0.95
    const stability = Math.min(0.90 + 0.15, 0.95);
    expect(stability).toBe(0.95);
  });

  it('floors style at 0.0', () => {
    // stardust has style 0.08, subtracting 0.10 would go negative
    const style = Math.max(0.08 - 0.10, 0.0);
    expect(style).toBe(0.0);
  });
});
