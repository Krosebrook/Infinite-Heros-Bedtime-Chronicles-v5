import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetStorage, mockAsyncStorage } from "../setup";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: mockAsyncStorage,
}));

vi.mock("@/constants/heroes", () => ({
  HEROES: [
    { id: "hero-1", name: "Nova" },
    { id: "hero-2", name: "Coral" },
  ],
}));

import {
  getFavorites,
  toggleFavorite,
  getReadStories,
  markStoryRead,
  getAllStories,
  saveStory,
  deleteStory,
  saveStoryScene,
  updateFeedback,
  savePreferences,
  getPreferences,
  getProfiles,
  saveProfile,
  deleteProfile,
  getActiveProfileId,
  setActiveProfileId,
  saveStoryWithProfile,
  getStoriesForProfile,
  getParentControls,
  saveParentControls,
} from "../../lib/storage";
import { DEFAULT_PREFERENCES, DEFAULT_PARENT_CONTROLS } from "../../constants/types";
import type { StoryFull, ChildProfile } from "../../constants/types";

function makeStoryFull(): StoryFull {
  return {
    title: "Test Story",
    parts: [{ text: "Once upon a time...", partIndex: 0 }],
    vocabWord: { word: "test", definition: "a test" },
    joke: "Why did the chicken...",
    lesson: "Be kind",
    tomorrowHook: "Next time...",
    rewardBadge: { emoji: "x", title: "x", description: "x" },
  };
}

function makeProfile(id: string): ChildProfile {
  return {
    id,
    name: `Child ${id}`,
    age: 5,
    favoriteHeroId: "hero-1",
    avatarEmoji: "x",
    createdAt: Date.now(),
  };
}

describe("Favorites", () => {
  beforeEach(() => resetStorage());

  it("returns empty array initially", async () => {
    expect(await getFavorites()).toEqual([]);
  });

  it("adds a favorite", async () => {
    const result = await toggleFavorite("story-1");
    expect(result).toContain("story-1");
  });

  it("removes an existing favorite (toggle off)", async () => {
    await toggleFavorite("story-1");
    const result = await toggleFavorite("story-1");
    expect(result).not.toContain("story-1");
  });

  it("maintains other favorites when toggling", async () => {
    await toggleFavorite("story-1");
    await toggleFavorite("story-2");
    const result = await toggleFavorite("story-1"); // remove story-1
    expect(result).not.toContain("story-1");
    expect(result).toContain("story-2");
  });
});

describe("Read Stories", () => {
  beforeEach(() => resetStorage());

  it("returns empty array initially", async () => {
    expect(await getReadStories()).toEqual([]);
  });

  it("marks a story as read", async () => {
    await markStoryRead("story-1");
    const read = await getReadStories();
    expect(read).toContain("story-1");
  });

  it("does not duplicate read marks", async () => {
    await markStoryRead("story-1");
    await markStoryRead("story-1");
    const read = await getReadStories();
    expect(read.filter((s) => s === "story-1")).toHaveLength(1);
  });
});

describe("Stories", () => {
  beforeEach(() => resetStorage());

  it("returns empty array initially", async () => {
    expect(await getAllStories()).toEqual([]);
  });

  it("saves and retrieves a story", async () => {
    const id = await saveStory(makeStoryFull(), "hero-1", "classic");
    expect(id).toBeTruthy();

    const stories = await getAllStories();
    expect(stories).toHaveLength(1);
    expect(stories[0].heroId).toBe("hero-1");
    expect(stories[0].mode).toBe("classic");
  });

  it("sorts stories by timestamp descending", async () => {
    await saveStory(makeStoryFull(), "hero-1", "classic");
    await new Promise((r) => setTimeout(r, 10)); // ensure different timestamp
    await saveStory(makeStoryFull(), "hero-2", "sleep");

    const stories = await getAllStories();
    expect(stories[0].heroId).toBe("hero-2"); // newer first
    expect(stories[1].heroId).toBe("hero-1");
  });

  it("deletes a story by ID", async () => {
    const id = await saveStory(makeStoryFull(), "hero-1", "classic");
    await deleteStory(id);

    const stories = await getAllStories();
    expect(stories).toHaveLength(0);
  });

  it("saves avatar when provided", async () => {
    const id = await saveStory(makeStoryFull(), "hero-1", "classic", "data:image/png;base64,abc");
    const stories = await getAllStories();
    expect(stories[0].avatar).toBe("data:image/png;base64,abc");
  });
});

describe("Story Scenes", () => {
  beforeEach(() => resetStorage());

  it("saves a scene to an existing story", async () => {
    const id = await saveStory(makeStoryFull(), "hero-1", "classic");
    await saveStoryScene(id, 0, "data:image/png;base64,scene0");

    const stories = await getAllStories();
    expect(stories[0].scenes?.[0]).toBe("data:image/png;base64,scene0");
  });

  it("no-ops for missing story ID", async () => {
    // Should not throw
    await saveStoryScene("nonexistent", 0, "data:image/png;base64,x");
    const stories = await getAllStories();
    expect(stories).toHaveLength(0);
  });
});

describe("Feedback", () => {
  beforeEach(() => resetStorage());

  it("attaches feedback to correct story", async () => {
    const id = await saveStory(makeStoryFull(), "hero-1", "classic");
    await updateFeedback(id, 5, "Great story!");

    const stories = await getAllStories();
    expect(stories[0].feedback?.rating).toBe(5);
    expect(stories[0].feedback?.text).toBe("Great story!");
  });

  it("no-ops for missing story ID", async () => {
    await updateFeedback("nonexistent", 5, "text");
    // Should not throw
  });
});

describe("Preferences", () => {
  beforeEach(() => resetStorage());

  it("returns defaults when no data stored", async () => {
    const prefs = await getPreferences();
    expect(prefs).toEqual(DEFAULT_PREFERENCES);
  });

  it("saves and retrieves preferences", async () => {
    const custom = { ...DEFAULT_PREFERENCES, isMuted: true, fontSize: "large" as const };
    await savePreferences(custom);
    const prefs = await getPreferences();
    expect(prefs.isMuted).toBe(true);
    expect(prefs.fontSize).toBe("large");
  });
});

describe("Profiles", () => {
  beforeEach(() => resetStorage());

  it("returns empty array initially", async () => {
    expect(await getProfiles()).toEqual([]);
  });

  it("creates a new profile", async () => {
    const profile = makeProfile("p-1");
    await saveProfile(profile);
    const profiles = await getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe("Child p-1");
  });

  it("updates existing profile by ID", async () => {
    const profile = makeProfile("p-1");
    await saveProfile(profile);
    await saveProfile({ ...profile, name: "Updated Name" });
    const profiles = await getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe("Updated Name");
  });

  it("deletes profile by ID", async () => {
    await saveProfile(makeProfile("p-1"));
    await saveProfile(makeProfile("p-2"));
    await deleteProfile("p-1");
    const profiles = await getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].id).toBe("p-2");
  });
});

describe("Active Profile", () => {
  beforeEach(() => resetStorage());

  it("returns null initially", async () => {
    expect(await getActiveProfileId()).toBeNull();
  });

  it("sets and retrieves active profile ID", async () => {
    await setActiveProfileId("p-1");
    expect(await getActiveProfileId()).toBe("p-1");
  });

  it("clears active profile when set to null", async () => {
    await setActiveProfileId("p-1");
    await setActiveProfileId(null);
    expect(await getActiveProfileId()).toBeNull();
  });
});

describe("Profile-scoped stories", () => {
  beforeEach(() => resetStorage());

  it("saves story with profileId", async () => {
    const id = await saveStoryWithProfile(makeStoryFull(), "hero-1", "classic", "p-1");
    const stories = await getAllStories();
    expect(stories[0].profileId).toBe("p-1");
  });

  it("filters stories by profileId", async () => {
    await saveStoryWithProfile(makeStoryFull(), "hero-1", "classic", "p-1");
    await saveStoryWithProfile(makeStoryFull(), "hero-2", "sleep", "p-2");

    const p1Stories = await getStoriesForProfile("p-1");
    expect(p1Stories).toHaveLength(1);
    expect(p1Stories[0].heroId).toBe("hero-1");
  });
});

describe("Parent Controls", () => {
  beforeEach(() => resetStorage());

  it("returns defaults when no data stored", async () => {
    const controls = await getParentControls();
    expect(controls).toEqual(DEFAULT_PARENT_CONTROLS);
  });

  it("saves and retrieves parent controls", async () => {
    const custom = { ...DEFAULT_PARENT_CONTROLS, bedtimeEnabled: true, pinCode: "1234" };
    await saveParentControls(custom);
    const controls = await getParentControls();
    expect(controls.bedtimeEnabled).toBe(true);
    expect(controls.pinCode).toBe("1234");
  });
});
