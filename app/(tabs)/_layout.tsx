import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];

interface TabIconProps {
  name: IoniconsName;
  focused: boolean;
  label: string;
  isCreate?: boolean;
}

function TabIcon({ name, focused, label, isCreate }: TabIconProps) {
  if (isCreate) {
    return (
      <View style={styles.createBtnWrap}>
        <View style={styles.createBtn}>
          <Ionicons name="add" size={28} color="#FFF" />
        </View>
        <Text style={[styles.tabLabel, { color: focused ? Colors.accent : "rgba(255,255,255,0.4)" }]}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tabIconWrap}>
      <Ionicons
        name={focused ? name : (`${String(name)}-outline` as IoniconsName)}
        size={24}
        color={focused ? Colors.accent : "rgba(255,255,255,0.4)"}
      />
      <Text style={[styles.tabLabel, focused && { color: Colors.accent }]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(16, 16, 34, 0.92)",
          borderTopColor: "rgba(15, 15, 189, 0.2)",
          borderTopWidth: 1,
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
          ...(Platform.OS === "web" ? {} : {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 20,
          }),
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: "rgba(255,255,255,0.4)",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="book" focused={focused} label="Library" />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="add-circle" focused={focused} label="Create" isCreate />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="heart" focused={focused} label="Saved" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" focused={focused} label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  tabLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 9,
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  createBtnWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    marginTop: -20,
  },
  createBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.deepIndigo,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.deepIndigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
});
