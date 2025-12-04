import { Tabs } from "expo-router";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: string;
  color: string;
  focused: boolean;
}) {
  const icons: { [key: string]: string } = {
    discover: "🔍",
    chats: "💬",
    favorites: "⭐",
    profile: "👤",
  };

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, { opacity: focused ? 1 : 0.6 }]}>
        {icons[name] || "❓"}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#e84393",
        tabBarInactiveTintColor: "#95a5a6",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#e9ecef",
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerStyle: {
          backgroundColor: "#e84393",
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="discover" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="chats" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="favorites" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="profile" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 24,
  },
});


