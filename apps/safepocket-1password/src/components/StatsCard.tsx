import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  color = "#2d3436",
  icon,
}: StatsCardProps) {
  return (
    <View style={[styles.container, { borderTopColor: color }]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderTopWidth: 4,
    alignItems: "center",
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: "#636e72",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    color: "#b2bec3",
    textAlign: "center",
    marginTop: 4,
  },
});


