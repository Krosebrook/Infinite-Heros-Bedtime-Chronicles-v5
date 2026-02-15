import React, { useState } from "react";
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
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { HEROES } from "@/constants/heroes";
import { StarField } from "@/components/StarField";

const MODES = [
  {
    id: "classic",
    label: "Classic",
    desc: "A magical adventure",
    icon: "book-outline" as const,
    color: "#F5C542",
  },
  {
    id: "madlibs",
    label: "Mad Libs",
    desc: "Fill in silly words",
    icon: "happy-outline" as const,
    color: "#FF8A65",
  },
  {
    id: "sleep",
    label: "Sleep",
    desc: "Drift off gently",
    icon: "moon-outline" as const,
    color: "#CE93D8",
  },
];

const DURATIONS = [
  { id: "short", label: "Quick Tale", time: "~2 min", icon: "flash-outline" as const },
  { id: "medium", label: "Classic Story", time: "~4 min", icon: "book-outline" as const },
  { id: "long", label: "Epic Saga", time: "~7 min", icon: "library-outline" as const },
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

export default function OptionsScreen() {
  const { heroId } = useLocalSearchParams<{ heroId: string }>();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState("classic");
  const [duration, setDuration] = useState("medium");
  const [voice, setVoice] = useState("kore");
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const hero = HEROES.find((h) => h.id === heroId);

  if (!hero) {
    router.back();
    return null;
  }

  const handleStart = () => {
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

  const buttonLabel =
    mode === "madlibs"
      ? "Fill In Words"
      : mode === "sleep"
        ? "Set Up Sleep Mode"
        : "Generate Story";

  const buttonIcon =
    mode === "madlibs"
      ? "pencil"
      : mode === "sleep"
        ? "moon"
        : "sparkles";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[hero.gradient[0], Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(600)} style={styles.heroPreview}>
          <LinearGradient colors={hero.gradient} style={styles.heroPreviewCard}>
            <View style={styles.heroMiniIcon}>
              <Ionicons name={hero.iconName as any} size={32} color={hero.color} />
            </View>
            <View style={styles.heroPreviewInfo}>
              <Text style={styles.heroPreviewName}>{hero.name}</Text>
              <Text style={styles.heroPreviewTitle}>{hero.title}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(50)}>
          <Text style={styles.sectionLabel}>STORY MODE</Text>
          <View style={styles.modeGrid}>
            {MODES.map((m) => {
              const isActive = mode === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMode(m.id);
                  }}
                  style={[
                    styles.modeCard,
                    isActive && [styles.modeCardActive, { borderColor: m.color }],
                  ]}
                  testID={`mode-${m.id}`}
                >
                  <View style={[styles.modeIconWrap, isActive && { backgroundColor: m.color + "20" }]}>
                    <Ionicons
                      name={m.icon}
                      size={22}
                      color={isActive ? m.color : Colors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.modeLabel, isActive && { color: m.color }]}>
                    {m.label}
                  </Text>
                  <Text style={styles.modeMeta}>{m.desc}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text style={styles.sectionLabel}>STORY LENGTH</Text>
          <View style={styles.optionGrid}>
            {DURATIONS.map((d) => {
              const isActive = duration === d.id;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDuration(d.id);
                  }}
                  style={[styles.optionCard, isActive && styles.optionCardActive]}
                  testID={`duration-${d.id}`}
                >
                  <Ionicons
                    name={d.icon}
                    size={24}
                    color={isActive ? Colors.accent : Colors.textSecondary}
                  />
                  <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                    {d.label}
                  </Text>
                  <Text style={styles.optionMeta}>{d.time}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text style={styles.sectionLabel}>NARRATOR VOICE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.voiceScroll}
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
                  style={[styles.voiceChip, isActive && styles.voiceChipActive]}
                  testID={`voice-${v.id}`}
                >
                  <View style={[styles.voiceChipIcon, isActive && styles.voiceChipIconActive]}>
                    <Ionicons
                      name={v.icon}
                      size={16}
                      color={isActive ? Colors.primary : Colors.textSecondary}
                    />
                  </View>
                  <View>
                    <Text style={[styles.voiceChipLabel, isActive && styles.voiceChipLabelActive]}>
                      {v.label}
                    </Text>
                    <Text style={styles.voiceChipDesc}>{v.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.duration(500).delay(400)}
        style={[styles.bottomBar, { paddingBottom: bottomInset + 20 }]}
      >
        <Pressable
          onPress={handleStart}
          style={({ pressed }) => [
            styles.startButton,
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
          testID="start-story-button"
        >
          <LinearGradient
            colors={
              mode === "sleep"
                ? ["#CE93D8", "#AB47BC"]
                : mode === "madlibs"
                  ? ["#FF8A65", "#E64A19"]
                  : [Colors.accent, "#E5A825"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Ionicons name={buttonIcon as any} size={20} color={mode === "classic" ? Colors.primary : "#FFF"} />
            <Text style={[styles.startButtonText, mode !== "classic" && { color: "#FFF" }]}>
              {buttonLabel}
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroPreview: {
    marginBottom: 24,
  },
  heroPreviewCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 20,
    gap: 16,
  },
  heroMiniIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroPreviewInfo: {
    flex: 1,
  },
  heroPreviewName: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 22,
    color: "#FFFFFF",
  },
  heroPreviewTitle: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: Colors.accent,
    letterSpacing: 2,
    marginBottom: 14,
  },
  modeGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  modeCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  modeCardActive: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  modeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  modeLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  modeMeta: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
  },
  optionGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  optionCardActive: {
    borderColor: Colors.accent,
    backgroundColor: "rgba(245, 197, 66, 0.08)",
  },
  optionLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  optionLabelActive: {
    color: Colors.textPrimary,
  },
  optionMeta: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  voiceScroll: {
    gap: 10,
    paddingBottom: 8,
    marginBottom: 20,
  },
  voiceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.cardBg,
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  voiceChipActive: {
    borderColor: Colors.accent,
    backgroundColor: "rgba(245, 197, 66, 0.08)",
  },
  voiceChipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceChipIconActive: {
    backgroundColor: Colors.accent,
  },
  voiceChipLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  voiceChipLabelActive: {
    color: Colors.textPrimary,
  },
  voiceChipDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "rgba(11, 16, 38, 0.9)",
  },
  startButton: {
    borderRadius: 28,
    overflow: "hidden",
    elevation: 6,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  startButtonText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    color: Colors.primary,
  },
});
