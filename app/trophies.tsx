import React, { useState, useEffect } from "react";
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
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn, ZoomIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { StarField } from "@/components/StarField";
import { useProfile } from "@/lib/ProfileContext";
import { EarnedBadge, StreakData, BADGE_DEFINITIONS } from "@/constants/types";
import { getBadges, getStreak, getStoriesForProfile } from "@/lib/storage";

const BADGE_GRADIENTS: [string, string][] = [
  ["rgba(100,103,242,0.4)", "rgba(147,51,234,0.4)"],
  ["rgba(59,130,246,0.4)", "rgba(99,102,241,0.4)"],
  ["rgba(249,115,22,0.4)", "rgba(239,68,68,0.4)"],
  ["rgba(16,185,129,0.4)", "rgba(6,182,212,0.4)"],
  ["rgba(236,72,153,0.4)", "rgba(168,85,247,0.4)"],
  ["rgba(245,158,11,0.4)", "rgba(239,68,68,0.4)"],
];

export default function TrophiesScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { activeProfile } = useProfile();
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [totalStories, setTotalStories] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeProfile) {
      setIsLoading(true);
      Promise.all([
        getBadges(activeProfile.id).then(setBadges),
        getStreak(activeProfile.id).then(setStreak),
        getStoriesForProfile(activeProfile.id).then((s) => setTotalStories(s.length)),
      ])
        .catch((e) => console.error("Failed to load trophy data:", e))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [activeProfile]);

  const earnedIds = new Set(badges.map((b) => b.id));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#02021a", "#0a0a2e", "#02021a"]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.accent} />
        </Pressable>
        <Text style={styles.topTitle}>TROPHY ROOM</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : !activeProfile ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.noProfile}>
            <Ionicons name="person-outline" size={48} color="rgba(255,255,255,0.15)" />
            <Text style={styles.noProfileTitle}>No Profile Selected</Text>
            <Text style={styles.noProfileSub}>
              Create or select a profile to start earning badges and tracking streaks
            </Text>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL STORIES</Text>
                <Text style={styles.statValue}>{totalStories}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>CURRENT STREAK</Text>
                <View style={styles.streakRow}>
                  <Text style={styles.statValue}>{streak?.currentStreak || 0}</Text>
                  {(streak?.currentStreak || 0) >= 1 && (
                    <Text style={styles.fireEmoji}>🔥</Text>
                  )}
                </View>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>BEST STREAK</Text>
                <Text style={styles.statValue}>{streak?.longestStreak || 0}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOTAL BADGES</Text>
                <Text style={styles.statValue}>{badges.length}</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles" size={18} color={Colors.accent} />
                <Text style={styles.sectionLabel}>Cosmic Achievements</Text>
              </View>

              {badges.length === 0 && (
                <View style={styles.emptyBadges}>
                  <Text style={styles.emptyBadgeText}>
                    Complete stories to start earning badges!
                  </Text>
                </View>
              )}

              <View style={styles.badgeGrid}>
                {badges.map((b, i) => (
                  <Animated.View
                    key={b.id}
                    entering={ZoomIn.duration(300).delay(i * 80)}
                    style={styles.badgeCard}
                  >
                    <View style={[styles.badgeCircle, { backgroundColor: "transparent" }]}>
                      <LinearGradient
                        colors={BADGE_GRADIENTS[i % BADGE_GRADIENTS.length]}
                        style={styles.badgeCircleGradient}
                      >
                        <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                      </LinearGradient>
                      <View style={styles.badgeCircleRing} />
                    </View>
                    <Text style={styles.badgeTitle}>{b.title}</Text>
                    <Text style={styles.badgeDesc}>{b.description}</Text>
                  </Animated.View>
                ))}

                {BADGE_DEFINITIONS.filter((d) => !earnedIds.has(d.id)).map((d, i) => (
                  <Animated.View
                    key={d.id}
                    entering={FadeInDown.duration(300).delay(i * 50)}
                    style={[styles.badgeCard, styles.badgeCardLocked]}
                  >
                    <View style={styles.lockedCircle}>
                      <Text style={styles.lockedQuestion}>?</Text>
                    </View>
                    <Text style={[styles.badgeTitle, styles.lockedTitle]}>
                      {d.title}
                    </Text>
                    <Text style={[styles.badgeDesc, styles.lockedDesc]}>
                      {d.description}
                    </Text>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#02021a" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(100,103,242,0.1)",
    borderWidth: 1,
    borderColor: "rgba(100,103,242,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 28,
    color: Colors.accent,
    letterSpacing: 3,
  },
  scrollContent: { paddingHorizontal: 20 },
  noProfile: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 12,
  },
  noProfileTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    color: "rgba(255,255,255,0.5)",
  },
  noProfileSub: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
    marginTop: 8,
  },
  statCard: {
    width: "47%" as `${number}%`,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(100,103,242,0.06)",
    borderWidth: 1,
    borderColor: "rgba(100,103,242,0.15)",
    gap: 4,
  },
  statLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 9,
    color: "rgba(100,103,242,0.7)",
    letterSpacing: 1.5,
  },
  statValue: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 28,
    color: "#FFFFFF",
  },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  fireEmoji: { fontSize: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  emptyBadges: {
    paddingVertical: 24,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginBottom: 20,
  },
  emptyBadgeText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  badgeCard: {
    width: "47%" as `${number}%`,
    alignItems: "center" as const,
    gap: 6,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(100,103,242,0.05)",
    borderWidth: 1,
    borderColor: "rgba(100,103,242,0.2)",
  },
  badgeCardLocked: {
    opacity: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  badgeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  badgeCircleGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCircleRing: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: "rgba(100,103,242,0.25)",
  },
  badgeEmoji: { fontSize: 38 },
  badgeTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
  },
  badgeDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    lineHeight: 15,
  },
  lockedCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(30,30,50,0.8)",
    borderWidth: 2,
    borderColor: "rgba(100,100,140,0.3)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  lockedQuestion: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 28,
    color: "rgba(255,255,255,0.2)",
  },
  lockedTitle: {
    color: "rgba(255,255,255,0.4)",
  },
  lockedDesc: {
    color: "rgba(255,255,255,0.2)",
  },
});
