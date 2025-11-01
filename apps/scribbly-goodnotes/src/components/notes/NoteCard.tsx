import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Note } from "../../types";

interface NoteCardProps {
  note: Note;
  onPress: (note: Note) => void;
  onFavoritePress?: (note: Note) => void;
  onOptionsPress?: (note: Note) => void;
}

export function NoteCard({
  note,
  onPress,
  onFavoritePress,
  onOptionsPress,
}: NoteCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getContentPreview = (content?: string) => {
    if (!content) return "";

    // Strip HTML tags for preview
    const stripped = content.replace(/<[^>]*>/g, "");
    // Replace multiple spaces/newlines with single space
    const cleaned = stripped.replace(/\s+/g, " ").trim();

    return cleaned;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(note)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {note.title}
        </Text>
        <View style={styles.headerActions}>
          {note.is_locked && (
            <Ionicons
              name="lock-closed"
              size={16}
              color="#95a5a6"
              style={styles.icon}
            />
          )}
          {onFavoritePress && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onFavoritePress(note);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={note.is_favorite ? "star" : "star-outline"}
                size={20}
                color={note.is_favorite ? "#f39c12" : "#95a5a6"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {note.content && (
        <Text style={styles.content} numberOfLines={2}>
          {getContentPreview(note.content)}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.metaContainer}>
          {note.notebook && (
            <View
              style={[
                styles.notebookTag,
                { backgroundColor: note.notebook.color + "20" },
              ]}
            >
              <Ionicons
                name="book-outline"
                size={12}
                color={note.notebook.color}
              />
              <Text
                style={[styles.notebookTagText, { color: note.notebook.color }]}
              >
                {note.notebook.title}
              </Text>
            </View>
          )}
          <Text style={styles.date}>{formatDate(note.updated_at)}</Text>
        </View>

        {onOptionsPress && (
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={(e) => {
              e.stopPropagation();
              onOptionsPress(note);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#95a5a6" />
          </TouchableOpacity>
        )}
      </View>

      {note.tags.length > 0 && (
        <View style={styles.tagsList}>
          {note.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {note.tags.length > 3 && (
            <Text style={styles.moreTags}>+{note.tags.length - 3}</Text>
          )}
        </View>
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
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
    marginRight: 8,
  },
  content: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  notebookTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  notebookTagText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  date: {
    fontSize: 12,
    color: "#95a5a6",
  },
  optionsButton: {
    padding: 4,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tag: {
    backgroundColor: "#e8f5f2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  tagText: {
    fontSize: 11,
    color: "#00b894",
    fontWeight: "500",
  },
  moreTags: {
    fontSize: 11,
    color: "#95a5a6",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
