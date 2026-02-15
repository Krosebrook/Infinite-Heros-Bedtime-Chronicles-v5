import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import Animated, {
  FadeIn,
  FadeInDown,
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

type StoryState = "generating" | "ready" | "error";

const AMBIENT_SOUNDS: Record<string, any> = {
  rain: require("@/assets/sounds/rain.wav"),
  ocean: require("@/assets/sounds/ocean.wav"),
  crickets: require("@/assets/sounds/crickets.wav"),
  wind: require("@/assets/sounds/wind.wav"),
  fire: require("@/assets/sounds/fire.wav"),
};

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
  const [storyText, setStoryText] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyState, setStoryState] = useState<StoryState>("generating");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentParagraph, setCurrentParagraph] = useState(-1);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const storyRef = useRef("");
  const scrollRef = useRef<ScrollView>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hero = HEROES.find((h) => h.id === heroId);

  const startAmbientSound = useCallback(async () => {
    if (!soundscape || soundscape === "none") return;
    const soundFile = AMBIENT_SOUNDS[soundscape];
    if (!soundFile) return;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
      const { sound } = await Audio.Sound.createAsync(soundFile, {
        isLooping: true,
        volume: 0.3,
      });
      soundRef.current = sound;
      await sound.playAsync();
    } catch (e) {
      console.log("Could not play ambient sound:", e);
    }
  }, [soundscape]);

  const stopAmbientSound = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
  }, []);

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
        stopAmbientSound();
        setIsSpeaking(false);
        setTimerRemaining(null);
      }
    }, 1000);
  }, [sleepTimer, stopAmbientSound]);

  const generateStory = useCallback(async () => {
    if (!hero) return;
    setStoryState("generating");
    setStoryText("");
    setStoryTitle("");
    storyRef.current = "";

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
        try {
          bodyData.madlibWords = JSON.parse(madlibWords);
        } catch {}
      }

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.done) {
                setStoryState("ready");
              } else if (data.content) {
                storyRef.current += data.content;
                setStoryText(storyRef.current);
              } else if (data.error) {
                setStoryState("error");
              }
            } catch {}
          }
        }
      }

      if (storyRef.current) {
        setStoryState("ready");
      }

      try {
        const titleUrl = new URL("/api/generate-title", baseUrl);
        const titleRes = await fetch(titleUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            heroName: hero.name,
            storyText: storyRef.current,
            mode: storyMode,
          }),
        });
        const titleData = await titleRes.json();
        setStoryTitle(titleData.title);
      } catch {
        setStoryTitle(`${hero.name}'s Adventure`);
      }
    } catch (error) {
      console.error("Story generation error:", error);
      setStoryState("error");
    }
  }, [hero, duration, storyMode, madlibWords]);

  useEffect(() => {
    generateStory();

    if (storyMode === "sleep" && soundscape && soundscape !== "none") {
      startAmbientSound();
    }

    return () => {
      Speech.stop();
      stopAmbientSound();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (storyState === "ready" && storyMode === "sleep" && sleepTimer && sleepTimer !== "none") {
      startSleepTimer();
    }
  }, [storyState]);

  const paragraphs = storyText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const speakStory = useCallback(() => {
    if (paragraphs.length === 0) return;

    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      setCurrentParagraph(-1);
      return;
    }

    setIsSpeaking(true);
    const fullText = paragraphs.join(". . . ");
    const voiceRate = storyMode === "sleep" ? 0.72 : 0.85;

    setCurrentParagraph(0);

    Speech.speak(fullText, {
      rate: voiceRate,
      pitch: storyMode === "sleep" ? 0.9 : 1.0,
      onDone: () => {
        setIsSpeaking(false);
        setCurrentParagraph(-1);
        if (storyMode !== "sleep") {
          handleStoryComplete();
        }
      },
      onStopped: () => {
        setIsSpeaking(false);
        setCurrentParagraph(-1);
      },
    });
  }, [paragraphs, isSpeaking, storyMode]);

  const handleStoryComplete = () => {
    if (!hero) return;
    stopAmbientSound();
    if (timerRef.current) clearInterval(timerRef.current);
    router.push({
      pathname: "/completion",
      params: {
        heroId: hero.id,
        storyTitle: storyTitle || `${hero.name}'s Adventure`,
        mode: storyMode,
      },
    });
  };

  const handleClose = () => {
    Speech.stop();
    stopAmbientSound();
    if (timerRef.current) clearInterval(timerRef.current);
    router.dismissAll();
  };

  const handleRegenerate = () => {
    Speech.stop();
    setIsSpeaking(false);
    setCurrentParagraph(-1);
    generateStory();
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

  const modeLabel =
    storyMode === "madlibs" ? "Mad Libs" : storyMode === "sleep" ? "Sleep Mode" : "";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={handleClose} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
        </Pressable>

        <View style={styles.topBarCenter}>
          {storyState === "ready" && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.heroBadge}>
              <Ionicons name={hero.iconName as any} size={14} color={hero.color} />
              <Text style={styles.heroBadgeText}>{hero.name}</Text>
              {modeLabel ? (
                <View style={[styles.modePill, isSleep && { backgroundColor: "rgba(206,147,216,0.2)" }]}>
                  <Text style={[styles.modePillText, isSleep && { color: "#CE93D8" }]}>
                    {modeLabel}
                  </Text>
                </View>
              ) : null}
            </Animated.View>
          )}
        </View>

        {storyState === "ready" && !isSleep && (
          <Pressable onPress={handleRegenerate} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="refresh" size={22} color="rgba(255,255,255,0.7)" />
          </Pressable>
        )}
        {(storyState !== "ready" || isSleep) && <View style={{ width: 40 }} />}
      </View>

      {timerRemaining !== null && timerRemaining > 0 && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.timerBar}>
          <Ionicons name="timer-outline" size={14} color="#CE93D8" />
          <Text style={styles.timerText}>{formatTimer(timerRemaining)}</Text>
        </Animated.View>
      )}

      {storyState === "generating" && paragraphs.length === 0 ? (
        <Animated.View entering={FadeIn.duration(600)} style={styles.loadingContainer}>
          <PulsingOrb />
          <View style={styles.loadingIconWrap}>
            <Ionicons name={hero.iconName as any} size={40} color={hero.color} />
          </View>
          <Text style={styles.loadingTitle}>
            {isSleep ? "Preparing your dreamscape..." : storyMode === "madlibs" ? "Mixing your silly words..." : "Crafting your story..."}
          </Text>
          <Text style={styles.loadingSubtitle}>
            {hero.name} is preparing tonight's adventure
          </Text>
          <ActivityIndicator size="small" color={isSleep ? "#CE93D8" : Colors.accent} style={{ marginTop: 20 }} />
        </Animated.View>
      ) : storyState === "error" && paragraphs.length === 0 ? (
        <Animated.View entering={FadeIn.duration(600)} style={styles.loadingContainer}>
          <Ionicons name="cloud-offline-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.loadingTitle}>Something went wrong</Text>
          <Text style={styles.loadingSubtitle}>
            Could not generate the story. Please try again.
          </Text>
          <Pressable onPress={handleRegenerate} style={styles.retryButton}>
            <Ionicons name="refresh" size={18} color={Colors.primary} />
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
        </Animated.View>
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              styles.storyContent,
              { paddingBottom: bottomInset + 120 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {storyTitle ? (
              <Animated.Text
                entering={FadeInDown.duration(600)}
                style={styles.storyTitleText}
              >
                {storyTitle}
              </Animated.Text>
            ) : null}

            {paragraphs.map((paragraph, index) => (
              <Animated.Text
                key={index}
                entering={FadeInDown.duration(400).delay(index * 80)}
                style={[
                  styles.paragraphText,
                  isSleep && styles.paragraphSleep,
                  currentParagraph === index && styles.paragraphActive,
                ]}
              >
                {paragraph}
              </Animated.Text>
            ))}

            {storyState === "generating" && (
              <View style={styles.streamingIndicator}>
                <ActivityIndicator size="small" color={isSleep ? "#CE93D8" : Colors.accent} />
              </View>
            )}
          </ScrollView>

          <LinearGradient
            colors={isSleep ? ["transparent", "rgba(10, 5, 20, 0.95)", "#060810"] : ["transparent", "rgba(11, 16, 38, 0.95)", Colors.primary]}
            style={[styles.bottomGradient, { paddingBottom: bottomInset + 20 }]}
            pointerEvents="box-none"
          >
            {storyState === "ready" && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.controlsRow}>
                <Pressable
                  onPress={speakStory}
                  style={({ pressed }) => [
                    styles.playButton,
                    { transform: [{ scale: pressed ? 0.95 : 1 }] },
                  ]}
                  testID="play-button"
                >
                  <LinearGradient
                    colors={
                      isSpeaking
                        ? ["#FF6B6B", "#E55555"]
                        : isSleep
                          ? ["#CE93D8", "#7B1FA2"]
                          : [Colors.accent, "#E5A825"]
                    }
                    style={styles.playButtonGradient}
                  >
                    <Ionicons
                      name={isSpeaking ? "stop" : "play"}
                      size={24}
                      color="#FFF"
                    />
                    <Text style={[styles.playButtonText, { color: isSpeaking || isSleep ? "#FFF" : Colors.primary }]}>
                      {isSpeaking ? "Stop" : isSleep ? "Begin Narration" : "Read Aloud"}
                    </Text>
                  </LinearGradient>
                </Pressable>

                {!isSleep && (
                  <Pressable
                    onPress={handleStoryComplete}
                    style={({ pressed }) => [
                      styles.doneButton,
                      { transform: [{ scale: pressed ? 0.95 : 1 }] },
                    ]}
                    testID="done-button"
                  >
                    <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
                  </Pressable>
                )}
              </Animated.View>
            )}
          </LinearGradient>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
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
  topBarCenter: {
    flex: 1,
    alignItems: "center",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  heroBadgeText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  modePill: {
    backgroundColor: "rgba(255, 138, 101, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  modePillText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 10,
    color: "#FF8A65",
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
    color: "#CE93D8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  pulsingOrb: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(245, 197, 66, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  orbInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(245, 197, 66, 0.08)",
  },
  loadingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  loadingTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  storyContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  storyTitleText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 34,
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
    lineHeight: 36,
    color: "rgba(220, 210, 240, 0.85)",
  },
  paragraphActive: {
    color: Colors.accent,
  },
  streamingIndicator: {
    alignItems: "center",
    paddingVertical: 12,
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
  playButton: {
    flex: 1,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 6,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  playButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  playButtonText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    color: Colors.primary,
  },
  doneButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(245, 197, 66, 0.12)",
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 12,
  },
  retryText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: Colors.primary,
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
