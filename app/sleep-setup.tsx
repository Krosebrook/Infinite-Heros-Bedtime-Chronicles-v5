import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
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
  { id: "rain", label: "Rain", icon: "rainy" as const, color: "#A855F7" },
  { id: "ocean", label: "Ocean", icon: "water" as const, color: "#A855F7" },
  { id: "crickets", label: "Crickets", icon: "bug" as const, color: "#A855F7" },
  { id: "wind", label: "Wind", icon: "leaf" as const, color: "#A855F7" },
  { id: "fire", label: "Fire", icon: "flame" as const, color: "#A855F7" },
  { id: "forest", label: "Forest", icon: "tree" as const, color: "#A855F7" },
];

const SLEEP_TIMERS = [
  { id: "5", label: "5 min" },
  { id: "10", label: "10 min" },
  { id: "15", label: "15 min" },
  { id: "20", label: "20 min" },
  { id: "30", label: "30 min" },
];

const PURPLE = "#A855F7";
const PURPLE_BG = "rgba(168, 85, 247, 0.1)";
const PURPLE_BORDER = "rgba(168, 85, 247, 0.2)";
const PURPLE_ACTIVE_BORDER = "rgba(168, 85, 247, 0.4)";

export default function SleepSetupScreen() {
  const { heroId, duration, voice, speed } = useLocalSearchParams<{
    heroId: string;
    duration: string;
    voice: string;
    speed: string;
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
        speed: speed || "gentle",
      },
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#05051e", "#0D0520", "#05051e"]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <View style={[styles.glowOrb, styles.glowOrbTop]} />
      <View style={[styles.glowOrb, styles.glowOrbBottom]} />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.8)" />
        </Pressable>
        <Text style={styles.topBarTitle}>Sleep Setup</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text style={styles.sectionTitle}>Ambient Soundscape</Text>
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
                    isActive && styles.soundCardActive,
                  ]}
                  testID={`sound-${s.id}`}
                >
                  <Ionicons
                    name={s.icon as any}
                    size={28}
                    color={isActive ? PURPLE : "rgba(255,255,255,0.4)"}
                  />
                  <Text style={[styles.soundLabel, isActive && styles.soundLabelActive]}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text style={styles.sectionTitle}>Sleep Timer</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timerRow}
          >
            {SLEEP_TIMERS.map((t) => {
              const isActive = sleepTimer === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSleepTimer(t.id);
                  }}
                  style={[
                    styles.timerPill,
                    isActive && styles.timerPillActive,
                  ]}
                  testID={`timer-${t.id}`}
                >
                  <Text style={[styles.timerLabel, isActive && styles.timerLabelActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          <View style={styles.heroCard}>
            <View style={styles.heroCardContent}>
              <Text style={styles.heroCardLabel}>TONIGHT&apos;S HERO</Text>
              <Text style={styles.heroCardName}>{hero.name}</Text>
            </View>
            <View style={styles.heroCardIconWrap}>
              <Ionicons name="sparkles" size={80} color={PURPLE} style={{ opacity: 0.2 }} />
            </View>
          </View>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>

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
          testID="sleep-start-button"
        >
          <LinearGradient
            colors={[PURPLE, "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Ionicons name="sparkles" size={20} color="#FFF" />
            <Text style={styles.startButtonText}>Begin Sleep Story</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#02021a",
  },
  glowOrb: {
    position: "absolute",
    borderRadius: 999,
  },
  glowOrbTop: {
    top: "-10%",
    left: "-10%",
    width: 256,
    height: 256,
    backgroundColor: "rgba(168, 85, 247, 0.15)",
    ...(Platform.OS === "web" ? { filter: "blur(80px)" } : { opacity: 0.6 }),
  },
  glowOrbBottom: {
    bottom: "20%",
    right: "-5%",
    width: 320,
    height: 320,
    backgroundColor: "rgba(168, 85, 247, 0.08)",
    ...(Platform.OS === "web" ? { filter: "blur(80px)" } : { opacity: 0.5 }),
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  soundGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  soundCard: {
    width: "30.5%" as any,
    aspectRatio: 1,
    backgroundColor: PURPLE_BG,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
  },
  soundCardActive: {
    borderColor: PURPLE_ACTIVE_BORDER,
    borderWidth: 2,
    backgroundColor: "rgba(168, 85, 247, 0.15)",
  },
  soundLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: Colors.textPrimary,
  },
  soundLabelActive: {
    color: "#FFF",
  },
  timerRow: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 8,
    marginBottom: 32,
  },
  timerPill: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: PURPLE_BG,
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  timerPillActive: {
    borderColor: PURPLE_ACTIVE_BORDER,
    backgroundColor: "rgba(168, 85, 247, 0.2)",
  },
  timerLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 15,
    color: "rgba(203, 213, 225, 0.8)",
  },
  timerLabelActive: {
    fontFamily: "PlusJakartaSans_700Bold",
    color: PURPLE,
  },
  heroCard: {
    borderRadius: 16,
    backgroundColor: PURPLE_BG,
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    borderStyle: "dashed",
    padding: 24,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    minHeight: 128,
    marginTop: 4,
  },
  heroCardContent: {
    flex: 1,
    zIndex: 2,
  },
  heroCardLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 11,
    color: PURPLE,
    letterSpacing: 3,
    marginBottom: 6,
  },
  heroCardName: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: Colors.textPrimary,
  },
  heroCardIconWrap: {
    position: "absolute",
    right: -20,
    bottom: -20,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  startButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
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
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    color: "#FFF",
  },
});
