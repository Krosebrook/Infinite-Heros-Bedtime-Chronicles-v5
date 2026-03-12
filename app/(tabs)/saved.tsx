import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  FlatList,
  Pressable,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { StarField } from "@/components/StarField";
import { useProfile } from "@/lib/ProfileContext";
import { HEROES } from "@/constants/heroes";
import { CachedStory } from "@/constants/types";
import { getAllStories, deleteStory, getFavorites, toggleFavorite } from "@/lib/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MODE_COLORS: Record<string, string> = {
  classic: "#6366f1",
  sleep: "#A855F7",
  madlibs: "#F97316",
};

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { activeProfile } = useProfile();
  const [savedStories, setSavedStories] = useState<CachedStory[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setIsLoading(true);
        const [allStories, favIds] = await Promise.all([
          getAllStories(),
          getFavorites(),
        ]);
        if (!cancelled) {
          const favStories = allStories.filter((s) => favIds.includes(s.id));
          setSavedStories(favStories);
          setFavorites(favIds);
          setIsLoading(false);
        }
      }
      load();
      return () => { cancelled = true; };
    }, [activeProfile])
  );

  const handleUnfavorite = async (id: string, title: string) => {
    Alert.alert("Remove from Saved", `Remove "${title}" from your saved stories?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const updated = await toggleFavorite(id);
          setFavorites(updated);
          setSavedStories((prev) => prev.filter((s) => s.id !== id));
        },
      },
    ]);
  };

  const getHero = (heroId: string) => HEROES.find((h) => h.id === heroId);

  const renderStory = ({ item, index }: { item: CachedStory; index: number }) => {
    const hero = getHero(item.heroId);
    const modeColor = MODE_COLORS[item.mode] || Colors.accent;
    const sceneImage = item.scenes ? Object.values(item.scenes)[0] : null;

    return (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 80)}>
        <Pressable
          style={styles.storyRow}
          onLongPress={() => handleUnfavorite(item.id, item.story.title)}
          testID={`saved-story-${item.id}`}
        >
          <View style={styles.storyThumb}>
            {sceneImage ? (
              <Image source={{ uri: sceneImage }} style={styles.thumbImage} resizeMode="cover" />
            ) : (
              <LinearGradient colors={hero?.gradient || ["#1e1b4b", "#312e81"]} style={styles.thumbImage}>
                <Ionicons name={(hero?.iconName || "book") as any} size={22} color="rgba(255,255,255,0.4)" />
              </LinearGradient>
            )}
          </View>
          <View style={styles.storyContent}>
            <Text style={styles.storyTitle} numberOfLines={1}>{item.story.title}</Text>
            <Text style={styles.storyMeta}>
              {hero?.name || "Hero"} · {item.story.parts.length} {item.story.parts.length === 1 ? "chapter" : "chapters"}
            </Text>
            <View style={styles.tagRow}>
              <View style={[styles.modeTag, { backgroundColor: `${modeColor}20`, borderColor: `${modeColor}40` }]}>
                <Text style={[styles.modeTagText, { color: modeColor }]}>{item.mode}</Text>
              </View>
              <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
            </View>
          </View>
          <Pressable
            style={styles.heartBtn}
            onPress={() => handleUnfavorite(item.id, item.story.title)}
            hitSlop={12}
            testID={`unsave-${item.id}`}
          >
            <Ionicons name="heart" size={20} color="#f43f5e" />
          </Pressable>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0a0a1e", "#0d0d28", "#0a0a1e"]} style={StyleSheet.absoluteFill} />
      <StarField />

      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Ionicons name="heart" size={22} color="#f43f5e" />
        <Text style={styles.headerTitle}>Saved Stories</Text>
        {savedStories.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{savedStories.length}</Text>
          </View>
        )}
      </View>

      {!isLoading && savedStories.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="heart-outline" size={52} color="rgba(244,63,94,0.25)" />
          </View>
          <Text style={styles.emptyTitle}>No saved stories</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart icon on any story to save it here for easy access later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedStories}
          renderItem={renderStory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={savedStories.length > 0}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1e" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 26,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    flex: 1,
  },
  countBadge: {
    backgroundColor: "rgba(244,63,94,0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(244,63,94,0.3)",
  },
  countText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    color: "#f43f5e",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginVertical: 4,
  },
  storyRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    gap: 14,
  },
  storyThumb: {
    width: 64,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  storyContent: {
    flex: 1,
    gap: 3,
  },
  storyTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  storyMeta: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  modeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  modeTagText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    textTransform: "capitalize",
  },
  dateText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(244,63,94,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
    gap: 14,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(244,63,94,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: "#FFFFFF",
  },
  emptySubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    lineHeight: 20,
  },
});
