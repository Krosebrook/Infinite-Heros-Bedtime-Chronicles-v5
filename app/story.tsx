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
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Audio, Video, ResizeMode, AVPlaybackStatus } from "expo-av";
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
import { LoadingOrb } from "@/components/PulsingOrb";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";
import { StoryFull } from "@/constants/types";
import { getParentControls } from "@/lib/storage";
import { MS_PER_WORD, MIN_READING_TIME_MS, LOADING_MESSAGE_INTERVAL_MS, VIDEO_POLL_INTERVAL_MS } from "@/constants/timing";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
    accent: "#6366f1",
    accentLight: "#818cf8",
    gradient: ["#05051e", "#0a0a2e", "#05051e"] as [string, string, string],
    orbColor: "rgba(99, 102, 241, 0.08)",
    choiceColors: [
      ["#6366f1", "#4f46e5"] as [string, string],
      ["#8B5CF6", "#7C3AED"] as [string, string],
      ["#F59E0B", "#D97706"] as [string, string],
    ],
  },
  madlibs: {
    accent: "#F97316",
    accentLight: "#FB923C",
    gradient: ["#05051e", "#1A0A00", "#05051e"] as [string, string, string],
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
    gradient: ["#05051e", "#0D0520", "#05051e"] as [string, string, string],
    orbColor: "rgba(168, 85, 247, 0.08)",
    choiceColors: [
      ["#A855F7", "#7C3AED"] as [string, string],
      ["#8B5CF6", "#6D28D9"] as [string, string],
      ["#C084FC", "#9333EA"] as [string, string],
    ],
  },
};

function FloatingParticle({ delay, accent }: { delay: number; accent: string }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const screenWidth = Dimensions.get("window").width;
  const startX = Math.random() * screenWidth;
  const size = 2 + Math.random() * 3;

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-200, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX,
          bottom: 100,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: accent,
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

function SceneVideoPlayer({
  jobId,
  accent,
}: {
  jobId: string;
  accent: string;
}) {
  const [status, setStatus] = useState<"queued" | "in_progress" | "completed" | "failed">("queued");
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    const baseUrl = getApiUrl();

    pollRef.current = setInterval(async () => {
      try {
        const res = await globalThis.fetch(
          new URL(`/api/video-status/${jobId}`, baseUrl).toString()
        );
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.status);
        setProgress(data.progress || 0);

        if (data.status === "completed" && data.videoUrl) {
          setVideoUrl(new URL(data.videoUrl, baseUrl).toString());
          if (pollRef.current) clearInterval(pollRef.current);
        }
        if (data.status === "failed") {
          setError(data.error || "Video generation failed");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch (e) {
        console.error("Video polling error:", e);
        setError("Failed to check video status");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, VIDEO_POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId]);

  if (error || status === "failed") {
    return null;
  }

  if (!videoUrl) {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.videoLoadingWrap}>
        <View style={styles.videoLoadingRow}>
          <ActivityIndicator size="small" color={accent} />
          <Text style={styles.videoLoadingText}>
            {status === "queued" ? "Preparing video..." : `Creating scene video... ${progress}%`}
          </Text>
        </View>
        <View style={styles.videoProgressBg}>
          <View style={[styles.videoProgressFill, { width: `${Math.max(progress, 5)}%`, backgroundColor: accent }]} />
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.videoPlayerWrap}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.videoPlayer}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted={false}
        volume={0.5}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)"]}
        style={styles.sceneImageOverlay}
      />
      <View style={styles.videoTag}>
        <Ionicons name="videocam" size={10} color="rgba(255,255,255,0.7)" />
        <Text style={styles.videoTagText}>AI Scene</Text>
      </View>
    </Animated.View>
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
  const { heroId, duration, voice, mode, madlibWords, soundscape, sleepTimer, speed: initialSpeed, replayJson } =
    useLocalSearchParams<{
      heroId: string;
      duration: string;
      voice: string;
      mode: string;
      madlibWords: string;
      soundscape: string;
      sleepTimer: string;
      speed: string;
      replayJson: string;
    }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const storyMode = (mode || "classic") as keyof typeof MODE_THEME;
  const theme = MODE_THEME[storyMode] || MODE_THEME.classic;

  const SPEED_RATES: Record<string, number> = { gentle: 0.8, medium: 0.9, normal: 1.0 };
  const SPEED_LABELS: Record<string, string> = { gentle: "Gentle", medium: "Medium", normal: "Normal" };
  const SPEED_ICONS: Record<string, "moon-outline" | "cloudy-night-outline" | "sunny-outline"> = { gentle: "moon-outline", medium: "cloudy-night-outline", normal: "sunny-outline" };
  const defaultSpeed = initialSpeed || (storyMode === "sleep" ? "gentle" : "medium");

  const [storyData, setStoryData] = useState<StoryFull | null>(null);
  const [storyState, setStoryState] = useState<StoryState>("generating");
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(defaultSpeed);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [sceneLoading, setSceneLoading] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [musicMuted, setMusicMuted] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoJobId, setVideoJobId] = useState<string | null>(null);
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
      const musicUrl = new URL(`/api/music/${storyMode}`, baseUrl).toString();

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: musicUrl },
        { shouldPlay: true, volume: MUSIC_VOLUME, isLooping: true }
      );
      bgMusicRef.current = sound;
      setMusicPlaying(true);
      setMusicLoading(false);
    } catch (err) {
      if (__DEV__) console.log("Background music failed:", err);
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
    }, LOADING_MESSAGE_INTERVAL_MS);
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

      const bodyData: Record<string, unknown> = {
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
    setSceneError(false);
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
      } else {
        setSceneError(true);
      }
    } catch (e) {
      console.error("Scene generation failed:", e);
      setSceneError(true);
    }
    setSceneLoading(false);
  }, [hero]);

  useEffect(() => {
    getParentControls().then((pc) => setVideoEnabled(pc.videoEnabled)).catch((e) => console.error("Failed to load parent controls:", e));

    if (replayJson) {
      try {
        const replayed = JSON.parse(replayJson) as StoryFull;
        setStoryData(replayed);
        setStoryState("ready");
        setCurrentPartIndex(0);
      } catch {
        generateStory();
      }
    } else {
      generateStory();
    }
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

  const triggerVideoGeneration = useCallback(async (partText: string) => {
    if (!hero || !videoEnabled) return;
    setVideoJobId(null);
    try {
      const baseUrl = getApiUrl();
      const res = await globalThis.fetch(
        new URL("/api/generate-video", baseUrl).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sceneText: partText,
            heroName: hero.name,
            heroDescription: hero.description,
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.jobId) setVideoJobId(data.jobId);
      }
    } catch (e) {
      if (__DEV__) console.log("Video generation request failed:", e);
    }
  }, [hero, videoEnabled]);

  useEffect(() => {
    if (storyState === "ready" && storyData && storyData.parts[currentPartIndex]) {
      const partText = storyData.parts[currentPartIndex].text;
      loadSceneImage(partText);
      if (videoEnabled) {
        triggerVideoGeneration(partText);
      }
    }
  }, [currentPartIndex, storyState]);

  useEffect(() => {
    if (storyState === "ready" && storyMode === "sleep" && storyData) {
      const currentPart = storyData.parts[currentPartIndex];
      if (currentPart && currentPartIndex < storyData.parts.length - 1) {
        const wordCount = currentPart.text.split(/\s+/).length;
        const readingTimeMs = Math.max(wordCount * MS_PER_WORD, MIN_READING_TIME_MS);
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
          voice: voice || "moonbeam",
          mode: storyMode,
        }),
      });

      if (!response.ok) throw new Error("TTS request failed");

      const data = await response.json();
      if (!data.audioUrl) throw new Error("No audio URL returned");

      const audioFileUrl = new URL(data.audioUrl, baseUrl).toString();

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const rate = SPEED_RATES[playbackSpeed] || 0.9;
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioFileUrl },
        { shouldPlay: false, rate, shouldCorrectPitch: true }
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
          setIsSpeaking(false);
        }
      });

      await sound.playAsync();
      setIsSpeaking(true);
      setAudioLoading(false);
    } catch (err) {
      if (__DEV__) console.log("TTS error:", err);
      setAudioLoading(false);
      setIsSpeaking(false);
    }
  }, [currentPart, isSpeaking, audioLoading, storyMode, voice, stopAudio, playbackSpeed]);

  const cycleSpeed = useCallback(async () => {
    const keys = ["gentle", "medium", "normal"];
    const idx = keys.indexOf(playbackSpeed);
    const next = keys[(idx + 1) % keys.length];
    setPlaybackSpeed(next);
    Haptics.selectionAsync();
    if (soundRef.current) {
      try {
        await soundRef.current.setRateAsync(SPEED_RATES[next], true);
      } catch {}
    }
  }, [playbackSpeed]);

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

  const handlePrevPart = () => {
    if (currentPartIndex > 0) {
      Haptics.selectionAsync();
      stopAudio();
      setCurrentPartIndex((prev) => prev - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleNextPart = () => {
    if (storyData && currentPartIndex < storyData.parts.length - 1) {
      Haptics.selectionAsync();
      stopAudio();
      setCurrentPartIndex((prev) => prev + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
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

      {[0, 1, 2, 3, 4, 5].map((i) => (
        <FloatingParticle key={i} delay={i * 800} accent={theme.accent} />
      ))}

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={handleClose} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.8)" />
        </Pressable>

        <View style={styles.topBarCenter}>
          <Text style={[styles.brandingText, { color: theme.accent }]}>INFINITY HEROES</Text>
          <Text style={styles.brandingSubtext}>Bedtime Chronicles</Text>
        </View>

        {storyState === "ready" && storyData && (
          <View style={[styles.chapterBadge, { backgroundColor: `${theme.accent}33`, borderColor: `${theme.accent}4D` }]}>
            <Ionicons name="book" size={12} color={theme.accent} />
            <Text style={[styles.chapterBadgeText, { color: theme.accent }]}>
              Chapter {currentPartIndex + 1}
            </Text>
          </View>
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
            <Ionicons name={hero.iconName} size={44} color={hero.color} />
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
            contentContainerStyle={[styles.storyContent, { paddingBottom: bottomInset + 160 }]}
            showsVerticalScrollIndicator={false}
          >
            {storyData && (
              <Animated.View entering={FadeInDown.duration(600)} style={styles.titleWrap}>
                <Text style={[styles.storyTitleText, { textShadowColor: `${theme.accent}40` }]}>
                  {storyData.title}
                </Text>
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
                  colors={["transparent", "rgba(0,0,0,0.5)"]}
                  style={styles.sceneImageOverlay}
                />
                <View style={styles.sceneProgressOverlay}>
                  <View style={styles.sceneProgressRow}>
                    <View style={styles.sceneProgressBg}>
                      <View style={[styles.sceneProgressFill, { width: `${progressPct}%`, backgroundColor: theme.accent }]} />
                    </View>
                    <Text style={styles.sceneProgressLabel}>{Math.round(progressPct)}% READ</Text>
                  </View>
                </View>
              </Animated.View>
            )}

            {sceneError && !sceneLoading && !sceneImage && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.sceneErrorWrap}>
                <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.2)" />
                <Text style={styles.sceneErrorText}>Scene unavailable</Text>
                <Pressable
                  onPress={() => {
                    if (currentPart) loadSceneImage(currentPart.text);
                  }}
                  style={[styles.sceneRetryBtn, { borderColor: `${theme.accent}40` }]}
                >
                  <Ionicons name="refresh" size={14} color={theme.accent} />
                  <Text style={[styles.sceneRetryText, { color: theme.accent }]}>Retry</Text>
                </Pressable>
              </Animated.View>
            )}

            {videoEnabled && videoJobId && (
              <ErrorBoundary FallbackComponent={({ resetError }) => (
                <View style={styles.sceneErrorWrap}>
                  <Ionicons name="videocam-off-outline" size={28} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.sceneErrorText}>Video unavailable</Text>
                  <Pressable onPress={resetError} style={[styles.sceneRetryBtn, { borderColor: `${theme.accent}40` }]}>
                    <Ionicons name="refresh" size={14} color={theme.accent} />
                    <Text style={[styles.sceneRetryText, { color: theme.accent }]}>Retry</Text>
                  </Pressable>
                </View>
              )}>
                <SceneVideoPlayer jobId={videoJobId} accent={theme.accent} />
              </ErrorBoundary>
            )}

            <View style={styles.parchmentCard}>
              {paragraphs.map((paragraph, index) => (
                <Animated.View
                  key={`${currentPartIndex}-${index}`}
                  entering={FadeInDown.duration(400).delay(index * 80)}
                >
                  {index === 0 ? (
                    <Text style={[styles.paragraphText, isSleep && styles.paragraphSleep]}>
                      <Text style={[styles.dropCap, { color: theme.accent }]}>
                        {paragraph.charAt(0)}
                      </Text>
                      {paragraph.slice(1)}
                    </Text>
                  ) : (
                    <Text style={[styles.paragraphText, isSleep && styles.paragraphSleep]}>
                      {paragraph}
                    </Text>
                  )}
                </Animated.View>
              ))}
            </View>

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

          {storyState === "ready" && storyData && (
            <Animated.View
              entering={FadeInUp.duration(400)}
              style={[styles.floatingControlsWrap, { bottom: bottomInset + 24 }]}
            >
              {isLastPart ? (
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
              ) : (
                <View style={styles.floatingPill}>
                  <Pressable onPress={cycleSpeed} hitSlop={8} style={styles.pillSpeedBtn} testID="speed-cycle-btn">
                    <Text style={[styles.pillSpeedText, { color: theme.accent }]}>
                      {SPEED_LABELS[playbackSpeed]}
                    </Text>
                    <Ionicons name={SPEED_ICONS[playbackSpeed]} size={16} color={theme.accent} />
                  </Pressable>

                  <View style={[styles.pillDivider, { backgroundColor: `${theme.accent}1A` }]} />

                  <View style={styles.pillCenterControls}>
                    <Pressable onPress={handlePrevPart} hitSlop={8} style={styles.pillNavBtn} disabled={currentPartIndex === 0}>
                      <Ionicons name="play-back" size={20} color={currentPartIndex === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)"} />
                    </Pressable>

                    <Pressable
                      onPress={speakCurrentPart}
                      hitSlop={8}
                      style={[styles.pillPlayBtn, { backgroundColor: theme.accent }]}
                      disabled={audioLoading}
                    >
                      {audioLoading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Ionicons
                          name={isSpeaking ? "pause" : "play"}
                          size={28}
                          color="#FFF"
                          style={!isSpeaking ? { marginLeft: 3 } : undefined}
                        />
                      )}
                    </Pressable>

                    <Pressable onPress={handleNextPart} hitSlop={8} style={styles.pillNavBtn}>
                      <Ionicons name="play-forward" size={20} color="rgba(255,255,255,0.5)" />
                    </Pressable>
                  </View>

                  <View style={[styles.pillDivider, { backgroundColor: `${theme.accent}1A` }]} />

                  <Pressable
                    onPress={toggleBgMusic}
                    hitSlop={8}
                    style={styles.pillMusicBtn}
                    disabled={musicLoading}
                  >
                    {musicLoading ? (
                      <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
                    ) : (
                      <>
                        <Ionicons
                          name={musicMuted ? "musical-note-outline" : "musical-notes"}
                          size={18}
                          color={musicMuted ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.6)"}
                        />
                        {musicPlaying && !musicMuted && (
                          <View style={styles.musicDot} />
                        )}
                      </>
                    )}
                  </Pressable>
                </View>
              )}
            </Animated.View>
          )}
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
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarCenter: { flex: 1, alignItems: "center" },
  brandingText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  brandingSubtext: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    marginTop: 1,
  },
  chapterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  chapterBadgeText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  timerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  timerText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
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
    backgroundColor: Colors.cardBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 2,
  },
  loadingTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
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
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 10,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 20,
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
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    paddingVertical: 30,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sceneLoadingText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  sceneImageWrap: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sceneImage: { width: "100%", height: 220, borderRadius: 20 },
  sceneImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  sceneProgressOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
  },
  sceneProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(2, 2, 26, 0.6)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sceneProgressBg: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  sceneProgressFill: {
    height: 5,
    borderRadius: 3,
  },
  sceneProgressLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 9,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.5,
  },
  parchmentCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 20,
    marginBottom: 20,
  },
  dropCap: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 38,
    lineHeight: 42,
  },
  paragraphText: {
    fontFamily: "PlusJakartaSans_400Regular",
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
    fontFamily: "PlusJakartaSans_700Bold",
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
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    color: "#FFF",
  },
  choiceText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 15,
    color: "#FFF",
    flex: 1,
  },
  floatingControlsWrap: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 50,
  },
  floatingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 17, 34, 0.92)",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.15)",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  pillSpeedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillSpeedText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 11,
  },
  pillDivider: {
    width: 1,
    height: 28,
  },
  pillCenterControls: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  pillNavBtn: {
    padding: 8,
  },
  pillPlayBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  pillMusicBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  musicDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },
  finishButton: {
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
    fontFamily: "PlusJakartaSans_700Bold",
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
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#FFF",
  },
  errorText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 18,
    color: Colors.textMuted,
  },
  errorLink: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: Colors.accent,
    marginTop: 16,
  },
  videoLoadingWrap: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 10,
  },
  videoLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  videoLoadingText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
  videoProgressBg: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  videoProgressFill: {
    height: 3,
    borderRadius: 2,
  },
  videoPlayerWrap: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    position: "relative",
  },
  videoPlayer: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    backgroundColor: "#000",
  },
  videoTag: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  videoTagText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 9,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.3,
  },
  sceneErrorWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    paddingVertical: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sceneErrorText: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
  },
  sceneRetryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  sceneRetryText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  progressArea: { alignItems: "center", gap: 6 },
  progressLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
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
});
