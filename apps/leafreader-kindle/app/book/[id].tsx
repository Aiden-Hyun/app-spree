import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { highlightService, Highlight, Bookmark } from "../../src/services/highlightService";
import { HighlightList } from "../../src/components/reader/HighlightList";

function BookDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const bookId = Array.isArray(id) ? id[0] : id || "";
  const [isFavorite, setIsFavorite] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);

  // TODO: Fetch book details from Supabase
  const book = {
    id: bookId,
    title: "Sample Book Title",
    author: "Author Name",
    cover: null,
    description:
      "This is a sample book description. The actual description will be loaded from the database.",
    totalPages: 350,
    currentPage: 0,
    status: "to_read",
    rating: 0,
    genre: "Fiction",
    publicationYear: 2023,
  };

  useEffect(() => {
    loadAnnotations();
  }, [bookId]);

  const loadAnnotations = async () => {
    try {
      const [highlightData, bookmarkData] = await Promise.all([
        highlightService.getBookHighlights(bookId),
        highlightService.getBookBookmarks(bookId),
      ]);
      setHighlights(highlightData);
      setBookmarks(bookmarkData);
    } catch (error) {
      console.error("Error loading annotations:", error);
    }
  };

  const handleStartReading = () => {
    router.push(`/reader/${id}`);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleDeleteBook = () => {
    // TODO: Implement delete functionality
    router.back();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reading":
        return "#3498db";
      case "completed":
        return "#27ae60";
      case "paused":
        return "#f39c12";
      default:
        return "#95a5a6";
    }
  };

  const progress =
    book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;

  return (
    <ScrollView style={styles.container}>
      {/* Book Cover and Basic Info */}
      <View style={styles.header}>
        <View style={styles.coverContainer}>
          {book.cover ? (
            <Image source={{ uri: book.cover }} style={styles.cover} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="book" size={48} color="#999" />
            </View>
          )}
        </View>

        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>by {book.author}</Text>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleStartReading}
          >
            <Ionicons name="book-outline" size={20} color="white" />
            <Text style={styles.primaryButtonText}>
              {book.currentPage > 0 ? "Continue Reading" : "Start Reading"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleToggleFavorite}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? "#e74c3c" : "#666"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Section */}
      {book.currentPage > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading Progress</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {book.currentPage} of {book.totalPages} pages
              </Text>
              <Text style={styles.progressPercent}>{progress.toFixed(0)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
        </View>
      )}

      {/* Book Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(book.status) },
                ]}
              />
              <Text style={styles.statusText}>
                {book.status.replace("_", " ").charAt(0).toUpperCase() +
                  book.status.slice(1).replace("_", " ")}
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Pages</Text>
            <Text style={styles.detailValue}>{book.totalPages}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Genre</Text>
            <Text style={styles.detailValue}>{book.genre}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Published</Text>
            <Text style={styles.detailValue}>{book.publicationYear}</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{book.description}</Text>
      </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => setShowBookmarks(true)}
          >
            <Ionicons name="bookmark-outline" size={20} color="#2d3436" />
            <Text style={styles.actionText}>
              View Bookmarks {bookmarks.length > 0 && `(${bookmarks.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => setShowHighlights(true)}
          >
            <Ionicons name="color-palette-outline" size={20} color="#2d3436" />
            <Text style={styles.actionText}>
              View Highlights {highlights.length > 0 && `(${highlights.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push(`/reader/${bookId}`)}
          >
            <Ionicons name="create-outline" size={20} color="#2d3436" />
            <Text style={styles.actionText}>Add Note</Text>
          </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionItem, styles.dangerAction]}
          onPress={handleDeleteBook}
        >
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          <Text style={[styles.actionText, styles.dangerText]}>
            Delete Book
          </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Highlights Modal */}
      <Modal
        visible={showHighlights}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHighlights(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Highlights</Text>
              <TouchableOpacity onPress={() => setShowHighlights(false)}>
                <Ionicons name="close" size={24} color="#2d3436" />
              </TouchableOpacity>
            </View>
            <HighlightList
              highlights={highlights}
              onHighlightPress={(highlight) => {
                setShowHighlights(false);
                router.push(`/reader/${bookId}?page=${highlight.page_number}`);
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Bookmarks Modal */}
      <Modal
        visible={showBookmarks}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookmarks(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bookmarks</Text>
              <TouchableOpacity onPress={() => setShowBookmarks(false)}>
                <Ionicons name="close" size={24} color="#2d3436" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bookmarkList}>
              {bookmarks.length === 0 ? (
                <View style={styles.emptyBookmarks}>
                  <Ionicons name="bookmark-outline" size={48} color="#ddd" />
                  <Text style={styles.emptyText}>No bookmarks yet</Text>
                </View>
              ) : (
                bookmarks.map((bookmark) => (
                  <TouchableOpacity
                    key={bookmark.id}
                    style={styles.bookmarkItem}
                    onPress={() => {
                      setShowBookmarks(false);
                      router.push(`/reader/${bookId}?page=${bookmark.page_number}`);
                    }}
                  >
                    <View style={styles.bookmarkInfo}>
                      <Text style={styles.bookmarkTitle}>
                        {bookmark.title || `Page ${bookmark.page_number}`}
                      </Text>
                      {bookmark.note && (
                        <Text style={styles.bookmarkNote}>{bookmark.note}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  coverContainer: {
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cover: {
    width: 150,
    height: 225,
    borderRadius: 8,
  },
  coverPlaceholder: {
    width: 150,
    height: 225,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    textAlign: "center",
    marginBottom: 8,
  },
  author: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 12,
  },
  primaryButton: {
    backgroundColor: "#2d3436",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f3f7",
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 16,
  },
  progressContainer: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3498db",
    borderRadius: 4,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
  },
  detailItem: {
    width: "50%",
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#2d3436",
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: "#2d3436",
    fontWeight: "500",
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionText: {
    fontSize: 16,
    color: "#2d3436",
    marginLeft: 16,
  },
  dangerAction: {
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  dangerText: {
    color: "#e74c3c",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3436",
  },
  bookmarkList: {
    padding: 20,
  },
  bookmarkItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2d3436",
  },
  bookmarkNote: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  emptyBookmarks: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
});

export default function BookDetails() {
  return (
    <ProtectedRoute>
      <BookDetailsScreen />
    </ProtectedRoute>
  );
}
