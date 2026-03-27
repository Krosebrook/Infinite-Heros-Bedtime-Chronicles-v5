import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { ParentControls, DEFAULT_PARENT_CONTROLS, CONTENT_THEMES } from "@/constants/types";
import { getParentControls, saveParentControls, hashPin, generatePinSalt, isPinLockedOut, recordFailedPinAttempt, resetPinAttempts } from "@/lib/storage";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const LOCKOUT_DURATION_MS = 30 * 1000;

const STORY_LENGTHS = [
  { id: "short", label: "Short", desc: "~3 min" },
  { id: "medium-short", label: "Med Short", desc: "~5 min" },
  { id: "medium", label: "Medium", desc: "~8 min" },
  { id: "long", label: "Long", desc: "~12 min" },
  { id: "epic", label: "Epic", desc: "~15+ min" },
];

export function ParentControlsModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [controls, setControls] = useState<ParentControls>(DEFAULT_PARENT_CONTROLS);
  const [pinInput, setPinInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [lockedOut, setLockedOut] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    if (visible) {
      getParentControls().then((c) => {
        setControls(c);
        if (!c.pinCode) {
          setUnlocked(true);
        } else {
          setUnlocked(false);
          setPinInput("");
        }
      });
    }
  }, [visible]);

  useEffect(() => {
    if (!lockedOut) return;
    const interval = setInterval(() => {
      const remaining = controls.lockoutUntil - Date.now();
      if (remaining <= 0) {
        setLockedOut(false);
        setLockoutRemaining(0);
      } else {
        setLockoutRemaining(Math.ceil(remaining / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedOut, controls.lockoutUntil]);

  const handleUnlock = async () => {
    if (isPinLockedOut(controls)) {
      setLockedOut(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const inputHash = await hashPin(pinInput, controls.pinSalt);
    if (inputHash === controls.pinCode) {
      setUnlocked(true);
      const updated = await resetPinAttempts(controls);
      setControls(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      const updated = await recordFailedPinAttempt(controls);
      setControls(updated);
      if (isPinLockedOut(updated)) {
        setLockedOut(true);
        setLockoutRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPinInput("");
    }
  };

  const update = <K extends keyof ParentControls>(key: K, value: ParentControls[K]) => {
    Haptics.selectionAsync();
    const updated = { ...controls, [key]: value };
    setControls(updated);
    saveParentControls(updated);
  };

  const toggleTheme = (themeId: string) => {
    const current = controls.allowedThemes;
    const updated = current.includes(themeId)
      ? current.filter((t) => t !== themeId)
      : [...current, themeId];
    if (updated.length === 0) return;
    update("allowedThemes", updated);
  };

  const handleSetPin = async () => {
    if (pinInput.length < 4) return;
    const salt = await generatePinSalt();
    const hash = await hashPin(pinInput, salt);
    const updated = { ...controls, pinCode: hash, pinSalt: salt, failedAttempts: 0, lockoutUntil: 0 };
    setControls(updated);
    saveParentControls(updated);
    setPinInput("");
    setShowPinSetup(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRemovePin = () => {
    const updated = { ...controls, pinCode: '', pinSalt: '', failedAttempts: 0, lockoutUntil: 0 };
    setControls(updated);
    saveParentControls(updated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const adjustTime = (field: "bedtimeHour" | "bedtimeMinute", delta: number) => {
    if (field === "bedtimeHour") {
      const next = (controls.bedtimeHour + delta + 24) % 24;
      update("bedtimeHour", next);
    } else {
      const next = (controls.bedtimeMinute + delta + 60) % 60;
      update("bedtimeMinute", next);
    }
  };

  const formatTime = () => {
    const h = controls.bedtimeHour;
    const m = controls.bedtimeMinute;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
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
          <Text style={styles.headerTitle}>Parent Controls</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close parent controls" accessibilityRole="button">
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        {!unlocked ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.pinScreen}>
            <Ionicons name="lock-closed" size={48} color={Colors.accent} />
            <Text style={styles.pinTitle}>Enter PIN</Text>
            <Text style={styles.pinSubtitle}>Enter your 4-digit PIN to access parent controls</Text>
            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={setPinInput}
              maxLength={4}
              keyboardType="number-pad"
              secureTextEntry
              placeholder="****"
              placeholderTextColor="rgba(255,255,255,0.2)"
              testID="parent-pin-input"
              accessibilityLabel="Enter 4 digit PIN"
              accessibilityRole="none"
            />
            {lockedOut ? (
              <Text style={styles.lockoutText}>
                Too many attempts. Try again in {lockoutRemaining}s
              </Text>
            ) : (
              <Pressable onPress={handleUnlock} style={styles.unlockBtn} accessibilityLabel="Unlock parent controls" accessibilityRole="button">
                <Text style={styles.unlockBtnText}>Unlock</Text>
              </Pressable>
            )}
          </Animated.View>
        ) : (
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>MAX STORY LENGTH</Text>
            <Text style={styles.sectionHint}>Limit how long stories can be</Text>
            <View style={styles.optionRow}>
              {STORY_LENGTHS.map((sl) => {
                const isActive = controls.maxStoryLength === sl.id;
                return (
                  <Pressable
                    key={sl.id}
                    onPress={() => update("maxStoryLength", sl.id)}
                    style={[styles.optionPill, isActive && styles.optionPillActive]}
                    accessibilityLabel={`Story length: ${sl.label}${isActive ? ", selected" : ""}`}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                      {sl.label}
                    </Text>
                    <Text style={styles.optionDesc}>{sl.desc}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>BEDTIME REMINDER</Text>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Enable Bedtime Reminder</Text>
                <Text style={styles.toggleDesc}>Gently remind when it&apos;s time for bed</Text>
              </View>
              <Switch
                value={controls.bedtimeEnabled}
                onValueChange={(val) => update("bedtimeEnabled", val)}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: Colors.accent }}
                thumbColor="#FFF"
                accessibilityLabel="Enable Bedtime Reminder"
                accessibilityRole="switch"
              />
            </View>

            {controls.bedtimeEnabled && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.timeRow}>
                <Text style={styles.timeLabel}>Bedtime</Text>
                <View style={styles.timeControls}>
                  <Pressable onPress={() => adjustTime("bedtimeHour", -1)} style={styles.timeBtn} accessibilityLabel="Decrease hour" accessibilityRole="button">
                    <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                  <Text style={styles.timeDisplay}>{formatTime()}</Text>
                  <Pressable onPress={() => adjustTime("bedtimeHour", 1)} style={styles.timeBtn} accessibilityLabel="Increase hour" accessibilityRole="button">
                    <Ionicons name="chevron-up" size={18} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>
                <View style={styles.timeControls}>
                  <Pressable onPress={() => adjustTime("bedtimeMinute", -15)} style={styles.timeBtn} accessibilityLabel="Decrease minute" accessibilityRole="button">
                    <Ionicons name="remove" size={16} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                  <Text style={styles.timeMinLabel}>Min</Text>
                  <Pressable onPress={() => adjustTime("bedtimeMinute", 15)} style={styles.timeBtn} accessibilityLabel="Increase minute" accessibilityRole="button">
                    <Ionicons name="add" size={16} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>
              </Animated.View>
            )}

            <Text style={styles.sectionTitle}>CONTENT THEMES</Text>
            <Text style={styles.sectionHint}>Choose which story themes are allowed</Text>
            <View style={styles.themeGrid}>
              {CONTENT_THEMES.map((t) => {
                const isActive = controls.allowedThemes.includes(t.id);
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => toggleTheme(t.id)}
                    style={[styles.themeCard, isActive && styles.themeCardActive]}
                    accessibilityLabel={`Theme: ${t.label}${isActive ? ", selected" : ""}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.themeEmoji}>{t.emoji}</Text>
                    <Text style={[styles.themeLabel, isActive && styles.themeLabelActive]}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>AI VIDEO CLIPS</Text>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Enable Video Scenes</Text>
                <Text style={styles.toggleDesc}>Generate short animated clips during stories (uses OpenAI Sora 2, costs apply)</Text>
              </View>
              <Switch
                value={controls.videoEnabled}
                onValueChange={(val) => update("videoEnabled", val)}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: Colors.accent }}
                thumbColor="#FFF"
                accessibilityLabel="Enable Video Scenes"
                accessibilityRole="switch"
              />
            </View>

            <Text style={styles.sectionTitle}>PIN PROTECTION</Text>
            {controls.pinCode ? (
              <View style={styles.pinStatus}>
                <Ionicons name="shield-checkmark" size={20} color="#66BB6A" />
                <Text style={styles.pinStatusText}>PIN is set</Text>
                <Pressable onPress={handleRemovePin} style={styles.removePinBtn} accessibilityLabel="Remove PIN" accessibilityRole="button">
                  <Text style={styles.removePinText}>Remove PIN</Text>
                </Pressable>
              </View>
            ) : showPinSetup ? (
              <View style={styles.pinSetupRow}>
                <TextInput
                  style={styles.pinSetupInput}
                  value={pinInput}
                  onChangeText={setPinInput}
                  maxLength={4}
                  keyboardType="number-pad"
                  placeholder="Set 4-digit PIN"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry
                />
                <Pressable
                  onPress={handleSetPin}
                  disabled={pinInput.length < 4}
                  style={[styles.setPinBtn, pinInput.length < 4 && { opacity: 0.4 }]}
                  accessibilityLabel="Set PIN"
                  accessibilityRole="button"
                >
                  <Text style={styles.setPinBtnText}>Set</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => setShowPinSetup(true)} style={styles.addPinBtn} accessibilityLabel="Set a PIN" accessibilityRole="button">
                <Ionicons name="lock-open-outline" size={18} color={Colors.accent} />
                <Text style={styles.addPinText}>Set a PIN</Text>
              </Pressable>
            )}
          </KeyboardAwareScrollViewCompat>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  headerTitle: { fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: 22, color: "#FFF" },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  pinScreen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 40 },
  pinTitle: { fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: 24, color: "#FFF" },
  pinSubtitle: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "rgba(255,255,255,0.5)", textAlign: "center" },
  pinInput: {
    width: 160, textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16,
    paddingVertical: 16, fontFamily: "PlusJakartaSans_700Bold", fontSize: 28,
    color: "#FFF", letterSpacing: 12,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.1)",
  },
  unlockBtn: {
    paddingHorizontal: 40, paddingVertical: 14,
    borderRadius: 24, backgroundColor: Colors.accent,
  },
  unlockBtnText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: "#FFF" },
  lockoutText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: "#EF5350", textAlign: "center" },
  scrollContent: { paddingHorizontal: 20 },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold", fontSize: 12,
    color: "rgba(255,255,255,0.5)", letterSpacing: 2,
    marginBottom: 6, marginTop: 24,
  },
  sectionHint: {
    fontFamily: "PlusJakartaSans_400Regular", fontSize: 12,
    color: "rgba(255,255,255,0.3)", marginBottom: 12,
  },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionPill: {
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  optionPillActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}18` },
  optionLabel: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 13, color: "rgba(255,255,255,0.5)" },
  optionLabelActive: { color: Colors.accent },
  optionDesc: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 },
  toggleRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 12,
  },
  toggleLabel: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: "rgba(255,255,255,0.8)" },
  toggleDesc: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 },
  timeRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 12,
  },
  timeLabel: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: "rgba(255,255,255,0.6)", flex: 1 },
  timeControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  timeDisplay: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: Colors.accent, minWidth: 80, textAlign: "center" },
  timeMinLabel: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: "rgba(255,255,255,0.4)" },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  themeCard: {
    alignItems: "center", gap: 6,
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 14, backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.06)",
    minWidth: 90,
  },
  themeCardActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}12` },
  themeEmoji: { fontSize: 24 },
  themeLabel: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: "rgba(255,255,255,0.5)" },
  themeLabelActive: { color: Colors.accent },
  pinStatus: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  pinStatusText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: "rgba(255,255,255,0.6)", flex: 1 },
  removePinBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "rgba(255,100,100,0.15)" },
  removePinText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 12, color: "#EF5350" },
  pinSetupRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  pinSetupInput: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: "#FFF",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.08)",
    letterSpacing: 8, textAlign: "center",
  },
  setPinBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: Colors.accent },
  setPinBtnText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 14, color: "#FFF" },
  addPinBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: `${Colors.accent}40`,
  },
  addPinText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: Colors.accent },
});
