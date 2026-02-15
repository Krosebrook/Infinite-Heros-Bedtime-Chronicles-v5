import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
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

function FloatingStar({ delay, x, y }: { delay: number; x: number; y: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: `${x}%` as any,
          top: `${y}%` as any,
        },
        animStyle,
      ]}
    >
      <Ionicons name="star" size={16} color={Colors.accent} />
    </Animated.View>
  );
}

export default function CompletionScreen() {
  const { heroId, storyTitle, mode } = useLocalSearchParams<{
    heroId: string;
    storyTitle: string;
    mode: string;
  }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const hero = HEROES.find((h) => h.id === heroId);
  const isMadLibs = mode === "madlibs";

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleNewStory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.dismissAll();
  };

  const handleGoHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.dismissAll();
  };

  if (!hero) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Pressable onPress={() => router.dismissAll()}>
          <Text style={styles.linkText}>Go Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A0520", "#0B1026", "#080D1E"]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <FloatingStar delay={0} x={15} y={25} />
      <FloatingStar delay={300} x={75} y={18} />
      <FloatingStar delay={600} x={25} y={55} />
      <FloatingStar delay={900} x={80} y={45} />
      <FloatingStar delay={1200} x={50} y={70} />
      <FloatingStar delay={200} x={60} y={30} />
      <FloatingStar delay={800} x={35} y={40} />

      <View style={[styles.content, { paddingTop: topInset + 40, paddingBottom: bottomInset + 40 }]}>
        <Animated.View entering={FadeIn.duration(1000)} style={styles.heroArea}>
          <View style={styles.completionRing}>
            <View style={styles.completionRingInner}>
              <LinearGradient
                colors={hero.gradient}
                style={styles.heroCircle}
              >
                <Ionicons name={hero.iconName as any} size={56} color={hero.color} />
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.textArea}>
          <Text style={styles.completionLabel}>
            {isMadLibs ? "THAT WAS HILARIOUS!" : "STORY COMPLETE"}
          </Text>
          <Text style={styles.completionTitle}>
            {isMadLibs ? "Great Job, Storyteller!" : "Sweet Dreams Await"}
          </Text>
          {storyTitle ? (
            <Text style={styles.storyTitleRef}>"{storyTitle}"</Text>
          ) : null}
          <Text style={styles.completionSubtitle}>
            {isMadLibs
              ? `${hero.name} loved your silly words! Ready for another hilarious adventure?`
              : `${hero.name} has finished tonight's tale. Time to close your eyes and drift into dreamland.`}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(800)} style={styles.actionsArea}>
          <Pressable
            onPress={handleNewStory}
            style={({ pressed }) => [
              styles.primaryButton,
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
            testID="new-story-button"
          >
            <LinearGradient
              colors={[Colors.accent, "#E5A825"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="sparkles" size={20} color={Colors.primary} />
              <Text style={styles.primaryButtonText}>New Adventure</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleGoHome}
            style={({ pressed }) => [
              styles.secondaryButton,
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
          >
            <Ionicons name="home-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>Back Home</Text>
          </Pressable>
        </Animated.View>
      </View>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  heroArea: {
    marginBottom: 32,
  },
  completionRing: {
    padding: 6,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: "rgba(245, 197, 66, 0.3)",
  },
  completionRingInner: {
    padding: 4,
    borderRadius: 74,
    borderWidth: 1,
    borderColor: "rgba(245, 197, 66, 0.15)",
  },
  heroCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: {
    alignItems: "center",
    marginBottom: 40,
  },
  completionLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: Colors.accent,
    letterSpacing: 3,
    marginBottom: 12,
  },
  completionTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 32,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  storyTitleRef: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 16,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 16,
  },
  completionSubtitle: {
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  actionsArea: {
    width: "100%",
    gap: 14,
  },
  primaryButton: {
    borderRadius: 28,
    overflow: "hidden",
    elevation: 6,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  primaryButtonText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    color: Colors.primary,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  secondaryButtonText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 16,
    color: Colors.textSecondary,
  },
  linkText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
    color: Colors.accent,
  },
});
