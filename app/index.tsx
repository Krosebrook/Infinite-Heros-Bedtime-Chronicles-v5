import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];
type MCIName = ComponentProps<typeof MaterialCommunityIcons>["name"];
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { HEROES, Hero } from "@/constants/heroes";
import { StarField } from "@/components/StarField";
import { PulsingOrb } from "@/components/PulsingOrb";
import { MemoryJar } from "@/components/MemoryJar";
import { SettingsModal } from "@/components/SettingsModal";
import { ProfileModal } from "@/components/ProfileModal";
import { ParentControlsModal } from "@/components/ParentControlsModal";
import { useProfile } from "@/lib/ProfileContext";
import { apiRequest } from "@/lib/query-client";
import { TTS_PREVIEW_TIMEOUT_MS } from "@/constants/timing";

interface AISuggestion {
  mode: string;
  duration: string;
  speed: string;
  voice: string;
  tip: string;
}

const MODE_THEMES = {
  classic: {
    accent: "#6366f1",
    accentLight: "#818cf8",
    gradient: ["#05051e", "#0a0a2e", "#05051e"] as [string, string, string],
    buttonGradient: ["#6366f1", "#4f46e5"] as [string, string],
    cardAccent: "#6366f1",
    glow: "rgba(99,102,241,0.25)",
    label: "Classic",
    tagline: "Choose your own adventure",
  },
  madlibs: {
    accent: "#F97316",
    accentLight: "#FB923C",
    gradient: ["#05051e", "#1A0A00", "#05051e"] as [string, string, string],
    buttonGradient: ["#F97316", "#EA580C"] as [string, string],
    cardAccent: "#F97316",
    glow: "rgba(249,115,22,0.25)",
    label: "Mad Libs",
    tagline: "Fill in the silly words",
  },
  sleep: {
    accent: "#A855F7",
    accentLight: "#C084FC",
    gradient: ["#05051e", "#0D0520", "#05051e"] as [string, string, string],
    buttonGradient: ["#A855F7", "#7C3AED"] as [string, string],
    cardAccent: "#A855F7",
    glow: "rgba(168,85,247,0.25)",
    label: "Sleepy",
    tagline: "Drift off to dreamland",
  },
};

type ModeId = keyof typeof MODE_THEMES;
const VALID_MODES_LIST: ModeId[] = ["classic", "madlibs", "sleep"];

const MODES: { id: ModeId; icon: MCIName; iconSet: "mci" }[] = [
  { id: "classic", icon: "sword-cross", iconSet: "mci" },
  { id: "madlibs", icon: "emoticon-tongue-outline", iconSet: "mci" },
  { id: "sleep", icon: "moon-waning-crescent", iconSet: "mci" },
];

const DURATIONS = [
  { id: "short", label: "3 min", icon: "flash" as const },
  { id: "medium-short", label: "5 min", icon: "book" as const },
  { id: "medium", label: "8 min", icon: "time" as const },
  { id: "long", label: "12 min", icon: "document-text" as const },
  { id: "epic", label: "15+ min", icon: "infinite" as const },
];

type VoiceCategory = "sleep" | "classic" | "fun";

const VOICES: { id: string; label: string; desc: string; accent: string; icon: IoniconsName; category: VoiceCategory }[] = [
  { id: "moonbeam", label: "Moonbeam", desc: "Warm lullaby", accent: "American", icon: "moon-outline", category: "sleep" },
  { id: "whisper", label: "Whisper", desc: "Soft & dreamy", accent: "American", icon: "cloud-outline", category: "sleep" },
  { id: "stardust", label: "Stardust", desc: "Magical guide", accent: "American", icon: "sparkles-outline", category: "sleep" },
  { id: "captain", label: "Captain Story", desc: "Dramatic narrator", accent: "British", icon: "book-outline", category: "classic" },
  { id: "professor", label: "Prof. Nova", desc: "Wise & warm", accent: "British", icon: "school-outline", category: "classic" },
  { id: "aurora", label: "Aurora", desc: "Expressive weaver", accent: "American", icon: "sunny-outline", category: "classic" },
  { id: "giggles", label: "Giggles", desc: "Playful & silly", accent: "American", icon: "happy-outline", category: "fun" },
  { id: "blaze", label: "Blaze", desc: "Bold & exciting", accent: "American", icon: "flame-outline", category: "fun" },
  { id: "ziggy", label: "Ziggy", desc: "Animated & cheery", accent: "British", icon: "star-outline", category: "fun" },
];

const MODE_DEFAULT_VOICE: Record<ModeId, string> = {
  classic: "captain",
  madlibs: "giggles",
  sleep: "moonbeam",
};

const MODE_VOICE_CATEGORY: Record<ModeId, VoiceCategory> = {
  classic: "classic",
  madlibs: "fun",
  sleep: "sleep",
};

const SPEED_PRESETS = [
  { id: "gentle", label: "Gentle", desc: "0.8×", rate: 0.8, icon: "moon-outline" as const },
  { id: "medium", label: "Medium", desc: "0.9×", rate: 0.9, icon: "cloudy-night-outline" as const },
  { id: "normal", label: "Normal", desc: "1.0×", rate: 1.0, icon: "sunny-outline" as const },
];

const MODE_DEFAULT_SPEED: Record<ModeId, string> = {
  classic: "medium",
  madlibs: "medium",
  sleep: "gentle",
};

const TAB_ITEMS = [
  { id: "create", label: "Create", icon: "add-circle" as const },
  { id: "stories", label: "My Stories", icon: "library" as const },
  { id: "favorites", label: "Favorites", icon: "heart" as const },
  { id: "settings", label: "Settings", icon: "settings" as const },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [heroIndex, setHeroIndex] = useState(0);
  const [mode, setMode] = useState<ModeId>("classic");
  const [duration, setDuration] = useState("medium");
  const [voice, setVoice] = useState("captain");
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const previewSoundRef = useRef<Audio.Sound | null>(null);
  const [speed, setSpeed] = useState(MODE_DEFAULT_SPEED["classic"]);
  const [jarVisible, setJarVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [parentControlsVisible, setParentControlsVisible] = useState(false);
  const { activeProfile } = useProfile();
  const [activeTab, setActiveTab] = useState("create");

  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const lastFetchedHeroRef = useRef<number>(-1);

  const hero = HEROES[heroIndex];
  const theme = MODE_THEMES[mode];

  const fetchSuggestion = useCallback(async (h: Hero) => {
    setSuggestionLoading(true);
    setSuggestion(null);
    setSuggestionDismissed(false);
    try {
      const res = await apiRequest("POST", "/api/suggest-settings", {
        heroName: h.name,
        heroPower: h.power,
        heroDescription: h.description,
        hour: new Date().getHours(),
        childAge: activeProfile?.age,
        childName: activeProfile?.name,
      });
      const data: AISuggestion = await res.json();
      setSuggestion(data);
    } catch (e) {
      if (__DEV__) console.log("Suggestion fetch failed:", e);
    } finally {
      setSuggestionLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    if (lastFetchedHeroRef.current !== heroIndex) {
      lastFetchedHeroRef.current = heroIndex;
      fetchSuggestion(HEROES[heroIndex]);
    }
  }, [heroIndex, fetchSuggestion]);

  const applySuggestion = () => {
    if (!suggestion) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (VALID_MODES_LIST.includes(suggestion.mode as ModeId)) {
      setMode(suggestion.mode as ModeId);
    }
    if (DURATIONS.some(d => d.id === suggestion.duration)) {
      setDuration(suggestion.duration);
    }
    if (SPEED_PRESETS.some(sp => sp.id === suggestion.speed)) {
      setSpeed(suggestion.speed);
    }
    if (VOICES.some(v => v.id === suggestion.voice)) {
      setVoice(suggestion.voice);
    }
    setSuggestionDismissed(true);
  };

  const handleModeChange = (newMode: ModeId) => {
    setMode(newMode);
    setSpeed(MODE_DEFAULT_SPEED[newMode]);
    setVoice(MODE_DEFAULT_VOICE[newMode]);
  };

  const playVoicePreview = useCallback(async (voiceId: string) => {
    if (previewLoading) return;
    setPreviewLoading(voiceId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (previewSoundRef.current) {
        await previewSoundRef.current.stopAsync();
        await previewSoundRef.current.unloadAsync();
        previewSoundRef.current = null;
      }
      const res = await apiRequest("POST", "/api/tts-preview", { voice: voiceId });
      const data = await res.json();
      if (data.audioUrl) {
        const { getApiUrl } = await import("@/lib/query-client");
        const baseUrl = getApiUrl();
        const fullUrl = `${baseUrl}${data.audioUrl}`;
        const { sound } = await Audio.Sound.createAsync(
          { uri: fullUrl },
          { shouldPlay: true }
        );
        previewSoundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            setPreviewLoading(null);
            sound.unloadAsync();
            previewSoundRef.current = null;
          }
        });
      }
    } catch (e) {
      console.error("Voice preview failed:", e);
      Alert.alert("Preview Unavailable", "Could not play voice preview. Please try again later.");
    } finally {
      setTimeout(() => setPreviewLoading(null), TTS_PREVIEW_TIMEOUT_MS);
    }
  }, [previewLoading]);

  const handleEngage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (mode === "madlibs") {
      router.push({
        pathname: "/madlibs",
        params: { heroId: hero.id, duration, voice, speed },
      });
    } else if (mode === "sleep") {
      router.push({
        pathname: "/sleep-setup",
        params: { heroId: hero.id, duration, voice, speed },
      });
    } else {
      router.push({
        pathname: "/story",
        params: { heroId: hero.id, duration, voice, mode: "classic", speed },
      });
    }
  };

  const handleTabPress = (tabId: string) => {
    Haptics.selectionAsync();
    setActiveTab(tabId);
    if (tabId === "stories") {
      setJarVisible(true);
    } else if (tabId === "favorites") {
      router.push("/trophies");
    } else if (tabId === "settings") {
      setSettingsVisible(true);
    }
  };

  return (
    <View style={s.container}>
      <LinearGradient
        colors={theme.gradient}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <PulsingOrb color={theme.accent} size={200} style={{ top: -40, right: -60 }} />
      <PulsingOrb color={theme.accent} size={140} style={{ bottom: 120, left: -50 }} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        bounces={false}
      >
        <View style={[s.topBar, { paddingTop: topInset + 8 }]}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setProfileVisible(true);
            }}
            style={s.topBarBtn}
            testID="profile-button"
          >
            {activeProfile ? (
              <Text style={{ fontSize: 18 }}>{activeProfile.avatarEmoji}</Text>
            ) : (
              <Ionicons name="person-circle-outline" size={20} color="rgba(255,255,255,0.5)" />
            )}
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/trophies");
            }}
            style={s.topBarBtn}
            testID="trophy-button"
          >
            <Ionicons name="trophy" size={20} color="#FFD54F" />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setParentControlsVisible(true);
            }}
            style={[s.topBarBtn, { marginLeft: 8 }]}
            testID="parent-controls-button"
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="rgba(255,255,255,0.5)" />
          </Pressable>
        </View>

        {activeProfile && (
          <Animated.View entering={FadeIn.duration(400)} style={s.greetingRow}>
            <Text style={s.greetingText}>
              Welcome back, {activeProfile.name}! {activeProfile.avatarEmoji}
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeIn.duration(800)} style={s.headerBlock}>
          <View style={s.headerTitleRow}>
            <Ionicons name="star" size={22} color={theme.accent} />
            <Text style={s.titleMain}>Infinity</Text>
          </View>
          <Text style={[s.titleSub, { color: theme.accent }]}>Chronicles</Text>
          <View style={s.taglineRow}>
            <View style={[s.taglineLine, { backgroundColor: theme.accent }]} />
            <Text style={s.taglineText}>CREATE YOUR OWN MAGIC</Text>
            <View style={[s.taglineLine, { backgroundColor: theme.accent }]} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500)} style={s.modeSection}>
          <View style={s.sectionHeader}>
            <Ionicons name="color-palette" size={14} color={theme.accent} />
            <Text style={s.sectionLabel}>STORY MODE</Text>
          </View>
          <View style={s.modeRow}>
            {MODES.map((m) => {
              const isActive = mode === m.id;
              const mTheme = MODE_THEMES[m.id];
              return (
                <Pressable
                  key={m.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    handleModeChange(m.id);
                  }}
                  style={[
                    s.modeChip,
                    isActive && { backgroundColor: mTheme.accent, borderColor: mTheme.accent },
                  ]}
                  testID={`mode-${m.id}`}
                >
                  <MaterialCommunityIcons
                    name={m.icon}
                    size={16}
                    color={isActive ? "#FFF" : "rgba(255,255,255,0.5)"}
                  />
                  <Text style={[s.modeChipText, isActive && { color: "#FFF" }]}>
                    {mTheme.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {(suggestionLoading || (suggestion && !suggestionDismissed)) && (
          <Animated.View entering={FadeInDown.duration(400)} style={s.suggestionCard}>
            <View style={s.glassCard}>
              <View style={s.suggestionHeader}>
                <View style={[s.suggestionIconWrap, { backgroundColor: `${theme.accent}30` }]}>
                  <Ionicons name="sparkles" size={14} color={theme.accent} />
                </View>
                <Text style={[s.suggestionTitle, { color: theme.accent }]}>AI Suggestion</Text>
                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={() => fetchSuggestion(hero)}
                  style={s.suggestionAction}
                  testID="refresh-suggestion"
                >
                  <Ionicons name="refresh" size={14} color="rgba(255,255,255,0.5)" />
                </Pressable>
                <Pressable
                  onPress={() => setSuggestionDismissed(true)}
                  style={s.suggestionAction}
                  testID="dismiss-suggestion"
                >
                  <Ionicons name="close" size={14} color="rgba(255,255,255,0.5)" />
                </Pressable>
              </View>
              {suggestionLoading ? (
                <View style={s.suggestionLoadingWrap}>
                  <Text style={s.suggestionStepLabel}>STEP 1 OF 3</Text>
                  <ActivityIndicator size="small" color={theme.accent} />
                  <Text style={s.suggestionLoadingText}>Dreaming up ingredients...</Text>
                </View>
              ) : suggestion ? (
                <>
                  <Text style={s.suggestionTip}>{suggestion.tip}</Text>
                  <View style={s.suggestionChips}>
                    <View style={[s.suggestionChipItem, { borderColor: `${theme.accent}40` }]}>
                      <Text style={s.suggestionChipText}>
                        {MODE_THEMES[suggestion.mode as ModeId]?.label || suggestion.mode}
                      </Text>
                    </View>
                    <View style={[s.suggestionChipItem, { borderColor: `${theme.accent}40` }]}>
                      <Text style={s.suggestionChipText}>
                        {DURATIONS.find(d => d.id === suggestion.duration)?.label || suggestion.duration}
                      </Text>
                    </View>
                    <View style={[s.suggestionChipItem, { borderColor: `${theme.accent}40` }]}>
                      <Text style={s.suggestionChipText}>
                        {SPEED_PRESETS.find(sp => sp.id === suggestion.speed)?.label || suggestion.speed}
                      </Text>
                    </View>
                    <View style={[s.suggestionChipItem, { borderColor: `${theme.accent}40` }]}>
                      <Text style={s.suggestionChipText}>
                        {VOICES.find(v => v.id === suggestion.voice)?.label || suggestion.voice}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={applySuggestion}
                    style={[s.suggestionApplyBtn, { backgroundColor: theme.accent }]}
                    testID="apply-suggestion"
                  >
                    <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                    <Text style={s.suggestionApplyText}>Apply Settings</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <View style={s.sectionHeader}>
            <Ionicons name="person" size={14} color={theme.accent} />
            <Text style={s.sectionLabel}>CHOOSE YOUR HERO</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.heroChipScroll}
          >
            {HEROES.map((h, i) => {
              const isActive = i === heroIndex;
              return (
                <Pressable
                  key={h.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setHeroIndex(i);
                  }}
                  style={[
                    s.heroChip,
                    isActive && { backgroundColor: `${theme.accent}20`, borderColor: theme.accent },
                  ]}
                  testID={`hero-${h.id}`}
                >
                  <View style={[s.heroChipIcon, isActive && { backgroundColor: theme.accent }]}>
                    <Ionicons name={h.iconName} size={18} color={isActive ? "#FFF" : h.color} />
                  </View>
                  <View>
                    <Text style={[s.heroChipName, isActive && { color: "#FFF" }]}>{h.name}</Text>
                    <Text style={[s.heroChipTitle, isActive && { color: theme.accentLight }]}>{h.title}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={s.heroDetailCard}>
            <View style={s.glassCard}>
              <View style={s.heroDetailRow}>
                <View style={[s.heroDetailIcon, { backgroundColor: `${hero.color}20` }]}>
                  <Ionicons name={hero.iconName} size={28} color={hero.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.heroDetailName}>{hero.name}</Text>
                  <Text style={s.heroDetailTitle}>{hero.title}</Text>
                </View>
                <View style={[s.heroPowerPill, { backgroundColor: `${theme.accent}20` }]}>
                  <Ionicons name="sparkles" size={10} color={theme.accent} />
                  <Text style={[s.heroPowerText, { color: theme.accent }]}>{hero.power}</Text>
                </View>
              </View>
              <Text style={s.heroDetailDesc}>{hero.description}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <View style={s.sectionHeader}>
            <Ionicons name="time" size={14} color={theme.accent} />
            <Text style={s.sectionLabel}>STORY LENGTH</Text>
          </View>
          <View style={s.durationRow}>
            {DURATIONS.map((d) => {
              const isActive = d.id === duration;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDuration(d.id);
                  }}
                  style={[
                    s.durationPill,
                    isActive && { backgroundColor: theme.accent, borderColor: theme.accent },
                  ]}
                  testID={`duration-${d.id}`}
                >
                  <Ionicons
                    name={d.icon}
                    size={14}
                    color={isActive ? "#FFF" : "rgba(255,255,255,0.4)"}
                  />
                  <Text
                    style={[
                      s.durationLabel,
                      isActive && { color: "#FFF" },
                    ]}
                  >
                    {d.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <View style={s.sectionHeader}>
            <Ionicons name="mic" size={14} color={theme.accent} />
            <Text style={s.sectionLabel}>NARRATOR VOICE</Text>
            <Text style={s.sectionHint}>
              {MODE_VOICE_CATEGORY[mode] === "sleep" ? "Calm & Soothing" : MODE_VOICE_CATEGORY[mode] === "fun" ? "Fun & Energetic" : "Storytellers"}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.voiceScrollContent}
          >
            {VOICES.filter((v) => v.category === MODE_VOICE_CATEGORY[mode]).map((v) => {
              const isActive = voice === v.id;
              const isPreviewing = previewLoading === v.id;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setVoice(v.id);
                  }}
                  style={[
                    s.voiceChip,
                    isActive && { borderColor: theme.accent, backgroundColor: `${theme.accent}18` },
                  ]}
                  testID={`voice-${v.id}`}
                >
                  <View style={s.voiceChipTop}>
                    <View
                      style={[
                        s.voiceChipDot,
                        isActive && { backgroundColor: theme.accent },
                      ]}
                    >
                      <Ionicons
                        name={v.icon}
                        size={13}
                        color={isActive ? "#FFF" : "rgba(255,255,255,0.4)"}
                      />
                    </View>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        playVoicePreview(v.id);
                      }}
                      hitSlop={8}
                      style={[s.previewBtn, isPreviewing && { backgroundColor: `${theme.accent}30` }]}
                    >
                      {isPreviewing ? (
                        <ActivityIndicator size={10} color={theme.accent} />
                      ) : (
                        <Ionicons name="volume-medium-outline" size={12} color={isActive ? theme.accent : "rgba(255,255,255,0.35)"} />
                      )}
                    </Pressable>
                  </View>
                  <View>
                    <Text style={[s.voiceChipName, isActive && { color: "#FFF" }]}>{v.label}</Text>
                    <Text style={[s.voiceChipDesc, isActive && { color: theme.accent }]}>{v.desc}</Text>
                    <Text style={s.voiceChipAccent}>{v.accent}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(350)}>
          <View style={s.sectionHeader}>
            <Ionicons name="speedometer-outline" size={14} color={theme.accent} />
            <Text style={s.sectionLabel}>NARRATION SPEED</Text>
          </View>
          <View style={s.speedRow}>
            {SPEED_PRESETS.map((sp) => {
              const isActive = speed === sp.id;
              return (
                <Pressable
                  key={sp.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSpeed(sp.id);
                  }}
                  style={[
                    s.speedChip,
                    isActive && { borderColor: theme.accent, backgroundColor: `${theme.accent}18` },
                  ]}
                  testID={`speed-${sp.id}`}
                >
                  <View
                    style={[
                      s.voiceChipDot,
                      isActive && { backgroundColor: theme.accent },
                    ]}
                  >
                    <Ionicons
                      name={sp.icon}
                      size={13}
                      color={isActive ? "#FFF" : "rgba(255,255,255,0.4)"}
                    />
                  </View>
                  <View>
                    <Text style={[s.voiceChipName, isActive && { color: "#FFF" }]}>{sp.label}</Text>
                    <Text style={[s.voiceChipDesc, isActive && { color: theme.accent }]}>{sp.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(400)}>
          <Pressable
            onPress={handleEngage}
            style={({ pressed }) => [
              s.engageBtn,
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
            testID="engage-mission-button"
          >
            <LinearGradient
              colors={theme.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.engageBtnGradient}
            >
              <Ionicons name="sparkles" size={18} color="rgba(255,255,255,0.8)" />
              <Text style={s.engageBtnText}>GENERATE MY STORY</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <View style={[s.bottomTabWrap, { paddingBottom: bottomInset + 4 }]}>
        <LinearGradient
          colors={["transparent", "rgba(5,5,30,0.9)", "rgba(5,5,30,0.98)"]}
          style={s.bottomTabGradient}
        />
        <View style={s.bottomTabBar}>
          {TAB_ITEMS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <Pressable
                key={tab.id}
                onPress={() => handleTabPress(tab.id)}
                style={s.bottomTabItem}
                testID={`tab-${tab.id}`}
              >
                <View style={[s.bottomTabIconWrap, isActive && { backgroundColor: `${theme.accent}20` }]}>
                  <Ionicons
                    name={tab.icon}
                    size={22}
                    color={isActive ? theme.accent : "rgba(255,255,255,0.35)"}
                  />
                </View>
                <Text style={[s.bottomTabLabel, isActive && { color: theme.accent }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <MemoryJar visible={jarVisible} onClose={() => setJarVisible(false)} />
      {settingsVisible && <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />}
      {profileVisible && <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />}
      {parentControlsVisible && <ParentControlsModal visible={parentControlsVisible} onClose={() => setParentControlsVisible(false)} />}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingRow: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  greetingText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  headerBlock: {
    alignItems: "center",
    paddingBottom: 20,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleMain: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 38,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  titleSub: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 44,
    letterSpacing: 2,
    marginTop: -6,
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  taglineLine: {
    width: 24,
    height: 1.5,
    opacity: 0.4,
  },
  taglineText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 3,
  },
  modeSection: {
    marginBottom: 4,
  },
  modeRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
  },
  modeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modeChipText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
  },
  sectionHint: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    marginLeft: "auto",
    letterSpacing: 0.5,
  },
  heroChipScroll: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  heroChipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroChipName: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  heroChipTitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    marginTop: 1,
  },
  heroDetailCard: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  glassCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 16,
  },
  heroDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  heroDetailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  heroDetailName: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  heroDetailTitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  heroPowerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  heroPowerText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  heroDetailDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 20,
  },
  durationRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 6,
  },
  durationPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 4,
  },
  durationLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
  },
  voiceScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
  },
  voiceChip: {
    width: 100,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  voiceChipDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceChipName: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  voiceChipTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  previewBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceChipDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
  },
  voiceChipAccent: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 8,
    color: "rgba(255,255,255,0.2)",
    marginTop: 2,
  },
  speedRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
  },
  speedChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  engageBtn: {
    marginHorizontal: 20,
    marginTop: 28,
    borderRadius: 9999,
    overflow: "hidden",
    elevation: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  engageBtnGradient: {
    flexDirection: "row",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  engageBtnText: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 16,
    color: "#FFF",
    letterSpacing: 2,
  },
  bottomTabWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomTabGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomTabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bottomTabItem: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  bottomTabIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomTabLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 0.5,
  },
  suggestionCard: {
    marginHorizontal: 20,
    marginBottom: 4,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  suggestionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 12,
    letterSpacing: 1,
  },
  suggestionAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionLoadingWrap: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  suggestionStepLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 10,
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase" as const,
    marginBottom: 2,
  },
  suggestionLoadingText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  suggestionTip: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 18,
    marginBottom: 10,
  },
  suggestionChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  suggestionChipItem: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  suggestionChipText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },
  suggestionApplyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  suggestionApplyText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 12,
    color: "#FFF",
    letterSpacing: 0.5,
  },
});
