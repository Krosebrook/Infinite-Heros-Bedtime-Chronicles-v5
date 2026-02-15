import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { StarField } from '@/components/StarField';

const PRESETS = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
  { label: '20 min', minutes: 20 },
  { label: '30 min', minutes: 30 },
];

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width * 0.65, 280);

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const [selectedMinutes, setSelectedMinutes] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const moonScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    moonScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const moonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: moonScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const startTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSecondsLeft(selectedMinutes * 60);
    setIsRunning(true);
  };

  const stopTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setSecondsLeft(0);
  };

  const progress = isRunning ? secondsLeft / (selectedMinutes * 60) : 1;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeDisplay = isRunning
    ? `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${selectedMinutes}:00`;

  const timerComplete = !isRunning && secondsLeft === 0 && selectedMinutes > 0;

  return (
    <View style={styles.container}>
      <StarField />
      <View style={[styles.content, { paddingTop: topInset + 16, paddingBottom: Platform.OS === 'web' ? 84 : insets.bottom + 90 }]}>
        <View style={styles.header}>
          <Text style={styles.label}>WIND DOWN</Text>
          <Text style={styles.title}>Sleep Timer</Text>
          <Text style={styles.subtitle}>
            Set a gentle timer for bedtime
          </Text>
        </View>

        <View style={styles.timerSection}>
          <Animated.View style={[styles.glowCircle, glowStyle]} />
          <Animated.View style={[styles.moonContainer, moonStyle]}>
            <LinearGradient
              colors={['#1a237e', '#4a148c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.circleGradient}
            >
              <View style={[styles.progressOverlay, { opacity: 1 - progress }]} />
              <Ionicons
                name={isRunning ? 'moon' : 'moon-outline'}
                size={48}
                color={Colors.accent}
              />
              <Text style={styles.timeDisplay}>{timeDisplay}</Text>
              <Text style={styles.timeLabel}>
                {isRunning ? 'until sweet dreams' : 'minutes'}
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {!isRunning && (
          <View style={styles.presetRow}>
            {PRESETS.map((preset) => (
              <Pressable
                key={preset.minutes}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedMinutes(preset.minutes);
                }}
                style={[
                  styles.presetPill,
                  selectedMinutes === preset.minutes && styles.presetPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.presetText,
                    selectedMinutes === preset.minutes && styles.presetTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.buttonRow}>
          {isRunning ? (
            <Pressable
              onPress={stopTimer}
              style={({ pressed }) => [
                styles.actionButton,
                styles.stopButton,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <Ionicons name="stop" size={22} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Stop</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={startTimer}
              style={({ pressed }) => [
                styles.actionButton,
                styles.startButton,
                { transform: [{ scale: pressed ? 0.95 : 1 }] },
              ]}
            >
              <Ionicons name="play" size={22} color={Colors.primary} />
              <Text style={[styles.actionButtonText, { color: Colors.primary }]}>
                Start Timer
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Bedtime Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="book-outline" size={20} color={Colors.accent} />
            <Text style={styles.tipText}>Read a story before starting the timer</Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="volume-low-outline" size={20} color={Colors.purpleLight} />
            <Text style={styles.tipText}>Keep the room quiet and cozy</Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="phone-portrait-outline" size={20} color="#4DD0E1" />
            <Text style={styles.tipText}>Put screens away after the story ends</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: Colors.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 32,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timerSection: {
    width: CIRCLE_SIZE + 40,
    height: CIRCLE_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  glowCircle: {
    position: 'absolute',
    width: CIRCLE_SIZE + 40,
    height: CIRCLE_SIZE + 40,
    borderRadius: (CIRCLE_SIZE + 40) / 2,
    backgroundColor: Colors.purple,
  },
  moonContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
  },
  circleGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: CIRCLE_SIZE / 2,
  },
  timeDisplay: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 44,
    color: '#FFFFFF',
    marginTop: 8,
  },
  timeLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  presetPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  presetPillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  presetText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  presetTextActive: {
    color: Colors.primary,
  },
  buttonRow: {
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
  },
  startButton: {
    backgroundColor: Colors.accent,
  },
  stopButton: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  tipsSection: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 10,
  },
  tipsTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tipText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
});
