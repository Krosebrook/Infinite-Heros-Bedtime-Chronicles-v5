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

const DURATIONS = [
  { id: "short", label: "Quick Tale", time: "~2 min", icon: "flash-outline" as const },
  { id: "medium", label: "Classic Story", time: "~4 min", icon: "book-outline" as const },
  { id: "long", label: "Epic Saga", time: "~7 min", icon: "library-outline" as const },
];

const VOICES = [
  { id: "alloy", label: "Alloy", desc: "Warm & Balanced", icon: "mic-outline" as const },
  { id: "nova", label: "Nova", desc: "Gentle & Soft", icon: "sparkles-outline" as const },
  { id: "echo", label: "Echo", desc: "Deep & Soothing", icon: "moon-outline" as const },
  { id: "shimmer", label: "Shimmer", desc: "Bright & Clear", icon: "sunny-outline" as const },
];

export default function OptionsScreen() {
  const { heroId } = useLocalSearchParams<{ heroId: string }>();
  const insets = useSafeAreaInsets();
  const [duration, setDuration] = useState("medium");
  const [voice, setVoice] = useState("nova");
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const hero = HEROES.find((h) => h.id === heroId);

  if (!hero) {
    router.back();
    return null;
  }

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: "/story",
      params: {
        heroId: hero.id,
        duration,
        voice,
      },
    });
  };

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
          <LinearGradient
            colors={hero.gradient}
            style={styles.heroPreviewCard}
          >
            <View style={styles.heroMiniIcon}>
              <Ionicons name={hero.iconName as any} size={32} color={hero.color} />
            </View>
            <View style={styles.heroPreviewInfo}>
              <Text style={styles.heroPreviewName}>{hero.name}</Text>
              <Text style={styles.heroPreviewTitle}>{hero.title}</Text>
            </View>
          </LinearGradient>
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
                  style={[
                    styles.optionCard,
                    isActive && styles.optionCardActive,
                  ]}
                  testID={`duration-${d.id}`}
                >
                  <Ionicons
                    name={d.icon}
                    size={24}
                    color={isActive ? Colors.accent : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      isActive && styles.optionLabelActive,
                    ]}
                  >
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
          <View style={styles.voiceGrid}>
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
                    styles.voiceCard,
                    isActive && styles.voiceCardActive,
                  ]}
                  testID={`voice-${v.id}`}
                >
                  <View
                    style={[
                      styles.voiceIconWrap,
                      isActive && styles.voiceIconWrapActive,
                    ]}
                  >
                    <Ionicons
                      name={v.icon}
                      size={20}
                      color={isActive ? Colors.primary : Colors.textSecondary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.voiceLabel,
                      isActive && styles.voiceLabelActive,
                    ]}
                  >
                    {v.label}
                  </Text>
                  <Text style={styles.voiceDesc}>{v.desc}</Text>
                </Pressable>
              );
            })}
          </View>
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
            colors={[Colors.accent, "#E5A825"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Ionicons name="sparkles" size={20} color={Colors.primary} />
            <Text style={styles.startButtonText}>Generate Story</Text>
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
    marginBottom: 28,
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
  optionGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
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
  voiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  voiceCard: {
    width: "47%" as any,
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  voiceCardActive: {
    borderColor: Colors.accent,
    backgroundColor: "rgba(245, 197, 66, 0.08)",
  },
  voiceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceIconWrapActive: {
    backgroundColor: Colors.accent,
  },
  voiceLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: Colors.textSecondary,
  },
  voiceLabelActive: {
    color: Colors.textPrimary,
  },
  voiceDesc: {
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
