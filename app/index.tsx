import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { HEROES, Hero } from "@/constants/heroes";
import { StarField } from "@/components/StarField";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.72;
const CARD_SPACING = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;

interface HeroSlideProps {
  hero: Hero;
  isActive: boolean;
}

function HeroSlide({ hero, isActive }: HeroSlideProps) {
  return (
    <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
      <LinearGradient
        colors={hero.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, { opacity: isActive ? 1 : 0.6 }]}
      >
        <View style={styles.glowRing}>
          <View style={[styles.heroIconWrap, { shadowColor: hero.color }]}>
            <Ionicons
              name={hero.iconName as any}
              size={48}
              color={hero.color}
            />
          </View>
        </View>

        <Text style={styles.heroName}>{hero.name}</Text>
        <Text style={styles.heroTitle}>{hero.title}</Text>

        <View style={styles.powerRow}>
          <Ionicons name="flash" size={12} color={Colors.accent} />
          <Text style={styles.powerText}>{hero.power}</Text>
        </View>

        <Text style={styles.heroDesc} numberOfLines={3}>
          {hero.description}
        </Text>
      </LinearGradient>
    </View>
  );
}

export default function HeroSelectScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const selectedHero = HEROES[activeIndex];

  const handleSelect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/options",
      params: { heroId: selectedHero.id },
    });
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, "#0E1433", Colors.primary]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <Animated.View
        entering={FadeIn.duration(800)}
        style={[styles.header, { paddingTop: topInset + 20 }]}
      >
        <Text style={styles.label}>BEDTIME CHRONICLES</Text>
        <Text style={styles.title}>Choose Your Hero</Text>
        <Text style={styles.subtitle}>
          Pick a guardian for tonight's adventure
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(600).delay(200)}
        style={styles.carouselContainer}
      >
        <FlatList
          ref={flatListRef}
          data={HEROES}
          horizontal
          pagingEnabled={false}
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="center"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: (width - CARD_WIDTH) / 2,
          }}
          ItemSeparatorComponent={() => <View style={{ width: CARD_SPACING }} />}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <HeroSlide hero={item} isActive={index === activeIndex} />
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      </Animated.View>

      <View style={styles.dotsRow}>
        {HEROES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex && styles.dotActive,
              i === activeIndex && {
                backgroundColor: selectedHero.color,
              },
            ]}
          />
        ))}
      </View>

      <Animated.View
        entering={FadeInDown.duration(600).delay(400)}
        style={[styles.bottomSection, { paddingBottom: bottomInset + 20 }]}
      >
        <Pressable
          onPress={handleSelect}
          style={({ pressed }) => [
            styles.selectButton,
            { transform: [{ scale: pressed ? 0.96 : 1 }] },
          ]}
          testID="select-hero-button"
        >
          <LinearGradient
            colors={[Colors.accent, "#E5A825"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.selectButtonGradient}
          >
            <Text style={styles.selectButtonText}>
              Choose {selectedHero.name}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: Colors.accent,
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  title: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 30,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Nunito_400Regular",
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  carouselContainer: {
    flex: 1,
    justifyContent: "center",
  },
  cardWrapper: {
    justifyContent: "center",
  },
  heroCard: {
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    minHeight: 320,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  glowRing: {
    padding: 4,
    borderRadius: 52,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 20,
  },
  heroIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  heroName: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 28,
    color: "#FFFFFF",
    textAlign: "center",
  },
  heroTitle: {
    fontFamily: "Nunito_500Medium",
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  powerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 14,
  },
  powerText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },
  heroDesc: {
    fontFamily: "Nunito_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },
  bottomSection: {
    paddingHorizontal: 24,
  },
  selectButton: {
    borderRadius: 28,
    overflow: "hidden",
    elevation: 6,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  selectButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 32,
  },
  selectButtonText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 18,
    color: Colors.primary,
  },
});
