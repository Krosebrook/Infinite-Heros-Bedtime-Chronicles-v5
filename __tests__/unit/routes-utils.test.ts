/**
 * Tests for pure utility functions extracted from server/routes.ts.
 *
 * Since these are module-private functions, we test them indirectly
 * by reimplementing the same logic here for validation, or by importing
 * the module and testing via the route handlers.
 *
 * For this test file we directly replicate the pure functions to test
 * their logic in isolation without needing to import the full routes module
 * (which has side effects like cache directory creation and setInterval).
 */

import { describe, it, expect } from "vitest";

// ---- Replicated pure functions from routes.ts ----

function sanitizeString(val: unknown, maxLen: number): string {
  if (typeof val !== "string") return "";
  return val.slice(0, maxLen).trim();
}

function getPartCount(duration: string): number {
  switch (duration) {
    case "short": return 3;
    case "medium-short": return 4;
    case "medium": return 5;
    case "long": return 6;
    case "epic": return 7;
    default: return 5;
  }
}

function getWordCount(duration: string): string {
  switch (duration) {
    case "short": return "200-300";
    case "medium-short": return "350-450";
    case "medium": return "500-650";
    case "long": return "750-950";
    case "epic": return "1000-1300";
    default: return "500-650";
  }
}

const VALID_MODES = ["classic", "madlibs", "sleep"];
const VALID_DURATIONS = ["short", "medium-short", "medium", "long", "epic"];

function checkRateLimit(
  rateLimitMap: Map<string, { count: number; resetAt: number }>,
  ip: string,
  windowMs: number,
  maxRequests: number
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

// ---- Tests ----

describe("sanitizeString", () => {
  it("returns empty string for non-string input", () => {
    expect(sanitizeString(undefined, 100)).toBe("");
    expect(sanitizeString(null, 100)).toBe("");
    expect(sanitizeString(42, 100)).toBe("");
    expect(sanitizeString({}, 100)).toBe("");
    expect(sanitizeString(true, 100)).toBe("");
    expect(sanitizeString([], 100)).toBe("");
  });

  it("truncates strings longer than maxLen", () => {
    expect(sanitizeString("abcdefgh", 5)).toBe("abcde");
  });

  it("trims whitespace", () => {
    expect(sanitizeString("  hello  ", 100)).toBe("hello");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeString("", 100)).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(sanitizeString("   ", 100)).toBe("");
  });

  it("truncates before trimming", () => {
    // "  ab" truncated to 4 chars, then trimmed
    expect(sanitizeString("  ab  ", 4)).toBe("ab");
  });

  it("handles zero maxLen", () => {
    expect(sanitizeString("hello", 0)).toBe("");
  });
});

describe("getPartCount", () => {
  it("returns correct part count for each duration", () => {
    expect(getPartCount("short")).toBe(3);
    expect(getPartCount("medium-short")).toBe(4);
    expect(getPartCount("medium")).toBe(5);
    expect(getPartCount("long")).toBe(6);
    expect(getPartCount("epic")).toBe(7);
  });

  it("returns 5 (medium) for unknown duration", () => {
    expect(getPartCount("unknown")).toBe(5);
    expect(getPartCount("")).toBe(5);
  });
});

describe("getWordCount", () => {
  it("returns correct word count range for each duration", () => {
    expect(getWordCount("short")).toBe("200-300");
    expect(getWordCount("medium-short")).toBe("350-450");
    expect(getWordCount("medium")).toBe("500-650");
    expect(getWordCount("long")).toBe("750-950");
    expect(getWordCount("epic")).toBe("1000-1300");
  });

  it("returns medium range for unknown duration", () => {
    expect(getWordCount("invalid")).toBe("500-650");
  });
});

describe("VALID_MODES and VALID_DURATIONS", () => {
  it("contains expected modes", () => {
    expect(VALID_MODES).toEqual(["classic", "madlibs", "sleep"]);
  });

  it("contains expected durations", () => {
    expect(VALID_DURATIONS).toContain("short");
    expect(VALID_DURATIONS).toContain("medium-short");
    expect(VALID_DURATIONS).toContain("medium");
    expect(VALID_DURATIONS).toContain("long");
    expect(VALID_DURATIONS).toContain("epic");
    expect(VALID_DURATIONS).toHaveLength(5);
  });
});

describe("checkRateLimit", () => {
  it("allows first request from an IP", () => {
    const map = new Map();
    expect(checkRateLimit(map, "1.2.3.4", 60000, 10)).toBe(true);
  });

  it("allows requests up to the limit", () => {
    const map = new Map();
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(map, "1.2.3.4", 60000, 10)).toBe(true);
    }
  });

  it("denies request at limit + 1", () => {
    const map = new Map();
    for (let i = 0; i < 10; i++) {
      checkRateLimit(map, "1.2.3.4", 60000, 10);
    }
    expect(checkRateLimit(map, "1.2.3.4", 60000, 10)).toBe(false);
  });

  it("allows requests after window expires", () => {
    const map = new Map();
    // Fill up the limit
    for (let i = 0; i < 10; i++) {
      checkRateLimit(map, "1.2.3.4", 1, 10); // 1ms window
    }
    // Denied at limit
    expect(checkRateLimit(map, "1.2.3.4", 1, 10)).toBe(false);

    // Manually expire the entry
    const entry = map.get("1.2.3.4")!;
    entry.resetAt = Date.now() - 1;

    // Now allowed again
    expect(checkRateLimit(map, "1.2.3.4", 60000, 10)).toBe(true);
  });

  it("tracks different IPs independently", () => {
    const map = new Map();
    for (let i = 0; i < 10; i++) {
      checkRateLimit(map, "1.1.1.1", 60000, 10);
    }
    expect(checkRateLimit(map, "1.1.1.1", 60000, 10)).toBe(false);
    expect(checkRateLimit(map, "2.2.2.2", 60000, 10)).toBe(true);
  });
});

describe("TTS filename validation regex", () => {
  const TTS_FILE_REGEX = /^[a-f0-9]+\.mp3$/;

  it("accepts valid hex filenames", () => {
    expect(TTS_FILE_REGEX.test("abc123def456.mp3")).toBe(true);
    expect(TTS_FILE_REGEX.test("0000.mp3")).toBe(true);
  });

  it("rejects path traversal attempts", () => {
    expect(TTS_FILE_REGEX.test("../../etc/passwd")).toBe(false);
    expect(TTS_FILE_REGEX.test("../abc.mp3")).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(TTS_FILE_REGEX.test("ghijk.mp3")).toBe(false);
    expect(TTS_FILE_REGEX.test("ABCDEF.mp3")).toBe(false);
  });

  it("rejects wrong extensions", () => {
    expect(TTS_FILE_REGEX.test("abc123.wav")).toBe(false);
    expect(TTS_FILE_REGEX.test("abc123.mp3.exe")).toBe(false);
  });

  it("rejects empty filename", () => {
    expect(TTS_FILE_REGEX.test(".mp3")).toBe(false);
    expect(TTS_FILE_REGEX.test("")).toBe(false);
  });
});

describe("Story prompt construction", () => {
  const CHILD_SAFETY_RULES = `
CRITICAL SAFETY RULES (non-negotiable):
- NEVER include violence, weapons, fighting, battles, or physical conflict of any kind`;

  function getStorySystemPrompt(mode: string, partCount: number): string {
    const modeRules = mode === "madlibs"
      ? "You are a hilarious bedtime storyteller."
      : mode === "sleep"
      ? "You are a gentle, hypnotic bedtime narrator."
      : "You are a master bedtime storyteller.";

    const choiceInstructions = mode === "sleep"
      ? "Since this is Sleep Mode, do NOT include choices."
      : `For each part EXCEPT the last one, include exactly 3 choices`;

    return `${modeRules}\n\n${CHILD_SAFETY_RULES}\n\n${choiceInstructions}\n\nThe story MUST have exactly ${partCount} parts.`;
  }

  it("includes child safety rules in every mode", () => {
    for (const mode of ["classic", "madlibs", "sleep"]) {
      const prompt = getStorySystemPrompt(mode, 5);
      expect(prompt).toContain("CRITICAL SAFETY RULES");
      expect(prompt).toContain("NEVER include violence");
    }
  });

  it("excludes choices instruction for sleep mode", () => {
    const prompt = getStorySystemPrompt("sleep", 5);
    expect(prompt).toContain("do NOT include choices");
    expect(prompt).not.toContain("include exactly 3 choices");
  });

  it("includes choices instruction for classic and madlibs", () => {
    expect(getStorySystemPrompt("classic", 5)).toContain("include exactly 3 choices");
    expect(getStorySystemPrompt("madlibs", 5)).toContain("include exactly 3 choices");
  });

  it("includes correct part count", () => {
    const prompt = getStorySystemPrompt("classic", 7);
    expect(prompt).toContain("exactly 7 parts");
  });

  it("uses mode-specific storyteller persona", () => {
    expect(getStorySystemPrompt("classic", 5)).toContain("master bedtime storyteller");
    expect(getStorySystemPrompt("madlibs", 5)).toContain("hilarious bedtime storyteller");
    expect(getStorySystemPrompt("sleep", 5)).toContain("gentle, hypnotic bedtime narrator");
  });
});
