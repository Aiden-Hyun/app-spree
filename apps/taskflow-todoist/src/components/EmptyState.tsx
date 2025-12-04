import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon,
  iconColor = "#ccc",
  title,
  subtitle,
  children,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children && <View style={styles.actions}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  actions: {
    marginTop: 24,
  },
});


