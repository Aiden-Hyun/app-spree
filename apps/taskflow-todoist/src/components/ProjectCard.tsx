import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ProjectCardProps {
  id: string;
  name: string;
  color: string;
  description?: string;
  taskCount: number;
  completedTaskCount: number;
  isArchived?: boolean;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
}

export function ProjectCard({
  id,
  name,
  color,
  description,
  taskCount,
  completedTaskCount,
  isArchived = false,
  onPress,
  onLongPress,
}: ProjectCardProps) {
  const completionPercentage =
    taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

  return (
    <TouchableOpacity
      style={[styles.container, isArchived && styles.archivedContainer]}
      onPress={() => onPress(id)}
      onLongPress={() => onLongPress?.(id)}
      activeOpacity={0.7}
    >
      <View style={[styles.colorBar, { backgroundColor: color }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.projectIcon, { backgroundColor: color + "20" }]}>
            <Ionicons
              name={name === "Inbox" ? "inbox" : "folder"}
              size={24}
              color={color}
            />
          </View>

          <View style={styles.projectInfo}>
            <Text
              style={[styles.projectName, isArchived && styles.archivedText]}
            >
              {name}
            </Text>
            {description && (
              <Text style={styles.projectDescription} numberOfLines={1}>
                {description}
              </Text>
            )}
          </View>

          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </View>

        <View style={styles.stats}>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {taskCount} {taskCount === 1 ? "task" : "tasks"}
            </Text>
            {taskCount > 0 && (
              <Text style={styles.statsText}>
                • {completionPercentage}% complete
              </Text>
            )}
          </View>

          {taskCount > 0 && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${completionPercentage}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
          )}
        </View>

        {isArchived && (
          <View style={styles.archivedBadge}>
            <Ionicons name="archive-outline" size={12} color="#999" />
            <Text style={styles.archivedBadgeText}>Archived</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  archivedContainer: {
    opacity: 0.7,
  },
  colorBar: {
    height: 4,
    width: "100%",
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  projectIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  projectDescription: {
    fontSize: 14,
    color: "#666",
  },
  archivedText: {
    color: "#999",
  },
  stats: {
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statsText: {
    fontSize: 13,
    color: "#999",
    marginRight: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#f0f0f0",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  archivedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  archivedBadgeText: {
    fontSize: 12,
    color: "#999",
    marginLeft: 4,
  },
});
