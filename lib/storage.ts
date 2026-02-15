import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@infinity_heroes_favorites';
const READ_STORIES_KEY = '@infinity_heroes_read';

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
