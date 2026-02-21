import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
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

const MADLIB_FIELDS = [
  { key: "adjective", label: "A Silly Adjective", placeholder: "e.g. sparkly, wobbly, gigantic", icon: "color-palette-outline" as const },
  { key: "animal", label: "A Funny Animal", placeholder: "e.g. penguin, dragon, unicorn", icon: "paw-outline" as const },
  { key: "place", label: "A Magical Place", placeholder: "e.g. candy mountain, cloud castle", icon: "map-outline" as const },
  { key: "superpower", label: "A Silly Superpower", placeholder: "e.g. turning invisible, super burping", icon: "flash-outline" as const },
  { key: "sound", label: "A Funny Sound", placeholder: "e.g. boing, splat, whoooosh", icon: "volume-high-outline" as const },
  { key: "food", label: "A Yummy Food", placeholder: "e.g. pizza, rainbow cake, tacos", icon: "restaurant-outline" as const },
];

export default function MadLibsScreen() {
  const { heroId, duration, voice, speed } = useLocalSearchParams<{
    heroId: string;
    duration: string;
    voice: string;
    speed: string;
  }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [words, setWords] = useState<Record<string, string>>({});
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const hero = HEROES.find((h) => h.id === heroId);

  if (!hero) {
    router.back();
    return null;
  }

  const filledCount = Object.values(words).filter((v) => v.trim().length > 0).length;
  const allFilled = filledCount >= 3;

  const handleGenerate = () => {
    if (!allFilled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const cleanWords: Record<string, string> = {};
    for (const field of MADLIB_FIELDS) {
      if (words[field.key]?.trim()) {
        cleanWords[field.key] = words[field.key].trim();
      }
    }

    router.push({
      pathname: "/story",
      params: {
        heroId: hero.id,
        duration,
        voice,
        mode: "madlibs",
        madlibWords: JSON.stringify(cleanWords),
        speed: speed || "medium",
      },
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#BF360C", Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeIn.duration(600)} style={styles.headerArea}>
            <View style={styles.madlibBadge}>
              <Ionicons name="happy" size={20} color="#FF8A65" />
              <Text style={styles.madlibBadgeText}>Mad Libs Mode</Text>
            </View>
            <Text style={styles.headerTitle}>Fill in the Blanks!</Text>
            <Text style={styles.headerSubtitle}>
              Type silly words and {hero.name} will use them in your story
            </Text>
          </Animated.View>

          {MADLIB_FIELDS.map((field, index) => (
            <Animated.View
              key={field.key}
              entering={FadeInDown.duration(400).delay(index * 60)}
              style={styles.fieldContainer}
            >
              <View style={styles.fieldLabelRow}>
                <Ionicons name={field.icon} size={16} color="#FF8A65" />
                <Text style={styles.fieldLabel}>{field.label}</Text>
              </View>
              <TextInput
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.fieldInput,
                  words[field.key]?.trim() ? styles.fieldInputFilled : null,
                ]}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.textMuted}
                value={words[field.key] || ""}
                onChangeText={(text) =>
                  setWords((prev) => ({ ...prev, [field.key]: text }))
                }
                returnKeyType={index < MADLIB_FIELDS.length - 1 ? "next" : "done"}
                onSubmitEditing={() => {
                  if (index < MADLIB_FIELDS.length - 1) {
                    inputRefs.current[index + 1]?.focus();
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Animated.View>
          ))}

          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {filledCount} of {MADLIB_FIELDS.length} words filled
            </Text>
            <Text style={styles.progressHint}>
              (at least 3 required)
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 20 }]}>
        <Pressable
          onPress={handleGenerate}
          disabled={!allFilled}
          style={({ pressed }) => [
            styles.startButton,
            !allFilled && styles.startButtonDisabled,
            { transform: [{ scale: pressed && allFilled ? 0.96 : 1 }] },
          ]}
          testID="madlibs-generate-button"
        >
          <LinearGradient
            colors={allFilled ? ["#FF8A65", "#E64A19"] : ["#333", "#444"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButtonGradient}
          >
            <Ionicons name="sparkles" size={20} color="#FFF" />
            <Text style={styles.startButtonText}>Create Silly Story</Text>
          </LinearGradient>
        </Pressable>
      </View>
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
    marginBottom: 24,
  },
  madlibBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 138, 101, 0.12)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 14,
  },
  madlibBadgeText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: "#FF8A65",
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
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: Colors.textPrimary,
  },
  fieldInput: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
  },
  fieldInputFilled: {
    borderColor: "#FF8A65",
    backgroundColor: "rgba(255, 138, 101, 0.06)",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  progressText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#FF8A65",
  },
  progressHint: {
    fontFamily: "Nunito_400Regular",
    fontSize: 12,
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
    shadowColor: "#FF8A65",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  startButtonDisabled: {
    opacity: 0.5,
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
    color: "#FFF",
  },
});
