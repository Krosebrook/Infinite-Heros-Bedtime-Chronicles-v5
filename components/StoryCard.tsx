import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import type { Story } from '@/constants/stories';

interface StoryCardProps {
  story: Story;
  isFavorite: boolean;
  isRead: boolean;
  onPress: () => void;
  onFavorite: () => void;
}

export function StoryCard({ story, isFavorite, isRead, onPress, onFavorite }: StoryCardProps) {
  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFavorite();
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <LinearGradient
        colors={story.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={story.iconName as any} size={32} color="rgba(255,255,255,0.9)" />
        </View>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.badges}>
              <View style={styles.badge}>
                <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.8)" />
                <Text style={styles.badgeText}>{story.duration} min</Text>
              </View>
              <View style={styles.badge}>
                <Ionicons name="person-outline" size={11} color="rgba(255,255,255,0.8)" />
                <Text style={styles.badgeText}>{story.ageRange}</Text>
              </View>
              {isRead && (
                <View style={[styles.badge, styles.readBadge]}>
                  <Ionicons name="checkmark-circle" size={11} color={Colors.accent} />
                  <Text style={[styles.badgeText, { color: Colors.accent }]}>Read</Text>
                </View>
              )}
            </View>
            <Pressable onPress={handleFavorite} hitSlop={12}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? '#FF6B6B' : 'rgba(255,255,255,0.6)'}
              />
            </Pressable>
          </View>
          <Text style={styles.title} numberOfLines={1}>{story.title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{story.subtitle}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  readBadge: {
    backgroundColor: 'rgba(245, 197, 66, 0.15)',
  },
  badgeText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
});
