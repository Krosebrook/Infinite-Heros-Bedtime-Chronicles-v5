import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AsyncStorage
let mockStorage: Record<string, string> = {};
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

// Mock the constants/types module
vi.mock('@/constants/types', () => ({
  DEFAULT_PREFERENCES: {
    narratorVoice: 'Kore',
    storyLength: 'medium',
    sleepTheme: 'Cloud Kingdom',
    fontSize: 'normal',
    isMuted: false,
    reducedMotion: false,
  },
  DEFAULT_PARENT_CONTROLS: {
    maxStoryLength: 'epic',
    bedtimeHour: 20,
    bedtimeMinute: 0,
    bedtimeEnabled: false,
    allowedThemes: ['courage', 'kindness', 'friendship', 'wonder', 'imagination', 'comfort'],
    pinCode: '',
    videoEnabled: false,
  },
  BADGE_DEFINITIONS: [
    { id: 'first-adventure', emoji: '🌟', title: 'First Adventure', description: 'Completed your very first story!', condition: 'first_story' },
  ],
}));

vi.mock('@/constants/heroes', () => ({
  HEROES: [{ id: 'hero1' }, { id: 'hero2' }],
}));

import {
  getFavorites,
  toggleFavorite,
  getAllStories,
  saveStory,
  deleteStory,
  getPreferences,
  savePreferences,
  getReadStories,
  markStoryRead,
  getProfiles,
  saveProfile,
  deleteProfile,
  getActiveProfileId,
  setActiveProfileId,
  getParentControls,
  saveParentControls,
  getBadges,
  awardBadge,
  getStreak,
  updateStreak,
} from './storage';

const makeStoryFull = (title = 'Test Story') => ({
  title,
  parts: [{ text: 'Once upon a time...', choices: ['A', 'B', 'C'], partIndex: 0 }],
  vocabWord: { word: 'brave', definition: 'having courage' },
  joke: 'Why did the hero cross the road?',
  lesson: 'Be kind to others.',
  tomorrowHook: 'Tomorrow the hero will fly!',
  rewardBadge: { emoji: '⭐', title: 'Star', description: 'You earned a star!' },
});

beforeEach(() => {
  mockStorage = {};
  vi.clearAllMocks();
});

describe('getFavorites', () => {
  it('returns empty array when no favorites exist', async () => {
    const result = await getFavorites();
    expect(result).toEqual([]);
  });

  it('returns stored favorites', async () => {
    mockStorage['@infinity_heroes_favorites'] = JSON.stringify(['story1', 'story2']);
    const result = await getFavorites();
    expect(result).toEqual(['story1', 'story2']);
  });

  it('returns empty array on parse error', async () => {
    mockStorage['@infinity_heroes_favorites'] = 'not-json';
    // The JSON.parse will throw, caught by the try/catch
    const AsyncStorageMock = (await import('@react-native-async-storage/async-storage')).default;
    vi.mocked(AsyncStorageMock.getItem).mockRejectedValueOnce(new Error('parse error'));
    const result = await getFavorites();
    expect(result).toEqual([]);
  });
});

describe('toggleFavorite', () => {
  it('adds a story to favorites', async () => {
    const result = await toggleFavorite('story1');
    expect(result).toContain('story1');
  });

  it('removes a story from favorites if already present', async () => {
    mockStorage['@infinity_heroes_favorites'] = JSON.stringify(['story1', 'story2']);
    const result = await toggleFavorite('story1');
    expect(result).not.toContain('story1');
    expect(result).toContain('story2');
  });

  it('persists changes to storage', async () => {
    await toggleFavorite('story1');
    const stored = JSON.parse(mockStorage['@infinity_heroes_favorites']);
    expect(stored).toContain('story1');
  });

  it('toggles back and forth correctly', async () => {
    let result = await toggleFavorite('story1');
    expect(result).toContain('story1');
    result = await toggleFavorite('story1');
    expect(result).not.toContain('story1');
  });
});

describe('getAllStories', () => {
  it('returns empty array when no stories exist', async () => {
    const result = await getAllStories();
    expect(result).toEqual([]);
  });

  it('returns stories sorted by timestamp descending', async () => {
    const stories = [
      { id: 'old', timestamp: 1000, story: makeStoryFull(), heroId: 'h1', mode: 'classic' },
      { id: 'new', timestamp: 3000, story: makeStoryFull(), heroId: 'h1', mode: 'classic' },
      { id: 'mid', timestamp: 2000, story: makeStoryFull(), heroId: 'h1', mode: 'classic' },
    ];
    mockStorage['@infinity_heroes_stories'] = JSON.stringify(stories);
    const result = await getAllStories();
    expect(result[0].id).toBe('new');
    expect(result[1].id).toBe('mid');
    expect(result[2].id).toBe('old');
  });

  it('returns empty array on error', async () => {
    const AsyncStorageMock = (await import('@react-native-async-storage/async-storage')).default;
    vi.mocked(AsyncStorageMock.getItem).mockRejectedValueOnce(new Error('storage error'));
    const result = await getAllStories();
    expect(result).toEqual([]);
  });
});

describe('saveStory', () => {
  it('saves a story and returns an id', async () => {
    const id = await saveStory(makeStoryFull(), 'hero1', 'classic');
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('persists the story to storage', async () => {
    await saveStory(makeStoryFull(), 'hero1', 'classic');
    const stored = JSON.parse(mockStorage['@infinity_heroes_stories']);
    expect(stored).toHaveLength(1);
    expect(stored[0].heroId).toBe('hero1');
    expect(stored[0].mode).toBe('classic');
  });

  it('includes avatar when provided', async () => {
    await saveStory(makeStoryFull(), 'hero1', 'classic', 'data:image/png;base64,...');
    const stored = JSON.parse(mockStorage['@infinity_heroes_stories']);
    expect(stored[0].avatar).toBe('data:image/png;base64,...');
  });

  it('omits avatar when not provided', async () => {
    await saveStory(makeStoryFull(), 'hero1', 'classic');
    const stored = JSON.parse(mockStorage['@infinity_heroes_stories']);
    expect(stored[0]).not.toHaveProperty('avatar');
  });

  it('appends to existing stories', async () => {
    await saveStory(makeStoryFull('First'), 'hero1', 'classic');
    await saveStory(makeStoryFull('Second'), 'hero2', 'madlibs');
    const stories = await getAllStories();
    expect(stories.length).toBeGreaterThanOrEqual(2);
  });
});

describe('deleteStory', () => {
  it('removes a story by id', async () => {
    const id = await saveStory(makeStoryFull(), 'hero1', 'classic');
    await deleteStory(id);
    const stories = await getAllStories();
    expect(stories.find((s) => s.id === id)).toBeUndefined();
  });

  it('does not affect other stories', async () => {
    const id1 = await saveStory(makeStoryFull('Keep'), 'hero1', 'classic');
    const id2 = await saveStory(makeStoryFull('Delete'), 'hero2', 'madlibs');
    await deleteStory(id2);
    const stories = await getAllStories();
    expect(stories.find((s) => s.id === id1)).toBeDefined();
    expect(stories.find((s) => s.id === id2)).toBeUndefined();
  });

  it('handles deletion of non-existent story gracefully', async () => {
    await saveStory(makeStoryFull(), 'hero1', 'classic');
    await expect(deleteStory('nonexistent')).resolves.not.toThrow();
    const stories = await getAllStories();
    expect(stories).toHaveLength(1);
  });
});

describe('getPreferences', () => {
  it('returns default preferences when none are saved', async () => {
    const prefs = await getPreferences();
    expect(prefs.narratorVoice).toBe('Kore');
    expect(prefs.storyLength).toBe('medium');
    expect(prefs.fontSize).toBe('normal');
    expect(prefs.isMuted).toBe(false);
    expect(prefs.reducedMotion).toBe(false);
  });

  it('returns saved preferences', async () => {
    const customPrefs = {
      narratorVoice: 'Luna',
      storyLength: 'long',
      sleepTheme: 'Star Garden',
      fontSize: 'large' as const,
      isMuted: true,
      reducedMotion: true,
    };
    mockStorage['@infinity_heroes_preferences'] = JSON.stringify(customPrefs);
    const prefs = await getPreferences();
    expect(prefs.narratorVoice).toBe('Luna');
    expect(prefs.isMuted).toBe(true);
  });

  it('returns defaults on error', async () => {
    const AsyncStorageMock = (await import('@react-native-async-storage/async-storage')).default;
    vi.mocked(AsyncStorageMock.getItem).mockRejectedValueOnce(new Error('error'));
    const prefs = await getPreferences();
    expect(prefs.narratorVoice).toBe('Kore');
  });
});

describe('savePreferences', () => {
  it('persists preferences to storage', async () => {
    const prefs = {
      narratorVoice: 'Luna',
      storyLength: 'short',
      sleepTheme: 'Ocean Waves',
      fontSize: 'large' as const,
      isMuted: false,
      reducedMotion: false,
    };
    await savePreferences(prefs);
    const stored = JSON.parse(mockStorage['@infinity_heroes_preferences']);
    expect(stored.narratorVoice).toBe('Luna');
    expect(stored.storyLength).toBe('short');
  });
});

describe('getReadStories', () => {
  it('returns empty array when no stories are read', async () => {
    const result = await getReadStories();
    expect(result).toEqual([]);
  });

  it('returns stored read story IDs', async () => {
    mockStorage['@infinity_heroes_read'] = JSON.stringify(['s1', 's2']);
    const result = await getReadStories();
    expect(result).toEqual(['s1', 's2']);
  });
});

describe('markStoryRead', () => {
  it('marks a story as read', async () => {
    await markStoryRead('story1');
    const read = await getReadStories();
    expect(read).toContain('story1');
  });

  it('does not duplicate already-read stories', async () => {
    await markStoryRead('story1');
    await markStoryRead('story1');
    const read = await getReadStories();
    expect(read.filter((id) => id === 'story1')).toHaveLength(1);
  });
});

describe('profiles', () => {
  const makeProfile = (id: string, name: string) => ({
    id,
    name,
    age: 5,
    favoriteHeroId: 'hero1',
    avatarEmoji: '🦸',
    createdAt: Date.now(),
  });

  it('returns empty array when no profiles exist', async () => {
    const profiles = await getProfiles();
    expect(profiles).toEqual([]);
  });

  it('saves and retrieves a profile', async () => {
    const profile = makeProfile('p1', 'Alice');
    await saveProfile(profile);
    const profiles = await getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('Alice');
  });

  it('updates an existing profile by id', async () => {
    const profile = makeProfile('p1', 'Alice');
    await saveProfile(profile);
    await saveProfile({ ...profile, name: 'Bob' });
    const profiles = await getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('Bob');
  });

  it('deletes a profile', async () => {
    await saveProfile(makeProfile('p1', 'Alice'));
    await saveProfile(makeProfile('p2', 'Bob'));
    await deleteProfile('p1');
    const profiles = await getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('Bob');
  });
});

describe('active profile', () => {
  it('returns null when no active profile is set', async () => {
    const id = await getActiveProfileId();
    expect(id).toBeNull();
  });

  it('sets and retrieves active profile', async () => {
    await setActiveProfileId('p1');
    const id = await getActiveProfileId();
    expect(id).toBe('p1');
  });

  it('clears active profile when set to null', async () => {
    await setActiveProfileId('p1');
    await setActiveProfileId(null);
    const id = await getActiveProfileId();
    expect(id).toBeNull();
  });
});

describe('parent controls', () => {
  it('returns defaults when no controls are saved', async () => {
    const controls = await getParentControls();
    expect(controls.maxStoryLength).toBe('epic');
    expect(controls.bedtimeEnabled).toBe(false);
    expect(controls.pinCode).toBe('');
  });

  it('saves and retrieves parent controls', async () => {
    const controls = {
      maxStoryLength: 'medium',
      bedtimeHour: 19,
      bedtimeMinute: 30,
      bedtimeEnabled: true,
      allowedThemes: ['courage'],
      pinCode: '1234',
      videoEnabled: true,
    };
    await saveParentControls(controls);
    const result = await getParentControls();
    expect(result.bedtimeEnabled).toBe(true);
    expect(result.pinCode).toBe('1234');
    expect(result.bedtimeHour).toBe(19);
  });
});

describe('badges', () => {
  const makeBadge = (id: string, profileId: string) => ({
    id,
    emoji: '⭐',
    title: 'Test Badge',
    description: 'A test badge',
    earnedAt: Date.now(),
    storyId: 'story1',
    profileId,
  });

  it('returns empty array when no badges exist', async () => {
    const badges = await getBadges('p1');
    expect(badges).toEqual([]);
  });

  it('awards a badge and retrieves it', async () => {
    const badge = makeBadge('b1', 'p1');
    const isNew = await awardBadge(badge);
    expect(isNew).toBe(true);
    const badges = await getBadges('p1');
    expect(badges).toHaveLength(1);
    expect(badges[0].id).toBe('b1');
  });

  it('does not duplicate badges', async () => {
    const badge = makeBadge('b1', 'p1');
    await awardBadge(badge);
    const isNew = await awardBadge(badge);
    expect(isNew).toBe(false);
  });

  it('filters badges by profile', async () => {
    await awardBadge(makeBadge('b1', 'p1'));
    await awardBadge(makeBadge('b2', 'p2'));
    const p1Badges = await getBadges('p1');
    expect(p1Badges).toHaveLength(1);
    expect(p1Badges[0].id).toBe('b1');
  });
});

describe('streaks', () => {
  it('returns default streak for unknown profile', async () => {
    const streak = await getStreak('p1');
    expect(streak.currentStreak).toBe(0);
    expect(streak.longestStreak).toBe(0);
    expect(streak.lastStoryDate).toBe('');
  });

  it('starts a new streak on first update', async () => {
    const streak = await updateStreak('p1');
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(1);
    expect(streak.lastStoryDate).toBeTruthy();
  });

  it('does not increment streak for same day', async () => {
    const first = await updateStreak('p1');
    const second = await updateStreak('p1');
    expect(second.currentStreak).toBe(first.currentStreak);
  });
});
