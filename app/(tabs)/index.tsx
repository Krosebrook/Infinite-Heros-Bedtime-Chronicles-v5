import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  TextInput,
  Image,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { StarField } from "@/components/StarField";
import { useProfile } from "@/lib/ProfileContext";

const CATEGORIES = [
  {
    id: "cosmic",
    label: "Cosmic",
    color: "#1a237e",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIOKJARSbpH3XoJuixmaeO192K9kjRVQ1cSy4HtEcEuEjYEZZGqfn6F5Dewj8W_KaXzXmq9hCmyIVoQ8en-fSKIEzWOR_M7OJJ54fhyWIhQfzuaUOtFurySxFd1xgWfXH54tI_jv-9-i7PtvP_oUzJrcAnUMtRawLle2ivePGjkvAyHe5epQ9dxX0MfWXjmhS1r4iibuOnsD3hWf7GSeYpFVXI9j9uYGWVilXy2EllZ6SS6ici1o-H4lFmaTq113tBsI0rEC",
  },
  {
    id: "magical",
    label: "Magical",
    color: "#1b5e20",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhDB631M-vLrCeBAlpf2IOQscUeN8Sjxnm7n0TsKW2WG2SsOMu9zyMHfUBetoqpRn3qR_t0toNNuqZ8uXiXwADmpxDpAL8kjZx8nTNV3iEIZ_SoczN4ggeL9-8TYgTI6z9bqITlOXFiWtKDQRQZ2rO1xtt15M6p_VIHMiNsSVjgJCEPruZJxWva783KTHus-cdRQCGTVc0sHGMTc6C0IGu7W1PKSLP6NimsLpIV5yMkTib3YVsw-e9rw4CgVJ6c_RXj04mR",
  },
  {
    id: "winter",
    label: "Winter",
    color: "#0d47a1",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzLJOJXgyvRM_hVP7B8VhVyW-tyCHeLmfm9QXmk6O6B_7vblb19izZPBAAcjVjiDiDtcdpr3a3AJH9RyiT5dis4EKy28RglLQv1W4zGoY-Buvo40T9fLEubemXkvHyoQvjsMfNfG9uH0rBp5mVs4QvMMWMfuordBql6dt_kaMMHWf2nX52IYzV4rBEYvbT4kcotM9RSCwy4yFNhIP3IVFZIS6UNyX2YnH-sMU4GQBQMrVCw7orE5OYuaFWoPMIdkD5JeoweYRs9zM",
  },
  {
    id: "oceanic",
    label: "Oceanic",
    color: "#006064",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAkpvSxcLcwXtCUTDOJztawVqDdTLqqIYUvVKx0pERU1KcNLZvxdedll9VpQgmrIWQL6D8CGj3_S_kfRXdLl1UWqT0-VqCB0EgyH8zfAMGASBeEAQg25KKPhnLexhQnV9y64lPlFfuM9quz2wlGPl-XlLI8pyhcta1Zj9DnI2r0v3pNnQpc_kdX4uM80HwFtZnNnBjV8TdG_ET-W7KjfgAezMlqlEcvXaspz51xRePI0He5NbZ_1-9YAqqBvi",
  },
  {
    id: "dreamy",
    label: "Dreamy",
    color: "#4a148c",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVCPpx1C5l9uVA_ARgxN07-9zv7umumEX3ExmL4NVK3dhNKlFUJIVo3reOZZxVZm9O36tcC9chAYnE1efAZlxx-khnnHVeC9ICy9fGmOb4YmUT-JtlM1sH9a02rnqoIRb6LDE3bWQnEuA--lioHOve0VIuFUQ-Ib_c_bOYS4t9hZqDo_wFLsLIiTJir18NY2y25peblBBLgy1YU_v5yIRiFzdxTVaCw0yDJk2WaxKes2vygIBxVu7B8UaT36f5dfFgRyyczUfcx",
  },
];

const TABS = ["New Arrivals", "Favorites", "AI Crafted"] as const;

const STORIES = [
  {
    id: "1",
    title: "The Starry Whales",
    duration: "12 min read",
    category: "Cosmic",
    badge: "Editor's Pick",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7yhyLj6n8bFSX8_d1U62Y2R02hWfFHIZdY5YPhSb3Y3VVVMuKgMoqGGfREzX6KVUaKVa-CFbzEIiI8LRNK-89koByLPx6qvtNbznH8X9Lql6r9uHIDaS306SXdsPex3pWn0YNJjmWF2jnTSg8Bc2YiKfekZrijs6EfelrhUWiiEoJBG9I1nQkxGicIetp_4b_GJ2F5F_4WtXgsvxYUy43i7UBN85rJsM2rXrFN3f64c1IzqC7CsZ",
  },
  {
    id: "2",
    title: "The Candy Cloud Kingdom",
    duration: "8 min read",
    category: "Dreamy",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsy6pS96BchFV2Rd9FYbAgmUtK8y3g7_bdGiEZgz1ldkMXcKQ10d_OqXfgXFJnPGwEX18QTU9yj_qAZurNUaqVxOjM-q5L7YO7qfiPGB2C8PntKlXsDy2fBqOFzFvR9FkItYsaL62q2F7SsXNhDfvJfA_3vDGd0XOz6yqJ-g_-5JnjkvFBsVUBwOQbDScpoQVCNwUdA4gHyJI646dv7ipngkbi9KJ3SqgckbOo6ajxo2v1nGw8FH7NNiUjPj3xoCym_DCc1Tx5DaA",
  },
  {
    id: "3",
    title: "The Moon Guardian",
    duration: "15 min read",
    category: "Fantasy",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKIeynr-pNPnxzh6yPj8bsFB8g1-td1o4GmLNz5jmpIg_t7gDbOxIbtILsQs4Dx-XBlWmcnkNehMZSnWWew6N1Dx4Y9_cLNY0PZAI0_12iS05d-Gb_j8j5IegKvVFrJs2tJl838VkEvGOxh1g91RhvPMLR_P86wQV6ytV-2CBV--S6HxIXXGGupUbHyWlc0k9K1McwymOGo0nMcSty8qBgqufJy7Z5QMuY89oQZTAiXXaoifXAWzSD-_zNGIYkk7RZLqYd2qqC7sI",
  },
  {
    id: "4",
    title: "The Firefly Symphony",
    duration: "10 min read",
    category: "Magical",
    badge: "AI Crafted",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhqNuQqkzTwGAhJw53iBqASKJM5WmTUyAsitylylLBDCiyiQySuD4c8uEy4IIX-M_slVeWQDKu81udgQBk3xczFzHl9VX-INVoRf4cv2CqCUaGgGiE__OkqcQjDJUi1X8I0VaC9Eah58JI7u2dX4VSYsqol-sdue-70Ewk8zopVPKYIBICUMELN7J_ft8R0pndpPkXAqAG2ZW53p4Fu8mUW3ywyRMq8UTU62BEoET9xphRhr4HW7uI-NoFHbr_J",
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("New Arrivals");
  const [searchText, setSearchText] = useState("");
  const { activeProfile } = useProfile();

  const handleStoryPress = (storyId: string) => {
    router.push({ pathname: "/story-details", params: { storyId } });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#101022", "#0a0a2e", "#101022"]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(400)}>
          <View style={[styles.header, { paddingTop: topInset + 8 }]}>
            <View style={styles.headerIcon}>
              <Ionicons name="sparkles" size={22} color={Colors.accent} />
            </View>
            <Text style={styles.headerTitle}>Infinity Bedtime Chronicles</Text>
            <Pressable style={styles.profileBtn} testID="profile-btn">
              <Text style={styles.profileEmoji}>
                {activeProfile?.avatar || "👤"}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View style={styles.searchWrap}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.3)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a magical tale..."
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
              <Pressable key={cat.id} style={styles.categoryItem} testID={`category-${cat.id}`}>
                <View style={styles.categoryImageWrap}>
                  <Image
                    source={{ uri: cat.image }}
                    style={styles.categoryImage}
                    resizeMode="cover"
                  />
                  <View style={[styles.categoryOverlay, { backgroundColor: `${cat.color}40` }]} />
                </View>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <View style={styles.tabsRow}>
            {TABS.map((tab) => {
              const isActive = tab === activeTab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabItem, isActive && styles.tabItemActive]}
                  testID={`tab-${tab}`}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          <View style={styles.storyGrid}>
            {STORIES.map((story, index) => (
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
                    colors={["transparent", "rgba(16,16,34,0.8)"]}
                    style={styles.storyImageOverlay}
                  />
                  {story.badge && (
                    <View style={styles.storyBadge}>
                      <Text style={styles.storyBadgeText}>{story.badge}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.storyInfo}>
                  <Text style={styles.storyTitle} numberOfLines={1}>
                    {story.title}
                  </Text>
                  <Text style={styles.storyMeta}>
                    {story.duration} • {story.category}
                  </Text>
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
    backgroundColor: "#101022",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15, 15, 189, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileEmoji: {
    fontSize: 20,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 15, 189, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(15, 15, 189, 0.2)",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 15,
    color: "#FFFFFF",
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
  },
  categoryItem: {
    alignItems: "center",
    gap: 8,
    width: 80,
  },
  categoryImageWrap: {
    width: 80,
    height: 112,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15, 15, 189, 0.3)",
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15, 15, 189, 0.2)",
    marginTop: 20,
    paddingHorizontal: 16,
    gap: 24,
  },
  tabItem: {
    paddingBottom: 12,
    paddingTop: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: Colors.deepIndigo,
  },
  tabText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
  },
  tabTextActive: {
    color: Colors.deepIndigo,
  },
  storyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  storyCard: {
    width: CARD_WIDTH,
    gap: 10,
  },
  storyImageWrap: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15, 15, 189, 0.1)",
  },
  storyImage: {
    width: "100%",
    height: "100%",
  },
  storyImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  storyBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(15, 15, 189, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  storyBadgeText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 9,
    color: "#FFFFFF",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  storyInfo: {
    gap: 2,
  },
  storyTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  storyMeta: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },
});
