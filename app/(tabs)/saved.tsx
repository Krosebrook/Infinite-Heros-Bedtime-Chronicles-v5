import React, { useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { StarField } from "@/components/StarField";
import { MemoryJar } from "@/components/MemoryJar";

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#101022", "#0a0a2e", "#101022"]}
        style={StyleSheet.absoluteFill}
      />
      <StarField />
      <View style={[styles.content, { paddingTop: topInset + 20 }]}>
        <Ionicons name="heart" size={48} color="rgba(255,255,255,0.15)" />
        <Text style={styles.title}>Saved Stories</Text>
        <Text style={styles.subtitle}>Your favorite bedtime tales will be collected here</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#101022" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  title: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 22,
    color: "#FFFFFF",
  },
  subtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
});
