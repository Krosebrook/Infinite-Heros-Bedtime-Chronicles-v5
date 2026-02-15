import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CachedStory,
  StoryFull,
  UserPreferences,
  DEFAULT_PREFERENCES,
} from '@/constants/types';

const FAVORITES_KEY = '@infinity_heroes_favorites';
const READ_STORIES_KEY = '@infinity_heroes_read';
const STORIES_KEY = '@infinity_heroes_stories';
const PREFERENCES_KEY = '@infinity_heroes_preferences';

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
