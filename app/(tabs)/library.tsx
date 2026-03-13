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
import { useFocusEffect, router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { StarField } from "@/components/StarField";
import { useProfile } from "@/lib/ProfileContext";
import { HEROES } from "@/constants/heroes";
import { CachedStory } from "@/constants/types";
import { getStoriesForProfile, getAllStories, deleteStory, getFavorites, toggleFavorite } from "@/lib/storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

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

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { activeProfile } = useProfile();
  const [stories, setStories] = useState<CachedStory[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function load() {
        setIsLoading(true);
        const [s, f] = await Promise.all([
          activeProfile ? getStoriesForProfile(activeProfile.id) : getAllStories(),
          getFavorites(),
        ]);
        if (!cancelled) {
          setStories(s);
          setFavorites(f);
          setIsLoading(false);
        }
      }
      load();
      return () => { cancelled = true; };
    }, [activeProfile])
  );

  const handleFavorite = async (id: string) => {
    const updated = await toggleFavorite(id);
    setFavorites(updated);
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert("Delete Story", `Remove "${title}" from your library?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteStory(id);
          setStories((prev) => prev.filter((s) => s.id !== id));
        },
      },
    ]);
  };

  const getHero = (heroId: string) => HEROES.find((h) => h.id === heroId);

  const renderStory = ({ item, index }: { item: CachedStory; index: number }) => {
    const hero = getHero(item.heroId);
    const isFav = favorites.includes(item.id);
    const modeColor = MODE_COLORS[item.mode] || Colors.accent;
    const sceneImage = item.scenes ? Object.values(item.scenes)[0] : null;

    return (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 60)}>
        <Pressable
          style={styles.storyCard}
          onPress={() => {
            router.push({
              pathname: "/story",
              params: {
                heroId: item.heroId,
                mode: item.mode,
                duration: "medium",
                voice: "moonbeam",
                speed: "medium",
                replayJson: JSON.stringify(item.story),
              },
            });
          }}
          onLongPress={() => handleDelete(item.id, item.story.title)}
          testID={`library-story-${item.id}`}
        >
          <View style={styles.storyImageWrap}>
            {sceneImage ? (
              <Image source={{ uri: sceneImage }} style={styles.storyImage} resizeMode="cover" />
            ) : (
              <LinearGradient colors={hero?.gradient || ["#1e1b4b", "#312e81"]} style={styles.storyImage}>
                <Ionicons name={(hero?.iconName || "book") as any} size={36} color="rgba(255,255,255,0.3)" />
              </LinearGradient>
            )}
            <LinearGradient
              colors={["transparent", "transparent", "rgba(0,0,0,0.8)"]}
              locations={[0, 0.35, 1]}
              style={styles.storyOverlay}
            />
            <View style={[styles.modeBadge, { backgroundColor: `${modeColor}cc` }]}>
              <Text style={styles.modeBadgeText}>{item.mode.toUpperCase()}</Text>
            </View>
            <Pressable
              style={styles.favBtn}
              onPress={() => handleFavorite(item.id)}
              hitSlop={12}
              testID={`fav-${item.id}`}
            >
              <Ionicons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? "#f43f5e" : "rgba(255,255,255,0.6)"} />
            </Pressable>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.story.title}</Text>
              <Text style={styles.cardMeta}>
                {hero?.name || "Hero"} · {formatDate(item.timestamp)}
              </Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0a0a1e", "#0d0d28", "#0a0a1e"]} style={StyleSheet.absoluteFill} />
      <StarField />

      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Text style={styles.headerTitle}>Your Library</Text>
        <Text style={styles.headerCount}>
          {stories.length} {stories.length === 1 ? "story" : "stories"}
        </Text>
      </View>

      {!isLoading && stories.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={56} color="rgba(99,102,241,0.2)" />
          <Text style={styles.emptyTitle}>No stories yet</Text>
          <Text style={styles.emptySubtitle}>
            Stories you create will appear here.{"\n"}Go to Create to start your first adventure!
          </Text>
        </View>
      ) : (
        <FlatList
          data={stories}
          renderItem={renderStory}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          scrollEnabled={stories.length > 0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1e" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 26,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerCount: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  gridRow: {
    gap: 14,
  },
  storyCard: {
    width: CARD_WIDTH,
    marginBottom: 14,
  },
  storyImageWrap: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(99,102,241,0.12)",
  },
  storyImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  storyOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modeBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modeBadgeText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 8,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  favBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    gap: 2,
  },
  cardTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 18,
  },
  cardMeta: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
    gap: 12,
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
