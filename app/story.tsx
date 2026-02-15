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
import { Audio } from "expo-av";
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
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";
import { StoryFull } from "@/constants/types";

type StoryState = "generating" | "ready" | "error";

const LOADING_MESSAGES = {
  classic: [
    "Charting the stars...",
    "Summoning your hero...",
    "Weaving the tale...",
    "Adding a sprinkle of magic...",
    "Almost ready for adventure...",
  ],
  madlibs: [
    "Mixing your silly words...",
    "Adding extra giggles...",
    "Stirring the funny pot...",
    "Sprinkling absurdity...",
    "Cooking up laughs...",
  ],
  sleep: [
    "Dimming the stars...",
    "Fluffing the clouds...",
    "Warming the moonbeams...",
    "Sprinkling sleepy dust...",
    "Preparing your dreamscape...",
  ],
};

const MODE_THEME = {
  classic: {
    accent: "#3B82F6",
    accentLight: "#60A5FA",
    gradient: ["#0B1A40", "#0E1528", "#080D1E"] as [string, string, string],
    orbColor: "rgba(59, 130, 246, 0.08)",
    choiceColors: [
      ["#3B82F6", "#2563EB"] as [string, string],
      ["#8B5CF6", "#7C3AED"] as [string, string],
      ["#F59E0B", "#D97706"] as [string, string],
    ],
  },
  madlibs: {
    accent: "#F97316",
    accentLight: "#FB923C",
    gradient: ["#1A0A00", "#0E1528", "#080D1E"] as [string, string, string],
    orbColor: "rgba(249, 115, 22, 0.08)",
    choiceColors: [
      ["#F97316", "#EA580C"] as [string, string],
      ["#EF4444", "#DC2626"] as [string, string],
      ["#F59E0B", "#D97706"] as [string, string],
    ],
  },
  sleep: {
    accent: "#A855F7",
    accentLight: "#C084FC",
    gradient: ["#1A0533", "#0B0D1E", "#060810"] as [string, string, string],
    orbColor: "rgba(168, 85, 247, 0.08)",
    choiceColors: [
      ["#A855F7", "#7C3AED"] as [string, string],
      ["#8B5CF6", "#6D28D9"] as [string, string],
      ["#C084FC", "#9333EA"] as [string, string],
    ],
  },
};

function LoadingOrb({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 1500, easing: Easing.inOut(Easing.ease) })
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
    <Animated.View
      style={[
        {
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

function LoadingDot({ delay, color }: { delay: number; color: string }) {
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

function ChoiceButton({
  label,
  index,
  onPress,
  colors,
}: {
  label: string;
  index: number;
  onPress: () => void;
  colors: [string, string][];
}) {
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
          <View style={styles.choiceIndex}>
            <Text style={styles.choiceIndexText}>{String.fromCharCode(65 + index)}</Text>
          </View>
          <Text style={styles.choiceText}>{label}</Text>
          <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.6)" />
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

  const storyMode = (mode || "classic") as keyof typeof MODE_THEME;
  const theme = MODE_THEME[storyMode] || MODE_THEME.classic;

  const [storyData, setStoryData] = useState<StoryFull | null>(null);
  const [storyState, setStoryState] = useState<StoryState>("generating");
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [sceneLoading, setSceneLoading] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [musicMuted, setMusicMuted] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingMsgRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const bgMusicRef = useRef<Audio.Sound | null>(null);

  const MUSIC_VOLUME = storyMode === "sleep" ? 0.12 : 0.15;

  const stopBgMusic = useCallback(async () => {
    if (bgMusicRef.current) {
      try {
        await bgMusicRef.current.stopAsync();
        await bgMusicRef.current.unloadAsync();
      } catch {}
      bgMusicRef.current = null;
    }
    setMusicPlaying(false);
  }, []);

  const startBgMusic = useCallback(async () => {
    setMusicLoading(true);
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/generate-music", baseUrl);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: storyMode }),
      });
      if (!res.ok) throw new Error("Music generation failed");
      const data = await res.json();
      if (!data.audioUrl) throw new Error("No audio URL");

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: data.audioUrl },
        { shouldPlay: true, volume: MUSIC_VOLUME, isLooping: true }
      );
      bgMusicRef.current = sound;
      setMusicPlaying(true);
      setMusicLoading(false);
    } catch (err) {
      console.log("Background music failed:", err);
      setMusicLoading(false);
    }
  }, [storyMode, MUSIC_VOLUME]);

  const toggleBgMusic = useCallback(async () => {
    if (!bgMusicRef.current) return;
    try {
      if (musicMuted) {
        await bgMusicRef.current.setVolumeAsync(MUSIC_VOLUME);
        setMusicMuted(false);
      } else {
        await bgMusicRef.current.setVolumeAsync(0);
        setMusicMuted(true);
      }
    } catch {}
  }, [musicMuted, MUSIC_VOLUME]);

  const stopAudio = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const hero = HEROES.find((h) => h.id === heroId);

  useEffect(() => {
    const messages = LOADING_MESSAGES[storyMode] || LOADING_MESSAGES.classic;
    loadingMsgRef.current = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => {
      if (loadingMsgRef.current) clearInterval(loadingMsgRef.current);
    };
  }, [storyMode]);

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
        stopAudio();
        stopBgMusic();
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
    startBgMusic();
    return () => {
      stopAudio();
      stopBgMusic();
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

  const speakCurrentPart = useCallback(async () => {
    if (!currentPart) return;
    if (isSpeaking || audioLoading) {
      await stopAudio();
      return;
    }

    setAudioLoading(true);
    try {
      const baseUrl = getApiUrl();
      const ttsUrl = new URL("/api/tts", baseUrl);

      const response = await fetch(ttsUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: currentPart.text,
          voice: voice || "kore",
        }),
      });

      if (!response.ok) throw new Error("TTS request failed");

      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const dataUri = await base64Promise;

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: dataUri },
        { shouldPlay: true, rate: storyMode === "sleep" ? 0.9 : 1.0 }
      );
      soundRef.current = sound;
      setIsSpeaking(true);
      setAudioLoading(false);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
          setIsSpeaking(false);
        }
      });
    } catch (err) {
      console.log("TTS error, falling back:", err);
      setAudioLoading(false);
      setIsSpeaking(false);
    }
  }, [currentPart, isSpeaking, audioLoading, storyMode, voice, stopAudio]);

  const handleChoiceSelect = (choiceIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    stopAudio();
    setCurrentPartIndex((prev) => prev + 1);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleStoryComplete = () => {
    if (!hero || !storyData) return;
    stopAudio();
    stopBgMusic();
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
    stopAudio();
    stopBgMusic();
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    router.dismissAll();
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
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
  const messages = LOADING_MESSAGES[storyMode] || LOADING_MESSAGES.classic;

  const paragraphs = currentPart
    ? currentPart.text.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0)
    : [];

  const progressPct = storyData
    ? ((currentPartIndex + 1) / storyData.parts.length) * 100
    : 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
      <StarField />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={handleClose} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
        </Pressable>

        {(musicPlaying || musicLoading) && (
          <Pressable onPress={toggleBgMusic} hitSlop={12} style={styles.iconBtn} disabled={musicLoading}>
            {musicLoading ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
            ) : (
              <Ionicons
                name={musicMuted ? "musical-note-outline" : "musical-notes"}
                size={20}
                color={musicMuted ? "rgba(255,255,255,0.4)" : theme.accent}
              />
            )}
          </Pressable>
        )}

        <View style={styles.topBarCenter}>
          {storyState === "ready" && storyData && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.progressArea}>
              <Text style={[styles.progressLabel, { color: theme.accent }]}>
                Part {currentPartIndex + 1} of {storyData.parts.length}
              </Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPct}%`, backgroundColor: theme.accent },
                  ]}
                />
              </View>
            </Animated.View>
          )}
        </View>

        {storyState === "ready" && (
          <Pressable onPress={speakCurrentPart} hitSlop={12} style={styles.iconBtn} disabled={audioLoading}>
            {audioLoading ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <Ionicons
                name={isSpeaking ? "volume-high" : "volume-medium-outline"}
                size={22}
                color={isSpeaking ? theme.accent : "rgba(255,255,255,0.7)"}
              />
            )}
          </Pressable>
        )}
        {storyState !== "ready" && <View style={{ width: 40 }} />}
      </View>

      {timerRemaining !== null && timerRemaining > 0 && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.timerBar}>
          <Ionicons name="timer-outline" size={14} color={theme.accent} />
          <Text style={[styles.timerText, { color: theme.accent }]}>{formatTimer(timerRemaining)}</Text>
        </Animated.View>
      )}

      {storyState === "generating" ? (
        <Animated.View entering={FadeIn.duration(600)} style={styles.loadingContainer}>
          <LoadingOrb color={theme.orbColor} />
          <View style={[styles.loadingIconWrap, { borderColor: `${theme.accent}30` }]}>
            <Ionicons name={hero.iconName as any} size={44} color={hero.color} />
          </View>

          <Text style={styles.loadingTitle}>
            {messages[loadingMsg]}
          </Text>
          <Text style={styles.loadingSubtitle}>
            {hero.name} is preparing tonight's story
          </Text>

          <View style={styles.loadingDotsRow}>
            <LoadingDot delay={0} color={theme.accent} />
            <LoadingDot delay={200} color={theme.accent} />
            <LoadingDot delay={400} color={theme.accent} />
          </View>
        </Animated.View>
      ) : storyState === "error" ? (
        <Animated.View entering={FadeIn.duration(600)} style={styles.loadingContainer}>
          <Ionicons name="cloud-offline-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.loadingTitle}>Something went wrong</Text>
          <Text style={styles.loadingSubtitle}>Could not generate the story. Please try again.</Text>
          <Pressable onPress={generateStory} style={[styles.retryButton, { backgroundColor: theme.accent }]}>
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
              <Animated.View entering={FadeInDown.duration(600)} style={styles.titleWrap}>
                <Text style={styles.storyTitleText}>{storyData.title}</Text>
                <View style={[styles.titleUnderline, { backgroundColor: theme.accent }]} />
              </Animated.View>
            )}

            {sceneLoading && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.sceneLoadingWrap}>
                <ActivityIndicator size="small" color={theme.accent} />
                <Text style={styles.sceneLoadingText}>Painting the scene...</Text>
              </Animated.View>
            )}

            {sceneImage && !sceneLoading && (
              <Animated.View entering={FadeIn.duration(600)} style={styles.sceneImageWrap}>
                <Image source={{ uri: sceneImage }} style={styles.sceneImage} resizeMode="cover" />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.4)"]}
                  style={styles.sceneImageOverlay}
                />
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
                <Text style={[styles.choicesLabel, { color: theme.accent }]}>
                  What should {hero.name} do next?
                </Text>
                {currentPart!.choices!.map((choice, i) => (
                  <ChoiceButton
                    key={`${currentPartIndex}-choice-${i}`}
                    label={choice}
                    index={i}
                    onPress={() => handleChoiceSelect(i)}
                    colors={theme.choiceColors}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          <LinearGradient
            colors={
              isSleep
                ? ["transparent", "rgba(10, 5, 20, 0.95)", "#060810"]
                : ["transparent", "rgba(11, 16, 38, 0.95)", Colors.primary]
            }
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
                    colors={[theme.accent, theme.choiceColors[0][1]]}
                    style={styles.finishButtonGradient}
                  >
                    <Ionicons name="sparkles" size={20} color="#FFF" />
                    <Text style={styles.finishButtonText}>
                      {isSleep ? "Sweet Dreams" : storyMode === "madlibs" ? "That Was Hilarious!" : "Complete Story"}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  topBarCenter: { flex: 1, alignItems: "center" },
  progressArea: { alignItems: "center", gap: 6 },
  progressLabel: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  progressBarBg: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  timerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  timerText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  loadingIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 2,
  },
  loadingTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  loadingDotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  storyContent: { paddingHorizontal: 24, paddingTop: 8 },
  titleWrap: {
    alignItems: "center",
    marginBottom: 24,
  },
  storyTitleText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 10,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    borderRadius: 2,
  },
  sceneLoadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    paddingVertical: 30,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  sceneLoadingText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  sceneImageWrap: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sceneImage: { width: "100%", height: 220, borderRadius: 20 },
  sceneImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  paragraphText: {
    fontFamily: "Nunito_400Regular",
    fontSize: 18,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 32,
    marginBottom: 22,
    textAlign: "left",
  },
  paragraphSleep: {
    fontSize: 20,
    lineHeight: 38,
    color: "rgba(220, 210, 240, 0.85)",
  },
  choicesSection: { marginTop: 12, gap: 12 },
  choicesLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 4,
  },
  choiceButton: { borderRadius: 16, overflow: "hidden" },
  choiceGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  choiceIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  choiceIndexText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: "#FFF",
  },
  choiceText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: "#FFF",
    flex: 1,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  finishButton: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  finishButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  finishButtonText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    color: "#FFF",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 12,
  },
  retryText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: "#FFF",
  },
  errorText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 18,
    color: Colors.textMuted,
  },
  errorLink: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: Colors.accent,
    marginTop: 16,
  },
});
