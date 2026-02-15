import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { HEROES } from "@/constants/heroes";
import { StarField } from "@/components/StarField";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";
import { StoryFull } from "@/constants/types";

type StoryState = "generating" | "ready" | "error";


function PulsingOrb() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.pulsingOrb, animStyle]}>
      <View style={styles.orbInner} />
    </Animated.View>
  );
}

function ChoiceButton({ label, index, onPress }: { label: string; index: number; onPress: () => void }) {
  const colors: [string, string][] = [
    ["#3B82F6", "#2563EB"],
    ["#8B5CF6", "#7C3AED"],
    ["#F59E0B", "#D97706"],
  ];
  const pair = colors[index % colors.length];

  return (
    <Animated.View entering={FadeInUp.duration(400).delay(index * 120)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.choiceButton,
          { transform: [{ scale: pressed ? 0.96 : 1 }] },
        ]}
        testID={`choice-${index}`}
      >
        <LinearGradient
          colors={pair}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.choiceGradient}
        >
          <Text style={styles.choiceText}>{label}</Text>
          <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export default function StoryScreen() {
  const { heroId, duration, voice, mode, madlibWords, soundscape, sleepTimer } =
    useLocalSearchParams<{
      heroId: string;
      duration: string;
      voice: string;
      mode: string;
      madlibWords: string;
      soundscape: string;
      sleepTimer: string;
    }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const storyMode = mode || "classic";
  const [storyData, setStoryData] = useState<StoryFull | null>(null);
  const [storyState, setStoryState] = useState<StoryState>("generating");
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [sceneLoading, setSceneLoading] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hero = HEROES.find((h) => h.id === heroId);

  const startSleepTimer = useCallback(() => {
    if (!sleepTimer || sleepTimer === "none") return;
    const minutes = parseInt(sleepTimer, 10);
    if (isNaN(minutes)) return;
    let remaining = minutes * 60;
    setTimerRemaining(remaining);
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimerRemaining(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        Speech.stop();
        setIsSpeaking(false);
        setTimerRemaining(null);
      }
    }, 1000);
  }, [sleepTimer]);

  const generateStory = useCallback(async () => {
    if (!hero) return;
    setStoryState("generating");
    setStoryData(null);
    setCurrentPartIndex(0);
    setSceneImage(null);

    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/generate-story", baseUrl);

      const bodyData: any = {
        heroName: hero.name,
        heroTitle: hero.title,
        heroPower: hero.power,
        heroDescription: hero.description,
        duration: duration || "medium",
        mode: storyMode,
      };

      if (storyMode === "madlibs" && madlibWords) {
        try { bodyData.madlibWords = JSON.parse(madlibWords); } catch {}
      }

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) throw new Error("Failed to generate story");

      const data = await res.json();
      setStoryData(data as StoryFull);
      setStoryState("ready");
    } catch (error) {
      console.error("Story generation error:", error);
      setStoryState("error");
    }
  }, [hero, duration, storyMode, madlibWords]);

  const loadSceneImage = useCallback(async (partText: string) => {
    if (!hero) return;
    setSceneLoading(true);
    setSceneImage(null);
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/generate-scene", baseUrl);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroName: hero.name,
          sceneText: partText,
          heroDescription: hero.description,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSceneImage(data.image);
      }
    } catch (e) {
      console.log("Scene generation failed:", e);
    }
    setSceneLoading(false);
  }, [hero]);

  useEffect(() => {
    generateStory();
    return () => {
      Speech.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  useEffect(() => {
    if (storyState === "ready" && storyMode === "sleep" && sleepTimer && sleepTimer !== "none") {
      startSleepTimer();
    }
  }, [storyState]);

  useEffect(() => {
    if (storyState === "ready" && storyData && storyData.parts[currentPartIndex]) {
      loadSceneImage(storyData.parts[currentPartIndex].text);
    }
  }, [currentPartIndex, storyState]);

  useEffect(() => {
    if (storyState === "ready" && storyMode === "sleep" && storyData) {
      const currentPart = storyData.parts[currentPartIndex];
      if (currentPart && currentPartIndex < storyData.parts.length - 1) {
        const wordCount = currentPart.text.split(/\s+/).length;
        const readingTimeMs = Math.max(wordCount * 300, 8000);
        autoAdvanceRef.current = setTimeout(() => {
          setCurrentPartIndex((prev) => prev + 1);
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }, readingTimeMs);
        return () => {
          if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
        };
      }
    }
  }, [currentPartIndex, storyState, storyMode]);

  const currentPart = storyData?.parts[currentPartIndex];
  const isLastPart = storyData ? currentPartIndex >= storyData.parts.length - 1 : false;
  const hasChoices = currentPart?.choices && currentPart.choices.length > 0 && !isLastPart;

  const speakCurrentPart = useCallback(() => {
    if (!currentPart) return;
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    const voiceRate = storyMode === "sleep" ? 0.72 : 0.85;
    Speech.speak(currentPart.text, {
      rate: voiceRate,
      pitch: storyMode === "sleep" ? 0.9 : 1.0,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  }, [currentPart, isSpeaking, storyMode]);

  const handleChoiceSelect = (choiceIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Speech.stop();
    setIsSpeaking(false);
    setCurrentPartIndex((prev) => prev + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleStoryComplete = () => {
    if (!hero || !storyData) return;
    Speech.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    router.push({
      pathname: "/completion",
      params: {
        heroId: hero.id,
        mode: storyMode,
        storyJson: JSON.stringify(storyData),
      },
    });
  };

  const handleClose = () => {
    Speech.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    router.dismissAll();
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!hero) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Hero not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.errorLink}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isSleep = storyMode === "sleep";
  const gradientColors: [string, string, string] = isSleep
    ? ["#1A0533", "#0B0D1E", "#060810"]
    : [hero.gradient[0], Colors.primary, "#080D1E"];

  const paragraphs = currentPart
    ? currentPart.text.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0)
    : [];

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
      <StarField />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={handleClose} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
        </Pressable>

        <View style={styles.topBarCenter}>
          {storyState === "ready" && storyData && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.progressBadge}>
              <Text style={styles.progressText}>
                {currentPartIndex + 1} / {storyData.parts.length}
              </Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${((currentPartIndex + 1) / storyData.parts.length) * 100}%` },
                    isSleep && { backgroundColor: "#CE93D8" },
                  ]}
                />
              </View>
            </Animated.View>
          )}
        </View>

        {storyState === "ready" && (
          <Pressable onPress={speakCurrentPart} hitSlop={12} style={styles.iconBtn}>
            <Ionicons
              name={isSpeaking ? "volume-high" : "volume-medium-outline"}
              size={22}
              color={isSpeaking ? Colors.accent : "rgba(255,255,255,0.7)"}
            />
          </Pressable>
        )}
        {storyState !== "ready" && <View style={{ width: 40 }} />}
      </View>

      {timerRemaining !== null && timerRemaining > 0 && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.timerBar}>
          <Ionicons name="timer-outline" size={14} color="#CE93D8" />
          <Text style={styles.timerText}>{formatTimer(timerRemaining)}</Text>
        </Animated.View>
      )}

      {storyState === "generating" ? (
        <Animated.View entering={FadeIn.duration(600)} style={styles.loadingContainer}>
          <PulsingOrb />
          <View style={styles.loadingIconWrap}>
            <Ionicons name={hero.iconName as any} size={40} color={hero.color} />
          </View>
          <Text style={styles.loadingTitle}>
            {isSleep ? "Preparing your dreamscape..." : storyMode === "madlibs" ? "Mixing your silly words..." : "Crafting your adventure..."}
          </Text>
          <Text style={styles.loadingSubtitle}>
            {hero.name} is preparing tonight's story
          </Text>
          <ActivityIndicator size="small" color={isSleep ? "#CE93D8" : Colors.accent} style={{ marginTop: 20 }} />
        </Animated.View>
      ) : storyState === "error" ? (
        <Animated.View entering={FadeIn.duration(600)} style={styles.loadingContainer}>
          <Ionicons name="cloud-offline-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.loadingTitle}>Something went wrong</Text>
          <Text style={styles.loadingSubtitle}>Could not generate the story. Please try again.</Text>
          <Pressable onPress={generateStory} style={styles.retryButton}>
            <Ionicons name="refresh" size={18} color="#FFF" />
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.storyContent, { paddingBottom: bottomInset + 140 }]}
            showsVerticalScrollIndicator={false}
          >
            {storyData && (
              <Animated.Text entering={FadeInDown.duration(600)} style={styles.storyTitleText}>
                {storyData.title}
              </Animated.Text>
            )}

            {sceneLoading && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.sceneLoadingWrap}>
                <ActivityIndicator size="small" color={Colors.accent} />
                <Text style={styles.sceneLoadingText}>Painting the scene...</Text>
              </Animated.View>
            )}

            {sceneImage && !sceneLoading && (
              <Animated.View entering={FadeIn.duration(600)} style={styles.sceneImageWrap}>
                <Image source={{ uri: sceneImage }} style={styles.sceneImage} resizeMode="cover" />
              </Animated.View>
            )}

            {paragraphs.map((paragraph, index) => (
              <Animated.Text
                key={`${currentPartIndex}-${index}`}
                entering={FadeInDown.duration(400).delay(index * 80)}
                style={[styles.paragraphText, isSleep && styles.paragraphSleep]}
              >
                {paragraph}
              </Animated.Text>
            ))}

            {hasChoices && (
              <View style={styles.choicesSection}>
                <Text style={styles.choicesLabel}>What should {hero.name} do next?</Text>
                {currentPart!.choices!.map((choice, i) => (
                  <ChoiceButton
                    key={`${currentPartIndex}-choice-${i}`}
                    label={choice}
                    index={i}
                    onPress={() => handleChoiceSelect(i)}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          <LinearGradient
            colors={isSleep ? ["transparent", "rgba(10, 5, 20, 0.95)", "#060810"] : ["transparent", "rgba(11, 16, 38, 0.95)", Colors.primary]}
            style={[styles.bottomGradient, { paddingBottom: bottomInset + 20 }]}
            pointerEvents="box-none"
          >
            {storyState === "ready" && isLastPart && (
              <Animated.View entering={FadeInUp.duration(400)} style={styles.controlsRow}>
                <Pressable
                  onPress={handleStoryComplete}
                  style={({ pressed }) => [
                    styles.finishButton,
                    { transform: [{ scale: pressed ? 0.95 : 1 }] },
                  ]}
                  testID="finish-story-button"
                >
                  <LinearGradient
                    colors={isSleep ? ["#CE93D8", "#7B1FA2"] : [Colors.accent, "#2563EB"]}
                    style={styles.finishButtonGradient}
                  >
                    <Ionicons name="sparkles" size={20} color="#FFF" />
                    <Text style={styles.finishButtonText}>
                      {isSleep ? "Sweet Dreams" : "Complete Story"}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}
          </LinearGradient>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  centered: { justifyContent: "center", alignItems: "center" },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 8, zIndex: 10,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  topBarCenter: { flex: 1, alignItems: "center" },
  progressBadge: { alignItems: "center", gap: 6 },
  progressText: { fontFamily: "Nunito_600SemiBold", fontSize: 12, color: "rgba(255,255,255,0.6)" },
  progressBarBg: {
    width: 100, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)",
  },
  progressBarFill: {
    height: 4, borderRadius: 2, backgroundColor: Colors.accent,
  },
  timerBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 6,
  },
  timerText: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: "#CE93D8" },
  loadingContainer: {
    flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, gap: 12,
  },
  pulsingOrb: {
    position: "absolute", width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(245, 197, 66, 0.06)", alignItems: "center", justifyContent: "center",
  },
  orbInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(245, 197, 66, 0.08)" },
  loadingIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  loadingTitle: { fontFamily: "Nunito_700Bold", fontSize: 22, color: Colors.textPrimary, textAlign: "center" },
  loadingSubtitle: { fontFamily: "Nunito_400Regular", fontSize: 14, color: Colors.textSecondary, textAlign: "center" },
  storyContent: { paddingHorizontal: 24, paddingTop: 8 },
  storyTitleText: {
    fontFamily: "Nunito_800ExtraBold", fontSize: 26, color: Colors.textPrimary,
    textAlign: "center", marginBottom: 24, lineHeight: 34,
  },
  sceneLoadingWrap: {
    alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16,
    paddingVertical: 30, marginBottom: 20,
  },
  sceneLoadingText: { fontFamily: "Nunito_400Regular", fontSize: 12, color: Colors.textMuted },
  sceneImageWrap: {
    borderRadius: 16, overflow: "hidden", marginBottom: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  sceneImage: { width: "100%", height: 200, borderRadius: 16 },
  paragraphText: {
    fontFamily: "Nunito_400Regular", fontSize: 18, color: "rgba(255,255,255,0.88)",
    lineHeight: 32, marginBottom: 22, textAlign: "left",
  },
  paragraphSleep: { fontSize: 20, lineHeight: 36, color: "rgba(220, 210, 240, 0.85)" },
  choicesSection: { marginTop: 12, gap: 12 },
  choicesLabel: {
    fontFamily: "Nunito_700Bold", fontSize: 16, color: Colors.accent,
    textAlign: "center", marginBottom: 4,
  },
  choiceButton: { borderRadius: 16, overflow: "hidden" },
  choiceGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 16, paddingHorizontal: 20,
  },
  choiceText: {
    fontFamily: "Nunito_700Bold", fontSize: 15, color: "#FFF", flex: 1, marginRight: 8,
  },
  bottomGradient: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingTop: 40, paddingHorizontal: 20,
  },
  controlsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12 },
  finishButton: { flex: 1, borderRadius: 28, overflow: "hidden", elevation: 6, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  finishButtonGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 18,
  },
  finishButtonText: { fontFamily: "Nunito_700Bold", fontSize: 18, color: "#FFF" },
  retryButton: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, marginTop: 12,
  },
  retryText: { fontFamily: "Nunito_700Bold", fontSize: 16, color: "#FFF" },
  errorText: { fontFamily: "Nunito_600SemiBold", fontSize: 18, color: Colors.textMuted },
  errorLink: { fontFamily: "Nunito_700Bold", fontSize: 16, color: Colors.accent, marginTop: 16 },
});
