import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  TextInput,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useProfile } from "@/lib/ProfileContext";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

const STORY_DATA: Record<string, {
  title: string;
  category: string;
  duration: string;
  ageRange: string;
  summary: string;
  image: string;
  heroId: string;
  mode: string;
}> = {
  "1": {
    title: "The Starry Whales",
    category: "Cosmic",
    duration: "12 min",
    ageRange: "Ages 5-8",
    heroId: "hero-1",
    mode: "classic",
    summary: "When the last cosmic whale begins to fade, young Nova must journey through the Starlight Reef to find the ancient Song of Stars that can restore their glow. Along the way, she befriends quirky space creatures and discovers that the greatest light comes from within.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7yhyLj6n8bFSX8_d1U62Y2R02hWfFHIZdY5YPhSb3Y3VVVMuKgMoqGGfREzX6KVUaKVa-CFbzEIiI8LRNK-89koByLPx6qvtNbznH8X9Lql6r9uHIDaS306SXdsPex3pWn0YNJjmWF2jnTSg8Bc2YiKfekZrijs6EfelrhUWiiEoJBG9I1nQkxGicIetp_4b_GJ2F5F_4WtXgsvxYUy43i7UBN85rJsM2rXrFN3f64c1IzqC7CsZ",
  },
  "2": {
    title: "The Candy Cloud Kingdom",
    category: "Dreamy",
    duration: "8 min",
    ageRange: "Ages 3-6",
    summary: "In a kingdom above the clouds made entirely of sweets, Princess Lollipop must save her candy subjects from the Sour Storm. With courage, kindness, and a sprinkle of sugar magic, she learns that true sweetness comes from friendship.",
    heroId: "hero-3",
    mode: "classic",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsy6pS96BchFV2Rd9FYbAgmUtK8y3g7_bdGiEZgz1ldkMXcKQ10d_OqXfgXFJnPGwEX18QTU9yj_qAZurNUaqVxOjM-q5L7YO7qfiPGB2C8PntKlXsDy2fBqOFzFvR9FkItYsaL62q2F7SsXNhDfvJfA_3vDGd0XOz6yqJ-g_-5JnjkvFBsVUBwOQbDScpoQVCNwUdA4gHyJI646dv7ipngkbi9KJ3SqgckbOo6ajxo2v1nGw8FH7NNiUjPj3xoCym_DCc1Tx5DaA",
  },
  "3": {
    title: "The Moon Guardian",
    category: "Fantasy",
    duration: "15 min",
    ageRange: "Ages 6-9",
    heroId: "hero-5",
    mode: "classic",
    summary: "Every night, a mysterious guardian watches over sleeping children from the moon. When shadows threaten to steal their dreams, young Kai is chosen to become the new Moon Guardian and must learn to wield the power of moonlight.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKIeynr-pNPnxzh6yPj8bsFB8g1-td1o4GmLNz5jmpIg_t7gDbOxIbtILsQs4Dx-XBlWmcnkNehMZSnWWew6N1Dx4Y9_cLNY0PZAI0_12iS05d-Gb_j8j5IegKvVFrJs2tJl838VkEvGOxh1g91RhvPMLR_P86wQV6ytV-2CBV--S6HxIXXGGupUbHyWlc0k9K1McwymOGo0nMcSty8qBgqufJy7Z5QMuY89oQZTAiXXaoifXAWzSD-_zNGIYkk7RZLqYd2qqC7sI",
  },
  "4": {
    title: "The Firefly Symphony",
    category: "Magical",
    duration: "10 min",
    ageRange: "Ages 4-7",
    summary: "Deep in the Enchanted Grove, fireflies create music with their light. When their conductor goes missing, a brave little firefly named Flicker must lead the symphony and discover that every voice, no matter how small, makes the music complete.",
    heroId: "hero-7",
    mode: "classic",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhqNuQqkzTwGAhJw53iBqASKJM5WmTUyAsitylylLBDCiyiQySuD4c8uEy4IIX-M_slVeWQDKu81udgQBk3xczFzHl9VX-INVoRf4cv2CqCUaGgGiE__OkqcQjDJUi1X8I0VaC9Eah58JI7u2dX4VSYsqol-sdue-70Ewk8zopVPKYIBICUMELN7J_ft8R0pndpPkXAqAG2ZW53p4Fu8mUW3ywyRMq8UTU62BEoET9xphRhr4HW7uI-NoFHbr_J",
  },
};

const ADVENTURE_SETTINGS = [
  { id: "enchanted-forest", label: "Enchanted Forest", prompt: "an enchanted forest filled with glowing mushrooms and talking animals", icon: "leaf" as IoniconsName, color: "#22c55e" },
  { id: "crystal-caves", label: "Crystal Caves", prompt: "sparkling crystal caves beneath a magical mountain", icon: "diamond" as IoniconsName, color: "#8b5cf6" },
  { id: "starship", label: "Starship", prompt: "aboard a magical starship sailing through the cosmos", icon: "rocket" as IoniconsName, color: "#3b82f6" },
  { id: "underwater", label: "Underwater Palace", prompt: "a shimmering underwater palace beneath the waves", icon: "water" as IoniconsName, color: "#06b6d4" },
];

const TONES = [
  { id: "gentle", label: "Gentle & Soothing" },
  { id: "adventurous", label: "Adventurous" },
  { id: "funny", label: "Funny & Silly" },
  { id: "mysterious", label: "Mysterious" },
];

const SIDEKICKS = [
  { id: "none", label: "Solo", icon: "person-outline" as IoniconsName, prompt: "none" },
  { id: "owl", label: "Wise Owl", icon: "eye-outline" as IoniconsName, prompt: "a wise old owl with spectacles and ancient knowledge" },
  { id: "dragon", label: "Dragon", icon: "flame-outline" as IoniconsName, prompt: "a friendly little dragon who breathes rainbow sparks" },
  { id: "fairy", label: "Fairy", icon: "sparkles-outline" as IoniconsName, prompt: "a mischievous fairy who loves to play pranks" },
  { id: "robot", label: "Robot Dog", icon: "hardware-chip-outline" as IoniconsName, prompt: "a loyal robot dog with a wagging antenna tail" },
  { id: "bear", label: "Magic Bear", icon: "paw-outline" as IoniconsName, prompt: "a talking bear who tells riddles and loves honey cakes" },
];

const PROBLEMS = [
  { id: "lost-treasure", label: "Find a Lost Treasure" },
  { id: "help-friend", label: "Help a Friend in Need" },
  { id: "ancient-puzzle", label: "Solve an Ancient Puzzle" },
  { id: "missing-magic", label: "Restore Missing Magic" },
  { id: "new-land", label: "Explore a New Land" },
];

const PROBLEM_PROMPTS: Record<string, string> = {
  "lost-treasure": "finding a legendary lost treasure hidden somewhere in the setting",
  "help-friend": "helping a friend who is lost, lonely, or needs the hero's special power",
  "ancient-puzzle": "solving an ancient magical puzzle that only the bravest hero can unlock",
  "missing-magic": "restoring lost magic that has made the world a little dimmer and sadder",
  "new-land": "exploring an unknown land and making peace with the mysterious creatures who live there",
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function StoryDetailsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  const { activeProfile } = useProfile();

  const story = STORY_DATA[storyId || "1"] || STORY_DATA["1"];

  const [childName, setChildName] = useState(activeProfile?.name || "");
  const [selectedSetting, setSelectedSetting] = useState("enchanted-forest");
  const [selectedTone, setSelectedTone] = useState("gentle");
  const [selectedSidekick, setSelectedSidekick] = useState("none");
  const [selectedProblem, setSelectedProblem] = useState("lost-treasure");

  const handleStartJourney = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const settingData = ADVENTURE_SETTINGS.find((s) => s.id === selectedSetting);
    const sidekickData = SIDEKICKS.find((s) => s.id === selectedSidekick);
    router.push({
      pathname: "/story",
      params: {
        heroId: story.heroId,
        duration: "medium",
        voice: story.mode === "sleep" ? "moonbeam" : "captain",
        mode: story.mode,
        speed: story.mode === "sleep" ? "gentle" : "medium",
        ...(childName.trim() ? { childName: childName.trim() } : {}),
        ...(story.mode === "classic" ? {
          setting: settingData?.prompt || selectedSetting,
          tone: selectedTone,
          sidekick: sidekickData?.prompt || "none",
          problem: PROBLEM_PROMPTS[selectedProblem] || selectedProblem,
        } : {}),
      },
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a1e", "#0d0d28", "#0a0a1e"]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAwareScrollViewCompat
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + bottomInset }}
        bounces={false}
      >
        <View style={styles.heroImageWrap}>
          <Image
            source={{ uri: story.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["rgba(10,10,30,0.3)", "rgba(10,10,30,0.6)", "#0a0a1e"]}
            locations={[0, 0.5, 1]}
            style={styles.heroImageOverlay}
          />

          <Pressable
            style={[styles.backBtn, { top: topInset + 8 }]}
            onPress={() => router.back()}
            testID="back-button"
          >
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </Pressable>

          <Pressable
            style={[styles.shareBtn, { top: topInset + 8 }]}
            onPress={() => Haptics.selectionAsync()}
          >
            <Ionicons name="heart-outline" size={20} color="#FFF" />
          </Pressable>

          <View style={styles.heroTitleArea}>
            <View style={styles.heroBadges}>
              <View style={[styles.badge, { backgroundColor: "rgba(99,102,241,0.85)" }]}>
                <Ionicons name="sparkles" size={10} color="#FFF" />
                <Text style={styles.badgeText}>AI Story</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
                <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.8)" />
                <Text style={styles.badgeText}>{story.duration}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
                <Text style={styles.badgeText}>{story.ageRange}</Text>
              </View>
            </View>
            <Text style={styles.title}>{story.title}</Text>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Animated.View entering={FadeIn.duration(400)}>
            <Text style={styles.summary}>{story.summary}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(150)}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="color-wand" size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Personalize</Text>
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Child's Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter name..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={childName}
                onChangeText={setChildName}
                testID="child-name-input"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(250)}>
            <Text style={styles.subsectionTitle}>Adventure Setting</Text>
            <View style={styles.settingsGrid}>
              {ADVENTURE_SETTINGS.map((setting) => {
                const isActive = selectedSetting === setting.id;
                return (
                  <Pressable
                    key={setting.id}
                    style={[
                      styles.settingCard,
                      isActive && { borderColor: setting.color, backgroundColor: `${setting.color}12` },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedSetting(setting.id);
                    }}
                    testID={`setting-${setting.id}`}
                  >
                    <View style={[styles.settingIconWrap, { backgroundColor: `${setting.color}18` }]}>
                      <Ionicons name={setting.icon} size={20} color={setting.color} />
                    </View>
                    <Text style={[styles.settingLabel, isActive && { color: "#FFF" }]}>
                      {setting.label}
                    </Text>
                    {isActive && (
                      <View style={[styles.settingCheck, { backgroundColor: setting.color }]}>
                        <Ionicons name="checkmark" size={11} color="#FFF" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(350)}>
            <Text style={styles.subsectionTitle}>Narration Tone</Text>
            <View style={styles.tonesRow}>
              {TONES.map((tone) => {
                const isActive = selectedTone === tone.id;
                return (
                  <Pressable
                    key={tone.id}
                    style={[styles.tonePill, isActive && styles.tonePillActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedTone(tone.id);
                    }}
                    testID={`tone-${tone.id}`}
                  >
                    <Text style={[styles.tonePillText, isActive && styles.tonePillTextActive]}>
                      {tone.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {story.mode === "classic" && (
            <>
              <Animated.View entering={FadeInDown.duration(400).delay(450)}>
                <Text style={styles.subsectionTitle}>Sidekick Companion</Text>
                <View style={styles.sidekickRow}>
                  {SIDEKICKS.map((sk) => {
                    const isActive = selectedSidekick === sk.id;
                    return (
                      <Pressable
                        key={sk.id}
                        style={[styles.sidekickCard, isActive && styles.sidekickCardActive]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedSidekick(sk.id);
                        }}
                        testID={`sidekick-${sk.id}`}
                      >
                        <View style={[styles.sidekickIcon, isActive && styles.sidekickIconActive]}>
                          <Ionicons name={sk.icon} size={18} color={isActive ? "#FFF" : Colors.textMuted} />
                        </View>
                        <Text style={[styles.sidekickLabel, isActive && styles.sidekickLabelActive]}>
                          {sk.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(400).delay(550)}>
                <Text style={styles.subsectionTitle}>Today's Challenge</Text>
                <View style={styles.problemRow}>
                  {PROBLEMS.map((p) => {
                    const isActive = selectedProblem === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        style={[styles.problemChip, isActive && styles.problemChipActive]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedProblem(p.id);
                        }}
                        testID={`problem-${p.id}`}
                      >
                        <Text style={[styles.problemChipText, isActive && styles.problemChipTextActive]}>
                          {p.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            </>
          )}

          <Animated.View entering={FadeInDown.duration(400).delay(650)}>
            <View style={styles.detailChipsRow}>
              <View style={styles.detailChip}>
                <Ionicons name="volume-high-outline" size={14} color={Colors.accent} />
                <Text style={styles.detailChipText}>Audio</Text>
              </View>
              <View style={styles.detailChip}>
                <Ionicons name="image-outline" size={14} color={Colors.accent} />
                <Text style={styles.detailChipText}>Illustrations</Text>
              </View>
              <View style={styles.detailChip}>
                <Ionicons name="globe-outline" size={14} color={Colors.accent} />
                <Text style={styles.detailChipText}>English</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </KeyboardAwareScrollViewCompat>

      <View style={[styles.bottomCTA, { paddingBottom: bottomInset + 12 }]}>
        <LinearGradient
          colors={["transparent", "rgba(10,10,30,0.97)"]}
          style={styles.bottomCTAGradient}
        />
        <Pressable
          onPress={handleStartJourney}
          style={({ pressed }) => [
            styles.ctaButton,
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
          testID="start-journey-button"
        >
          <LinearGradient
            colors={["#6366f1", "#4f46e5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaButtonGradient}
          >
            <Ionicons name="sparkles" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={styles.ctaButtonText}>Begin Story</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a1e",
  },
  heroImageWrap: {
    width: "100%",
    height: 360,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  shareBtn: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heroTitleArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  heroBadges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 28,
    color: "#FFFFFF",
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  summary: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    lineHeight: 22,
    marginBottom: 28,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  inputWrap: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase" as const,
  },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: "#FFFFFF",
  },
  subsectionTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  settingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  settingCard: {
    width: (SCREEN_WIDTH - 50) / 2,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  settingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  settingCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tonesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  tonePill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tonePillActive: {
    backgroundColor: `${Colors.accent}15`,
    borderColor: `${Colors.accent}50`,
  },
  tonePillText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  tonePillTextActive: {
    color: Colors.accent,
  },
  sidekickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  sidekickCard: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    minWidth: 72,
  },
  sidekickCardActive: {
    backgroundColor: `${Colors.accent}18`,
    borderColor: `${Colors.accent}60`,
  },
  sidekickIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  sidekickIconActive: {
    backgroundColor: Colors.accent,
  },
  sidekickLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
  },
  sidekickLabelActive: {
    color: "#FFF",
  },
  problemRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  problemChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  problemChipActive: {
    backgroundColor: "rgba(249,115,22,0.15)",
    borderColor: "rgba(249,115,22,0.5)",
  },
  problemChipText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  problemChipTextActive: {
    color: "#F97316",
  },
  detailChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  detailChipText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },
  bottomCTA: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  bottomCTAGradient: {
    ...StyleSheet.absoluteFillObject,
    height: 120,
  },
  ctaButton: {
    borderRadius: 14,
    overflow: "hidden",
    elevation: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  ctaButtonGradient: {
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaButtonText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#FFF",
    letterSpacing: 0.5,
  },
});
