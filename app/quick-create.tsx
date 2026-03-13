import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  TextInput,
  Animated as RNAnimated,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { StarField } from "@/components/StarField";
import Colors from "@/constants/colors";

const THEMES = [
  {
    id: "fantasy",
    label: "Fantasy",
    icon: "sparkles" as const,
    color: "#6366f1",
    heroId: "hero-1",
    emoji: "🧙",
  },
  {
    id: "space",
    label: "Space",
    icon: "planet" as const,
    color: "#3b82f6",
    heroId: "hero-3",
    emoji: "🚀",
  },
  {
    id: "ocean",
    label: "Ocean",
    icon: "water" as const,
    color: "#06b6d4",
    heroId: "hero-2",
    emoji: "🌊",
  },
  {
    id: "forest",
    label: "Forest",
    icon: "leaf" as const,
    color: "#22c55e",
    heroId: "hero-6",
    emoji: "🌿",
  },
  {
    id: "retro",
    label: "Retro",
    icon: "train" as const,
    color: "#f59e0b",
    heroId: "hero-7",
    emoji: "🌟",
  },
  {
    id: "fairy-tale",
    label: "Fairy Tale",
    icon: "moon" as const,
    color: "#a855f7",
    heroId: "hero-4",
    emoji: "🧚",
  },
];

const LENGTHS = [
  { id: "short", label: "Short", desc: "~5 min" },
  { id: "medium", label: "Medium", desc: "~10 min" },
  { id: "long", label: "Long", desc: "~15 min" },
];

const AGE_RANGES = ["2-4", "4-6", "6-8", "8-10"];

export default function QuickCreateScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [selectedTheme, setSelectedTheme] = useState("fantasy");
  const [childName, setChildName] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [storyLength, setStoryLength] = useState("medium");
  const [ageRange, setAgeRange] = useState("4-6");
  const [customPrompt, setCustomPrompt] = useState("");

  const advancedHeight = useRef(new RNAnimated.Value(0)).current;

  const toggleAdvanced = () => {
    Haptics.selectionAsync();
    const toValue = showAdvanced ? 0 : 1;
    RNAnimated.timing(advancedHeight, {
      toValue,
      duration: 280,
      useNativeDriver: false,
    }).start();
    setShowAdvanced(!showAdvanced);
  };

  const handleGenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const theme = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

    router.replace({
      pathname: "/story",
      params: {
        heroId: theme.heroId,
        mode: "classic",
        duration: storyLength,
        voice: "moonbeam",
        speed: "medium",
        isFirstStory: "true",
        ...(childName.trim() ? { childName: childName.trim() } : {}),
        ...(customPrompt.trim() ? { customPrompt: customPrompt.trim() } : {}),
      },
    });
  };

  const selectedThemeData = THEMES.find((t) => t.id === selectedTheme) || THEMES[0];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#02021a", "#05051e", "#0a0a2e"]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.8)" />
        </Pressable>
        <Text style={styles.screenTitle}>Quick Create</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + bottomInset }]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={styles.sectionLabel}>Choose a Theme</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themesScroll}
          >
            {THEMES.map((theme) => {
              const isSelected = selectedTheme === theme.id;
              return (
                <Pressable
                  key={theme.id}
                  style={[
                    styles.themeCard,
                    isSelected && { borderColor: theme.color, backgroundColor: `${theme.color}15` },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedTheme(theme.id);
                  }}
                  testID={`theme-${theme.id}`}
                >
                  <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                  <View style={[styles.themeIconBg, { backgroundColor: `${theme.color}20` }]}>
                    <Ionicons name={theme.icon} size={18} color={theme.color} />
                  </View>
                  <Text style={[styles.themeLabel, isSelected && { color: theme.color }]}>
                    {theme.label}
                  </Text>
                  {isSelected && (
                    <View style={[styles.themeCheck, { backgroundColor: theme.color }]}>
                      <Ionicons name="checkmark" size={11} color="#FFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.nameSection}>
          <Text style={styles.sectionLabel}>Child's Name</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.3)" style={styles.inputIcon} />
            <TextInput
              style={styles.nameInput}
              placeholder="Enter name (optional)..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={childName}
              onChangeText={setChildName}
              autoCapitalize="words"
              returnKeyType="done"
              testID="child-name-input"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <Pressable onPress={toggleAdvanced} style={styles.advancedToggle}>
            <Text style={styles.advancedToggleText}>Advanced Options</Text>
            <Ionicons
              name={showAdvanced ? "chevron-up" : "chevron-down"}
              size={16}
              color="rgba(255,255,255,0.4)"
            />
          </Pressable>

          <RNAnimated.View
            style={{
              overflow: "hidden",
              maxHeight: advancedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 500],
              }),
              opacity: advancedHeight,
            }}
          >
            <View style={styles.advancedSection}>
              <Text style={styles.advancedLabel}>Story Length</Text>
              <View style={styles.pillRow}>
                {LENGTHS.map((len) => (
                  <Pressable
                    key={len.id}
                    style={[
                      styles.pill,
                      storyLength === len.id && styles.pillActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setStoryLength(len.id);
                    }}
                  >
                    <Text style={[styles.pillText, storyLength === len.id && styles.pillTextActive]}>
                      {len.label}
                    </Text>
                    <Text style={[styles.pillDesc, storyLength === len.id && { color: Colors.accent }]}>
                      {len.desc}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.advancedLabel, { marginTop: 16 }]}>Age Range</Text>
              <View style={styles.pillRowSmall}>
                {AGE_RANGES.map((range) => (
                  <Pressable
                    key={range}
                    style={[
                      styles.pillSmall,
                      ageRange === range && styles.pillActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setAgeRange(range);
                    }}
                  >
                    <Text style={[styles.pillTextSmall, ageRange === range && styles.pillTextActive]}>
                      {range}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.advancedLabel, { marginTop: 16 }]}>Custom Story Idea</Text>
              <TextInput
                style={styles.customPromptInput}
                placeholder="Add a special twist, character, or scene..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={customPrompt}
                onChangeText={setCustomPrompt}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </RNAnimated.View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.duration(500).delay(300)}
        style={[styles.bottomCTA, { paddingBottom: bottomInset + 16 }]}
      >
        <LinearGradient
          colors={["transparent", "rgba(2,2,26,0.98)"]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedInfoEmoji}>{selectedThemeData.emoji}</Text>
          <Text style={styles.selectedInfoText}>
            {selectedThemeData.label} · {LENGTHS.find((l) => l.id === storyLength)?.label}
            {childName.trim() ? ` · For ${childName.trim()}` : ""}
          </Text>
        </View>
        <Pressable
          onPress={handleGenerate}
          style={({ pressed }) => [
            styles.generateBtn,
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
          testID="generate-story-btn"
        >
          <LinearGradient
            colors={[selectedThemeData.color, shadeColor(selectedThemeData.color, -20)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.generateBtnGradient}
          >
            <Ionicons name="sparkles" size={20} color="#FFF" />
            <Text style={styles.generateBtnText}>Generate Story</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function shadeColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#02021a" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  screenTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 0,
  },
  sectionLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  themesScroll: {
    paddingRight: 20,
    gap: 10,
    flexDirection: "row",
    paddingBottom: 4,
  },
  themeCard: {
    width: 96,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  themeEmoji: { fontSize: 22 },
  themeIconBg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  themeLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
  themeCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  nameSection: { marginTop: 24 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    gap: 10,
  },
  inputIcon: { marginRight: 2 },
  nameInput: {
    flex: 1,
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 15,
    color: "#FFFFFF",
    paddingVertical: 14,
  },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  advancedToggleText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
  },
  advancedSection: {
    paddingTop: 12,
    gap: 0,
  },
  advancedLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  pillRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  pill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  pillActive: {
    backgroundColor: `${Colors.accent}15`,
    borderColor: `${Colors.accent}50`,
  },
  pillText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
  pillDesc: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    marginTop: 2,
  },
  pillTextActive: { color: Colors.accent },
  pillRowSmall: { flexDirection: "row", gap: 8 },
  pillSmall: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  pillTextSmall: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  customPromptInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    padding: 12,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "#FFFFFF",
    minHeight: 80,
  },
  bottomCTA: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 50,
    gap: 10,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  selectedInfoEmoji: { fontSize: 16 },
  selectedInfoText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  generateBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  generateBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  generateBtnText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
    color: "#FFF",
  },
});
