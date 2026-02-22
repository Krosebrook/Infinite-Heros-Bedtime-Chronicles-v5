import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
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

export default function TrophiesScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { activeProfile } = useProfile();
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [totalStories, setTotalStories] = useState(0);

  useEffect(() => {
    if (activeProfile) {
      getBadges(activeProfile.id).then(setBadges);
      getStreak(activeProfile.id).then(setStreak);
      getStoriesForProfile(activeProfile.id).then((s) => setTotalStories(s.length));
    }
  }, [activeProfile]);

  const earnedIds = new Set(badges.map((b) => b.id));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1A237E", "#0D47A1", Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.8)" />
        </Pressable>
        <Text style={styles.topTitle}>Trophy Shelf</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {!activeProfile ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.noProfile}>
            <Ionicons name="person-outline" size={48} color="rgba(255,255,255,0.15)" />
            <Text style={styles.noProfileTitle}>No Profile Selected</Text>
            <Text style={styles.noProfileSub}>
              Create or select a profile to start earning badges and tracking streaks
            </Text>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeIn.duration(500)} style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{activeProfile.avatarEmoji}</Text>
              </View>
              <Text style={styles.profileName}>{activeProfile.name}'s Trophies</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{totalStories}</Text>
                <Text style={styles.statLabel}>Stories</Text>
              </View>
              <View style={[styles.statCard, styles.statCardAccent]}>
                <View style={styles.streakRow}>
                  <Text style={styles.statValue}>{streak?.currentStreak || 0}</Text>
                  {(streak?.currentStreak || 0) >= 3 && (
                    <Text style={styles.fireEmoji}>🔥</Text>
                  )}
                </View>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{streak?.longestStreak || 0}</Text>
                <Text style={styles.statLabel}>Best Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{badges.length}</Text>
                <Text style={styles.statLabel}>Badges</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trophy" size={16} color="#FFD54F" />
                <Text style={styles.sectionLabel}>EARNED BADGES</Text>
              </View>

              {badges.length === 0 ? (
                <View style={styles.emptyBadges}>
                  <Text style={styles.emptyBadgeText}>
                    Complete stories to start earning badges!
                  </Text>
                </View>
              ) : (
                <View style={styles.badgeGrid}>
                  {badges.map((b, i) => (
                    <Animated.View
                      key={b.id}
                      entering={ZoomIn.duration(300).delay(i * 80)}
                      style={styles.badgeCard}
                    >
                      <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                      <Text style={styles.badgeTitle}>{b.title}</Text>
                      <Text style={styles.badgeDesc}>{b.description}</Text>
                      <Text style={styles.badgeDate}>
                        {new Date(b.earnedAt).toLocaleDateString()}
                      </Text>
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(300)}>
              <View style={styles.sectionHeader}>
                <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.3)" />
                <Text style={styles.sectionLabel}>LOCKED BADGES</Text>
              </View>

              <View style={styles.badgeGrid}>
                {BADGE_DEFINITIONS.filter((d) => !earnedIds.has(d.id)).map((d, i) => (
                  <Animated.View
                    key={d.id}
                    entering={FadeInDown.duration(300).delay(i * 50)}
                    style={[styles.badgeCard, styles.badgeCardLocked]}
                  >
                    <Text style={[styles.badgeEmoji, { opacity: 0.3 }]}>❓</Text>
                    <Text style={[styles.badgeTitle, { color: "rgba(255,255,255,0.25)" }]}>
                      {d.title}
                    </Text>
                    <Text style={[styles.badgeDesc, { color: "rgba(255,255,255,0.15)" }]}>
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
  container: { flex: 1, backgroundColor: Colors.primary },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 8, zIndex: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  topTitle: {
    fontFamily: "Bangers_400Regular", fontSize: 24,
    color: "#FFD54F", letterSpacing: 2,
  },
  scrollContent: { paddingHorizontal: 20 },
  noProfile: {
    alignItems: "center", paddingVertical: 80, gap: 12,
  },
  noProfileTitle: { fontFamily: "Nunito_700Bold", fontSize: 20, color: "rgba(255,255,255,0.5)" },
  noProfileSub: {
    fontFamily: "Nunito_400Regular", fontSize: 14,
    color: "rgba(255,255,255,0.3)", textAlign: "center", paddingHorizontal: 32,
  },
  profileHeader: { alignItems: "center", marginBottom: 20, marginTop: 8 },
  profileAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,215,0,0.3)",
    marginBottom: 10,
  },
  profileAvatarText: { fontSize: 30 },
  profileName: { fontFamily: "Nunito_800ExtraBold", fontSize: 22, color: "#FFF" },
  statsRow: {
    flexDirection: "row", gap: 10, marginBottom: 24,
  },
  statCard: {
    flex: 1, alignItems: "center", paddingVertical: 14,
    borderRadius: 14, backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  statCardAccent: { borderColor: "#FFD54F40", backgroundColor: "rgba(255,213,79,0.06)" },
  statValue: { fontFamily: "Bangers_400Regular", fontSize: 28, color: "#FFD54F" },
  statLabel: { fontFamily: "Nunito_600SemiBold", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 0.5 },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  fireEmoji: { fontSize: 16 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginBottom: 14, marginTop: 8,
  },
  sectionLabel: {
    fontFamily: "Nunito_700Bold", fontSize: 12,
    color: "rgba(255,255,255,0.5)", letterSpacing: 2,
  },
  emptyBadges: {
    paddingVertical: 24, alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", marginBottom: 20,
  },
  emptyBadgeText: { fontFamily: "Nunito_500Medium", fontSize: 13, color: "rgba(255,255,255,0.3)" },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  badgeCard: {
    width: "47%" as any, alignItems: "center", gap: 4,
    paddingVertical: 16, paddingHorizontal: 12,
    borderRadius: 16, backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1.5, borderColor: "rgba(255,215,79,0.15)",
  },
  badgeCardLocked: { borderColor: "rgba(255,255,255,0.04)" },
  badgeEmoji: { fontSize: 32, marginBottom: 4 },
  badgeTitle: { fontFamily: "Nunito_700Bold", fontSize: 13, color: "#FFD54F", textAlign: "center" },
  badgeDesc: { fontFamily: "Nunito_400Regular", fontSize: 10, color: "rgba(255,255,255,0.4)", textAlign: "center" },
  badgeDate: { fontFamily: "Nunito_400Regular", fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 4 },
});
