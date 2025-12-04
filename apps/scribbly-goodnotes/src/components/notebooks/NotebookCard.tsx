import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Notebook } from "../../types";

interface NotebookCardProps {
  notebook: Notebook;
  onPress: (notebook: Notebook) => void;
  onLongPress?: (notebook: Notebook) => void;
  onOptionsPress?: (notebook: Notebook) => void;
}

export function NotebookCard({
  notebook,
  onPress,
  onLongPress,
  onOptionsPress,
}: NotebookCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: notebook.color }]}
      onPress={() => onPress(notebook)}
      onLongPress={() => onLongPress?.(notebook)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.iconBackground,
            { backgroundColor: notebook.color + "20" },
          ]}
        >
          <Ionicons
            name={(notebook.is_folder ? "folder" : notebook.icon) as any}
            size={24}
            color={notebook.color}
          />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {notebook.title}
          </Text>
          {notebook.is_archived && (
            <Ionicons name="archive-outline" size={16} color="#95a5a6" />
          )}
        </View>

        {notebook.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {notebook.description}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.meta}>
            {notebook.is_folder
              ? `${notebook.children?.length || 0} items`
              : `${notebook.note_count || 0} notes`}
          </Text>
          <Text style={styles.meta}>{formatDate(notebook.updated_at)}</Text>
        </View>
      </View>

      {onOptionsPress && (
        <TouchableOpacity
          style={styles.optionsButton}
          onPress={(e) => {
            e.stopPropagation();
            onOptionsPress(notebook);
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#95a5a6" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meta: {
    fontSize: 12,
    color: "#95a5a6",
  },
  optionsButton: {
    padding: 8,
    marginLeft: 8,
  },
});


