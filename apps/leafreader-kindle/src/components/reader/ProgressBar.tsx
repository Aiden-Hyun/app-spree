import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface ProgressBarProps {
  currentPage: number;
  totalPages: number;
  progress: number;
  color: string;
}

export function ProgressBar({
  currentPage,
  totalPages,
  progress,
  color,
}: ProgressBarProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.pageInfo, { color }]}>
        Page {currentPage} of {totalPages}
      </Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={[styles.progressText, { color }]}>
        {progress.toFixed(0)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  pageInfo: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3498db",
  },
  progressText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
});
