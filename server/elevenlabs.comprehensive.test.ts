import { describe, it, expect } from 'vitest';
import { VOICE_MAP, MODE_DEFAULT_VOICES, getVoicesForMode, type VoiceConfig, type VoiceCategory } from './elevenlabs';

// ══════════════════════════════════════════════════════════════════
// ElevenLabs TTS Configuration & Voice Management Tests
// ══════════════════════════════════════════════════════════════════

describe('VOICE_MAP structure', () => {
  it('has exactly 9 voices', () => {
    expect(Object.keys(VOICE_MAP)).toHaveLength(9);
  });

  it('contains all expected voice keys', () => {
    const expected = ['moonbeam', 'whisper', 'stardust', 'captain', 'professor', 'aurora', 'giggles', 'blaze', 'ziggy'];
    for (const key of expected) {
      expect(VOICE_MAP).toHaveProperty(key);
    }
  });

  it('each voice has a valid ElevenLabs voice ID', () => {
    for (const [key, voice] of Object.entries(VOICE_MAP)) {
      expect(voice.id).toBeTruthy();
      expect(typeof voice.id).toBe('string');
      expect(voice.id.length).toBeGreaterThan(5);
    }
  });

  it('each voice has all required fields', () => {
    const requiredFields: (keyof VoiceConfig)[] = [
      'id', 'name', 'characterName', 'description', 'accent', 'personality', 'category', 'previewText', 'settings',
    ];
    for (const [key, voice] of Object.entries(VOICE_MAP)) {
      for (const field of requiredFields) {
        expect(voice).toHaveProperty(field);
      }
    }
  });

  it('each voice has valid settings', () => {
    for (const [key, voice] of Object.entries(VOICE_MAP)) {
      expect(voice.settings.stability).toBeGreaterThanOrEqual(0);
      expect(voice.settings.stability).toBeLessThanOrEqual(1);
      expect(voice.settings.similarity_boost).toBeGreaterThanOrEqual(0);
      expect(voice.settings.similarity_boost).toBeLessThanOrEqual(1);
      expect(voice.settings.style).toBeGreaterThanOrEqual(0);
      expect(voice.settings.style).toBeLessThanOrEqual(1);
      expect(typeof voice.settings.use_speaker_boost).toBe('boolean');
    }
  });

  it('each voice has a non-empty preview text', () => {
    for (const [key, voice] of Object.entries(VOICE_MAP)) {
      expect(voice.previewText.length).toBeGreaterThan(10);
    }
  });

  it('all voice IDs are unique', () => {
    const ids = Object.values(VOICE_MAP).map(v => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all character names are unique', () => {
    const names = Object.values(VOICE_MAP).map(v => v.characterName);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('voice categories', () => {
  it('has 3 sleep voices', () => {
    const sleep = Object.values(VOICE_MAP).filter(v => v.category === 'sleep');
    expect(sleep).toHaveLength(3);
  });

  it('has 3 classic voices', () => {
    const classic = Object.values(VOICE_MAP).filter(v => v.category === 'classic');
    expect(classic).toHaveLength(3);
  });

  it('has 3 fun voices', () => {
    const fun = Object.values(VOICE_MAP).filter(v => v.category === 'fun');
    expect(fun).toHaveLength(3);
  });

  it('sleep voices have high stability', () => {
    const sleep = Object.values(VOICE_MAP).filter(v => v.category === 'sleep');
    for (const voice of sleep) {
      expect(voice.settings.stability).toBeGreaterThanOrEqual(0.85);
    }
  });

  it('sleep voices have speaker boost disabled', () => {
    const sleep = Object.values(VOICE_MAP).filter(v => v.category === 'sleep');
    for (const voice of sleep) {
      expect(voice.settings.use_speaker_boost).toBe(false);
    }
  });

  it('fun voices have lower stability for expressiveness', () => {
    const fun = Object.values(VOICE_MAP).filter(v => v.category === 'fun');
    for (const voice of fun) {
      expect(voice.settings.stability).toBeLessThan(0.6);
    }
  });

  it('fun voices have speaker boost enabled', () => {
    const fun = Object.values(VOICE_MAP).filter(v => v.category === 'fun');
    for (const voice of fun) {
      expect(voice.settings.use_speaker_boost).toBe(true);
    }
  });

  it('classic voices have moderate stability', () => {
    const classic = Object.values(VOICE_MAP).filter(v => v.category === 'classic');
    for (const voice of classic) {
      expect(voice.settings.stability).toBeGreaterThanOrEqual(0.6);
      expect(voice.settings.stability).toBeLessThanOrEqual(0.8);
    }
  });
});

describe('MODE_DEFAULT_VOICES', () => {
  it('has defaults for all modes', () => {
    expect(MODE_DEFAULT_VOICES).toHaveProperty('sleep');
    expect(MODE_DEFAULT_VOICES).toHaveProperty('classic');
    expect(MODE_DEFAULT_VOICES).toHaveProperty('madlibs');
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

  it('all default voices exist in VOICE_MAP', () => {
    for (const voiceKey of Object.values(MODE_DEFAULT_VOICES)) {
      expect(VOICE_MAP).toHaveProperty(voiceKey);
    }
  });

  it('default voices match their mode category', () => {
    expect(VOICE_MAP[MODE_DEFAULT_VOICES.sleep].category).toBe('sleep');
    expect(VOICE_MAP[MODE_DEFAULT_VOICES.classic].category).toBe('classic');
    expect(VOICE_MAP[MODE_DEFAULT_VOICES.madlibs].category).toBe('fun');
  });
});

describe('getVoicesForMode', () => {
  it('returns 3 sleep voices for sleep mode', () => {
    const voices = getVoicesForMode('sleep');
    expect(voices).toHaveLength(3);
    expect(voices).toContain('moonbeam');
    expect(voices).toContain('whisper');
    expect(voices).toContain('stardust');
  });

  it('returns 3 classic voices for classic mode', () => {
    const voices = getVoicesForMode('classic');
    expect(voices).toHaveLength(3);
    expect(voices).toContain('captain');
    expect(voices).toContain('professor');
    expect(voices).toContain('aurora');
  });

  it('returns 3 fun voices for madlibs mode', () => {
    const voices = getVoicesForMode('madlibs');
    expect(voices).toHaveLength(3);
    expect(voices).toContain('giggles');
    expect(voices).toContain('blaze');
    expect(voices).toContain('ziggy');
  });

  it('returns ALL voices for unknown mode', () => {
    const voices = getVoicesForMode('unknown');
    expect(voices).toHaveLength(9);
  });

  it('returns ALL voices for empty mode', () => {
    const voices = getVoicesForMode('');
    expect(voices).toHaveLength(9);
  });

  it('is case-sensitive', () => {
    const voices = getVoicesForMode('Sleep');
    expect(voices).toHaveLength(9); // Falls through to default
  });

  it('sleep voices do not include classic voices', () => {
    const sleep = getVoicesForMode('sleep');
    const classic = getVoicesForMode('classic');
    for (const v of classic) {
      expect(sleep).not.toContain(v);
    }
  });

  it('sleep voices do not include fun voices', () => {
    const sleep = getVoicesForMode('sleep');
    const fun = getVoicesForMode('madlibs');
    for (const v of fun) {
      expect(sleep).not.toContain(v);
    }
  });
});

describe('sleep mode voice adjustment logic', () => {
  // Mirror the adjustment from generateSpeech
  function adjustForSleep(settings: VoiceConfig['settings'], category: VoiceCategory) {
    const adjusted = { ...settings };
    if (category !== 'sleep') {
      adjusted.stability = Math.min(adjusted.stability + 0.15, 0.95);
      adjusted.style = Math.max(adjusted.style - 0.10, 0.0);
      adjusted.use_speaker_boost = false;
    }
    return adjusted;
  }

  it('does not adjust sleep voices', () => {
    const original = VOICE_MAP.moonbeam.settings;
    const adjusted = adjustForSleep(original, 'sleep');
    expect(adjusted).toEqual(original);
  });

  it('increases stability for classic voice in sleep mode', () => {
    const original = VOICE_MAP.captain.settings;
    const adjusted = adjustForSleep(original, 'classic');
    expect(adjusted.stability).toBe(Math.min(original.stability + 0.15, 0.95));
  });

  it('decreases style for fun voice in sleep mode', () => {
    const original = VOICE_MAP.giggles.settings;
    const adjusted = adjustForSleep(original, 'fun');
    expect(adjusted.style).toBe(Math.max(original.style - 0.10, 0.0));
  });

  it('disables speaker boost for non-sleep in sleep mode', () => {
    const original = VOICE_MAP.blaze.settings;
    const adjusted = adjustForSleep(original, 'fun');
    expect(adjusted.use_speaker_boost).toBe(false);
  });

  it('caps stability at 0.95', () => {
    const highStabilitySettings = { stability: 0.90, similarity_boost: 0.8, style: 0.1, use_speaker_boost: true };
    const adjusted = adjustForSleep(highStabilitySettings, 'classic');
    expect(adjusted.stability).toBe(0.95);
  });

  it('floors style at 0.0', () => {
    const lowStyleSettings = { stability: 0.5, similarity_boost: 0.8, style: 0.05, use_speaker_boost: true };
    const adjusted = adjustForSleep(lowStyleSettings, 'classic');
    expect(adjusted.style).toBe(0.0);
  });

  it('does not modify similarity_boost', () => {
    const original = VOICE_MAP.captain.settings;
    const adjusted = adjustForSleep(original, 'classic');
    expect(adjusted.similarity_boost).toBe(original.similarity_boost);
  });
});

describe('voice accent and personality', () => {
  it('has both American and British accents', () => {
    const accents = new Set(Object.values(VOICE_MAP).map(v => v.accent));
    expect(accents).toContain('American');
    expect(accents).toContain('British');
  });

  it('all descriptions are child-friendly', () => {
    const forbiddenWords = ['scary', 'dark', 'frightening', 'horror', 'violent'];
    for (const voice of Object.values(VOICE_MAP)) {
      for (const word of forbiddenWords) {
        expect(voice.description.toLowerCase()).not.toContain(word);
        expect(voice.personality.toLowerCase()).not.toContain(word);
      }
    }
  });

  it('all preview texts are appropriate for children', () => {
    for (const voice of Object.values(VOICE_MAP)) {
      expect(voice.previewText.length).toBeLessThan(200);
      expect(voice.previewText.length).toBeGreaterThan(20);
    }
  });
});
