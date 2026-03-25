import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { HEROES } from "@/constants/heroes";
import { StarField } from "@/components/StarField";
import { StoryFull, EarnedBadge } from "@/constants/types";
import { saveStory, saveStoryWithProfile, saveStoryScene, updateStreak, checkAndAwardBadges, markStoryRead } from "@/lib/storage";
import { useProfile } from "@/lib/ProfileContext";

const MODE_THEMES = {
  classic: {
    accent: "#6366f1",
    accentDark: "#4f46e5",
    gradient: ["#05051e", "#0a0a2e", "#05051e"] as [string, string, string],
    label: "STORY COMPLETE",
    sublabel: "A heroic tale well told",
  },
  madlibs: {
    accent: "#F97316",
    accentDark: "#EA580C",
    gradient: ["#05051e", "#1A0A00", "#05051e"] as [string, string, string],
    label: "THAT WAS HILARIOUS!",
    sublabel: "Your wacky words made magic",
  },
  sleep: {
    accent: "#A855F7",
    accentDark: "#7C3AED",
    gradient: ["#05051e", "#0D0520", "#05051e"] as [string, string, string],
    label: "SWEET DREAMS",
    sublabel: "Time to drift off to sleep",
  },
};

function FloatingStar({ delay, x, y, color }: { delay: number; x: number; y: number; color: string }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ), -1, false
    ));
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ), -1, false
    ));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ position: "absolute", left: `${x}%`, top: `${y}%` } as Record<string, string | number>, animStyle]}>
      <Ionicons name="star" size={16} color={color} />
    </Animated.View>
  );
}

function PulsingBadge({ emoji, color }: { emoji: string; color: string }) {
  const pulseScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withDelay(500, withRepeat(
      withSequence(
        withSpring(1.08, { damping: 6, stiffness: 100 }),
        withSpring(1, { damping: 6, stiffness: 100 })
      ), -1, false
    ));
    ringOpacity.value = withDelay(500, withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200 }),
        withTiming(0, { duration: 1200 })
      ), -1, false
    ));
    ringScale.value = withDelay(500, withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1.6, { duration: 2400 })
      ), -1, false
    ));
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <View style={styles.badgeWrapper}>
      <Animated.View style={[styles.badgeRing, { borderColor: color }, ringStyle]} />
      <Animated.View style={[styles.badgeCircle, { borderColor: `${color}50`, backgroundColor: `${color}12` }, badgeStyle]}>
        <Text style={styles.badgeEmoji}>{emoji}</Text>
      </Animated.View>
    </View>
  );
}

export default function CompletionScreen() {
  const { heroId, mode, storyJson, isFirstStory, scenesJson } = useLocalSearchParams<{
    heroId: string;
    mode: string;
    storyJson: string;
    isFirstStory: string;
    scenesJson: string;
  }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const hero = HEROES.find((h) => h.id === heroId);
  const modeKey = (mode || "classic") as keyof typeof MODE_THEMES;
  const theme = MODE_THEMES[modeKey] || MODE_THEMES.classic;
  const [saved, setSaved] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [newBadges, setNewBadges] = useState<EarnedBadge[]>([]);
  const { activeProfile } = useProfile();

  let storyData: StoryFull | null = null;
  try {
    if (storyJson) storyData = JSON.parse(storyJson) as StoryFull;
  } catch {}

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (isFirstStory === "true") {
      AsyncStorage.setItem("@infinity_heroes_onboarding_complete", "true").catch(() => {});
    }

    const trackCompletion = async () => {
      if (!activeProfile || !hero) return;
      try {
        await updateStreak(activeProfile.id);
        let storyId = `story_${Date.now()}`;
        if (storyData) {
          storyId = await saveStoryWithProfile(storyData, hero.id, mode || "classic", activeProfile.id);
          if (scenesJson) {
            try {
              const scenes: Record<string, string> = JSON.parse(scenesJson);
              for (const [key, imageDataUri] of Object.entries(scenes)) {
                await saveStoryScene(storyId, Number(key), imageDataUri);
              }
            } catch {}
          }
        }
        await markStoryRead(storyId);
        const earned = await checkAndAwardBadges(
          activeProfile.id,
          storyId,
          mode || "classic",
          hero.id,
        );
        if (earned.length > 0) {
          setNewBadges(earned);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (e) {
        if (__DEV__) console.log("Error tracking completion:", e);
      }
    };
    trackCompletion();
  }, []);

  const handleSaveToJar = useCallback(async () => {
    if (!storyData || !hero || saved) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await saveStory(storyData, hero.id, mode || "classic");
    setSaved(true);
  }, [storyData, hero, mode, saved]);

  const handleNewStory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.dismissAll();
  };

  const toggleSection = (section: string) => {
    Haptics.selectionAsync();
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (!hero) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Pressable onPress={() => router.dismissAll()}>
          <Text style={[styles.linkText, { color: theme.accent }]}>Go Home</Text>
        </Pressable>
      </View>
    );
  }

  const badge = storyData?.rewardBadge;
  const vocabWord = storyData?.vocabWord;
  const joke = storyData?.joke;
  const lesson = storyData?.lesson;
  const tomorrowHook = storyData?.tomorrowHook;

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
      <StarField />
      <FloatingStar delay={0} x={15} y={20} color={theme.accent} />
      <FloatingStar delay={300} x={75} y={15} color={theme.accent} />
      <FloatingStar delay={600} x={25} y={50} color={theme.accent} />
      <FloatingStar delay={900} x={80} y={40} color={theme.accent} />
      <FloatingStar delay={1200} x={50} y={65} color={theme.accent} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 20, paddingBottom: bottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {badge && (
          <Animated.View entering={FadeIn.duration(1000)} style={styles.badgeArea}>
            <PulsingBadge emoji={badge.emoji} color={theme.accent} />
            <Text style={[styles.badgeTitle, { color: theme.accent }]}>{badge.title}</Text>
            <Text style={styles.badgeDescription}>{badge.description}</Text>
          </Animated.View>
        )}

        {newBadges.length > 0 && (
          <Animated.View entering={FadeInDown.duration(800).delay(300)} style={styles.newBadgesArea}>
            <Text style={[styles.newBadgesTitle, { color: "#FFD54F" }]}>
              {newBadges.length === 1 ? "New Badge Earned!" : `${newBadges.length} New Badges!`}
            </Text>
            <View style={styles.newBadgesRow}>
              {newBadges.map((b) => (
                <View key={b.id} style={styles.newBadgeItem}>
                  <Text style={{ fontSize: 28 }}>{b.emoji}</Text>
                  <Text style={styles.newBadgeLabel}>{b.title}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.textArea}>
          <Text style={[styles.completionLabel, { color: theme.accent }]}>
            {theme.label}
          </Text>
          <Text style={styles.completionTitle}>
            {storyData?.title || "Great Adventure!"}
          </Text>
          <Text style={styles.completionSublabel}>{theme.sublabel}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(600)} style={styles.extrasArea}>
          {vocabWord && (
            <Pressable onPress={() => toggleSection("vocab")} style={styles.extraCard}>
              <View style={styles.extraCardHeader}>
                <View style={[styles.extraIconWrap, { backgroundColor: `${theme.accent}18` }]}>
                  <Ionicons name="book-outline" size={18} color={theme.accent} />
                </View>
                <View style={styles.extraCardHeaderText}>
                  <Text style={styles.extraCardLabel}>New Word</Text>
                  <Text style={styles.extraCardTitle}>{vocabWord.word}</Text>
                </View>
                <Ionicons
                  name={expandedSection === "vocab" ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textMuted}
                />
              </View>
              {expandedSection === "vocab" && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <Text style={styles.extraCardBody}>{vocabWord.definition}</Text>
                </Animated.View>
              )}
            </Pressable>
          )}

          {joke && (
            <Pressable onPress={() => toggleSection("joke")} style={styles.extraCard}>
              <View style={styles.extraCardHeader}>
                <View style={[styles.extraIconWrap, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                  <Ionicons name="happy-outline" size={18} color="#F59E0B" />
                </View>
                <View style={styles.extraCardHeaderText}>
                  <Text style={styles.extraCardLabel}>Story Joke</Text>
                  <Text style={styles.extraCardTitle}>Tap to reveal</Text>
                </View>
                <Ionicons
                  name={expandedSection === "joke" ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textMuted}
                />
              </View>
              {expandedSection === "joke" && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <Text style={styles.extraCardBody}>{joke}</Text>
                </Animated.View>
              )}
            </Pressable>
          )}

          {lesson && (
            <Pressable onPress={() => toggleSection("lesson")} style={styles.extraCard}>
              <View style={styles.extraCardHeader}>
                <View style={[styles.extraIconWrap, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                  <Ionicons name="heart-outline" size={18} color="#10B981" />
                </View>
                <View style={styles.extraCardHeaderText}>
                  <Text style={styles.extraCardLabel}>Today's Lesson</Text>
                  <Text style={styles.extraCardTitle}>What we learned</Text>
                </View>
                <Ionicons
                  name={expandedSection === "lesson" ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textMuted}
                />
              </View>
              {expandedSection === "lesson" && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <Text style={styles.extraCardBody}>{lesson}</Text>
                </Animated.View>
              )}
            </Pressable>
          )}

          {tomorrowHook && (
            <View style={[styles.tomorrowCard, { borderColor: `${theme.accent}22`, backgroundColor: `${theme.accent}08` }]}>
              <Ionicons name="telescope-outline" size={18} color={theme.accent} />
              <Text style={[styles.tomorrowText, { color: theme.accent }]}>{tomorrowHook}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(800)} style={styles.actionsArea}>
          <Pressable
            onPress={handleSaveToJar}
            disabled={saved}
            style={({ pressed }) => [
              styles.saveButton,
              { borderColor: saved ? "rgba(16, 185, 129, 0.2)" : `${theme.accent}30` },
              saved && styles.saveButtonDone,
              { transform: [{ scale: pressed && !saved ? 0.96 : 1 }] },
            ]}
            testID="save-to-jar-button"
          >
            <Ionicons
              name={saved ? "checkmark-circle" : "archive-outline"}
              size={20}
              color={saved ? "#10B981" : theme.accent}
            />
            <Text style={[styles.saveButtonText, { color: saved ? "#10B981" : theme.accent }]}>
              {saved ? "Saved to Memory Jar" : "Save to Memory Jar"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleNewStory}
            style={({ pressed }) => [
              styles.primaryButton,
              { shadowColor: theme.accent },
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
            testID="new-story-button"
          >
            <LinearGradient
              colors={[theme.accent, theme.accentDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="sparkles" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>New Adventure</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  centered: { justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingHorizontal: 24 },
  badgeArea: { alignItems: "center", marginBottom: 24 },
  badgeWrapper: {
    width: 120, height: 120, alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  badgeRing: {
    position: "absolute",
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2,
  },
  badgeCircle: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  badgeEmoji: { fontSize: 44 },
  badgeTitle: {
    fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: 20,
    textAlign: "center", marginBottom: 4,
  },
  badgeDescription: {
    fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: Colors.textSecondary,
    textAlign: "center",
  },
  textArea: { alignItems: "center", marginBottom: 24 },
  completionLabel: {
    fontFamily: "PlusJakartaSans_700Bold", fontSize: 12,
    letterSpacing: 3, marginBottom: 8,
  },
  completionTitle: {
    fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: 28, color: Colors.textPrimary,
    textAlign: "center", lineHeight: 36,
  },
  completionSublabel: {
    fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: Colors.textSecondary,
    marginTop: 6,
  },
  extrasArea: { gap: 12, marginBottom: 28 },
  extraCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder,
    padding: 16,
  },
  extraCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  extraIconWrap: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
  },
  extraCardHeaderText: { flex: 1 },
  extraCardLabel: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: Colors.textMuted, letterSpacing: 1 },
  extraCardTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: Colors.textPrimary },
  extraCardBody: {
    fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: Colors.textSecondary,
    lineHeight: 24, marginTop: 12, paddingLeft: 48,
  },
  tomorrowCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 16, borderWidth: 1,
    padding: 16,
  },
  tomorrowText: {
    fontFamily: "PlusJakartaSans_500Medium", fontSize: 14,
    flex: 1, lineHeight: 22, fontStyle: "italic",
  },
  actionsArea: { gap: 12 },
  saveButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 28, borderWidth: 1.5,
    paddingVertical: 16,
  },
  saveButtonDone: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
  },
  saveButtonText: {
    fontFamily: "PlusJakartaSans_700Bold", fontSize: 16,
  },
  primaryButton: {
    borderRadius: 28, overflow: "hidden", elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12,
  },
  primaryButtonGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 18, paddingHorizontal: 32,
  },
  primaryButtonText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: "#FFF" },
  linkText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 16 },
  newBadgesArea: {
    alignItems: "center", marginBottom: 20,
    paddingVertical: 16, paddingHorizontal: 20,
    borderRadius: 20, backgroundColor: "rgba(255,215,79,0.06)",
    borderWidth: 1.5, borderColor: "rgba(255,215,79,0.15)",
  },
  newBadgesTitle: {
    fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: 16,
    letterSpacing: 1, marginBottom: 12,
  },
  newBadgesRow: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "center", gap: 16,
  },
  newBadgeItem: { alignItems: "center", gap: 4 },
  newBadgeLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },
});
