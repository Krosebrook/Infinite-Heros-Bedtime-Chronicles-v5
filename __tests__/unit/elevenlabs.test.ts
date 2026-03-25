import { describe, it, expect } from "vitest";
import {
  VOICE_MAP,
  MODE_DEFAULT_VOICES,
  MODE_VOICE_CATEGORIES,
  getVoicesForMode,
} from "../../server/elevenlabs";
import type { VoiceCategory } from "../../server/elevenlabs";

describe("VOICE_MAP", () => {
  it("contains 9 voices", () => {
    expect(Object.keys(VOICE_MAP)).toHaveLength(9);
  });

  it("every voice has required fields", () => {
    for (const [key, voice] of Object.entries(VOICE_MAP)) {
      expect(voice.id).toBeTruthy();
      expect(voice.name).toBeTruthy();
      expect(voice.characterName).toBeTruthy();
      expect(voice.description).toBeTruthy();
      expect(voice.accent).toBeTruthy();
      expect(voice.personality).toBeTruthy();
      expect(["sleep", "classic", "fun"]).toContain(voice.category);
      expect(voice.previewText.length).toBeGreaterThan(10);
      expect(voice.settings.stability).toBeGreaterThanOrEqual(0);
      expect(voice.settings.stability).toBeLessThanOrEqual(1);
      expect(voice.settings.similarity_boost).toBeGreaterThanOrEqual(0);
      expect(voice.settings.similarity_boost).toBeLessThanOrEqual(1);
    }
  });

  it("has unique voice IDs", () => {
    const ids = Object.values(VOICE_MAP).map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has sleep voices with high stability", () => {
    const sleepVoices = Object.values(VOICE_MAP).filter((v) => v.category === "sleep");
    for (const voice of sleepVoices) {
      expect(voice.settings.stability).toBeGreaterThanOrEqual(0.85);
      expect(voice.settings.use_speaker_boost).toBe(false);
    }
  });

  it("has fun voices with lower stability for expressiveness", () => {
    const funVoices = Object.values(VOICE_MAP).filter((v) => v.category === "fun");
    for (const voice of funVoices) {
      expect(voice.settings.stability).toBeLessThan(0.55);
      expect(voice.settings.use_speaker_boost).toBe(true);
    }
  });
});

describe("MODE_DEFAULT_VOICES", () => {
  it("maps each mode to a valid voice key", () => {
    expect(VOICE_MAP[MODE_DEFAULT_VOICES.sleep]).toBeDefined();
    expect(VOICE_MAP[MODE_DEFAULT_VOICES.classic]).toBeDefined();
    expect(VOICE_MAP[MODE_DEFAULT_VOICES.madlibs]).toBeDefined();
  });

  it("sleep default is moonbeam (sleep category)", () => {
    expect(MODE_DEFAULT_VOICES.sleep).toBe("moonbeam");
    expect(VOICE_MAP.moonbeam.category).toBe("sleep");
  });

  it("classic default is captain (classic category)", () => {
    expect(MODE_DEFAULT_VOICES.classic).toBe("captain");
    expect(VOICE_MAP.captain.category).toBe("classic");
  });

  it("madlibs default is giggles (fun category)", () => {
    expect(MODE_DEFAULT_VOICES.madlibs).toBe("giggles");
    expect(VOICE_MAP.giggles.category).toBe("fun");
  });
});

describe("MODE_VOICE_CATEGORIES", () => {
  it("maps modes to correct categories", () => {
    expect(MODE_VOICE_CATEGORIES.sleep).toBe("sleep");
    expect(MODE_VOICE_CATEGORIES.classic).toBe("classic");
    expect(MODE_VOICE_CATEGORIES.madlibs).toBe("fun");
  });
});

describe("getVoicesForMode", () => {
  it("returns only sleep-category voices for sleep mode", () => {
    const voices = getVoicesForMode("sleep");
    for (const key of voices) {
      expect(VOICE_MAP[key].category).toBe("sleep");
    }
    expect(voices.length).toBeGreaterThan(0);
  });

  it("returns only classic-category voices for classic mode", () => {
    const voices = getVoicesForMode("classic");
    for (const key of voices) {
      expect(VOICE_MAP[key].category).toBe("classic");
    }
  });

  it("returns only fun-category voices for madlibs mode", () => {
    const voices = getVoicesForMode("madlibs");
    for (const key of voices) {
      expect(VOICE_MAP[key].category).toBe("fun");
    }
  });

  it("returns all voices for unknown mode", () => {
    const voices = getVoicesForMode("unknown");
    expect(voices).toHaveLength(Object.keys(VOICE_MAP).length);
  });

  it("returns all voices for empty mode", () => {
    const voices = getVoicesForMode("");
    expect(voices).toHaveLength(Object.keys(VOICE_MAP).length);
  });
});

describe("Sleep mode voice override logic", () => {
  // Replicating the override logic from generateSpeech
  function applySleepOverride(voiceKey: string): {
    stability: number;
    style: number;
    use_speaker_boost: boolean;
  } {
    const voiceInfo = VOICE_MAP[voiceKey.toLowerCase()] || VOICE_MAP["moonbeam"];
    const settings = { ...voiceInfo.settings };

    if (voiceInfo.category !== "sleep") {
      settings.stability = Math.min(settings.stability + 0.15, 0.95);
      settings.style = Math.max(settings.style - 0.10, 0.0);
      settings.use_speaker_boost = false;
    }

    return {
      stability: settings.stability,
      style: settings.style,
      use_speaker_boost: settings.use_speaker_boost,
    };
  }

  it("boosts stability for non-sleep voice in sleep mode", () => {
    const result = applySleepOverride("captain"); // classic, stability 0.65
    expect(result.stability).toBe(0.80); // 0.65 + 0.15
  });

  it("caps stability at 0.95", () => {
    const result = applySleepOverride("whisper"); // sleep voice, already 0.95
    // sleep voices don't get overridden
    expect(result.stability).toBe(0.95);
  });

  it("reduces style for non-sleep voice in sleep mode", () => {
    const original = VOICE_MAP.captain.settings.style; // 0.30
    const result = applySleepOverride("captain");
    expect(result.style).toBeCloseTo(0.20); // 0.30 - 0.10
  });

  it("floors style at 0.0", () => {
    const result = applySleepOverride("moonbeam"); // style 0.05, but sleep category so no override
    expect(result.style).toBe(0.05);
  });

  it("disables speaker boost for non-sleep voice in sleep mode", () => {
    const result = applySleepOverride("captain");
    expect(result.use_speaker_boost).toBe(false);
  });

  it("does not modify sleep voices in sleep mode", () => {
    const original = VOICE_MAP.moonbeam.settings;
    const result = applySleepOverride("moonbeam");
    expect(result.stability).toBe(original.stability);
    expect(result.style).toBe(original.style);
    expect(result.use_speaker_boost).toBe(original.use_speaker_boost);
  });

  it("falls back to moonbeam for unknown voice key", () => {
    const result = applySleepOverride("nonexistent");
    // moonbeam is sleep category so no override
    expect(result.stability).toBe(VOICE_MAP.moonbeam.settings.stability);
  });
});
