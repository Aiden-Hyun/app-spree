import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Highlight } from "../../services/highlightService";

interface HighlightListProps {
  highlights: Highlight[];
  onHighlightPress?: (highlight: Highlight) => void;
  onDeletePress?: (highlightId: string) => void;
}

export function HighlightList({
  highlights,
  onHighlightPress,
  onDeletePress,
}: HighlightListProps) {
  const getHighlightColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      yellow: "#FFEB3B",
      green: "#4CAF50",
      blue: "#2196F3",
      pink: "#E91E63",
      purple: "#9C27B0",
    };
    return colorMap[color] || colorMap.yellow;
  };

  if (highlights.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="color-palette-outline" size={48} color="#ddd" />
        <Text style={styles.emptyText}>No highlights yet</Text>
        <Text style={styles.emptySubtext}>
          Long press text while reading to highlight
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {highlights.map((highlight) => (
        <TouchableOpacity
          key={highlight.id}
          style={styles.highlightCard}
          onPress={() => onHighlightPress?.(highlight)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.pageInfo}>
              <View
                style={[
                  styles.colorIndicator,
                  { backgroundColor: getHighlightColor(highlight.color) },
                ]}
              />
              <Text style={styles.pageNumber}>
                Page {highlight.page_number}
              </Text>
            </View>
            {onDeletePress && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onDeletePress(highlight.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#e74c3c" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.highlightText} numberOfLines={3}>
            "{highlight.text_content}"
          </Text>

          {highlight.note && (
            <View style={styles.noteSection}>
              <Ionicons name="create-outline" size={16} color="#666" />
              <Text style={styles.noteText} numberOfLines={2}>
                {highlight.note}
              </Text>
            </View>
          )}

          <Text style={styles.timestamp}>
            {new Date(highlight.created_at).toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  highlightCard: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pageInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    opacity: 0.8,
  },
  pageNumber: {
    fontSize: 14,
    color: "#666",
  },
  deleteButton: {
    padding: 4,
  },
  highlightText: {
    fontSize: 16,
    color: "#2d3436",
    lineHeight: 24,
    fontStyle: "italic",
  },
  noteSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
});


