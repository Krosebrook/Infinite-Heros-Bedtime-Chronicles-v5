import React, { useState } from "react";
import { View, Text, StyleSheet, Platform, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { StarField } from "@/components/StarField";
import { ProfileModal } from "@/components/ProfileModal";
import { SettingsModal } from "@/components/SettingsModal";
import { ParentControlsModal } from "@/components/ParentControlsModal";
import { useProfile } from "@/lib/ProfileContext";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { activeProfile } = useProfile();
  const [profileVisible, setProfileVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [parentControlsVisible, setParentControlsVisible] = useState(false);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#101022", "#0a0a2e", "#101022"]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />
      <View style={[styles.content, { paddingTop: topInset + 20 }]}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarEmoji}>{activeProfile?.avatarEmoji || "👤"}</Text>
        </View>
        <Text style={styles.name}>{activeProfile?.name || "Little Star"}</Text>
        <Text style={styles.subtitle}>Story Explorer</Text>

        <View style={styles.actions}>
          <Pressable style={styles.actionBtn} onPress={() => setProfileVisible(true)} testID="edit-profile">
            <Ionicons name="person-outline" size={20} color={Colors.accent} />
            <Text style={styles.actionText}>Edit Profile</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => setSettingsVisible(true)} testID="open-settings">
            <Ionicons name="settings-outline" size={20} color={Colors.accent} />
            <Text style={styles.actionText}>Settings</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => setParentControlsVisible(true)} testID="parent-controls">
            <Ionicons name="shield-outline" size={20} color={Colors.accent} />
            <Text style={styles.actionText}>Parent Controls</Text>
          </Pressable>
        </View>
      </View>

      {profileVisible && <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />}
      {settingsVisible && <SettingsModal visible={settingsVisible} onClose={() => setSettingsVisible(false)} />}
      {parentControlsVisible && <ParentControlsModal visible={parentControlsVisible} onClose={() => setParentControlsVisible(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101022" },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(15, 15, 189, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(15, 15, 189, 0.3)",
    marginBottom: 8,
  },
  avatarEmoji: { fontSize: 36 },
  name: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 24,
    color: "#FFFFFF",
  },
  subtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 24,
  },
  actions: {
    width: "100%",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
});
