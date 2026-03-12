import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { ChildProfile, AVATAR_EMOJIS } from "@/constants/types";
import { HEROES } from "@/constants/heroes";
import { useProfile } from "@/lib/ProfileContext";
import * as Crypto from "expo-crypto";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Screen = "list" | "create" | "edit";

const AGE_OPTIONS = [3, 4, 5, 6, 7, 8, 9];

export function ProfileModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const { profiles, activeProfile, switchProfile, createProfile, updateProfile, removeProfile } = useProfile();

  const [screen, setScreen] = useState<Screen>("list");
  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState(5);
  const [emoji, setEmoji] = useState(AVATAR_EMOJIS[0]);
  const [heroId, setHeroId] = useState(HEROES[0].id);

  const resetForm = () => {
    setName("");
    setAge(5);
    setEmoji(AVATAR_EMOJIS[0]);
    setHeroId(HEROES[0].id);
    setEditingProfile(null);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const profile: ChildProfile = {
      id: Crypto.randomUUID(),
      name: name.trim(),
      age,
      favoriteHeroId: heroId,
      avatarEmoji: emoji,
      createdAt: Date.now(),
    };
    await createProfile(profile);
    resetForm();
    setScreen("list");
  };

  const handleUpdate = async () => {
    if (!editingProfile || !name.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateProfile({
      ...editingProfile,
      name: name.trim(),
      age,
      favoriteHeroId: heroId,
      avatarEmoji: emoji,
    });
    resetForm();
    setScreen("list");
  };

  const handleEdit = (profile: ChildProfile) => {
    setEditingProfile(profile);
    setName(profile.name);
    setAge(profile.age);
    setEmoji(profile.avatarEmoji);
    setHeroId(profile.favoriteHeroId);
    setScreen("edit");
  };

  const handleDelete = async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await removeProfile(id);
  };

  const handleSelect = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await switchProfile(id);
    onClose();
  };

  const handleCloseModal = () => {
    resetForm();
    setScreen("list");
    onClose();
  };

  const renderForm = () => (
    <ScrollView
      contentContainerStyle={[styles.formScroll, { paddingBottom: bottomInset + 40 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.sectionTitle}>NAME</Text>
      <TextInput
        style={styles.nameInput}
        placeholder="Enter child's name"
        placeholderTextColor={Colors.textMuted}
        value={name}
        onChangeText={setName}
        maxLength={20}
        autoCapitalize="words"
        testID="profile-name-input"
      />

      <Text style={styles.sectionTitle}>AGE</Text>
      <View style={styles.ageRow}>
        {AGE_OPTIONS.map((a) => (
          <Pressable
            key={a}
            onPress={() => { Haptics.selectionAsync(); setAge(a); }}
            style={[styles.agePill, age === a && styles.agePillActive]}
          >
            <Text style={[styles.agePillText, age === a && styles.agePillTextActive]}>
              {a}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>AVATAR</Text>
      <View style={styles.emojiGrid}>
        {AVATAR_EMOJIS.map((e) => (
          <Pressable
            key={e}
            onPress={() => { Haptics.selectionAsync(); setEmoji(e); }}
            style={[styles.emojiCell, emoji === e && styles.emojiCellActive]}
          >
            <Text style={styles.emojiText}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>FAVORITE HERO</Text>
      <View style={styles.heroGrid}>
        {HEROES.map((h) => {
          const isActive = heroId === h.id;
          return (
            <Pressable
              key={h.id}
              onPress={() => { Haptics.selectionAsync(); setHeroId(h.id); }}
              style={[styles.heroCard, isActive && { borderColor: h.color }]}
            >
              <Ionicons name={h.iconName as any} size={22} color={isActive ? h.color : "rgba(255,255,255,0.4)"} />
              <Text style={[styles.heroCardName, isActive && { color: h.color }]}>{h.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={screen === "edit" ? handleUpdate : handleCreate}
        disabled={!name.trim()}
        style={[styles.saveBtn, !name.trim() && { opacity: 0.4 }]}
        testID="profile-save-button"
      >
        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
        <Text style={styles.saveBtnText}>
          {screen === "edit" ? "Save Changes" : "Create Profile"}
        </Text>
      </Pressable>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCloseModal}
    >
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.header}>
          {screen !== "list" ? (
            <Pressable
              onPress={() => { resetForm(); setScreen("list"); }}
              style={styles.backBtn}
            >
              <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.7)" />
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
          <Text style={styles.headerTitle}>
            {screen === "create" ? "New Profile" : screen === "edit" ? "Edit Profile" : "Profiles"}
          </Text>
          <Pressable onPress={handleCloseModal} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        {screen === "list" ? (
          <ScrollView
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            {profiles.length === 0 && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.15)" />
                <Text style={styles.emptyTitle}>No Profiles Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Create a profile for each child to track their stories, badges, and streaks
                </Text>
              </Animated.View>
            )}

            {profiles.map((p, i) => {
              const isActive = activeProfile?.id === p.id;
              const hero = HEROES.find((h) => h.id === p.favoriteHeroId);
              return (
                <Animated.View
                  key={p.id}
                  entering={FadeInDown.duration(300).delay(i * 60)}
                >
                  <Pressable
                    onPress={() => handleSelect(p.id)}
                    style={[styles.profileRow, isActive && styles.profileRowActive]}
                  >
                    <View style={styles.profileAvatar}>
                      <Text style={styles.profileAvatarText}>{p.avatarEmoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.profileName}>{p.name}</Text>
                      <Text style={styles.profileMeta}>
                        Age {p.age} · {hero?.name || "No hero"}
                      </Text>
                    </View>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Ionicons name="checkmark-circle" size={18} color={Colors.accent} />
                      </View>
                    )}
                    <Pressable
                      onPress={() => handleEdit(p)}
                      style={styles.editBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="pencil-outline" size={16} color="rgba(255,255,255,0.4)" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(p.id)}
                      style={styles.editBtn}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={16} color="rgba(255,100,100,0.5)" />
                    </Pressable>
                  </Pressable>
                </Animated.View>
              );
            })}

            {activeProfile && (
              <Pressable
                onPress={() => { switchProfile(null); onClose(); }}
                style={styles.guestBtn}
              >
                <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.5)" />
                <Text style={styles.guestBtnText}>Use as Guest</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setScreen("create")}
              style={styles.addBtn}
              testID="add-profile-button"
            >
              <Ionicons name="add-circle-outline" size={22} color={Colors.accent} />
              <Text style={styles.addBtnText}>Add New Profile</Text>
            </Pressable>
          </ScrollView>
        ) : (
          renderForm()
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontFamily: "PlusJakartaSans_800ExtraBold", fontSize: 22, color: "#FFF" },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  listContent: { paddingHorizontal: 20, gap: 10 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyTitle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: "rgba(255,255,255,0.5)" },
  emptySubtitle: {
    fontFamily: "PlusJakartaSans_400Regular", fontSize: 13,
    color: "rgba(255,255,255,0.3)", textAlign: "center", paddingHorizontal: 32,
  },
  profileRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.06)",
  },
  profileRowActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}10` },
  profileAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  profileAvatarText: { fontSize: 22 },
  profileName: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: "#FFF" },
  profileMeta: { fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  activeBadge: { marginRight: 4 },
  editBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  guestBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, marginTop: 8,
    borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  guestBtnText: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: "rgba(255,255,255,0.5)" },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, marginTop: 12,
    borderRadius: 16, borderWidth: 2, borderStyle: "dashed",
    borderColor: `${Colors.accent}40`,
  },
  addBtnText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: Colors.accent },
  formScroll: { paddingHorizontal: 20 },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold", fontSize: 12,
    color: "rgba(255,255,255,0.5)", letterSpacing: 2,
    marginBottom: 10, marginTop: 20,
  },
  nameInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: "#FFF",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.08)",
  },
  ageRow: { flexDirection: "row", gap: 8 },
  agePill: {
    flex: 1, alignItems: "center", paddingVertical: 10,
    borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.06)",
  },
  agePillActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}18` },
  agePillText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: "rgba(255,255,255,0.5)" },
  agePillTextActive: { color: Colors.accent },
  emojiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  emojiCell: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.06)",
  },
  emojiCellActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}18` },
  emojiText: { fontSize: 24 },
  heroGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  heroCard: {
    alignItems: "center", gap: 4,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 14, backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.06)",
    minWidth: 80,
  },
  heroCardEmoji: { fontSize: 24 },
  heroCardName: { fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: "rgba(255,255,255,0.5)" },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 28, paddingVertical: 16,
    borderRadius: 24, backgroundColor: Colors.accent,
  },
  saveBtnText: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: "#FFF" },
});
