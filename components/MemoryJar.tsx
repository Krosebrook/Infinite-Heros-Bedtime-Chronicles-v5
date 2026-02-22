import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { HEROES } from "@/constants/heroes";
import { CachedStory } from "@/constants/types";
import { getAllStories, deleteStory } from "@/lib/storage";

function StoryCard({ item, onDelete, onReread }: { item: CachedStory; onDelete: (id: string) => void; onReread: (item: CachedStory) => void }) {
  const hero = HEROES.find((h) => h.id === item.heroId);
  const date = new Date(item.timestamp);
  const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const modeLabels: Record<string, string> = {
    classic: "Classic",
    madlibs: "Mad Libs",
    sleep: "Sleep",
  };

  const badge = item.story.rewardBadge;

  const handleDelete = () => {
    if (Platform.OS === "web") {
      onDelete(item.id);
    } else {
      Alert.alert("Remove Story", "Remove this story from your Memory Jar?", [
        { text: "Keep", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => onDelete(item.id) },
      ]);
    }
  };

  return (
    <Pressable onPress={() => onReread(item)} style={jarStyles.storyCard}>
      <View style={jarStyles.storyCardTop}>
        {badge && <Text style={jarStyles.storyBadgeEmoji}>{badge.emoji}</Text>}
        <View style={jarStyles.storyCardInfo}>
          <Text style={jarStyles.storyTitle} numberOfLines={1}>
            {item.story.title}
          </Text>
          <View style={jarStyles.storyMeta}>
            {hero && (
              <View style={jarStyles.storyMetaChip}>
                <Ionicons name={hero.iconName as any} size={12} color={hero.color} />
                <Text style={jarStyles.storyMetaText}>{hero.name}</Text>
              </View>
            )}
            <View style={jarStyles.storyMetaChip}>
              <Text style={jarStyles.storyMetaText}>{modeLabels[item.mode] || item.mode}</Text>
            </View>
            <Text style={jarStyles.storyDate}>{dateStr}</Text>
          </View>
        </View>
        <View style={jarStyles.cardActions}>
          <Pressable onPress={() => { Haptics.selectionAsync(); onReread(item); }} hitSlop={12} style={jarStyles.rereadBtn}>
            <Ionicons name="book-outline" size={16} color={Colors.accent} />
          </Pressable>
          <Pressable onPress={handleDelete} hitSlop={12} style={jarStyles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.3)" />
          </Pressable>
        </View>
      </View>

      {item.story.lesson && (
        <Text style={jarStyles.storyLesson} numberOfLines={2}>
          {item.story.lesson}
        </Text>
      )}
    </Pressable>
  );
}

interface MemoryJarProps {
  visible: boolean;
  onClose: () => void;
}

export function MemoryJar({ visible, onClose }: MemoryJarProps) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;
  const [stories, setStories] = useState<CachedStory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStories = useCallback(async () => {
    setLoading(true);
    const data = await getAllStories();
    setStories(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (visible) loadStories();
  }, [visible]);

  const handleDelete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await deleteStory(id);
    setStories((prev) => prev.filter((s) => s.id !== id));
  };

  const handleReread = (item: CachedStory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    router.push({
      pathname: "/story",
      params: {
        heroId: item.heroId,
        mode: item.mode,
        replayJson: JSON.stringify(item.story),
      },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
      <View style={[jarStyles.container, { paddingTop: topInset }]}>
        <View style={jarStyles.header}>
          <View style={jarStyles.headerLeft}>
            <Ionicons name="archive" size={22} color={Colors.accent} />
            <Text style={jarStyles.headerTitle}>Memory Jar</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={jarStyles.closeBtn}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        {loading ? (
          <View style={jarStyles.emptyContainer}>
            <Text style={jarStyles.emptyText}>Loading stories...</Text>
          </View>
        ) : stories.length === 0 ? (
          <Animated.View entering={FadeIn.duration(600)} style={jarStyles.emptyContainer}>
            <Ionicons name="archive-outline" size={48} color={Colors.textMuted} />
            <Text style={jarStyles.emptyTitle}>No stories yet</Text>
            <Text style={jarStyles.emptyText}>
              Stories you save after completing them will appear here
            </Text>
          </Animated.View>
        ) : (
          <FlatList
            data={stories}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.duration(400).delay(index * 60)}>
                <StoryCard item={item} onDelete={handleDelete} onReread={handleReread} />
              </Animated.View>
            )}
            contentContainerStyle={[jarStyles.listContent, { paddingBottom: bottomInset + 20 }]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}

const jarStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontFamily: "Nunito_800ExtraBold", fontSize: 22, color: Colors.textPrimary },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  emptyContainer: {
    flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, gap: 12,
  },
  emptyTitle: {
    fontFamily: "Nunito_700Bold", fontSize: 20, color: Colors.textPrimary, textAlign: "center",
  },
  emptyText: {
    fontFamily: "Nunito_400Regular", fontSize: 14, color: Colors.textMuted, textAlign: "center",
  },
  listContent: { paddingHorizontal: 16, paddingTop: 12 },
  storyCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    padding: 16, marginBottom: 12,
  },
  storyCardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  storyBadgeEmoji: { fontSize: 28 },
  storyCardInfo: { flex: 1 },
  storyTitle: {
    fontFamily: "Nunito_700Bold", fontSize: 16, color: Colors.textPrimary, marginBottom: 4,
  },
  storyMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  storyMetaChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  storyMetaText: {
    fontFamily: "Nunito_600SemiBold", fontSize: 11, color: Colors.textSecondary,
  },
  storyDate: { fontFamily: "Nunito_400Regular", fontSize: 11, color: Colors.textMuted },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  rereadBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
  },
  storyLesson: {
    fontFamily: "Nunito_400Regular", fontSize: 13, color: Colors.textSecondary,
    lineHeight: 20, marginTop: 10, fontStyle: "italic",
  },
});
