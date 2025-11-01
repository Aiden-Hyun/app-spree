import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ProgressBar } from "./ProgressBar";

interface LessonCardProps {
  id: string;
  title: string;
  description: string;
  type: "vocabulary" | "grammar" | "conversation";
  difficulty: number;
  xpReward: number;
  isLocked?: boolean;
  progress?: number;
  onPress?: () => void;
}

export function LessonCard({
  id,
  title,
  description,
  type,
  difficulty,
  xpReward,
  isLocked = false,
  progress = 0,
  onPress,
}: LessonCardProps) {
  const typeConfig = {
    vocabulary: {
      icon: "📚",
      color: "#00b894",
      backgroundColor: "#e8f8f5",
    },
    grammar: {
      icon: "📝",
      color: "#6c5ce7",
      backgroundColor: "#f0effd",
    },
    conversation: {
      icon: "💬",
      color: "#0984e3",
      backgroundColor: "#e7f3ff",
    },
  };

  const config = typeConfig[type];

  const difficultyStars = "⭐".repeat(difficulty);

  return (
    <TouchableOpacity
      style={[styles.container, isLocked && styles.lockedContainer]}
      onPress={onPress}
      disabled={isLocked}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: config.backgroundColor },
        ]}
      >
        <Text style={styles.icon}>{config.icon}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        {progress > 0 && (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progress}
              height={4}
              color={config.color}
              animated={false}
            />
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.meta}>
            <View
              style={[
                styles.typeTag,
                { backgroundColor: config.backgroundColor },
              ]}
            >
              <Text style={[styles.typeText, { color: config.color }]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </View>
            <Text style={styles.difficulty}>{difficultyStars}</Text>
          </View>
          <Text style={styles.xpReward}>+{xpReward} XP</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lockedContainer: {
    opacity: 0.6,
    backgroundColor: "#f8f8f8",
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    flex: 1,
  },
  lockIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  difficulty: {
    fontSize: 12,
  },
  xpReward: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00b894",
  },
});
