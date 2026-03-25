import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetStorage, mockAsyncStorage } from "../setup";

// Mock AsyncStorage before importing the module under test
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: mockAsyncStorage,
}));

// Mock heroes (needed by checkAndAwardBadges)
vi.mock("@/constants/heroes", () => ({
  HEROES: [
    { id: "hero-1", name: "Nova" },
    { id: "hero-2", name: "Coral" },
    { id: "hero-3", name: "Orion" },
    { id: "hero-4", name: "Luna" },
    { id: "hero-5", name: "Nimbus" },
    { id: "hero-6", name: "Bloom" },
    { id: "hero-7", name: "Whistle" },
    { id: "hero-8", name: "Shade" },
  ],
}));

import {
  getBadges,
  awardBadge,
  getAllBadges,
  getStreak,
  updateStreak,
  checkAndAwardBadges,
} from "../../lib/storage";

import type { EarnedBadge, CachedStory, StoryFull } from "../../constants/types";

const PROFILE_ID = "profile-1";

function makeBadge(id: string, profileId = PROFILE_ID): EarnedBadge {
  return { id, emoji: "x", title: id, description: id, earnedAt: Date.now(), profileId };
}

function makeStory(overrides: Partial<CachedStory> = {}): CachedStory {
  const story: StoryFull = {
    title: "Test",
    parts: [{ text: "Once upon a time...", partIndex: 0 }],
    vocabWord: { word: "test", definition: "a test" },
    joke: "ha",
    lesson: "be kind",
    tomorrowHook: "next time...",
    rewardBadge: { emoji: "x", title: "x", description: "x" },
  };
  return {
    id: "s-" + Math.random().toString(36).slice(2),
    timestamp: Date.now(),
    story,
    heroId: "hero-1",
    mode: "classic",
    profileId: PROFILE_ID,
    ...overrides,
  };
}

describe("Badge System", () => {
  beforeEach(() => {
    resetStorage();
  });

  describe("awardBadge", () => {
    it("awards a new badge and returns true", async () => {
      const badge = makeBadge("first-adventure");
      const result = await awardBadge(badge);
      expect(result).toBe(true);

      const badges = await getBadges(PROFILE_ID);
      expect(badges).toHaveLength(1);
      expect(badges[0].id).toBe("first-adventure");
    });

    it("prevents duplicate badges for the same profile", async () => {
      const badge = makeBadge("first-adventure");
      await awardBadge(badge);
      const result = await awardBadge(badge);
      expect(result).toBe(false);

      const badges = await getAllBadges();
      expect(badges).toHaveLength(1);
    });

    it("allows same badge for different profiles", async () => {
      await awardBadge(makeBadge("first-adventure", "profile-1"));
      const result = await awardBadge(makeBadge("first-adventure", "profile-2"));
      expect(result).toBe(true);

      const all = await getAllBadges();
      expect(all).toHaveLength(2);
    });
  });

  describe("getBadges", () => {
    it("returns empty array for profile with no badges", async () => {
      const badges = await getBadges("nonexistent");
      expect(badges).toEqual([]);
    });

    it("filters badges by profileId", async () => {
      await awardBadge(makeBadge("badge-a", "profile-1"));
      await awardBadge(makeBadge("badge-b", "profile-2"));

      const p1 = await getBadges("profile-1");
      expect(p1).toHaveLength(1);
      expect(p1[0].id).toBe("badge-a");
    });
  });
});

describe("Streak System", () => {
  beforeEach(() => {
    resetStorage();
  });

  describe("getStreak", () => {
    it("returns default streak for new profile", async () => {
      const streak = await getStreak(PROFILE_ID);
      expect(streak).toEqual({
        profileId: PROFILE_ID,
        currentStreak: 0,
        longestStreak: 0,
        lastStoryDate: "",
      });
    });
  });

  describe("updateStreak", () => {
    it("creates a streak of 1 for first story", async () => {
      const streak = await updateStreak(PROFILE_ID);
      expect(streak.currentStreak).toBe(1);
      expect(streak.longestStreak).toBe(1);
    });

    it("does not increment on same-day story", async () => {
      const s1 = await updateStreak(PROFILE_ID);
      const s2 = await updateStreak(PROFILE_ID);
      expect(s2.currentStreak).toBe(1);
      expect(s2.lastStoryDate).toBe(s1.lastStoryDate);
    });

    it("increments streak on consecutive day", async () => {
      // Manually set yesterday as last story date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const streakData = [{
        profileId: PROFILE_ID,
        currentStreak: 3,
        longestStreak: 5,
        lastStoryDate: yesterdayStr,
      }];
      await mockAsyncStorage.setItem("@infinity_heroes_streaks", JSON.stringify(streakData));

      const streak = await updateStreak(PROFILE_ID);
      expect(streak.currentStreak).toBe(4);
      expect(streak.longestStreak).toBe(5);
    });

    it("resets streak after gap of 2+ days", async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 3);
      const dateStr = twoDaysAgo.toISOString().split("T")[0];

      const streakData = [{
        profileId: PROFILE_ID,
        currentStreak: 5,
        longestStreak: 7,
        lastStoryDate: dateStr,
      }];
      await mockAsyncStorage.setItem("@infinity_heroes_streaks", JSON.stringify(streakData));

      const streak = await updateStreak(PROFILE_ID);
      expect(streak.currentStreak).toBe(1);
      expect(streak.longestStreak).toBe(7); // preserved
    });

    it("updates longestStreak when current exceeds it", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const streakData = [{
        profileId: PROFILE_ID,
        currentStreak: 5,
        longestStreak: 5,
        lastStoryDate: yesterdayStr,
      }];
      await mockAsyncStorage.setItem("@infinity_heroes_streaks", JSON.stringify(streakData));

      const streak = await updateStreak(PROFILE_ID);
      expect(streak.currentStreak).toBe(6);
      expect(streak.longestStreak).toBe(6);
    });
  });
});

describe("checkAndAwardBadges", () => {
  beforeEach(() => {
    resetStorage();
  });

  it("awards 'first-adventure' badge on first story", async () => {
    // Store one story for the profile
    const stories = [makeStory()];
    await mockAsyncStorage.setItem("@infinity_heroes_stories", JSON.stringify(stories));

    const newBadges = await checkAndAwardBadges(PROFILE_ID, "s-1", "classic", "hero-1");
    const firstAdventure = newBadges.find((b) => b.id === "first-adventure");
    expect(firstAdventure).toBeDefined();
  });

  it("awards 'night-owl' badge when hour >= 20", async () => {
    const stories = [makeStory()];
    await mockAsyncStorage.setItem("@infinity_heroes_stories", JSON.stringify(stories));

    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15, 21, 0, 0));

    const newBadges = await checkAndAwardBadges(PROFILE_ID, "s-1", "classic", "hero-1");
    const nightOwl = newBadges.find((b) => b.id === "night-owl");
    expect(nightOwl).toBeDefined();

    vi.useRealTimers();
  });

  it("awards 'early-bird' badge when 5 <= hour < 10", async () => {
    const stories = [makeStory()];
    await mockAsyncStorage.setItem("@infinity_heroes_stories", JSON.stringify(stories));

    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 0, 15, 7, 0, 0));

    const newBadges = await checkAndAwardBadges(PROFILE_ID, "s-1", "classic", "hero-1");
    const earlyBird = newBadges.find((b) => b.id === "early-bird");
    expect(earlyBird).toBeDefined();

    vi.useRealTimers();
  });

  it("awards 'mad-libs-master' after 3 madlibs stories", async () => {
    const stories = [
      makeStory({ mode: "madlibs" }),
      makeStory({ mode: "madlibs" }),
      makeStory({ mode: "madlibs" }),
    ];
    await mockAsyncStorage.setItem("@infinity_heroes_stories", JSON.stringify(stories));

    const newBadges = await checkAndAwardBadges(PROFILE_ID, "s-1", "madlibs", "hero-1");
    const mlMaster = newBadges.find((b) => b.id === "mad-libs-master");
    expect(mlMaster).toBeDefined();
  });

  it("awards 'dream-weaver' after 3 sleep stories", async () => {
    const stories = [
      makeStory({ mode: "sleep" }),
      makeStory({ mode: "sleep" }),
      makeStory({ mode: "sleep" }),
    ];
    await mockAsyncStorage.setItem("@infinity_heroes_stories", JSON.stringify(stories));

    const newBadges = await checkAndAwardBadges(PROFILE_ID, "s-1", "sleep", "hero-1");
    const dreamWeaver = newBadges.find((b) => b.id === "dream-weaver");
    expect(dreamWeaver).toBeDefined();
  });

  it("awards 'classic-champion' after 5 classic stories", async () => {
    const stories = Array.from({ length: 5 }, () => makeStory({ mode: "classic" }));
    await mockAsyncStorage.setItem("@infinity_heroes_stories", JSON.stringify(stories));

    const newBadges = await checkAndAwardBadges(PROFILE_ID, "s-1", "classic", "hero-1");
    const cc = newBadges.find((b) => b.id === "classic-champion");
    expect(cc).toBeDefined();
  });

  it("awards 'bookworm' after 10 total stories", async () => {
    const stories = Array.from({ length: 10 }, () => makeStory());
    await mockAsyncStorage.setItem("@infinity_heroes_stories", JSON.stringify(stories));

    const newBadges = await checkAndAwardBadges(PROFILE_ID, "s-1", "classic", "hero-1");
    const bookworm = newBadges.find((b) => b.id === "bookworm");
    expect(bookworm).toBeDefined();
  });

  it("awards 'legend' after 25 total stories", async () => {
    const stories = Array.from({ length: 25 }, () => makeStory());
    await mockAsyncStorage.setItem("@infinity_heroes_stories", JSON.stringify(stories));

    const newBadges = await checkAndAwardBadges(PROFILE_ID, "s-1", "classic", "hero-1");
    const legend = newBadges.find((b) => b.id === "legend");
    expect(legend).toBeDefined();
  });

  it("awards 'all-heroes' when all 8 heroes used", async () => {
    const stories = Array.from({ length: 8 }, (_, i) =>
      makeStory({ heroId: `hero-${i + 1}` })
    );
    await mockAsyncStorage.setItem("@infinity_heroes_stories", JSON.stringify(stories));

    const newBadges = await checkAndAwardBadges(PROFILE_ID, "s-1", "classic", "hero-1");
    const allHeroes = newBadges.find((b) => b.id === "all-heroes");
    expect(allHeroes).toBeDefined();
  });

  it("awards streak badges when streak data qualifies", async () => {
    const stories = [makeStory()];
    await mockAsyncStorage.setItem("@infinity_heroes_stories", JSON.stringify(stories));

    // Set a 7-day streak
    const today = new Date().toISOString().split("T")[0];
    const streakData = [{
      profileId: PROFILE_ID,
      currentStreak: 7,
      longestStreak: 7,
      lastStoryDate: today,
    }];
    await mockAsyncStorage.setItem("@infinity_heroes_streaks", JSON.stringify(streakData));

    const newBadges = await checkAndAwardBadges(PROFILE_ID, "s-1", "classic", "hero-1");
    const streak3 = newBadges.find((b) => b.id === "story-streak-3");
    const streak7 = newBadges.find((b) => b.id === "story-streak-7");
    expect(streak3).toBeDefined();
    expect(streak7).toBeDefined();
  });

  it("does not re-award already earned badges", async () => {
    const stories = [makeStory()];
    await mockAsyncStorage.setItem("@infinity_heroes_stories", JSON.stringify(stories));

    // First award
    const first = await checkAndAwardBadges(PROFILE_ID, "s-1", "classic", "hero-1");
    expect(first.length).toBeGreaterThan(0);

    // Second call - should not re-award same badges
    const second = await checkAndAwardBadges(PROFILE_ID, "s-2", "classic", "hero-1");
    const duplicates = second.filter((b) => first.some((f) => f.id === b.id));
    expect(duplicates).toHaveLength(0);
  });
});
