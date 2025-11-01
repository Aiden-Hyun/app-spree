import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { BookGrid } from "../../src/components/library/BookGrid";
import { SearchBar } from "../../src/components/library/SearchBar";
import { FilterMenu } from "../../src/components/library/FilterMenu";
import { useLibrary } from "../../src/hooks/useLibrary";

function LibraryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const {
    books,
    loading,
    error,
    refreshing,
    refresh,
    searchBooks,
    getBookCounts,
  } = useLibrary();

  // Format books for the components
  const formattedBooks = books.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    cover: book.cover_url,
    currentPage: book.current_page,
    totalPages: book.total_pages,
    status: book.status,
  }));

  // Handle search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery) {
        searchBooks(searchQuery);
      } else {
        refresh();
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleImportBook = () => {
    router.push("/import");
  };

  const handleBookPress = (bookId: string) => {
    router.push(`/book/${bookId}`);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d3436" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search books, authors..."
        />
      </View>

      {/* Filter Tabs */}
      <FilterMenu
        activeFilter={filter}
        onFilterChange={setFilter}
        bookCounts={getBookCounts()}
      />

      {/* Books Grid */}
      {formattedBooks.length === 0 && filter === "all" && !searchQuery ? (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
        >
          <Ionicons name="book-outline" size={64} color="#ddd" />
          <Text style={styles.emptyStateTitle}>Your library is empty</Text>
          <Text style={styles.emptyStateText}>
            Import your first book to start reading
          </Text>
          <TouchableOpacity
            style={styles.importButton}
            onPress={handleImportBook}
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text style={styles.importButtonText}>Import Book</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <BookGrid
          books={formattedBooks}
          onBookPress={handleBookPress}
          filter={filter}
          searchQuery={searchQuery}
        />
      )}

      {/* Floating Action Button */}
      {formattedBooks.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleImportBook}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#2d3436",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3436",
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    marginBottom: 24,
  },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2d3436",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  importButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    backgroundColor: "#2d3436",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});

export default function Library() {
  return (
    <ProtectedRoute>
      <LibraryScreen />
    </ProtectedRoute>
  );
}
