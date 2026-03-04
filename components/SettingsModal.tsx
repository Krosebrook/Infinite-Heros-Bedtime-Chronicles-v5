import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { UserPreferences, DEFAULT_PREFERENCES } from "@/constants/types";
import { getPreferences, savePreferences } from "@/lib/storage";

type Tab = "general" | "voice" | "accessibility";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "general", label: "General", icon: "settings-outline" },
  { id: "voice", label: "Voice", icon: "mic-outline" },
  { id: "accessibility", label: "Access", icon: "accessibility-outline" },
];

const STORY_LENGTHS = [
  { id: "short", label: "Short", desc: "~3 min" },
  { id: "medium-short", label: "Medium Short", desc: "~5 min" },
  { id: "medium", label: "Medium", desc: "~8 min" },
  { id: "long", label: "Long", desc: "~12 min" },
  { id: "epic", label: "Epic", desc: "~15+ min" },
];

const VOICES = [
  { id: "Kore", label: "Kore", desc: "Soothing" },
  { id: "Aoede", label: "Aoede", desc: "Melodic" },
  { id: "Zephyr", label: "Zephyr", desc: "Gentle" },
  { id: "Leda", label: "Leda", desc: "Ethereal" },
  { id: "Puck", label: "Puck", desc: "Playful" },
  { id: "Charon", label: "Charon", desc: "Deep" },
  { id: "Fenrir", label: "Fenrir", desc: "Bold" },
];

const SLEEP_THEMES = [
  { id: "Cloud Kingdom", label: "Cloud Kingdom" },
  { id: "Starlit Ocean", label: "Starlit Ocean" },
  { id: "Moonlit Forest", label: "Moonlit Forest" },
  { id: "Crystal Cave", label: "Crystal Cave" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [tab, setTab] = useState<Tab>("general");
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    if (visible) {
      getPreferences().then(setPrefs).catch((e) => console.error("Failed to load preferences:", e));
    }
  }, [visible]);

  const updatePref = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    Haptics.selectionAsync();
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    savePreferences(updated);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        <View style={styles.tabRow}>
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTab(t.id);
                }}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
              >
                <Ionicons
                  name={t.icon as any}
                  size={18}
                  color={isActive ? Colors.accent : "rgba(255,255,255,0.4)"}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {tab === "general" && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.sectionTitle}>Default Story Length</Text>
              <View style={styles.optionGrid}>
                {STORY_LENGTHS.map((sl) => {
                  const isActive = prefs.storyLength === sl.id;
                  return (
                    <Pressable
                      key={sl.id}
                      onPress={() => updatePref("storyLength", sl.id)}
                      style={[styles.optionCard, isActive && styles.optionCardActive]}
                    >
                      <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                        {sl.label}
                      </Text>
                      <Text style={styles.optionDesc}>{sl.desc}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.sectionTitle}>Sleep Theme</Text>
              <View style={styles.optionGrid}>
                {SLEEP_THEMES.map((st) => {
                  const isActive = prefs.sleepTheme === st.id;
                  return (
                    <Pressable
                      key={st.id}
                      onPress={() => updatePref("sleepTheme", st.id)}
                      style={[styles.optionCard, isActive && styles.optionCardActive]}
                    >
                      <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                        {st.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {tab === "voice" && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.sectionTitle}>Narrator Voice</Text>
              <View style={styles.voiceList}>
                {VOICES.map((v) => {
                  const isActive = prefs.narratorVoice === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => updatePref("narratorVoice", v.id)}
                      style={[styles.voiceRow, isActive && styles.voiceRowActive]}
                    >
                      <View style={[styles.voiceRadio, isActive && styles.voiceRadioActive]}>
                        {isActive && <View style={styles.voiceRadioDot} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.voiceName, isActive && { color: "#FFF" }]}>{v.label}</Text>
                        <Text style={styles.voiceDesc}>{v.desc}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Mute All Audio</Text>
                  <Text style={styles.toggleDesc}>Turn off narration and sounds</Text>
                </View>
                <Switch
                  value={prefs.isMuted}
                  onValueChange={(val) => updatePref("isMuted", val)}
                  trackColor={{ false: "rgba(255,255,255,0.1)", true: Colors.accent }}
                  thumbColor="#FFF"
                />
              </View>
            </Animated.View>
          )}

          {tab === "accessibility" && (
            <Animated.View entering={FadeIn.duration(300)}>
              <Text style={styles.sectionTitle}>Text Size</Text>
              <View style={styles.optionGrid}>
                {(["normal", "large"] as const).map((size) => {
                  const isActive = prefs.fontSize === size;
                  return (
                    <Pressable
                      key={size}
                      onPress={() => updatePref("fontSize", size)}
                      style={[styles.optionCard, isActive && styles.optionCardActive, { flex: 1 }]}
                    >
                      <Text style={[
                        styles.optionLabel,
                        isActive && styles.optionLabelActive,
                        size === "large" && { fontSize: 18 },
                      ]}>
                        {size === "normal" ? "Normal" : "Large"}
                      </Text>
                      <Text style={styles.optionDesc}>
                        {size === "normal" ? "Standard reading size" : "Easier to read"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Reduced Motion</Text>
                  <Text style={styles.toggleDesc}>Minimize animations and transitions</Text>
                </View>
                <Switch
                  value={prefs.reducedMotion}
                  onValueChange={(val) => updatePref("reducedMotion", val)}
                  trackColor={{ false: "rgba(255,255,255,0.1)", true: Colors.accent }}
                  thumbColor="#FFF"
                />
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 24,
    color: "#FFF",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tabItemActive: {
    backgroundColor: `${Colors.accent}18`,
    borderColor: Colors.accent,
  },
  tabLabel: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  tabLabelActive: {
    color: Colors.accent,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 8,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
    minWidth: 90,
    alignItems: "center",
  },
  optionCardActive: {
    borderColor: Colors.accent,
    backgroundColor: `${Colors.accent}12`,
  },
  optionLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  optionLabelActive: {
    color: Colors.accent,
  },
  optionDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    marginTop: 2,
  },
  voiceList: {
    gap: 8,
    marginBottom: 24,
  },
  voiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  voiceRowActive: {
    borderColor: Colors.accent,
    backgroundColor: `${Colors.accent}10`,
  },
  voiceRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceRadioActive: {
    borderColor: Colors.accent,
  },
  voiceRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  voiceName: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
  },
  voiceDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 16,
  },
  toggleLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
  },
  toggleDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    marginTop: 2,
  },
});
