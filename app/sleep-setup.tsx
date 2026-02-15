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

const SOUNDSCAPES = [
  { id: "rain", label: "Gentle Rain", icon: "rainy-outline" as const, color: "#64B5F6" },
  { id: "ocean", label: "Ocean Waves", icon: "water-outline" as const, color: "#4DD0E1" },
  { id: "crickets", label: "Night Crickets", icon: "bug-outline" as const, color: "#AED581" },
  { id: "wind", label: "Soft Wind", icon: "leaf-outline" as const, color: "#A1887F" },
  { id: "fire", label: "Crackling Fire", icon: "flame-outline" as const, color: "#FFB74D" },
  { id: "none", label: "No Sound", icon: "volume-mute-outline" as const, color: "#90A4AE" },
];

const SLEEP_TIMERS = [
  { id: "5", label: "5 min", desc: "Quick nap" },
  { id: "10", label: "10 min", desc: "Short rest" },
  { id: "15", label: "15 min", desc: "Standard" },
  { id: "30", label: "30 min", desc: "Deep sleep" },
  { id: "none", label: "Off", desc: "No timer" },
];

export default function SleepSetupScreen() {
  const { heroId, duration, voice } = useLocalSearchParams<{
    heroId: string;
    duration: string;
    voice: string;
  }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [soundscape, setSoundscape] = useState("rain");
  const [sleepTimer, setSleepTimer] = useState("15");

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
        mode: "sleep",
        soundscape,
        sleepTimer,
      },
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1A0533", "#0B1026", "#060810"]}
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
        <Animated.View entering={FadeIn.duration(800)} style={styles.headerArea}>
          <View style={styles.sleepBadge}>
            <Ionicons name="moon" size={20} color="#CE93D8" />
            <Text style={styles.sleepBadgeText}>Sleep Mode</Text>
          </View>
          <Text style={styles.headerTitle}>Prepare for Dreamland</Text>
          <Text style={styles.headerSubtitle}>
            Choose your soundscape and {hero.name} will guide you to sleep
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text style={styles.sectionLabel}>AMBIENT SOUNDS</Text>
          <View style={styles.soundGrid}>
            {SOUNDSCAPES.map((s) => {
              const isActive = soundscape === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSoundscape(s.id);
                  }}
                  style={[
                    styles.soundCard,
                    isActive && [styles.soundCardActive, { borderColor: s.color }],
                  ]}
                  testID={`sound-${s.id}`}
                >
                  <View style={[styles.soundIconWrap, isActive && { backgroundColor: s.color + "20" }]}>
                    <Ionicons
                      name={s.icon}
                      size={24}
                      color={isActive ? s.color : Colors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.soundLabel, isActive && { color: s.color }]}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text style={styles.sectionLabel}>SLEEP TIMER</Text>
          <Text style={styles.sectionHint}>Auto-stops narration and sounds</Text>
          <View style={styles.timerGrid}>
            {SLEEP_TIMERS.map((t) => {
              const isActive = sleepTimer === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSleepTimer(t.id);
                  }}
                  style={[styles.timerCard, isActive && styles.timerCardActive]}
                  testID={`timer-${t.id}`}
                >
                  <Text style={[styles.timerLabel, isActive && styles.timerLabelActive]}>
                    {t.label}
                  </Text>
                  <Text style={styles.timerDesc}>{t.desc}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.duration(500).delay(300)}
        style={[styles.bottomBar, { paddingBottom: bottomInset + 20 }]}
      >
        <Pressable
          onPress={handleStart}
          style={({ pressed }) => [
            styles.startButton,
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
          testID="sleep-start-button"
        >
          <LinearGradient
            colors={["#CE93D8", "#7B1FA2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Ionicons name="moon" size={20} color="#FFF" />
            <Text style={[styles.startButtonText, { color: "#FFF" }]}>
              Begin Bedtime Story
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
  headerArea: {
    alignItems: "center",
    marginBottom: 28,
  },
  sleepBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(206, 147, 216, 0.12)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 14,
  },
  sleepBadgeText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: "#CE93D8",
  },
  headerTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 28,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  sectionLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#CE93D8",
    letterSpacing: 2,
    marginBottom: 6,
  },
  sectionHint: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 14,
  },
  soundGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  soundCard: {
    width: "30%" as any,
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  soundCardActive: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  soundIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  soundLabel: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  timerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  timerCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    minWidth: 70,
  },
  timerCardActive: {
    borderColor: "#CE93D8",
    backgroundColor: "rgba(206, 147, 216, 0.08)",
  },
  timerLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: Colors.textSecondary,
  },
  timerLabelActive: {
    color: "#CE93D8",
  },
  timerDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
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
    shadowColor: "#CE93D8",
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
