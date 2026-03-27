import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CachedStory,
  StoryFull,
  UserPreferences,
  DEFAULT_PREFERENCES,
  ChildProfile,
  EarnedBadge,
  StreakData,
  ParentControls,
  DEFAULT_PARENT_CONTROLS,
  BADGE_DEFINITIONS,
} from '@/constants/types';
import { HEROES } from '@/constants/heroes';

const FAVORITES_KEY = '@infinity_heroes_favorites';
const READ_STORIES_KEY = '@infinity_heroes_read';
const STORIES_KEY = '@infinity_heroes_stories';
const PREFERENCES_KEY = '@infinity_heroes_preferences';
const PROFILES_KEY = '@infinity_heroes_profiles';
const ACTIVE_PROFILE_KEY = '@infinity_heroes_active_profile';
const BADGES_KEY = '@infinity_heroes_badges';
const STREAKS_KEY = '@infinity_heroes_streaks';
const PARENT_CONTROLS_KEY = '@infinity_heroes_parent_controls';

export async function getFavorites(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(storyId: string): Promise<string[]> {
  const favorites = await getFavorites();
  const index = favorites.indexOf(storyId);
  if (index > -1) {
    favorites.splice(index, 1);
  } else {
    favorites.push(storyId);
  }
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return favorites;
}

export async function getReadStories(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(READ_STORIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function markStoryRead(storyId: string): Promise<void> {
  const readStories = await getReadStories();
  if (!readStories.includes(storyId)) {
    readStories.push(storyId);
    await AsyncStorage.setItem(READ_STORIES_KEY, JSON.stringify(readStories));
  }
}

export async function getAllStories(): Promise<CachedStory[]> {
  try {
    const data = await AsyncStorage.getItem(STORIES_KEY);
    const stories: CachedStory[] = data ? JSON.parse(data) : [];
    return stories.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export async function saveStory(
  story: StoryFull,
  heroId: string,
  mode: string,
  avatar?: string
): Promise<string> {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const cached: CachedStory = {
    id,
    timestamp: Date.now(),
    story,
    heroId,
    mode,
    ...(avatar ? { avatar } : {}),
  };
  const stories = await getAllStories();
  stories.push(cached);
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(stories));
  return id;
}

export async function deleteStory(id: string): Promise<void> {
  const stories = await getAllStories();
  const filtered = stories.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(filtered));
}

export async function saveStoryScene(
  id: string,
  partIndex: number,
  imageDataUri: string
): Promise<void> {
  const stories = await getAllStories();
  const story = stories.find((s) => s.id === id);
  if (!story) return;
  if (!story.scenes) story.scenes = {};
  story.scenes[partIndex] = imageDataUri;
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(stories));
}

export async function updateFeedback(
  id: string,
  rating: number,
  text: string
): Promise<void> {
  const stories = await getAllStories();
  const story = stories.find((s) => s.id === id);
  if (!story) return;
  story.feedback = { rating, text, timestamp: Date.now() };
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(stories));
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(PREFERENCES_KEY);
    return data ? JSON.parse(data) : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function getProfiles(): Promise<ChildProfile[]> {
  try {
    const data = await AsyncStorage.getItem(PROFILES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveProfile(profile: ChildProfile): Promise<void> {
  const profiles = await getProfiles();
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx > -1) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export async function deleteProfile(id: string): Promise<void> {
  const profiles = await getProfiles();
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles.filter((p) => p.id !== id)));
}

export async function getActiveProfileId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
  } catch {
    return null;
  }
}

export async function setActiveProfileId(id: string | null): Promise<void> {
  if (id) {
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, id);
  } else {
    await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
}

export async function saveStoryWithProfile(
  story: StoryFull,
  heroId: string,
  mode: string,
  profileId?: string,
  avatar?: string
): Promise<string> {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const cached: CachedStory = {
    id,
    timestamp: Date.now(),
    story,
    heroId,
    mode,
    profileId,
    ...(avatar ? { avatar } : {}),
  };
  const stories = await getAllStories();
  stories.push(cached);
  await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(stories));
  return id;
}

export async function getStoriesForProfile(profileId: string): Promise<CachedStory[]> {
  const all = await getAllStories();
  return all.filter((s) => s.profileId === profileId);
}

export async function getBadges(profileId: string): Promise<EarnedBadge[]> {
  try {
    const data = await AsyncStorage.getItem(BADGES_KEY);
    const all: EarnedBadge[] = data ? JSON.parse(data) : [];
    return all.filter((b) => b.profileId === profileId);
  } catch {
    return [];
  }
}

export async function getAllBadges(): Promise<EarnedBadge[]> {
  try {
    const data = await AsyncStorage.getItem(BADGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function awardBadge(badge: EarnedBadge): Promise<boolean> {
  const all = await getAllBadges();
  if (all.some((b) => b.id === badge.id && b.profileId === badge.profileId)) {
    return false;
  }
  all.push(badge);
  await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(all));
  return true;
}

export async function getStreak(profileId: string): Promise<StreakData> {
  try {
    const data = await AsyncStorage.getItem(STREAKS_KEY);
    const all: StreakData[] = data ? JSON.parse(data) : [];
    return all.find((s) => s.profileId === profileId) || {
      profileId,
      currentStreak: 0,
      longestStreak: 0,
      lastStoryDate: '',
    };
  } catch {
    return { profileId, currentStreak: 0, longestStreak: 0, lastStoryDate: '' };
  }
}

export async function updateStreak(profileId: string): Promise<StreakData> {
  const data = await AsyncStorage.getItem(STREAKS_KEY);
  const all: StreakData[] = data ? JSON.parse(data) : [];
  let streak = all.find((s) => s.profileId === profileId);

  const today = new Date().toISOString().split('T')[0];

  if (!streak) {
    streak = { profileId, currentStreak: 1, longestStreak: 1, lastStoryDate: today };
    all.push(streak);
  } else if (streak.lastStoryDate === today) {
    return streak;
  } else {
    const lastDate = new Date(streak.lastStoryDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak.currentStreak += 1;
    } else {
      streak.currentStreak = 1;
    }
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    streak.lastStoryDate = today;
  }

  await AsyncStorage.setItem(STREAKS_KEY, JSON.stringify(all));
  return streak;
}

export async function checkAndAwardBadges(
  profileId: string,
  storyId: string,
  mode: string,
  heroId: string,
): Promise<EarnedBadge[]> {
  const stories = await getStoriesForProfile(profileId);
  const streak = await getStreak(profileId);
  const existing = await getBadges(profileId);
  const existingIds = new Set(existing.map((b) => b.id));
  const newBadges: EarnedBadge[] = [];

  const now = new Date();
  const hour = now.getHours();
  const totalStories = stories.length;
  const modeCount = (m: string) => stories.filter((s) => s.mode === m).length;
  const uniqueHeroes = new Set(stories.map((s) => s.heroId));

  for (const def of BADGE_DEFINITIONS) {
    if (existingIds.has(def.id)) continue;

    let earned = false;
    switch (def.condition) {
      case 'first_story': earned = totalStories >= 1; break;
      case 'night_story': earned = hour >= 20; break;
      case 'morning_story': earned = hour >= 5 && hour < 10; break;
      case 'all_heroes': earned = uniqueHeroes.size >= HEROES.length; break;
      case 'madlibs_3': earned = modeCount('madlibs') >= 3; break;
      case 'sleep_3': earned = modeCount('sleep') >= 3; break;
      case 'classic_5': earned = modeCount('classic') >= 5; break;
      case 'streak_3': earned = streak.currentStreak >= 3; break;
      case 'streak_7': earned = streak.currentStreak >= 7; break;
      case 'total_10': earned = totalStories >= 10; break;
      case 'total_25': earned = totalStories >= 25; break;
      case 'vocab_5': earned = totalStories >= 5; break;
    }

    if (earned) {
      const badge: EarnedBadge = {
        id: def.id,
        emoji: def.emoji,
        title: def.title,
        description: def.description,
        earnedAt: Date.now(),
        storyId,
        profileId,
      };
      const wasNew = await awardBadge(badge);
      if (wasNew) newBadges.push(badge);
    }
  }

  return newBadges;
}

/**
 * Hash a PIN with a salt using SHA-256 via expo-crypto.
 * Returns the hex digest.
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const { digestStringAsync, CryptoDigestAlgorithm } = await import('expo-crypto');
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, salt + pin);
}

/**
 * Generate a random salt for PIN hashing.
 */
export async function generatePinSalt(): Promise<string> {
  const { getRandomBytes } = await import('expo-crypto');
  const bytes = getRandomBytes(16);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

/**
 * Check if parent controls are currently locked out due to failed attempts.
 */
export function isPinLockedOut(controls: ParentControls): boolean {
  if (controls.lockoutUntil === 0) return false;
  return Date.now() < controls.lockoutUntil;
}

/**
 * Record a failed PIN attempt. Returns updated controls.
 */
export async function recordFailedPinAttempt(controls: ParentControls): Promise<ParentControls> {
  const updated = { ...controls };
  updated.failedAttempts = (updated.failedAttempts || 0) + 1;
  if (updated.failedAttempts >= MAX_PIN_ATTEMPTS) {
    updated.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    updated.failedAttempts = 0; // Reset counter after lockout
  }
  await saveParentControls(updated);
  return updated;
}

/**
 * Reset failed attempts on successful unlock.
 */
export async function resetPinAttempts(controls: ParentControls): Promise<ParentControls> {
  const updated = { ...controls, failedAttempts: 0, lockoutUntil: 0 };
  await saveParentControls(updated);
  return updated;
}

export async function getParentControls(): Promise<ParentControls> {
  try {
    const data = await AsyncStorage.getItem(PARENT_CONTROLS_KEY);
    return data ? JSON.parse(data) : DEFAULT_PARENT_CONTROLS;
  } catch {
    return DEFAULT_PARENT_CONTROLS;
  }
}

export async function saveParentControls(controls: ParentControls): Promise<void> {
  await AsyncStorage.setItem(PARENT_CONTROLS_KEY, JSON.stringify(controls));
}
