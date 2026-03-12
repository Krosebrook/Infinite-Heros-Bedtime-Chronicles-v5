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
import { StarField } from "@/components/StarField";
import { useProfile } from "@/lib/ProfileContext";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

const STORY_DATA: Record<string, {
  title: string;
  category: string;
  duration: string;
  ageRange: string;
  summary: string;
  image: string;
}> = {
  "1": {
    title: "The Starry Whales",
    category: "Cosmic",
    duration: "12 min",
    ageRange: "Ages 5-8",
    summary: "When the last cosmic whale begins to fade, young Nova must journey through the Starlight Reef to find the ancient Song of Stars that can restore their glow. Along the way, she befriends quirky space creatures and discovers that the greatest light comes from within.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7yhyLj6n8bFSX8_d1U62Y2R02hWfFHIZdY5YPhSb3Y3VVVMuKgMoqGGfREzX6KVUaKVa-CFbzEIiI8LRNK-89koByLPx6qvtNbznH8X9Lql6r9uHIDaS306SXdsPex3pWn0YNJjmWF2jnTSg8Bc2YiKfekZrijs6EfelrhUWiiEoJBG9I1nQkxGicIetp_4b_GJ2F5F_4WtXgsvxYUy43i7UBN85rJsM2rXrFN3f64c1IzqC7CsZ",
  },
  "2": {
    title: "The Candy Cloud Kingdom",
    category: "Dreamy",
    duration: "8 min",
    ageRange: "Ages 3-6",
    summary: "In a kingdom above the clouds made entirely of sweets, Princess Lollipop must save her candy subjects from the Sour Storm. With courage, kindness, and a sprinkle of sugar magic, she learns that true sweetness comes from friendship.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsy6pS96BchFV2Rd9FYbAgmUtK8y3g7_bdGiEZgz1ldkMXcKQ10d_OqXfgXFJnPGwEX18QTU9yj_qAZurNUaqVxOjM-q5L7YO7qfiPGB2C8PntKlXsDy2fBqOFzFvR9FkItYsaL62q2F7SsXNhDfvJfA_3vDGd0XOz6yqJ-g_-5JnjkvFBsVUBwOQbDScpoQVCNwUdA4gHyJI646dv7ipngkbi9KJ3SqgckbOo6ajxo2v1nGw8FH7NNiUjPj3xoCym_DCc1Tx5DaA",
  },
  "3": {
    title: "The Moon Guardian",
    category: "Fantasy",
    duration: "15 min",
    ageRange: "Ages 6-9",
    summary: "Every night, a mysterious guardian watches over sleeping children from the moon. When shadows threaten to steal their dreams, young Kai is chosen to become the new Moon Guardian and must learn to wield the power of moonlight.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAKIeynr-pNPnxzh6yPj8bsFB8g1-td1o4GmLNz5jmpIg_t7gDbOxIbtILsQs4Dx-XBlWmcnkNehMZSnWWew6N1Dx4Y9_cLNY0PZAI0_12iS05d-Gb_j8j5IegKvVFrJs2tJl838VkEvGOxh1g91RhvPMLR_P86wQV6ytV-2CBV--S6HxIXXGGupUbHyWlc0k9K1McwymOGo0nMcSty8qBgqufJy7Z5QMuY89oQZTAiXXaoifXAWzSD-_zNGIYkk7RZLqYd2qqC7sI",
  },
  "4": {
    title: "The Firefly Symphony",
    category: "Magical",
    duration: "10 min",
    ageRange: "Ages 4-7",
    summary: "Deep in the Enchanted Grove, fireflies create music with their light. When their conductor goes missing, a brave little firefly named Flicker must lead the symphony and discover that every voice, no matter how small, makes the music complete.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhqNuQqkzTwGAhJw53iBqASKJM5WmTUyAsitylylLBDCiyiQySuD4c8uEy4IIX-M_slVeWQDKu81udgQBk3xczFzHl9VX-INVoRf4cv2CqCUaGgGiE__OkqcQjDJUi1X8I0VaC9Eah58JI7u2dX4VSYsqol-sdue-70Ewk8zopVPKYIBICUMELN7J_ft8R0pndpPkXAqAG2ZW53p4Fu8mUW3ywyRMq8UTU62BEoET9xphRhr4HW7uI-NoFHbr_J",
  },
};

const ADVENTURE_SETTINGS = [
  { id: "enchanted-forest", label: "Enchanted Forest", icon: "leaf" as IoniconsName, color: "#22c55e" },
  { id: "crystal-caves", label: "Crystal Caves", icon: "diamond" as IoniconsName, color: "#8b5cf6" },
  { id: "starship", label: "Starship", icon: "rocket" as IoniconsName, color: "#3b82f6" },
  { id: "underwater", label: "Underwater Palace", icon: "water" as IoniconsName, color: "#06b6d4" },
];

const TONES = [
  { id: "gentle", label: "Gentle & Soothing" },
  { id: "adventurous", label: "Adventurous" },
  { id: "funny", label: "Funny & Silly" },
  { id: "mysterious", label: "Mysterious" },
];

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

  const handleStartJourney = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: "/story",
      params: {
        heroId: "nova",
        duration: "medium",
        voice: "moonbeam",
        mode: "classic",
        speed: "medium",
        storyTitle: story.title,
        childName: childName || undefined,
        setting: selectedSetting,
        tone: selectedTone,
      },
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#101022", "#0a0a2e", "#101022"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
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
            colors={["transparent", "rgba(16, 16, 34, 0.6)", "#101022"]}
            style={styles.heroImageOverlay}
          />

          <Pressable
            style={[styles.backBtn, { top: topInset + 8 }]}
            onPress={() => router.back()}
            testID="back-button"
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </Pressable>

          <View style={styles.heroBadges}>
            <View style={[styles.badge, { backgroundColor: "rgba(99,102,241,0.8)" }]}>
              <Ionicons name="star" size={10} color="#FFF" />
              <Text style={styles.badgeText}>Premium Story</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Text style={styles.badgeText}>{story.ageRange}</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentSection}>
          <Animated.View entering={FadeIn.duration(400)}>
            <Text style={styles.title}>{story.title}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.5)" />
                <Text style={styles.metaText}>{story.duration}</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Ionicons name="sparkles-outline" size={14} color="rgba(255,255,255,0.5)" />
                <Text style={styles.metaText}>{story.category}</Text>
              </View>
            </View>
            <Text style={styles.summary}>{story.summary}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(400).delay(150)}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="color-wand" size={18} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Personalize the Magic</Text>
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Child's Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your child's name..."
                placeholderTextColor="rgba(255,255,255,0.25)"
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
                      isActive && { borderColor: setting.color, backgroundColor: `${setting.color}15` },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedSetting(setting.id);
                    }}
                    testID={`setting-${setting.id}`}
                  >
                    <View style={[styles.settingIconWrap, { backgroundColor: `${setting.color}20` }]}>
                      <Ionicons name={setting.icon} size={22} color={setting.color} />
                    </View>
                    <Text style={[styles.settingLabel, isActive && { color: "#FFF" }]}>
                      {setting.label}
                    </Text>
                    {isActive && (
                      <View style={[styles.settingCheck, { backgroundColor: setting.color }]}>
                        <Ionicons name="checkmark" size={12} color="#FFF" />
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

          <Animated.View entering={FadeInDown.duration(400).delay(450)}>
            <View style={styles.detailChipsRow}>
              <View style={styles.detailChip}>
                <Ionicons name="volume-high-outline" size={16} color={Colors.accent} />
                <Text style={styles.detailChipText}>Audio</Text>
              </View>
              <View style={styles.detailChip}>
                <Ionicons name="image-outline" size={16} color={Colors.accent} />
                <Text style={styles.detailChipText}>Illustrations</Text>
              </View>
              <View style={styles.detailChip}>
                <Ionicons name="globe-outline" size={16} color={Colors.accent} />
                <Text style={styles.detailChipText}>English</Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      <View style={[styles.bottomCTA, { paddingBottom: bottomInset + 12 }]}>
        <LinearGradient
          colors={["transparent", "rgba(16,16,34,0.95)"]}
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
            <Ionicons name="sparkles" size={20} color="rgba(255,255,255,0.9)" />
            <Text style={styles.ctaButtonText}>Start Journey</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101022",
  },
  heroImageWrap: {
    width: "100%",
    height: 320,
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
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  heroBadges: {
    position: "absolute",
    bottom: 24,
    left: 16,
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  badgeText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 10,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 28,
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  summary: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 22,
    marginBottom: 28,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  inputWrap: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  textInput: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 15,
    color: "#FFFFFF",
  },
  subsectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  settingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  settingCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  settingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  settingCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tonePillActive: {
    backgroundColor: `${Colors.accent}20`,
    borderColor: Colors.accent,
  },
  tonePillText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  tonePillTextActive: {
    color: Colors.accent,
  },
  detailChipsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  detailChipText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
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
    borderRadius: 9999,
    overflow: "hidden",
    elevation: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  ctaButtonGradient: {
    flexDirection: "row",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaButtonText: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 16,
    color: "#FFF",
    letterSpacing: 1.5,
  },
});
