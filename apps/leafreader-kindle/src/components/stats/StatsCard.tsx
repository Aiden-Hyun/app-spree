import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string | number;
  label: string;
  style?: ViewStyle;
}

export function StatsCard({
  icon,
  iconColor,
  value,
  label,
  style,
}: StatsCardProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={32} color={iconColor} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  value: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2d3436",
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
});


