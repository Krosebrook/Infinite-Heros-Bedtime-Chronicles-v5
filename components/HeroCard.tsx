import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import type { Hero } from '@/constants/heroes';

interface HeroCardProps {
  hero: Hero;
  onPress: () => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 52) / 2;

export function HeroCard({ hero, onPress }: HeroCardProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.container,
        { transform: [{ scale: pressed ? 0.95 : 1 }] },
      ]}
    >
      <LinearGradient
        colors={hero.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.iconWrap}>
          <Ionicons name={hero.iconName} size={36} color={hero.color} />
        </View>
        <Text style={styles.name}>{hero.name}</Text>
        <Text style={styles.title}>{hero.title}</Text>
        <View style={styles.powerBadge}>
          <Ionicons name="flash" size={10} color={Colors.accent} />
          <Text style={styles.powerText}>{hero.power}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    padding: 18,
    alignItems: 'center',
    minHeight: 170,
    justifyContent: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  title: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 10,
  },
  powerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  powerText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
  },
});
