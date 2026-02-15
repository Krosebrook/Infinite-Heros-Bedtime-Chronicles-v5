import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { HEROES, Hero } from "@/constants/heroes";
import { StarField } from "@/components/StarField";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MODES = [
  {
    id: "classic",
    label: "CLASSIC",
    icon: "sword-cross" as const,
    iconSet: "mci",
    color: "#4A90D9",
  },
  {
    id: "madlibs",
    label: "MAD LIBS",
    icon: "emoticon-tongue-outline" as const,
    iconSet: "mci",
    color: "#FF8A65",
  },
  {
    id: "sleep",
    label: "SLEEPY",
    icon: "moon-waning-crescent" as const,
    iconSet: "mci",
    color: "#CE93D8",
  },
];

const DURATIONS = [
  { id: "short", time: "~3 min", icon: "flash" as const },
  { id: "medium-short", time: "~5 min", icon: "book" as const },
  { id: "medium", time: "~8 min", icon: "time" as const },
  { id: "long", time: "~12 min", icon: "document-text" as const },
  { id: "epic", time: "~15+ min", icon: "infinite" as const },
];

const VOICES = [
  { id: "kore", label: "Kore", desc: "Soothing", icon: "flower-outline" as const },
  { id: "aoede", label: "Aoede", desc: "Melodic", icon: "musical-notes-outline" as const },
  { id: "zephyr", label: "Zephyr", desc: "Gentle", icon: "leaf-outline" as const },
  { id: "leda", label: "Leda", desc: "Ethereal", icon: "sparkles-outline" as const },
  { id: "puck", label: "Puck", desc: "Playful", icon: "happy-outline" as const },
  { id: "charon", label: "Charon", desc: "Deep", icon: "moon-outline" as const },
  { id: "fenrir", label: "Fenrir", desc: "Bold", icon: "flame-outline" as const },
];

function HeroAvatar({ hero }: { hero: Hero }) {
  return (
    <LinearGradient
      colors={hero.gradient}
      style={s.heroAvatarCircle}
    >
      <Ionicons name={hero.iconName as any} size={28} color={hero.color} />
    </LinearGradient>
  );
}

function DurationTimeline({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const selectedIndex = DURATIONS.findIndex((d) => d.id === selected);

  return (
    <View style={s.timelineContainer}>
      <View style={s.timelineLine}>
        <View
          style={[
            s.timelineLineFilled,
            { width: `${(selectedIndex / (DURATIONS.length - 1)) * 100}%` },
          ]}
        />
      </View>

      <View style={s.timelineNodes}>
        {DURATIONS.map((d, i) => {
          const isActive = d.id === selected;
          const isPast = i <= selectedIndex;
          return (
            <Pressable
              key={d.id}
              onPress={() => {
                Haptics.selectionAsync();
                onSelect(d.id);
              }}
              style={s.timelineNodeWrap}
              testID={`duration-${d.id}`}
            >
              <View
                style={[
                  s.timelineNode,
                  isPast && s.timelineNodePast,
                  isActive && s.timelineNodeActive,
                ]}
              >
                <Ionicons
                  name={d.icon as any}
                  size={isActive ? 20 : 16}
                  color={isActive ? "#FFF" : isPast ? "#FFF" : "#999"}
                />
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={s.timelineLabel}>{DURATIONS[selectedIndex]?.time}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [heroIndex, setHeroIndex] = useState(0);
  const [mode, setMode] = useState("classic");
  const [duration, setDuration] = useState("medium");
  const [voice, setVoice] = useState("kore");

  const hero = HEROES[heroIndex];

  const prevHero = () => {
    Haptics.selectionAsync();
    setHeroIndex((prev) => (prev === 0 ? HEROES.length - 1 : prev - 1));
  };

  const nextHero = () => {
    Haptics.selectionAsync();
    setHeroIndex((prev) => (prev === HEROES.length - 1 ? 0 : prev + 1));
  };

  const handleEngage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (mode === "madlibs") {
      router.push({
        pathname: "/madlibs",
        params: { heroId: hero.id, duration, voice },
      });
    } else if (mode === "sleep") {
      router.push({
        pathname: "/sleep-setup",
        params: { heroId: hero.id, duration, voice },
      });
    } else {
      router.push({
        pathname: "/story",
        params: { heroId: hero.id, duration, voice, mode: "classic" },
      });
    }
  };

  return (
    <View style={s.container}>
      <LinearGradient
        colors={["#0B1A40", "#122050", "#0B1026"]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 20 }}
        bounces={false}
      >
        <Animated.View
          entering={FadeIn.duration(800)}
          style={[s.headerArea, { paddingTop: topInset + 24 }]}
        >
          <Text style={s.titleLine1}>INFINITY</Text>
          <Text style={s.titleLine2}>HEROES</Text>
          <View style={s.subtitleRow}>
            <View style={s.subtitleLine} />
            <Text style={s.subtitleText}>CHOOSE YOUR DESTINY</Text>
            <View style={s.subtitleLine} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)} style={s.modesRow}>
          {MODES.map((m) => {
            const isActive = mode === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMode(m.id);
                }}
                style={[s.modeTab, isActive && s.modeTabActive]}
                testID={`mode-${m.id}`}
              >
                {m.iconSet === "mci" ? (
                  <MaterialCommunityIcons
                    name={m.icon as any}
                    size={20}
                    color={isActive ? "#FFF" : "rgba(255,255,255,0.5)"}
                  />
                ) : (
                  <Ionicons
                    name={m.icon as any}
                    size={20}
                    color={isActive ? "#FFF" : "rgba(255,255,255,0.5)"}
                  />
                )}
                <Text
                  style={[s.modeTabLabel, isActive && s.modeTabLabelActive]}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={s.whiteCard}>
          <View style={s.heroSection}>
            <View style={s.heroSelectorRow}>
              <HeroAvatar hero={hero} />
              <View style={s.heroQuestionBox}>
                <Text style={s.heroQuestionText}>WHO IS OUR HERO TODAY?</Text>
              </View>
            </View>

            <Text style={s.heroNameDisplay}>{hero.name}</Text>
            <Text style={s.heroTitleDisplay}>{hero.title}</Text>

            <View style={s.heroNavRow}>
              <Pressable onPress={prevHero} style={s.arrowBtn} testID="prev-hero">
                <Ionicons name="chevron-back" size={20} color="#999" />
              </Pressable>

              <View style={s.dotIndicators}>
                {HEROES.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      s.heroDot,
                      i === heroIndex && s.heroDotActive,
                    ]}
                  />
                ))}
              </View>

              <Pressable onPress={nextHero} style={s.nextBtn} testID="next-hero">
                <Text style={s.nextBtnText}>NEXT</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
              </Pressable>
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.durationSection}>
            <Text style={s.sectionTitle}>STORY DURATION</Text>
            <DurationTimeline selected={duration} onSelect={setDuration} />
          </View>

          <View style={s.divider} />

          <View style={s.voiceSection}>
            <Text style={s.sectionTitle}>Select Narrator Voice</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.voiceScrollContent}
            >
              {VOICES.map((v) => {
                const isActive = voice === v.id;
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setVoice(v.id);
                    }}
                    style={[s.voiceChip, isActive && s.voiceChipActive]}
                    testID={`voice-${v.id}`}
                  >
                    <View
                      style={[
                        s.voiceChipIcon,
                        isActive && s.voiceChipIconActive,
                      ]}
                    >
                      <Ionicons
                        name={v.icon as any}
                        size={14}
                        color={isActive ? "#FFF" : "#888"}
                      />
                    </View>
                    <View>
                      <Text
                        style={[
                          s.voiceChipDesc,
                          isActive && s.voiceChipDescActive,
                        ]}
                      >
                        {v.desc}
                      </Text>
                      <Text
                        style={[
                          s.voiceChipLabel,
                          isActive && s.voiceChipLabelActive,
                        ]}
                      >
                        {v.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <Pressable
            onPress={handleEngage}
            style={({ pressed }) => [
              s.engageBtn,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
            testID="engage-mission-button"
          >
            <LinearGradient
              colors={
                mode === "sleep"
                  ? ["#7B1FA2", "#CE93D8"]
                  : mode === "madlibs"
                    ? ["#E64A19", "#FF8A65"]
                    : ["#2962FF", "#448AFF"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.engageBtnGradient}
            >
              <Text style={s.engageBtnText}>
                {mode === "madlibs"
                  ? "FILL IN WORDS"
                  : mode === "sleep"
                    ? "SET UP SLEEP"
                    : "ENGAGE MISSION"}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  headerArea: {
    alignItems: "center",
    paddingBottom: 20,
  },
  titleLine1: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 48,
    color: "#FFFFFF",
    letterSpacing: 4,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 52,
    textShadowColor: "rgba(0,100,255,0.3)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  titleLine2: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 52,
    color: "#5B9CFF",
    letterSpacing: 6,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 56,
    textShadowColor: "rgba(91,156,255,0.35)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
    marginTop: -4,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
  },
  subtitleLine: {
    width: 32,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  subtitleText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 3,
  },
  modesRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modeTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modeTabActive: {
    backgroundColor: "#2962FF",
    borderColor: "#2962FF",
  },
  modeTabLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1,
  },
  modeTabLabelActive: {
    color: "#FFF",
  },
  whiteCard: {
    marginHorizontal: 12,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    paddingVertical: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  heroSelectorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  heroAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  heroQuestionBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#222",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  heroQuestionText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: "#222",
    letterSpacing: 0.5,
  },
  heroNameDisplay: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 28,
    color: "#1A1A1A",
    textAlign: "center",
    letterSpacing: 1,
  },
  heroTitleDisplay: {
    fontFamily: "Nunito_500Medium",
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 14,
  },
  heroNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  dotIndicators: {
    flexDirection: "row",
    gap: 5,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DDD",
  },
  heroDotActive: {
    width: 18,
    borderRadius: 3,
    backgroundColor: "#2962FF",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2962FF",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  nextBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: "#FFF",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginHorizontal: 20,
    marginVertical: 16,
  },
  durationSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#777",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 16,
    textAlign: "center",
  },
  timelineContainer: {
    alignItems: "center",
  },
  timelineLine: {
    position: "absolute",
    top: 20,
    left: 32,
    right: 32,
    height: 3,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  timelineLineFilled: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: "#2962FF",
    borderRadius: 2,
  },
  timelineNodes: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 12,
  },
  timelineNodeWrap: {
    alignItems: "center",
  },
  timelineNode: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  timelineNodePast: {
    backgroundColor: "#2962FF",
    borderColor: "#2962FF",
  },
  timelineNodeActive: {
    backgroundColor: "#2962FF",
    borderColor: "#1A56DB",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
  },
  timelineLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 14,
    color: "#2962FF",
    marginTop: 10,
    letterSpacing: 0.5,
  },
  voiceSection: {
    paddingLeft: 20,
  },
  voiceScrollContent: {
    gap: 10,
    paddingRight: 20,
    paddingBottom: 4,
  },
  voiceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "#EEE",
  },
  voiceChipActive: {
    borderColor: "#2962FF",
    backgroundColor: "#EDF2FF",
  },
  voiceChipIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceChipIconActive: {
    backgroundColor: "#2962FF",
  },
  voiceChipDesc: {
    fontFamily: "Nunito_500Medium",
    fontSize: 10,
    color: "#999",
  },
  voiceChipDescActive: {
    color: "#2962FF",
  },
  voiceChipLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: "#555",
  },
  voiceChipLabelActive: {
    color: "#222",
  },
  engageBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#2962FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  engageBtnGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  engageBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 16,
    color: "#FFF",
    letterSpacing: 2,
  },
});
