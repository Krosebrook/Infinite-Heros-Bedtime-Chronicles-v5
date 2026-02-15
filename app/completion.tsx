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
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { HEROES } from "@/constants/heroes";
import { StarField } from "@/components/StarField";
import { StoryFull } from "@/constants/types";
import { saveStory } from "@/lib/storage";

function FloatingStar({ delay, x, y }: { delay: number; x: number; y: number }) {
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
    <Animated.View style={[{ position: "absolute", left: `${x}%` as any, top: `${y}%` as any }, animStyle]}>
      <Ionicons name="star" size={16} color={Colors.accent} />
    </Animated.View>
  );
}

export default function CompletionScreen() {
  const { heroId, mode, storyJson } = useLocalSearchParams<{
    heroId: string;
    mode: string;
    storyJson: string;
  }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const hero = HEROES.find((h) => h.id === heroId);
  const isMadLibs = mode === "madlibs";
  const isSleep = mode === "sleep";
  const [saved, setSaved] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  let storyData: StoryFull | null = null;
  try {
    if (storyJson) storyData = JSON.parse(storyJson) as StoryFull;
  } catch {}

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          <Text style={styles.linkText}>Go Home</Text>
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
      <LinearGradient colors={["#0A0520", "#0B1026", "#080D1E"]} style={StyleSheet.absoluteFill} />
      <StarField />
      <FloatingStar delay={0} x={15} y={20} />
      <FloatingStar delay={300} x={75} y={15} />
      <FloatingStar delay={600} x={25} y={50} />
      <FloatingStar delay={900} x={80} y={40} />
      <FloatingStar delay={1200} x={50} y={65} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 20, paddingBottom: bottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {badge && (
          <Animated.View entering={FadeIn.duration(1000)} style={styles.badgeArea}>
            <View style={styles.badgeCircle}>
              <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
            </View>
            <Text style={styles.badgeTitle}>{badge.title}</Text>
            <Text style={styles.badgeDescription}>{badge.description}</Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.textArea}>
          <Text style={styles.completionLabel}>
            {isMadLibs ? "THAT WAS HILARIOUS!" : isSleep ? "SWEET DREAMS" : "STORY COMPLETE"}
          </Text>
          <Text style={styles.completionTitle}>
            {storyData?.title || "Great Adventure!"}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(600)} style={styles.extrasArea}>
          {vocabWord && (
            <Pressable onPress={() => toggleSection("vocab")} style={styles.extraCard}>
              <View style={styles.extraCardHeader}>
                <View style={[styles.extraIconWrap, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
                  <Ionicons name="book-outline" size={18} color="#3B82F6" />
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
            <View style={styles.tomorrowCard}>
              <Ionicons name="telescope-outline" size={18} color="#CE93D8" />
              <Text style={styles.tomorrowText}>{tomorrowHook}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(800)} style={styles.actionsArea}>
          <Pressable
            onPress={handleSaveToJar}
            disabled={saved}
            style={({ pressed }) => [
              styles.saveButton,
              saved && styles.saveButtonDone,
              { transform: [{ scale: pressed && !saved ? 0.96 : 1 }] },
            ]}
            testID="save-to-jar-button"
          >
            <Ionicons
              name={saved ? "checkmark-circle" : "archive-outline"}
              size={20}
              color={saved ? "#10B981" : Colors.accent}
            />
            <Text style={[styles.saveButtonText, saved && { color: "#10B981" }]}>
              {saved ? "Saved to Memory Jar" : "Save to Memory Jar"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleNewStory}
            style={({ pressed }) => [
              styles.primaryButton,
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
            testID="new-story-button"
          >
            <LinearGradient
              colors={[Colors.accent, "#2563EB"]}
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
  badgeCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(245, 197, 66, 0.1)",
    borderWidth: 2, borderColor: "rgba(245, 197, 66, 0.3)",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  badgeEmoji: { fontSize: 44 },
  badgeTitle: {
    fontFamily: "Nunito_800ExtraBold", fontSize: 20, color: Colors.accent,
    textAlign: "center", marginBottom: 4,
  },
  badgeDescription: {
    fontFamily: "Nunito_400Regular", fontSize: 14, color: Colors.textSecondary,
    textAlign: "center",
  },
  textArea: { alignItems: "center", marginBottom: 24 },
  completionLabel: {
    fontFamily: "Nunito_700Bold", fontSize: 12, color: Colors.accent,
    letterSpacing: 3, marginBottom: 8,
  },
  completionTitle: {
    fontFamily: "Nunito_800ExtraBold", fontSize: 28, color: Colors.textPrimary,
    textAlign: "center", lineHeight: 36,
  },
  extrasArea: { gap: 12, marginBottom: 28 },
  extraCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },
  extraCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  extraIconWrap: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
  },
  extraCardHeaderText: { flex: 1 },
  extraCardLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 11, color: Colors.textMuted, letterSpacing: 1 },
  extraCardTitle: { fontFamily: "Nunito_700Bold", fontSize: 15, color: Colors.textPrimary },
  extraCardBody: {
    fontFamily: "Nunito_400Regular", fontSize: 15, color: Colors.textSecondary,
    lineHeight: 24, marginTop: 12, paddingLeft: 48,
  },
  tomorrowCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: "rgba(206, 147, 216, 0.06)",
    borderRadius: 16, borderWidth: 1, borderColor: "rgba(206, 147, 216, 0.15)",
    padding: 16,
  },
  tomorrowText: {
    fontFamily: "Nunito_500Medium", fontSize: 14, color: "#CE93D8",
    flex: 1, lineHeight: 22, fontStyle: "italic",
  },
  actionsArea: { gap: 12 },
  saveButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderRadius: 28, borderWidth: 1.5, borderColor: "rgba(59, 130, 246, 0.2)",
    paddingVertical: 16,
  },
  saveButtonDone: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  saveButtonText: {
    fontFamily: "Nunito_700Bold", fontSize: 16, color: Colors.accent,
  },
  primaryButton: {
    borderRadius: 28, overflow: "hidden", elevation: 6,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12,
  },
  primaryButtonGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 18, paddingHorizontal: 32,
  },
  primaryButtonText: { fontFamily: "Nunito_700Bold", fontSize: 18, color: "#FFF" },
  linkText: { fontFamily: "Nunito_700Bold", fontSize: 16, color: Colors.accent },
});
