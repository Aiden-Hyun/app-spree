import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = (screenWidth - 48) / 3; // 3 columns with padding

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    cover?: string;
    currentPage: number;
    totalPages: number;
    status: "to_read" | "reading" | "completed" | "paused";
  };
  onPress: (bookId: string) => void;
}

export function BookCard({ book, onPress }: BookCardProps) {
  const progress =
    book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;

  const getStatusIcon = () => {
    switch (book.status) {
      case "reading":
        return <Ionicons name="book" size={12} color="#3498db" />;
      case "completed":
        return <Ionicons name="checkmark-circle" size={12} color="#27ae60" />;
      case "paused":
        return <Ionicons name="pause-circle" size={12} color="#f39c12" />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(book.id)}
      activeOpacity={0.8}
    >
      {/* Book Cover */}
      <View style={styles.coverContainer}>
        {book.cover ? (
          <Image source={{ uri: book.cover }} style={styles.cover} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="book" size={32} color="#999" />
          </View>
        )}

        {/* Progress Indicator for Reading Books */}
        {book.status === "reading" && progress > 0 && (
          <View style={styles.progressOverlay}>
            <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
          </View>
        )}

        {/* Status Badge */}
        {book.status !== "to_read" && (
          <View style={styles.statusBadge}>{getStatusIcon()}</View>
        )}
      </View>

      {/* Book Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: 20,
  },
  coverContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 2 / 3,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cover: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    resizeMode: "cover",
  },
  coverPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  progressOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  progressText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  info: {
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
    lineHeight: 18,
  },
  author: {
    fontSize: 12,
    color: "#666",
  },
});


