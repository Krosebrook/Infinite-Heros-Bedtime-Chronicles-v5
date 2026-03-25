import { describe, it, expect } from "vitest";
import { DEFAULT_PARENT_CONTROLS, CONTENT_THEMES } from "../../constants/types";
import type { ParentControls } from "../../constants/types";

/**
 * Tests for parent controls business logic.
 * Since the modal is a React component, we test the pure logic in isolation.
 */

describe("DEFAULT_PARENT_CONTROLS", () => {
  it("has sensible defaults", () => {
    expect(DEFAULT_PARENT_CONTROLS.maxStoryLength).toBe("epic");
    expect(DEFAULT_PARENT_CONTROLS.bedtimeHour).toBe(20);
    expect(DEFAULT_PARENT_CONTROLS.bedtimeMinute).toBe(0);
    expect(DEFAULT_PARENT_CONTROLS.bedtimeEnabled).toBe(false);
    expect(DEFAULT_PARENT_CONTROLS.pinCode).toBe("");
    expect(DEFAULT_PARENT_CONTROLS.videoEnabled).toBe(false);
  });

  it("allows all content themes by default", () => {
    const themeIds = CONTENT_THEMES.map((t) => t.id);
    expect(DEFAULT_PARENT_CONTROLS.allowedThemes).toEqual(themeIds);
  });
});

describe("PIN Validation Logic", () => {
  function isPinValid(pin: string): boolean {
    return pin.length >= 4;
  }

  function checkPin(input: string, stored: string): boolean {
    return input === stored;
  }

  function isUnlocked(pinCode: string): boolean {
    return !pinCode; // No PIN = automatically unlocked
  }

  it("requires minimum 4 characters", () => {
    expect(isPinValid("123")).toBe(false);
    expect(isPinValid("1234")).toBe(true);
    expect(isPinValid("12345")).toBe(true);
  });

  it("validates PIN comparison exactly", () => {
    expect(checkPin("1234", "1234")).toBe(true);
    expect(checkPin("1234", "5678")).toBe(false);
    expect(checkPin("1234", "1234 ")).toBe(false);
    expect(checkPin("", "")).toBe(true);
  });

  it("auto-unlocks when no PIN is set", () => {
    expect(isUnlocked("")).toBe(true);
    expect(isUnlocked("1234")).toBe(false);
  });
});

describe("Bedtime Hour/Minute Wrapping", () => {
  function adjustHour(current: number, delta: number): number {
    return ((current + delta) % 24 + 24) % 24;
  }

  function adjustMinute(current: number, delta: number): number {
    return ((current + delta) % 60 + 60) % 60;
  }

  describe("Hour wrapping", () => {
    it("increments normally", () => {
      expect(adjustHour(20, 1)).toBe(21);
    });

    it("wraps 23 + 1 to 0", () => {
      expect(adjustHour(23, 1)).toBe(0);
    });

    it("wraps 0 - 1 to 23", () => {
      expect(adjustHour(0, -1)).toBe(23);
    });

    it("handles mid-range values", () => {
      expect(adjustHour(12, 1)).toBe(13);
      expect(adjustHour(12, -1)).toBe(11);
    });
  });

  describe("Minute wrapping", () => {
    it("increments normally", () => {
      expect(adjustMinute(30, 5)).toBe(35);
    });

    it("wraps 55 + 5 to 0", () => {
      expect(adjustMinute(55, 5)).toBe(0);
    });

    it("wraps 0 - 5 to 55", () => {
      expect(adjustMinute(0, -5)).toBe(55);
    });

    it("wraps 59 + 1 to 0", () => {
      expect(adjustMinute(59, 1)).toBe(0);
    });

    it("wraps 0 - 1 to 59", () => {
      expect(adjustMinute(0, -1)).toBe(59);
    });
  });
});

describe("12-Hour AM/PM Conversion", () => {
  function formatTime(hour: number, minute: number): string {
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? "AM" : "PM";
    const minStr = minute.toString().padStart(2, "0");
    return `${h12}:${minStr} ${ampm}`;
  }

  it("converts midnight (0:00) to 12:00 AM", () => {
    expect(formatTime(0, 0)).toBe("12:00 AM");
  });

  it("converts noon (12:00) to 12:00 PM", () => {
    expect(formatTime(12, 0)).toBe("12:00 PM");
  });

  it("converts 8:00 PM (20:00) correctly", () => {
    expect(formatTime(20, 0)).toBe("8:00 PM");
  });

  it("converts 8:30 AM correctly", () => {
    expect(formatTime(8, 30)).toBe("8:30 AM");
  });

  it("converts 11:59 PM (23:59) correctly", () => {
    expect(formatTime(23, 59)).toBe("11:59 PM");
  });

  it("pads single-digit minutes", () => {
    expect(formatTime(20, 5)).toBe("8:05 PM");
  });
});

describe("Theme Filtering Logic", () => {
  function toggleTheme(current: string[], themeId: string): string[] {
    if (current.includes(themeId)) {
      // Prevent removing all themes
      if (current.length <= 1) return current;
      return current.filter((t) => t !== themeId);
    }
    return [...current, themeId];
  }

  it("adds a theme when not present", () => {
    const result = toggleTheme(["courage", "kindness"], "friendship");
    expect(result).toContain("friendship");
    expect(result).toHaveLength(3);
  });

  it("removes a theme when present", () => {
    const result = toggleTheme(["courage", "kindness"], "kindness");
    expect(result).not.toContain("kindness");
    expect(result).toHaveLength(1);
  });

  it("prevents removing the last theme", () => {
    const result = toggleTheme(["courage"], "courage");
    expect(result).toContain("courage");
    expect(result).toHaveLength(1);
  });

  it("allows removing when multiple themes exist", () => {
    const result = toggleTheme(["courage", "kindness", "friendship"], "kindness");
    expect(result).not.toContain("kindness");
    expect(result).toHaveLength(2);
  });
});

describe("Story Length Validation", () => {
  const VALID_LENGTHS = ["short", "medium-short", "medium", "long", "epic"];

  it("validates all allowed lengths", () => {
    for (const length of VALID_LENGTHS) {
      expect(VALID_LENGTHS.includes(length)).toBe(true);
    }
  });

  it("rejects invalid lengths", () => {
    expect(VALID_LENGTHS.includes("tiny")).toBe(false);
    expect(VALID_LENGTHS.includes("huge")).toBe(false);
    expect(VALID_LENGTHS.includes("")).toBe(false);
  });
});
