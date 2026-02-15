import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { STORIES, CATEGORIES } from '@/constants/stories';
import { StoryCard } from '@/components/StoryCard';
import { StarField } from '@/components/StarField';
import { getFavorites, toggleFavorite, getReadStories } from '@/lib/storage';

export default function StoriesScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [readStories, setReadStories] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const loadData = useCallback(async () => {
    const [favs, reads] = await Promise.all([getFavorites(), getReadStories()]);
    setFavorites(favs);
    setReadStories(reads);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleFavorite = async (storyId: string) => {
    const newFavs = await toggleFavorite(storyId);
    setFavorites(newFavs);
  };

  const filteredStories =
    selectedCategory === 'all'
      ? STORIES
      : STORIES.filter((s) => s.category === selectedCategory);

  const favoriteStories = STORIES.filter((s) => favorites.includes(s.id));

  return (
    <View style={styles.container}>
      <StarField />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 16, paddingBottom: Platform.OS === 'web' ? 84 : insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        <View style={styles.headerSection}>
          <Text style={styles.greeting}>Bedtime Chronicles</Text>
          <Text style={styles.headerTitle}>Infinity Heroes</Text>
          <Text style={styles.headerSubtitle}>
            {STORIES.length} magical stories to dream with
          </Text>
        </View>

        {favoriteStories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart" size={18} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Favorites</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favScrollContent}>
              {favoriteStories.map((story) => (
                <Pressable
                  key={story.id}
                  onPress={() => router.push({ pathname: '/story/[id]', params: { id: story.id } })}
                  style={({ pressed }) => [
                    styles.favCard,
                    { transform: [{ scale: pressed ? 0.95 : 1 }] },
                  ]}
                >
                  <View style={[styles.favIcon, { backgroundColor: story.gradient[0] }]}>
                    <Ionicons name={story.iconName as any} size={20} color="rgba(255,255,255,0.9)" />
                  </View>
                  <Text style={styles.favTitle} numberOfLines={1}>{story.title}</Text>
                  <Text style={styles.favDuration}>{story.duration} min</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedCategory(cat.id);
                  }}
                  style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={isActive ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {filteredStories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            isFavorite={favorites.includes(story.id)}
            isRead={readStories.includes(story.id)}
            onPress={() => router.push({ pathname: '/story/[id]', params: { id: story.id } })}
            onFavorite={() => handleFavorite(story.id)}
          />
        ))}

        {filteredStories.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No stories in this category yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {},
  headerSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greeting: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: Colors.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 32,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  favScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  favCard: {
    width: 110,
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  favIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  favTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  favDuration: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  categoryPillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  categoryText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: Colors.textMuted,
  },
});
