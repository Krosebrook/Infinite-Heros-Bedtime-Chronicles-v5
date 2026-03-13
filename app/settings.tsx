import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { StarField } from "@/components/StarField";
import Colors from "@/constants/colors";
import { useSettings, AppSettings } from "@/lib/SettingsContext";

const VOICES = [
  { id: "moonbeam", label: "Moonbeam" },
  { id: "stargazer", label: "Stargazer" },
  { id: "dreamweaver", label: "Dreamweaver" },
  { id: "whisperwind", label: "Whisper Wind" },
];

const SPEED_OPTIONS = [
  { id: 0.5, label: "0.5×" },
  { id: 0.75, label: "0.75×" },
  { id: 1.0, label: "1×" },
  { id: 1.25, label: "1.25×" },
  { id: 1.5, label: "1.5×" },
  { id: 2.0, label: "2×" },
];

const TEXT_SIZES: Array<AppSettings["textSize"]> = ["small", "medium", "large"];
const SORT_ORDERS: Array<{ id: AppSettings["librarySortOrder"]; label: string }> = [
  { id: "recent", label: "Most Recent" },
  { id: "alphabetical", label: "A–Z" },
  { id: "theme", label: "By Theme" },
];
const AGE_RANGES: Array<AppSettings["ageRange"]> = ["2-4", "4-6", "6-8", "8-10"];
const STORY_LENGTHS: Array<{ id: AppSettings["storyLength"]; label: string; desc: string }> = [
  { id: "short", label: "Short", desc: "~300 words" },
  { id: "medium", label: "Medium", desc: "~600 words" },
  { id: "long", label: "Long", desc: "~1000 words" },
];
const THEMES = [
  { id: "fantasy", label: "Fantasy" },
  { id: "space", label: "Space" },
  { id: "ocean", label: "Ocean" },
  { id: "forest", label: "Forest" },
  { id: "retro", label: "Retro" },
  { id: "fairy-tale", label: "Fairy Tale" },
];

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>
        <Ionicons name={icon as any} size={16} color={Colors.accent} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function SettingRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <View style={[styles.settingRow, last && styles.settingRowLast]}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingControl}>{children}</View>
    </View>
  );
}

function ChipSelector<T extends string | number>({
  options,
  selected,
  onSelect,
  getLabel,
}: {
  options: T[];
  selected: T;
  onSelect: (v: T) => void;
  getLabel?: (v: T) => string;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <Pressable
          key={String(opt)}
          style={[styles.chip, selected === opt && styles.chipActive]}
          onPress={() => {
            Haptics.selectionAsync();
            onSelect(opt);
          }}
        >
          <Text style={[styles.chipText, selected === opt && styles.chipTextActive]}>
            {getLabel ? getLabel(opt) : String(opt)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const levels = [20, 40, 60, 80, 100];
  return (
    <View style={styles.volumeRow}>
      <Ionicons name="volume-low-outline" size={14} color="rgba(255,255,255,0.35)" />
      <View style={styles.volumeTrack}>
        {levels.map((level) => (
          <Pressable
            key={level}
            style={[
              styles.volumeSegment,
              value >= level && { backgroundColor: Colors.accent },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(level);
            }}
          />
        ))}
      </View>
      <Ionicons name="volume-high-outline" size={14} color="rgba(255,255,255,0.35)" />
      <Text style={styles.volumeValue}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const { settings, updateSetting, resetSettings } = useSettings();

  const handleReset = () => {
    Alert.alert(
      "Reset Settings",
      "Are you sure you want to reset all settings to their defaults?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetSettings();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a1e", "#0d0d28", "#0a0a1e"]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.8)" />
        </Pressable>
        <Text style={styles.screenTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 40 + bottomInset }]}
      >
        <View style={styles.card}>
          <SectionHeader title="Audio" icon="headset-outline" />

          <SettingRow label="Volume">
            <VolumeSlider
              value={settings.audioVolume}
              onChange={(v) => updateSetting("audioVolume", v)}
            />
          </SettingRow>

          <SettingRow label="Speed">
            <ChipSelector
              options={SPEED_OPTIONS.map((s) => s.id)}
              selected={settings.audioSpeed}
              onSelect={(v) => updateSetting("audioSpeed", v as AppSettings["audioSpeed"])}
              getLabel={(v) => SPEED_OPTIONS.find((s) => s.id === v)?.label || String(v)}
            />
          </SettingRow>

          <SettingRow label="Narrator Voice">
            <ChipSelector
              options={VOICES.map((v) => v.id)}
              selected={settings.narratorVoice}
              onSelect={(v) => updateSetting("narratorVoice", v)}
              getLabel={(v) => VOICES.find((voice) => voice.id === v)?.label || v}
            />
          </SettingRow>

          <SettingRow label="Auto-play on open" last>
            <Switch
              value={settings.autoPlay}
              onValueChange={(v) => updateSetting("autoPlay", v)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.autoPlay ? Colors.accent : "rgba(255,255,255,0.5)"}
            />
          </SettingRow>
        </View>

        <View style={styles.card}>
          <SectionHeader title="Story" icon="book-outline" />

          <SettingRow label="Story Length">
            <ChipSelector
              options={STORY_LENGTHS.map((l) => l.id)}
              selected={settings.storyLength}
              onSelect={(v) => updateSetting("storyLength", v as AppSettings["storyLength"])}
              getLabel={(v) => STORY_LENGTHS.find((l) => l.id === v)?.label || v}
            />
          </SettingRow>

          <SettingRow label="Age Range">
            <ChipSelector
              options={AGE_RANGES}
              selected={settings.ageRange}
              onSelect={(v) => updateSetting("ageRange", v as AppSettings["ageRange"])}
            />
          </SettingRow>

          <SettingRow label="Default Theme">
            <ChipSelector
              options={THEMES.map((t) => t.id)}
              selected={settings.defaultTheme}
              onSelect={(v) => updateSetting("defaultTheme", v)}
              getLabel={(v) => THEMES.find((t) => t.id === v)?.label || v}
            />
          </SettingRow>

          <SettingRow label="Auto-generate images" last>
            <Switch
              value={settings.autoGenerateImages}
              onValueChange={(v) => updateSetting("autoGenerateImages", v)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.autoGenerateImages ? Colors.accent : "rgba(255,255,255,0.5)"}
            />
          </SettingRow>
        </View>

        <View style={styles.card}>
          <SectionHeader title="Playback & Reading" icon="play-circle-outline" />

          <SettingRow label="Extend Mode">
            <Switch
              value={settings.extendMode}
              onValueChange={(v) => updateSetting("extendMode", v)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.extendMode ? Colors.accent : "rgba(255,255,255,0.5)"}
            />
          </SettingRow>

          <SettingRow label="Auto-play next story">
            <Switch
              value={settings.autoPlayNext}
              onValueChange={(v) => updateSetting("autoPlayNext", v)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.autoPlayNext ? Colors.accent : "rgba(255,255,255,0.5)"}
            />
          </SettingRow>

          <SettingRow label="Text Size" last>
            <ChipSelector
              options={TEXT_SIZES}
              selected={settings.textSize}
              onSelect={(v) => updateSetting("textSize", v as AppSettings["textSize"])}
              getLabel={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            />
          </SettingRow>
        </View>

        <View style={styles.card}>
          <SectionHeader title="Library" icon="library-outline" />

          <SettingRow label="Sort By">
            <ChipSelector
              options={SORT_ORDERS.map((s) => s.id)}
              selected={settings.librarySortOrder}
              onSelect={(v) => updateSetting("librarySortOrder", v as AppSettings["librarySortOrder"])}
              getLabel={(v) => SORT_ORDERS.find((s) => s.id === v)?.label || v}
            />
          </SettingRow>

          <SettingRow label="Favorites only">
            <Switch
              value={settings.showFavoritesOnly}
              onValueChange={(v) => updateSetting("showFavoritesOnly", v)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.showFavoritesOnly ? Colors.accent : "rgba(255,255,255,0.5)"}
            />
          </SettingRow>

          <SettingRow label="Auto-save stories" last>
            <Switch
              value={settings.autoSave}
              onValueChange={(v) => updateSetting("autoSave", v)}
              trackColor={{ false: "rgba(255,255,255,0.1)", true: `${Colors.accent}80` }}
              thumbColor={settings.autoSave ? Colors.accent : "rgba(255,255,255,0.5)"}
            />
          </SettingRow>
        </View>

        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [
            styles.resetBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          testID="reset-settings-btn"
        >
          <Ionicons name="refresh-circle-outline" size={18} color="rgba(255,100,100,0.7)" />
          <Text style={styles.resetBtnText}>Reset to Defaults</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1e" },
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
    fontSize: 17,
    color: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${Colors.accent}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
    flexWrap: "wrap",
    gap: 8,
  },
  settingRowLast: { borderBottomWidth: 0 },
  settingLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    minWidth: 100,
  },
  settingControl: {
    flex: 1,
    alignItems: "flex-end",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "flex-end",
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipActive: {
    backgroundColor: `${Colors.accent}20`,
    borderColor: `${Colors.accent}60`,
  },
  chipText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  chipTextActive: {
    color: Colors.accent,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  volumeTrack: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  volumeSegment: {
    flex: 1,
    height: 20,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  volumeValue: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: Colors.accent,
    minWidth: 24,
    textAlign: "right",
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,100,100,0.2)",
    backgroundColor: "rgba(255,100,100,0.05)",
    marginTop: 4,
    marginBottom: 8,
  },
  resetBtnText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    color: "rgba(255,100,100,0.7)",
  },
});
