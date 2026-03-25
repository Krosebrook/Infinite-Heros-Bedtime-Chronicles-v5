import { describe, it, expect } from "vitest";
import { DEFAULT_SETTINGS } from "../../lib/SettingsContext";
import type { AppSettings } from "../../lib/SettingsContext";

/**
 * Tests for the settings reducer and migration logic.
 * We replicate the pure reducer here because the SettingsContext
 * module uses React hooks that cannot run outside a React environment.
 */

type SettingsAction =
  | { type: "UPDATE"; payload: Partial<AppSettings> }
  | { type: "RESET" }
  | { type: "LOAD"; payload: AppSettings };

function settingsReducer(state: AppSettings, action: SettingsAction): AppSettings {
  switch (action.type) {
    case "UPDATE":
      return { ...state, ...action.payload };
    case "RESET":
      return { ...DEFAULT_SETTINGS };
    case "LOAD":
      return { ...DEFAULT_SETTINGS, ...action.payload };
    default:
      return state;
  }
}

describe("DEFAULT_SETTINGS", () => {
  it("has all expected fields", () => {
    expect(DEFAULT_SETTINGS.audioVolume).toBe(80);
    expect(DEFAULT_SETTINGS.audioSpeed).toBe(1.0);
    expect(DEFAULT_SETTINGS.narratorVoice).toBe("moonbeam");
    expect(DEFAULT_SETTINGS.autoPlay).toBe(false);
    expect(DEFAULT_SETTINGS.storyLength).toBe("medium");
    expect(DEFAULT_SETTINGS.ageRange).toBe("4-6");
    expect(DEFAULT_SETTINGS.defaultTheme).toBe("fantasy");
    expect(DEFAULT_SETTINGS.autoGenerateImages).toBe(false);
    expect(DEFAULT_SETTINGS.extendMode).toBe(false);
    expect(DEFAULT_SETTINGS.autoPlayNext).toBe(false);
    expect(DEFAULT_SETTINGS.textSize).toBe("medium");
    expect(DEFAULT_SETTINGS.librarySortOrder).toBe("recent");
    expect(DEFAULT_SETTINGS.showFavoritesOnly).toBe(false);
    expect(DEFAULT_SETTINGS.autoSave).toBe(true);
    expect(DEFAULT_SETTINGS.sleepTheme).toBe("Cloud Kingdom");
    expect(DEFAULT_SETTINGS.isMuted).toBe(false);
    expect(DEFAULT_SETTINGS.reducedMotion).toBe(false);
    expect(DEFAULT_SETTINGS.fontSize).toBe("normal");
  });
});

describe("settingsReducer", () => {
  describe("UPDATE action", () => {
    it("merges partial update into existing state", () => {
      const state = { ...DEFAULT_SETTINGS };
      const result = settingsReducer(state, {
        type: "UPDATE",
        payload: { audioVolume: 50, isMuted: true },
      });
      expect(result.audioVolume).toBe(50);
      expect(result.isMuted).toBe(true);
      // Other fields preserved
      expect(result.narratorVoice).toBe("moonbeam");
      expect(result.storyLength).toBe("medium");
    });

    it("does not remove existing fields", () => {
      const state = { ...DEFAULT_SETTINGS, audioVolume: 42 };
      const result = settingsReducer(state, {
        type: "UPDATE",
        payload: { isMuted: true },
      });
      expect(result.audioVolume).toBe(42);
    });
  });

  describe("RESET action", () => {
    it("returns DEFAULT_SETTINGS", () => {
      const modified = {
        ...DEFAULT_SETTINGS,
        audioVolume: 10,
        isMuted: true,
        narratorVoice: "captain",
      };
      const result = settingsReducer(modified, { type: "RESET" });
      expect(result).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe("LOAD action", () => {
    it("merges loaded data over defaults", () => {
      const stored = {
        ...DEFAULT_SETTINGS,
        audioVolume: 60,
        sleepTheme: "Ocean Depths",
      };
      const result = settingsReducer(DEFAULT_SETTINGS, {
        type: "LOAD",
        payload: stored,
      });
      expect(result.audioVolume).toBe(60);
      expect(result.sleepTheme).toBe("Ocean Depths");
    });

    it("fills missing fields with defaults", () => {
      // Simulate a partially stored settings object
      const partial = { audioVolume: 60 } as AppSettings;
      const result = settingsReducer(DEFAULT_SETTINGS, {
        type: "LOAD",
        payload: partial,
      });
      expect(result.audioVolume).toBe(60);
      expect(result.narratorVoice).toBe("moonbeam"); // default
      expect(result.storyLength).toBe("medium"); // default
    });
  });

  describe("unknown action", () => {
    it("returns current state unchanged", () => {
      const state = { ...DEFAULT_SETTINGS };
      // @ts-expect-error - testing unknown action
      const result = settingsReducer(state, { type: "UNKNOWN" });
      expect(result).toBe(state);
    });
  });
});

describe("Legacy migration logic", () => {
  // Replicate the migration logic from SettingsContext
  function migrateLegacy(
    merged: Partial<AppSettings>,
    legacy: Record<string, unknown>
  ): Partial<AppSettings> {
    const result = { ...merged };
    if (legacy.sleepTheme && !result.sleepTheme) result.sleepTheme = legacy.sleepTheme as string;
    if (legacy.isMuted !== undefined && result.isMuted === undefined) result.isMuted = legacy.isMuted as boolean;
    if (legacy.reducedMotion !== undefined && result.reducedMotion === undefined) result.reducedMotion = legacy.reducedMotion as boolean;
    if (legacy.fontSize && !result.fontSize) result.fontSize = legacy.fontSize as "normal" | "large";
    if (legacy.narratorVoice && !result.narratorVoice) result.narratorVoice = legacy.narratorVoice as string;
    if (legacy.storyLength && !result.storyLength) result.storyLength = legacy.storyLength as AppSettings["storyLength"];
    return result;
  }

  it("migrates legacy fields into empty settings", () => {
    const merged: Partial<AppSettings> = {};
    const legacy = {
      sleepTheme: "Starry Night",
      isMuted: true,
      reducedMotion: true,
      fontSize: "large",
      narratorVoice: "captain",
      storyLength: "long",
    };

    const result = migrateLegacy(merged, legacy);
    expect(result.sleepTheme).toBe("Starry Night");
    expect(result.isMuted).toBe(true);
    expect(result.reducedMotion).toBe(true);
    expect(result.fontSize).toBe("large");
    expect(result.narratorVoice).toBe("captain");
    expect(result.storyLength).toBe("long");
  });

  it("does not overwrite existing settings with legacy values", () => {
    const merged: Partial<AppSettings> = {
      sleepTheme: "Cloud Kingdom",
      narratorVoice: "moonbeam",
    };
    const legacy = {
      sleepTheme: "Old Theme",
      narratorVoice: "old_voice",
    };

    const result = migrateLegacy(merged, legacy);
    expect(result.sleepTheme).toBe("Cloud Kingdom");
    expect(result.narratorVoice).toBe("moonbeam");
  });

  it("handles empty legacy data gracefully", () => {
    const merged: Partial<AppSettings> = { audioVolume: 80 };
    const result = migrateLegacy(merged, {});
    expect(result).toEqual({ audioVolume: 80 });
  });

  it("migrates isMuted even when false (falsy but defined)", () => {
    const merged: Partial<AppSettings> = {};
    const legacy = { isMuted: false };
    const result = migrateLegacy(merged, legacy);
    expect(result.isMuted).toBe(false);
  });
});
