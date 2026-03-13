import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StarField } from "@/components/StarField";
import Colors from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ONBOARDING_KEY = "@infinity_heroes_onboarding_complete";

function PulsingOrb({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0.5, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.orbWrap,
        { backgroundColor: `${color}18`, borderColor: `${color}30` },
        animStyle,
      ]}
    >
      <View style={[styles.orbInner, { backgroundColor: `${color}12` }]}>
        <Ionicons name="sparkles" size={52} color={color} />
      </View>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(tabs)");
  };

  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/quick-create");
  };

  const handleLibrary = () => {
    Haptics.selectionAsync();
    router.replace("/(tabs)/library");
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#02021a", "#05051e", "#0a0a2e", "#05051e"]}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <View style={[styles.topRow, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={handleSkip} hitSlop={12} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" />
        </Pressable>
      </View>

      <View style={styles.heroSection}>
        <Animated.View entering={FadeIn.duration(800)}>
          <PulsingOrb color="#6366f1" />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.titleWrap}>
          <Text style={styles.tagline}>✨ INFINITY HEROES</Text>
          <Text style={styles.headline}>Bedtime stories{"\n"}made magical</Text>
          <Text style={styles.subtext}>
            AI-powered adventures tailored for your child — ready in seconds.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.featureRow}>
          {[
            { icon: "sparkles", label: "AI Stories", color: "#6366f1" },
            { icon: "headset", label: "Narration", color: "#A855F7" },
            { icon: "image", label: "Illustrations", color: "#06b6d4" },
          ].map((f) => (
            <View key={f.label} style={styles.featureChip}>
              <View style={[styles.featureIconWrap, { backgroundColor: `${f.color}18` }]}>
                <Ionicons name={f.icon as any} size={16} color={f.color} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInUp.duration(600).delay(500)}
        style={[styles.ctaSection, { paddingBottom: bottomInset + 24 }]}
      >
        <Pressable
          onPress={handleCreate}
          style={({ pressed }) => [
            styles.primaryBtn,
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
          testID="create-first-story-btn"
        >
          <LinearGradient
            colors={["#6366f1", "#4f46e5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            <Ionicons name="sparkles" size={20} color="#FFF" />
            <Text style={styles.primaryBtnText}>Create My First Story</Text>
            <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={handleLibrary}
          hitSlop={8}
          style={styles.secondaryBtn}
          testID="explore-library-btn"
        >
          <Text style={styles.secondaryBtnText}>Explore Library</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#02021a" },
  topRow: {
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  skipText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
  },
  heroSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 28,
  },
  orbWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  orbInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: { alignItems: "center", gap: 10 },
  tagline: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 11,
    color: Colors.accent,
    letterSpacing: 2.5,
  },
  headline: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 34,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  subtext: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 4,
  },
  featureRow: {
    flexDirection: "row",
    gap: 10,
  },
  featureChip: {
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
  },
  ctaSection: {
    paddingHorizontal: 24,
    gap: 14,
    paddingTop: 8,
  },
  primaryBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 28,
  },
  primaryBtnText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    color: "#FFF",
    flex: 1,
    textAlign: "center",
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  secondaryBtnText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textDecorationLine: "underline",
  },
});
