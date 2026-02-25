import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import React from "react";
import Colors from "@/constants/colors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="jobs">
        <Icon sf={{ default: "briefcase", selected: "briefcase.fill" }} />
        <Label>Jobs</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <Icon sf={{ default: "message", selected: "message.fill" }} />
        <Label>Messages</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Account</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarLabelStyle: { fontFamily: "DMSans_500Medium", fontSize: 11 },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : isDark ? "#000" : "#fff",
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: isDark ? "#333" : Colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? "#000" : "#fff" }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarTestID: "nav.home",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="home-outline" size={size} color={color} />,
        } as any}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarTestID: "nav.jobs",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="briefcase-outline" size={size} color={color} />,
        } as any}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarTestID: "nav.messages",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
        } as any}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarTestID: "nav.account",
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Ionicons name="person-outline" size={size} color={color} />,
        } as any}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
