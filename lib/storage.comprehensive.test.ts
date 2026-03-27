import { describe, it, expect, vi, beforeEach } from 'vitest';

// ══════════════════════════════════════════════════════════════════
// Client Storage (AsyncStorage) Comprehensive Tests
// Mock AsyncStorage since we're in a Node test environment
// ══════════════════════════════════════════════════════════════════

// Mock AsyncStorage
const mockStore: Record<string, string> = {};
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => mockStore[key] ?? null),
    setItem: vi.fn(async (key: string, value: string) => { mockStore[key] = value; }),
    removeItem: vi.fn(async (key: string) => { delete mockStore[key]; }),
    clear: vi.fn(async () => { Object.keys(mockStore).forEach(k => delete mockStore[k]); }),
  },
}));

// Mock constants
vi.mock('@/constants/types', () => ({
  DEFAULT_PREFERENCES: { audioVolume: 80, narratorVoice: 'moonbeam' },
  DEFAULT_PARENT_CONTROLS: { pin: null, isLocked: false, dailyLimit: 0 },
  BADGE_DEFINITIONS: [
    { id: 'first_adventure', emoji: '🌟', title: 'First Adventure', description: 'Complete first story', condition: 'first_story' },
    { id: 'night_owl', emoji: '🦉', title: 'Night Owl', description: 'Listen after 8 PM', condition: 'night_story' },
    { id: 'early_bird', emoji: '🐦', title: 'Early Bird', description: 'Listen 5-10 AM', condition: 'morning_story' },
    { id: 'streak_3', emoji: '🔥', title: 'On Fire!', description: '3-day streak', condition: 'streak_3' },
    { id: 'streak_7', emoji: '💎', title: 'Diamond Reader', description: '7-day streak', condition: 'streak_7' },
    { id: 'total_10', emoji: '📚', title: 'Bookworm', description: '10 stories', condition: 'total_10' },
    { id: 'total_25', emoji: '🏆', title: 'Story Legend', description: '25 stories', condition: 'total_25' },
    { id: 'classic_5', emoji: '🏅', title: 'Classic Champion', description: '5 classic stories', condition: 'classic_5' },
    { id: 'madlibs_3', emoji: '🤣', title: 'Silly Storyteller', description: '3 Mad Libs', condition: 'madlibs_3' },
    { id: 'sleep_3', emoji: '🌙', title: 'Dream Weaver', description: '3 sleep stories', condition: 'sleep_3' },
    { id: 'all_heroes', emoji: '🦸', title: 'Hero Collector', description: 'Use every hero', condition: 'all_heroes' },
    { id: 'vocab_5', emoji: '📖', title: 'Word Wizard', description: '5 vocab words', condition: 'vocab_5' },
  ],
  CachedStory: {},
  StoryFull: {},
  UserPreferences: {},
  ChildProfile: {},
  EarnedBadge: {},
  StreakData: {},
  ParentControls: {},
}));

vi.mock('@/constants/heroes', () => ({
  HEROES: [
    { id: 'nova' }, { id: 'coral' }, { id: 'orion' }, { id: 'luna' },
    { id: 'nimbus' }, { id: 'bloom' }, { id: 'whistle' }, { id: 'shade' },
  ],
}));

import {
  getFavorites, toggleFavorite,
  getReadStories, markStoryRead,
  getAllStories, saveStory, deleteStory, saveStoryScene, updateFeedback,
  savePreferences, getPreferences,
  getProfiles, saveProfile, deleteProfile,
  getActiveProfileId, setActiveProfileId,
  saveStoryWithProfile, getStoriesForProfile,
  getBadges, getAllBadges, awardBadge,
  getStreak, updateStreak,
  checkAndAwardBadges,
  getParentControls, saveParentControls,
} from './storage';

beforeEach(() => {
  Object.keys(mockStore).forEach(k => delete mockStore[k]);
  vi.clearAllMocks();
});

// ── Favorites ─────────────────────────────────────────────────────
describe('favorites', () => {
  it('returns empty array when no favorites', async () => {
    expect(await getFavorites()).toEqual([]);
  });

  it('adds a favorite', async () => {
    await toggleFavorite('story1');
    expect(await getFavorites()).toEqual(['story1']);
  });

  it('removes a favorite on second toggle', async () => {
    await toggleFavorite('story1');
    await toggleFavorite('story1');
    expect(await getFavorites()).toEqual([]);
  });

  it('manages multiple favorites', async () => {
    await toggleFavorite('s1');
    await toggleFavorite('s2');
    await toggleFavorite('s3');
    expect(await getFavorites()).toEqual(['s1', 's2', 's3']);
  });

  it('removes specific favorite without affecting others', async () => {
    await toggleFavorite('s1');
    await toggleFavorite('s2');
    await toggleFavorite('s3');
    await toggleFavorite('s2');
    expect(await getFavorites()).toEqual(['s1', 's3']);
  });

  it('handles empty string story ID', async () => {
    await toggleFavorite('');
    expect(await getFavorites()).toEqual(['']);
  });

  it('returns empty array on corrupted data', async () => {
    mockStore['@infinity_heroes_favorites'] = 'not-json';
    expect(await getFavorites()).toEqual([]);
  });
});

// ── Read Stories ──────────────────────────────────────────────────
describe('read stories tracking', () => {
  it('returns empty when no stories read', async () => {
    expect(await getReadStories()).toEqual([]);
  });

  it('marks a story as read', async () => {
    await markStoryRead('story1');
    expect(await getReadStories()).toContain('story1');
  });

  it('does not duplicate read marks', async () => {
    await markStoryRead('story1');
    await markStoryRead('story1');
    const reads = await getReadStories();
    expect(reads.filter(r => r === 'story1')).toHaveLength(1);
  });

  it('tracks multiple read stories', async () => {
    await markStoryRead('s1');
    await markStoryRead('s2');
    await markStoryRead('s3');
    expect(await getReadStories()).toEqual(['s1', 's2', 's3']);
  });

  it('returns empty on corrupted data', async () => {
    mockStore['@infinity_heroes_read'] = '{invalid';
    expect(await getReadStories()).toEqual([]);
  });
});

// ── Story CRUD ────────────────────────────────────────────────────
describe('story management', () => {
  const mockStory = {
    title: 'Test Story',
    parts: [{ text: 'Once upon a time', choices: ['A', 'B', 'C'], partIndex: 0 }],
    vocabWord: { word: 'brave', definition: 'not scared' },
    joke: 'ha',
    lesson: 'be kind',
    tomorrowHook: 'next time...',
    rewardBadge: { emoji: '⭐', title: 'Star', description: 'earned' },
  };

  it('returns empty when no stories saved', async () => {
    expect(await getAllStories()).toEqual([]);
  });

  it('saves and retrieves a story', async () => {
    const id = await saveStory(mockStory as any, 'nova', 'classic');
    expect(id).toBeTruthy();
    const stories = await getAllStories();
    expect(stories).toHaveLength(1);
    expect(stories[0].story.title).toBe('Test Story');
  });

  it('generates unique IDs', async () => {
    const id1 = await saveStory(mockStory as any, 'nova', 'classic');
    const id2 = await saveStory(mockStory as any, 'nova', 'classic');
    expect(id1).not.toBe(id2);
  });

  it('saves with avatar', async () => {
    const id = await saveStory(mockStory as any, 'nova', 'classic', 'data:image/png;base64,abc');
    const stories = await getAllStories();
    expect(stories[0].avatar).toBe('data:image/png;base64,abc');
  });

  it('saves without avatar', async () => {
    const id = await saveStory(mockStory as any, 'nova', 'classic');
    const stories = await getAllStories();
    expect(stories[0].avatar).toBeUndefined();
  });

  it('deletes a story by ID', async () => {
    const id = await saveStory(mockStory as any, 'nova', 'classic');
    await deleteStory(id);
    expect(await getAllStories()).toHaveLength(0);
  });

  it('delete non-existent ID is safe', async () => {
    await saveStory(mockStory as any, 'nova', 'classic');
    await deleteStory('nonexistent');
    expect(await getAllStories()).toHaveLength(1);
  });

  it('sorts stories by timestamp descending', async () => {
    const id1 = await saveStory(mockStory as any, 'nova', 'classic');
    // Small delay to ensure different timestamps
    const id2 = await saveStory({ ...mockStory, title: 'Story 2' } as any, 'luna', 'sleep');
    const stories = await getAllStories();
    expect(stories[0].timestamp).toBeGreaterThanOrEqual(stories[1].timestamp);
  });

  it('saves scene image for a story', async () => {
    const id = await saveStory(mockStory as any, 'nova', 'classic');
    await saveStoryScene(id, 0, 'data:image/png;base64,scene');
    const stories = await getAllStories();
    expect(stories.find(s => s.id === id)?.scenes?.[0]).toBe('data:image/png;base64,scene');
  });

  it('saveStoryScene ignores non-existent story', async () => {
    await saveStoryScene('nonexistent', 0, 'data:image');
    // Should not throw
  });

  it('updates feedback on a story', async () => {
    const id = await saveStory(mockStory as any, 'nova', 'classic');
    await updateFeedback(id, 5, 'Great story!');
    const stories = await getAllStories();
    const story = stories.find(s => s.id === id);
    expect(story?.feedback?.rating).toBe(5);
    expect(story?.feedback?.text).toBe('Great story!');
  });

  it('updateFeedback ignores non-existent story', async () => {
    await updateFeedback('nonexistent', 5, 'test');
    // Should not throw
  });

  it('returns empty on corrupted story data', async () => {
    mockStore['@infinity_heroes_stories'] = 'broken-json';
    expect(await getAllStories()).toEqual([]);
  });
});

// ── Profiles ──────────────────────────────────────────────────────
describe('profile management', () => {
  const profile1 = { id: 'p1', name: 'Alice', age: 5, avatar: 'nova' };
  const profile2 = { id: 'p2', name: 'Bob', age: 7, avatar: 'coral' };

  it('returns empty when no profiles', async () => {
    expect(await getProfiles()).toEqual([]);
  });

  it('saves and retrieves a profile', async () => {
    await saveProfile(profile1 as any);
    const profiles = await getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('Alice');
  });

  it('updates existing profile by ID', async () => {
    await saveProfile(profile1 as any);
    await saveProfile({ ...profile1, name: 'Alice Updated' } as any);
    const profiles = await getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('Alice Updated');
  });

  it('saves multiple profiles', async () => {
    await saveProfile(profile1 as any);
    await saveProfile(profile2 as any);
    expect(await getProfiles()).toHaveLength(2);
  });

  it('deletes a profile', async () => {
    await saveProfile(profile1 as any);
    await deleteProfile('p1');
    expect(await getProfiles()).toHaveLength(0);
  });

  it('delete non-existent profile is safe', async () => {
    await saveProfile(profile1 as any);
    await deleteProfile('nonexistent');
    expect(await getProfiles()).toHaveLength(1);
  });

  it('returns empty on corrupted data', async () => {
    mockStore['@infinity_heroes_profiles'] = '{broken';
    expect(await getProfiles()).toEqual([]);
  });
});

// ── Active Profile ────────────────────────────────────────────────
describe('active profile', () => {
  it('returns null when no active profile', async () => {
    expect(await getActiveProfileId()).toBeNull();
  });

  it('sets and gets active profile', async () => {
    await setActiveProfileId('p1');
    expect(await getActiveProfileId()).toBe('p1');
  });

  it('clears active profile with null', async () => {
    await setActiveProfileId('p1');
    await setActiveProfileId(null);
    expect(await getActiveProfileId()).toBeNull();
  });

  it('overwrites active profile', async () => {
    await setActiveProfileId('p1');
    await setActiveProfileId('p2');
    expect(await getActiveProfileId()).toBe('p2');
  });
});

// ── Profile Stories ───────────────────────────────────────────────
describe('profile-scoped stories', () => {
  const story = { title: 'Test', parts: [], vocabWord: {}, joke: '', lesson: '', tomorrowHook: '', rewardBadge: {} };

  it('saves story with profile ID', async () => {
    const id = await saveStoryWithProfile(story as any, 'nova', 'classic', 'profile1');
    const stories = await getAllStories();
    expect(stories[0].profileId).toBe('profile1');
  });

  it('filters stories by profile ID', async () => {
    await saveStoryWithProfile(story as any, 'nova', 'classic', 'p1');
    await saveStoryWithProfile(story as any, 'luna', 'sleep', 'p2');
    await saveStoryWithProfile(story as any, 'coral', 'madlibs', 'p1');
    const p1Stories = await getStoriesForProfile('p1');
    expect(p1Stories).toHaveLength(2);
  });

  it('returns empty for profile with no stories', async () => {
    await saveStoryWithProfile(story as any, 'nova', 'classic', 'p1');
    expect(await getStoriesForProfile('p2')).toEqual([]);
  });
});

// ── Badges ────────────────────────────────────────────────────────
describe('badge system', () => {
  const badge1 = { id: 'first_adventure', emoji: '🌟', title: 'First', description: 'd', earnedAt: 1000, storyId: 's1', profileId: 'p1' };
  const badge2 = { id: 'night_owl', emoji: '🦉', title: 'Night', description: 'd', earnedAt: 2000, storyId: 's2', profileId: 'p1' };

  it('returns empty when no badges', async () => {
    expect(await getBadges('p1')).toEqual([]);
    expect(await getAllBadges()).toEqual([]);
  });

  it('awards a badge', async () => {
    const wasNew = await awardBadge(badge1 as any);
    expect(wasNew).toBe(true);
    expect(await getBadges('p1')).toHaveLength(1);
  });

  it('prevents duplicate badge award', async () => {
    await awardBadge(badge1 as any);
    const wasNew = await awardBadge(badge1 as any);
    expect(wasNew).toBe(false);
    expect(await getBadges('p1')).toHaveLength(1);
  });

  it('awards different badges to same profile', async () => {
    await awardBadge(badge1 as any);
    await awardBadge(badge2 as any);
    expect(await getBadges('p1')).toHaveLength(2);
  });

  it('same badge for different profiles is allowed', async () => {
    await awardBadge(badge1 as any);
    await awardBadge({ ...badge1, profileId: 'p2' } as any);
    expect(await getAllBadges()).toHaveLength(2);
  });

  it('getBadges filters by profile ID', async () => {
    await awardBadge(badge1 as any);
    await awardBadge({ ...badge2, profileId: 'p2' } as any);
    expect(await getBadges('p1')).toHaveLength(1);
    expect(await getBadges('p2')).toHaveLength(1);
  });

  it('returns empty on corrupted data', async () => {
    mockStore['@infinity_heroes_badges'] = 'broken';
    expect(await getAllBadges()).toEqual([]);
    expect(await getBadges('p1')).toEqual([]);
  });
});

// ── Streaks ───────────────────────────────────────────────────────
describe('reading streaks', () => {
  it('returns default streak for new profile', async () => {
    const streak = await getStreak('p1');
    expect(streak.currentStreak).toBe(0);
    expect(streak.longestStreak).toBe(0);
    expect(streak.lastStoryDate).toBe('');
  });

  it('creates streak on first update', async () => {
    const streak = await updateStreak('p1');
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(1);
  });

  it('does not increment on same day', async () => {
    const first = await updateStreak('p1');
    const second = await updateStreak('p1');
    expect(second.currentStreak).toBe(1);
  });

  it('increments on consecutive days', async () => {
    // Manually set yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    mockStore['@infinity_heroes_streaks'] = JSON.stringify([{
      profileId: 'p1',
      currentStreak: 1,
      longestStreak: 1,
      lastStoryDate: yesterday.toISOString().split('T')[0],
    }]);
    const streak = await updateStreak('p1');
    expect(streak.currentStreak).toBe(2);
  });

  it('resets streak on gap > 1 day', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    mockStore['@infinity_heroes_streaks'] = JSON.stringify([{
      profileId: 'p1',
      currentStreak: 5,
      longestStreak: 5,
      lastStoryDate: threeDaysAgo.toISOString().split('T')[0],
    }]);
    const streak = await updateStreak('p1');
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(5); // preserves longest
  });

  it('updates longestStreak when current exceeds it', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    mockStore['@infinity_heroes_streaks'] = JSON.stringify([{
      profileId: 'p1',
      currentStreak: 3,
      longestStreak: 3,
      lastStoryDate: yesterday.toISOString().split('T')[0],
    }]);
    const streak = await updateStreak('p1');
    expect(streak.currentStreak).toBe(4);
    expect(streak.longestStreak).toBe(4);
  });

  it('tracks streaks independently per profile', async () => {
    await updateStreak('p1');
    await updateStreak('p2');
    const s1 = await getStreak('p1');
    const s2 = await getStreak('p2');
    expect(s1.profileId).toBe('p1');
    expect(s2.profileId).toBe('p2');
  });

  it('handles corrupted streak data', async () => {
    mockStore['@infinity_heroes_streaks'] = 'broken';
    const streak = await getStreak('p1');
    expect(streak.currentStreak).toBe(0);
  });
});

// ── Preferences ───────────────────────────────────────────────────
describe('preferences', () => {
  it('returns defaults when no preferences saved', async () => {
    const prefs = await getPreferences();
    expect(prefs.audioVolume).toBe(80);
    expect(prefs.narratorVoice).toBe('moonbeam');
  });

  it('saves and retrieves preferences', async () => {
    await savePreferences({ audioVolume: 50, narratorVoice: 'captain' } as any);
    const prefs = await getPreferences();
    expect(prefs.audioVolume).toBe(50);
  });

  it('returns defaults on corrupted data', async () => {
    mockStore['@infinity_heroes_preferences'] = 'broken';
    const prefs = await getPreferences();
    expect(prefs.audioVolume).toBe(80);
  });
});

// ── Parent Controls ───────────────────────────────────────────────
describe('parent controls', () => {
  it('returns defaults when no controls saved', async () => {
    const controls = await getParentControls();
    expect(controls.pin).toBeNull();
    expect(controls.isLocked).toBe(false);
  });

  it('saves and retrieves parent controls', async () => {
    await saveParentControls({ pin: '1234', isLocked: true, dailyLimit: 3 } as any);
    const controls = await getParentControls();
    expect(controls.pin).toBe('1234');
    expect(controls.isLocked).toBe(true);
  });

  it('returns defaults on corrupted data', async () => {
    mockStore['@infinity_heroes_parent_controls'] = 'broken';
    const controls = await getParentControls();
    expect(controls.pin).toBeNull();
  });
});

// ── Badge Award Logic ─────────────────────────────────────────────
describe('checkAndAwardBadges', () => {
  const story = { title: 'Test', parts: [], vocabWord: {}, joke: '', lesson: '', tomorrowHook: '', rewardBadge: {} };

  it('awards first_adventure badge on first story', async () => {
    await saveStoryWithProfile(story as any, 'nova', 'classic', 'p1');
    const badges = await checkAndAwardBadges('p1', 's1', 'classic', 'nova');
    const ids = badges.map(b => b.id);
    expect(ids).toContain('first_adventure');
  });

  it('does not re-award existing badge', async () => {
    await saveStoryWithProfile(story as any, 'nova', 'classic', 'p1');
    await checkAndAwardBadges('p1', 's1', 'classic', 'nova');
    const secondRun = await checkAndAwardBadges('p1', 's2', 'classic', 'nova');
    expect(secondRun.find(b => b.id === 'first_adventure')).toBeUndefined();
  });
});
