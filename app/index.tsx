import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { HEROES, Hero } from "@/constants/heroes";
import { StarField } from "@/components/StarField";
import { MemoryJar } from "@/components/MemoryJar";

const MODE_THEMES = {
  classic: {
    accent: "#3B82F6",
    accentLight: "#60A5FA",
    gradient: ["#0B1A40", "#122050", "#0B1026"] as [string, string, string],
    buttonGradient: ["#3B82F6", "#2563EB"] as [string, string],
    cardAccent: "#3B82F6",
    glow: "rgba(59,130,246,0.25)",
    label: "Classic",
    tagline: "Choose your own adventure",
  },
  madlibs: {
    accent: "#F97316",
    accentLight: "#FB923C",
    gradient: ["#1A0A00", "#2D1400", "#1A0800"] as [string, string, string],
    buttonGradient: ["#F97316", "#EA580C"] as [string, string],
    cardAccent: "#F97316",
    glow: "rgba(249,115,22,0.25)",
    label: "Mad Libs",
    tagline: "Fill in the silly words",
  },
  sleep: {
    accent: "#A855F7",
    accentLight: "#C084FC",
    gradient: ["#0D0520", "#1A0A35", "#0D0318"] as [string, string, string],
    buttonGradient: ["#A855F7", "#7C3AED"] as [string, string],
    cardAccent: "#A855F7",
    glow: "rgba(168,85,247,0.25)",
    label: "Sleepy",
    tagline: "Drift off to dreamland",
  },
};

type ModeId = keyof typeof MODE_THEMES;

const MODES: { id: ModeId; icon: string; iconSet: "mci" | "ion" }[] = [
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

const VOICES = [
  { id: "kore", label: "Kore", desc: "Soothing", icon: "flower-outline" as const },
  { id: "aoede", label: "Aoede", desc: "Melodic", icon: "musical-notes-outline" as const },
  { id: "zephyr", label: "Zephyr", desc: "Gentle", icon: "leaf-outline" as const },
  { id: "leda", label: "Leda", desc: "Ethereal", icon: "sparkles-outline" as const },
  { id: "puck", label: "Puck", desc: "Playful", icon: "happy-outline" as const },
  { id: "charon", label: "Charon", desc: "Deep", icon: "moon-outline" as const },
  { id: "fenrir", label: "Fenrir", desc: "Bold", icon: "flame-outline" as const },
];

function PulsingOrb({ color, size, style }: { color: string; size: number; style?: any }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.3, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(0.1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
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
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
        animStyle,
      ]}
      pointerEvents="none"
    />
  );
}

function HeroCard({ hero, isActive }: { hero: Hero; isActive: boolean }) {
  const cardScale = useSharedValue(isActive ? 1 : 0.88);

  useEffect(() => {
    cardScale.value = withSpring(isActive ? 1 : 0.88, { damping: 15, stiffness: 120 });
  }, [isActive]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: isActive ? 1 : 0.5,
  }));

  return (
    <Animated.View style={[s.heroCard, cardStyle]}>
      <LinearGradient
        colors={hero.gradient}
        style={s.heroCardGradient}
      >
        <View style={s.heroIconWrap}>
          <Ionicons name={hero.iconName as any} size={36} color={hero.color} />
        </View>
        <Text style={s.heroCardName}>{hero.name}</Text>
        <Text style={s.heroCardTitle}>{hero.title}</Text>
        <View style={s.heroPowerPill}>
          <Ionicons name="sparkles" size={10} color="rgba(255,255,255,0.8)" />
          <Text style={s.heroPowerText}>{hero.power}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function DurationPicker({
  selected,
  onSelect,
  accent,
}: {
  selected: string;
  onSelect: (id: string) => void;
  accent: string;
}) {
  return (
    <View style={s.durationRow}>
      {DURATIONS.map((d) => {
        const isActive = d.id === selected;
        return (
          <Pressable
            key={d.id}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(d.id);
            }}
            style={[
              s.durationPill,
              isActive && { backgroundColor: accent, borderColor: accent },
            ]}
            testID={`duration-${d.id}`}
          >
            <Ionicons
              name={d.icon as any}
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
  );
}

function ModeDock({
  activeMode,
  onSelect,
}: {
  activeMode: ModeId;
  onSelect: (id: ModeId) => void;
}) {
  return (
    <View style={s.modeDock}>
      {MODES.map((m) => {
        const isActive = activeMode === m.id;
        const theme = MODE_THEMES[m.id];
        return (
          <Pressable
            key={m.id}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(m.id);
            }}
            style={[s.modeDockItem, isActive && { backgroundColor: `${theme.accent}22` }]}
            testID={`mode-${m.id}`}
          >
            <View style={[s.modeDockIcon, isActive && { backgroundColor: theme.accent }]}>
              {m.iconSet === "mci" ? (
                <MaterialCommunityIcons
                  name={m.icon as any}
                  size={20}
                  color={isActive ? "#FFF" : "rgba(255,255,255,0.35)"}
                />
              ) : (
                <Ionicons
                  name={m.icon as any}
                  size={20}
                  color={isActive ? "#FFF" : "rgba(255,255,255,0.35)"}
                />
              )}
            </View>
            <Text style={[s.modeDockLabel, isActive && { color: theme.accent }]}>
              {theme.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [heroIndex, setHeroIndex] = useState(0);
  const [mode, setMode] = useState<ModeId>("classic");
  const [duration, setDuration] = useState("medium");
  const [voice, setVoice] = useState("kore");
  const [jarVisible, setJarVisible] = useState(false);

  const hero = HEROES[heroIndex];
  const theme = MODE_THEMES[mode];

  const prevHero = () => {
    Haptics.selectionAsync();
    setHeroIndex((prev) => (prev === 0 ? HEROES.length - 1 : prev - 1));
  };

  const nextHero = () => {
    Haptics.selectionAsync();
    setHeroIndex((prev) => (prev === HEROES.length - 1 ? 0 : prev + 1));
  };

  const handleEngage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (mode === "madlibs") {
      router.push({
        pathname: "/madlibs",
        params: { heroId: hero.id, duration, voice },
      });
    } else if (mode === "sleep") {
      router.push({
        pathname: "/sleep-setup",
        params: { heroId: hero.id, duration, voice },
      });
    } else {
      router.push({
        pathname: "/story",
        params: { heroId: hero.id, duration, voice, mode: "classic" },
      });
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
          <View style={{ width: 40 }} />
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setJarVisible(true);
            }}
            style={s.jarButton}
            testID="memory-jar-button"
          >
            <Ionicons name="archive" size={20} color={theme.accent} />
          </Pressable>
        </View>

        <Animated.View entering={FadeIn.duration(800)} style={s.headerBlock}>
          <Text style={s.titleInfinity}>INFINITY</Text>
          <Text style={[s.titleHeroes, { color: theme.accent }]}>HEROES</Text>
          <View style={s.taglineRow}>
            <View style={[s.taglineLine, { backgroundColor: theme.accent }]} />
            <Text style={s.taglineText}>{theme.tagline.toUpperCase()}</Text>
            <View style={[s.taglineLine, { backgroundColor: theme.accent }]} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <View style={s.sectionHeader}>
            <Ionicons name="person" size={14} color={theme.accent} />
            <Text style={s.sectionLabel}>CHOOSE YOUR HERO</Text>
          </View>

          <View style={s.heroCarousel}>
            <Pressable onPress={prevHero} style={s.heroArrow} testID="prev-hero">
              <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.6)" />
            </Pressable>

            <View style={s.heroCardContainer}>
              <HeroCard hero={hero} isActive={true} />
            </View>

            <Pressable onPress={nextHero} style={s.heroArrow} testID="next-hero">
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>

          <View style={s.dotRow}>
            {HEROES.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  Haptics.selectionAsync();
                  setHeroIndex(i);
                }}
              >
                <View
                  style={[
                    s.dot,
                    i === heroIndex && [s.dotActive, { backgroundColor: theme.accent }],
                  ]}
                />
              </Pressable>
            ))}
          </View>

          <Text style={s.heroDesc} numberOfLines={2}>{hero.description}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <View style={s.sectionHeader}>
            <Ionicons name="time" size={14} color={theme.accent} />
            <Text style={s.sectionLabel}>STORY LENGTH</Text>
          </View>
          <DurationPicker selected={duration} onSelect={setDuration} accent={theme.accent} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <View style={s.sectionHeader}>
            <Ionicons name="mic" size={14} color={theme.accent} />
            <Text style={s.sectionLabel}>NARRATOR VOICE</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.voiceScrollContent}
          >
            {VOICES.map((v) => {
              const isActive = voice === v.id;
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
                  <View
                    style={[
                      s.voiceChipDot,
                      isActive && { backgroundColor: theme.accent },
                    ]}
                  >
                    <Ionicons
                      name={v.icon as any}
                      size={13}
                      color={isActive ? "#FFF" : "rgba(255,255,255,0.4)"}
                    />
                  </View>
                  <View>
                    <Text style={[s.voiceChipName, isActive && { color: "#FFF" }]}>{v.label}</Text>
                    <Text style={[s.voiceChipDesc, isActive && { color: theme.accent }]}>{v.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
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
              <Text style={s.engageBtnText}>
                {mode === "madlibs"
                  ? "FILL IN WORDS"
                  : mode === "sleep"
                    ? "START DREAMSCAPE"
                    : "BEGIN ADVENTURE"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <View style={[s.modeDockWrap, { paddingBottom: bottomInset + 8 }]}>
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)", "rgba(0,0,0,0.95)"]}
          style={s.modeDockGradient}
        />
        <ModeDock activeMode={mode} onSelect={setMode} />
      </View>

      <MemoryJar visible={jarVisible} onClose={() => setJarVisible(false)} />
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
  jarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBlock: {
    alignItems: "center",
    paddingBottom: 24,
  },
  titleInfinity: {
    fontFamily: "Bangers_400Regular",
    fontSize: 48,
    color: "#FFFFFF",
    letterSpacing: 6,
    textAlign: "center",
    lineHeight: 52,
    textShadowColor: "rgba(255,255,255,0.15)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 20,
  },
  titleHeroes: {
    fontFamily: "Bangers_400Regular",
    fontSize: 54,
    letterSpacing: 8,
    textAlign: "center",
    lineHeight: 56,
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
    fontFamily: "Nunito_600SemiBold",
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 3,
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
    fontFamily: "Nunito_700Bold",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
  },
  heroCarousel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  heroArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCardContainer: {
    flex: 1,
    alignItems: "center",
    maxWidth: 260,
  },
  heroCard: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  heroCardGradient: {
    padding: 24,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  heroCardName: {
    fontFamily: "Bangers_400Regular",
    fontSize: 28,
    color: "#FFFFFF",
    letterSpacing: 2,
    textAlign: "center",
  },
  heroCardTitle: {
    fontFamily: "Nunito_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 10,
  },
  heroPowerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  heroPowerText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.5,
  },
  dotRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
  },
  heroDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    paddingHorizontal: 40,
    marginTop: 10,
    lineHeight: 18,
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
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 4,
  },
  durationLabel: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
  },
  voiceScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 4,
  },
  voiceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  voiceChipDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
  },
  engageBtn: {
    marginHorizontal: 20,
    marginTop: 28,
    borderRadius: 9999,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  engageBtnGradient: {
    flexDirection: "row",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  engageBtnText: {
    fontFamily: "Bangers_400Regular",
    fontSize: 20,
    color: "#FFF",
    letterSpacing: 3,
  },
  modeDockWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  modeDockGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  modeDock: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  modeDockItem: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  modeDockIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  modeDockLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 1,
  },
});
