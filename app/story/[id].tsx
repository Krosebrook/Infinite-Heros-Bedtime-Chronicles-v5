import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { STORIES } from '@/constants/stories';
import { HEROES } from '@/constants/heroes';
import { StarField } from '@/components/StarField';
import { toggleFavorite, getFavorites, markStoryRead } from '@/lib/storage';

const { width, height } = Dimensions.get('window');

export default function StoryReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(-1);
  const [isFavorite, setIsFavorite] = useState(false);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const story = STORIES.find((s) => s.id === id);
  const hero = story ? HEROES.find((h) => h.id === story.heroId) : null;

  const textOpacity = useSharedValue(1);

  useEffect(() => {
    getFavorites().then((favs) => setIsFavorite(favs.includes(id || '')));
  }, [id]);

  const handleFavorite = async () => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newFavs = await toggleFavorite(id);
    setIsFavorite(newFavs.includes(id));
  };

  const goNext = () => {
    if (!story) return;
    if (currentPage < story.pages.length - 1) {
      Haptics.selectionAsync();
      textOpacity.value = 0;
      setTimeout(() => {
        setCurrentPage((p) => p + 1);
        textOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
      }, 200);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      markStoryRead(id!);
      router.back();
    }
  };

  const goPrev = () => {
    if (currentPage > -1) {
      Haptics.selectionAsync();
      textOpacity.value = 0;
      setTimeout(() => {
        setCurrentPage((p) => p - 1);
        textOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
      }, 200);
    }
  };

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  if (!story || !hero) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.errorText}>Story not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isIntro = currentPage === -1;
  const isLastPage = currentPage === story.pages.length - 1;
  const page = isIntro ? null : story.pages[currentPage];
  const progress = isIntro ? 0 : (currentPage + 1) / story.pages.length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          isIntro
            ? story.gradient
            : page?.mood === 'exciting'
            ? ['#1a237e', '#311b92']
            : page?.mood === 'warm'
            ? ['#1a237e', '#4a148c']
            : page?.mood === 'mysterious'
            ? ['#0d1b2a', '#1b2838']
            : ['#0B1026', '#151B3A']
        }
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
        </Pressable>

        {!isIntro && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.pageCounter}>
              {currentPage + 1} / {story.pages.length}
            </Text>
          </View>
        )}

        <Pressable onPress={handleFavorite} hitSlop={12} style={styles.iconBtn}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={22}
            color={isFavorite ? '#FF6B6B' : 'rgba(255,255,255,0.6)'}
          />
        </Pressable>
      </View>

      <View style={styles.contentArea}>
        {isIntro ? (
          <Animated.View entering={FadeIn.duration(800)} style={styles.introContent}>
            <View style={styles.introIconWrap}>
              <Ionicons name={hero.iconName as any} size={64} color={hero.color} />
            </View>
            <Text style={styles.introTitle}>{story.title}</Text>
            <Text style={styles.introSubtitle}>{story.subtitle}</Text>

            <View style={styles.introMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="person" size={14} color={Colors.accent} />
                <Text style={styles.metaText}>{hero.name}</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Ionicons name="time" size={14} color={Colors.accent} />
                <Text style={styles.metaText}>{story.duration} min</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Ionicons name="people" size={14} color={Colors.accent} />
                <Text style={styles.metaText}>Ages {story.ageRange}</Text>
              </View>
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.pageContent, textStyle]}>
            <Text style={styles.storyText}>{page?.text}</Text>
          </Animated.View>
        )}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 16 }]}>
        {currentPage > -1 ? (
          <Pressable
            onPress={goPrev}
            style={({ pressed }) => [
              styles.navButton,
              styles.prevButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.8)" />
          </Pressable>
        ) : (
          <View style={{ width: 48 }} />
        )}

        <Pressable
          onPress={goNext}
          style={({ pressed }) => [
            styles.navButton,
            styles.nextButton,
            { transform: [{ scale: pressed ? 0.95 : 1 }] },
          ]}
        >
          <Text style={styles.nextButtonText}>
            {isIntro ? 'Begin Story' : isLastPage ? 'Finish' : 'Continue'}
          </Text>
          <Ionicons
            name={isLastPage ? 'checkmark' : 'chevron-forward'}
            size={18}
            color={Colors.primary}
          />
        </Pressable>

        <View style={{ width: 48 }} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
    gap: 4,
  },
  progressBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  pageCounter: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  introContent: {
    alignItems: 'center',
    gap: 12,
  },
  introIconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  introTitle: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 30,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  introSubtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  introMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  pageContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 21,
    color: '#FFFFFF',
    lineHeight: 36,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  navButton: {
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  nextButton: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    elevation: 4,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextButtonText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: Colors.primary,
  },
  errorText: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 12,
  },
  backBtn: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: Colors.accent,
  },
  backBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.primary,
  },
});
