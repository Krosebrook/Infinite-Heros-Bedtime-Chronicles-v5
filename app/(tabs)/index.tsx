import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { StarField } from "@/components/StarField";
import { useProfile } from "@/lib/ProfileContext";
import { getAllStories, getFavorites } from "@/lib/storage";
import { CachedStory } from "@/constants/types";
import { HEROES } from "@/constants/heroes";

const CATEGORIES = [
  {
    id: "cosmic",
    label: "Cosmic",
    icon: "planet-outline" as const,
    color: "#6366f1",
    bg: "rgba(99,102,241,0.12)",
  },
  {
    id: "magical",
    label: "Magical",
    icon: "sparkles-outline" as const,
    color: "#a855f7",
    bg: "rgba(168,85,247,0.12)",
  },
  {
    id: "dreamy",
    label: "Dreamy",
    icon: "moon-outline" as const,
    color: "#ec4899",
    bg: "rgba(236,72,153,0.12)",
  },
  {
    id: "adventure",
    label: "Adventure",
    icon: "compass-outline" as const,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
  },
  {
    id: "ocean",
    label: "Ocean",
    icon: "water-outline" as const,
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.12)",
  },
];

const FEATURED_STORIES = [
  {
    id: "1",
    title: "The Starry Whales",
    duration: "12 min",
    category: "Cosmic",
    badge: "Featured",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7yhyLj6n8bFSX8_d1U62Y2R02hWfFHIZdY5YPhSb3Y3VVVMuKgMoqGGfREzX6KVUaKVa-CFbzEIiI8LRNK-89koByLPx6qvtNbznH8X9Lql6r9uHIDaS306SXdsPex3pWn0YNJjmWF2jnTSg8Bc2YiKfekZrijs6EfelrhUWiiEoJBG9I1nQkxGicIetp_4b_GJ2F5F_4WtXgsvxYUy43i7UBN85rJsM2rXrFN3f64c1IzqC7CsZ",
  },
  {
    id: "2",
    title: "The Candy Cloud Kingdom",
    duration: "8 min",
    category: "Dreamy",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsy6pS96BchFV2Rd9FYbAgmUtK8y3g7_bdGiEZgz1ldkMXcKQ10d_OqXfgXFJnPGwEX18QTU9yj_qAZurNUaqVxOjM-q5L7YO7qfiPGB2C8PntKlXsDy2fBqOFzFvR9FkItYsaL62q2F7SsXNhDfvJfA_3vDGd0XOz6yqJ-g_-5JnjkvFBsVUBwOQbDScpoQVCNwUdA4gHyJI646dv7ipngkbi9KJ3SqgckbOo6ajxo2v1nGw8FH7NNiUjPj3xoCym_DCc1Tx5DaA",
  },
  {
    id: "3",
    title: "The Moon Guardian",
    duration: "15 min",
    category: "Fantasy",
    badge: "Popular",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKIeynr-pNPnxzh6yPj8bsFB8g1-td1o4GmLNz5jmpIg_t7gDbOxIbtILsQs4Dx-XBlWmcnkNehMZSnWWew6N1Dx4Y9_cLNY0PZAI0_12iS05d-Gb_j8j5IegKvVFrJs2tJl838VkEvGOxh1g91RhvPMLR_P86wQV6ytV-2CBV--S6HxIXXGGupUbHyWlc0k9K1McwymOGo0nMcSty8qBgqufJy7Z5QMuY89oQZTAiXXaoifXAWzSD-_zNGIYkk7RZLqYd2qqC7sI",
  },
  {
    id: "4",
    title: "The Firefly Symphony",
    duration: "10 min",
    category: "Magical",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhqNuQqkzTwGAhJw53iBqASKJM5WmTUyAsitylylLBDCiyiQySuD4c8uEy4IIX-M_slVeWQDKu81udgQBk3xczFzHl9VX-INVoRf4cv2CqCUaGgGiE__OkqcQjDJUi1X8I0VaC9Eah58JI7u2dX4VSYsqol-sdue-70Ewk8zopVPKYIBICUMELN7J_ft8R0pndpPkXAqAG2ZW53p4Fu8mUW3ywyRMq8UTU62BEoET9xphRhr4HW7uI-NoFHbr_J",
  },
];

const MODE_LABELS: Record<string, { label: string; color: string }> = {
  classic: { label: "Classic", color: "#6366f1" },
  sleep: { label: "Sleep", color: "#A855F7" },
  madlibs: { label: "Mad Libs", color: "#F97316" },
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const [searchText, setSearchText] = useState("");
  const { activeProfile } = useProfile();
  const [recentStories, setRecentStories] = useState<CachedStory[]>([]);
  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const stories = await getAllStories();
        setRecentStories(stories.slice(0, 4));
      };
      load();
    }, [])
  );

  const handleStoryPress = (storyId: string) => {
    router.push({ pathname: "/story-details", params: { storyId } });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a1e", "#0d0d28", "#0a0a1e"]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 + bottomInset }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(400)}>
          <View style={[styles.header, { paddingTop: topInset + 12 }]}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.headerName}>
                {activeProfile?.name || "Little Explorer"} ✨
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable
                onPress={() => router.push("/settings")}
                hitSlop={10}
                style={styles.gearBtn}
                testID="settings-btn"
              >
                <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>
              <Pressable
                style={styles.profileBtn}
                testID="profile-btn"
                onPress={() => router.push("/(tabs)/profile")}
              >
                <Text style={styles.profileEmoji}>
                  {activeProfile?.avatar || "👤"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View style={styles.searchWrap}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.3)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search stories..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={searchText}
                onChangeText={setSearchText}
                testID="search-input"
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORIES.map((cat) => (
              <Pressable key={cat.id} style={styles.categoryChip} testID={`category-${cat.id}`}>
                <View style={[styles.categoryIconWrap, { backgroundColor: cat.bg }]}>
                  <Ionicons name={cat.icon} size={18} color={cat.color} />
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {recentStories.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(250)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Reading</Text>
              <Pressable onPress={() => router.push("/(tabs)/library")}>
                <Text style={styles.seeAll}>See All</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScroll}
            >
              {recentStories.map((story) => {
                const hero = HEROES.find((h) => h.id === story.heroId);
                const modeInfo = MODE_LABELS[story.mode] || MODE_LABELS.classic;
                return (
                  <Pressable
                    key={story.id}
                    style={styles.recentCard}
                    onPress={() => {
                      router.push({
                        pathname: "/story",
                        params: {
                          heroId: story.heroId,
                          mode: story.mode,
                          duration: "medium",
                          voice: "moonbeam",
                          speed: "medium",
                          replayJson: JSON.stringify(story.story),
                        },
                      });
                    }}
                  >
                    {story.scenes?.[0] ? (
                      <Image
                        source={{ uri: story.scenes[0] }}
                        style={styles.recentImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={[hero?.color || "#6366f1", "#1a1a3e"]}
                        style={styles.recentImage}
                      />
                    )}
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.8)"]}
                      style={styles.recentOverlay}
                    />
                    <View style={styles.recentInfo}>
                      <View style={[styles.recentModeBadge, { backgroundColor: `${modeInfo.color}CC` }]}>
                        <Text style={styles.recentModeText}>{modeInfo.label}</Text>
                      </View>
                      <Text style={styles.recentTitle} numberOfLines={1}>{story.story.title}</Text>
                      <Text style={styles.recentMeta}>{hero?.name || "Hero"}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(400).delay(350)}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discover Stories</Text>
          </View>
          <View style={styles.storyGrid}>
            {FEATURED_STORIES.map((story) => (
              <Pressable
                key={story.id}
                style={styles.storyCard}
                onPress={() => handleStoryPress(story.id)}
                testID={`story-card-${story.id}`}
              >
                <View style={styles.storyImageWrap}>
                  <Image
                    source={{ uri: story.image }}
                    style={styles.storyImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={["transparent", "transparent", "rgba(0,0,0,0.8)"]}
                    locations={[0, 0.35, 1]}
                    style={styles.storyImageOverlay}
                  />
                  {story.badge && (
                    <View style={styles.storyBadge}>
                      <Text style={styles.storyBadgeText}>{story.badge}</Text>
                    </View>
                  )}
                  <View style={styles.storyInfoOverlay}>
                    <Text style={styles.storyTitle} numberOfLines={2}>
                      {story.title}
                    </Text>
                    <View style={styles.storyMetaRow}>
                      <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.storyMeta}>{story.duration}</Text>
                      <View style={styles.metaDot} />
                      <Text style={styles.storyMeta}>{story.category}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a1e",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 2,
  },
  headerName: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 22,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(99, 102, 241, 0.25)",
  },
  profileEmoji: {
    fontSize: 22,
  },
  searchWrap: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "#FFFFFF",
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 14,
    paddingLeft: 6,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  categoryIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  seeAll: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: Colors.accent,
  },
  recentScroll: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 8,
  },
  recentCard: {
    width: 200,
    height: 130,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  recentImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  recentOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  recentInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  recentModeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  recentModeText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 9,
    color: "#FFF",
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  recentTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#FFF",
    marginBottom: 2,
  },
  recentMeta: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
  storyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
  },
  storyCard: {
    width: CARD_WIDTH,
  },
  storyImageWrap: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: "hidden",
  },
  storyImage: {
    width: "100%",
    height: "100%",
  },
  storyImageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  storyBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(99, 102, 241, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  storyBadgeText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 9,
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  storyInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    gap: 4,
  },
  storyTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 19,
  },
  storyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storyMeta: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
});
