import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { NoteService } from "../../src/services/noteService";
import { NotebookService } from "../../src/services/notebookService";
import { Note, Notebook } from "../../src/types";
import { router } from "expo-router";

type SearchResult =
  | (Note & { type: "note" })
  | (Notebook & { type: "notebook" });

function SearchScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState<
    "all" | "notes" | "notebooks"
  >("all");

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    Keyboard.dismiss();

    try {
      const query = searchQuery.toLowerCase();
      const searchResults: SearchResult[] = [];

      // Search based on filter
      if (searchFilter === "all" || searchFilter === "notes") {
        const notes = await NoteService.searchNotes(query);
        searchResults.push(
          ...notes.map((note) => ({ ...note, type: "note" as const }))
        );
      }

      if (searchFilter === "all" || searchFilter === "notebooks") {
        const notebooks = await NotebookService.getNotebooks();
        const filteredNotebooks = notebooks.filter(
          (nb) =>
            nb.title.toLowerCase().includes(query) ||
            (nb.description && nb.description.toLowerCase().includes(query))
        );
        searchResults.push(
          ...filteredNotebooks.map((nb) => ({
            ...nb,
            type: "notebook" as const,
          }))
        );
      }

      // Sort by updated_at
      searchResults.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setResults(searchResults);

      // Add to recent searches
      const updatedRecent = [
        searchQuery,
        ...recentSearches.filter((s) => s !== searchQuery),
      ].slice(0, 5);
      setRecentSearches(updatedRecent);

      // Store in local storage (you could use AsyncStorage in a real app)
      try {
        localStorage.setItem("recentSearches", JSON.stringify(updatedRecent));
      } catch (e) {
        // Ignore storage errors
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, searchFilter, recentSearches]);

  const handleResultPress = (result: SearchResult) => {
    if (result.type === "note") {
      router.push(`/editor/index?id=${result.id}`);
    } else {
      router.push(`/(tabs)/notes?notebook=${result.id}`);
    }
  };

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query);
    // Trigger search after setting query
    setTimeout(() => handleSearch(), 100);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("recentSearches");
    } catch (e) {
      // Ignore storage errors
    }
  };

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentSearches");
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  // Auto-search on query change (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchFilter]);

  const renderResult = (result: SearchResult) => {
    const getContentPreview = (content?: string) => {
      if (!content) return "";
      // Strip HTML tags for preview
      const stripped = content.replace(/<[^>]*>/g, "");
      // Replace multiple spaces/newlines with single space
      const cleaned = stripped.replace(/\s+/g, " ").trim();
      return cleaned.substring(0, 100) + (cleaned.length > 100 ? "..." : "");
    };

    return (
      <TouchableOpacity
        key={result.id}
        style={styles.resultCard}
        onPress={() => handleResultPress(result)}
      >
        <View style={styles.resultHeader}>
          <Ionicons
            name={result.type === "note" ? "document-text" : "book"}
            size={20}
            color="#00b894"
          />
          <Text style={styles.resultTitle} numberOfLines={1}>
            {result.title}
          </Text>
        </View>

        {result.type === "note" && result.content && (
          <Text style={styles.matchExcerpt} numberOfLines={2}>
            {getContentPreview(result.content)}
          </Text>
        )}

        {result.type === "notebook" && result.description && (
          <Text style={styles.matchExcerpt} numberOfLines={2}>
            {result.description}
          </Text>
        )}

        <View style={styles.resultMeta}>
          {result.type === "note" && result.notebook && (
            <Text style={styles.notebookName}>{result.notebook.title}</Text>
          )}
          {result.type === "notebook" && (
            <Text style={styles.notebookName}>
              {result.note_count || 0} notes
            </Text>
          )}
          <Text style={styles.resultDate}>
            {new Date(result.updated_at).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={64} color="#bdc3c7" />
      <Text style={styles.emptyTitle}>Search Your Notes</Text>
      <Text style={styles.emptyText}>
        Find anything in your notebooks and notes
      </Text>
    </View>
  );

  const renderNoResults = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color="#bdc3c7" />
      <Text style={styles.emptyTitle}>No Results Found</Text>
      <Text style={styles.emptyText}>
        Try searching with different keywords
      </Text>
    </View>
  );

  const renderRecentSearches = () => (
    <View style={styles.recentSection}>
      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Recent Searches</Text>
        <TouchableOpacity onPress={clearRecentSearches}>
          <Text style={styles.clearButton}>Clear</Text>
        </TouchableOpacity>
      </View>
      {recentSearches.map((search, index) => (
        <TouchableOpacity
          key={index}
          style={styles.recentItem}
          onPress={() => handleRecentSearch(search)}
        >
          <Ionicons name="time-outline" size={16} color="#7f8c8d" />
          <Text style={styles.recentText}>{search}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#95a5a6"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes and notebooks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#95a5a6" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              searchFilter === "all" && styles.filterButtonActive,
            ]}
            onPress={() => setSearchFilter("all")}
          >
            <Text
              style={[
                styles.filterText,
                searchFilter === "all" && styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              searchFilter === "notes" && styles.filterButtonActive,
            ]}
            onPress={() => setSearchFilter("notes")}
          >
            <Text
              style={[
                styles.filterText,
                searchFilter === "notes" && styles.filterTextActive,
              ]}
            >
              Notes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              searchFilter === "notebooks" && styles.filterButtonActive,
            ]}
            onPress={() => setSearchFilter("notebooks")}
          >
            <Text
              style={[
                styles.filterText,
                searchFilter === "notebooks" && styles.filterTextActive,
              ]}
            >
              Notebooks
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00b894" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchQuery && results.length > 0 ? (
          <View style={styles.resultsList}>{results.map(renderResult)}</View>
        ) : searchQuery && results.length === 0 && !loading ? (
          renderNoResults()
        ) : recentSearches.length > 0 ? (
          renderRecentSearches()
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  searchHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    marginHorizontal: 4,
  },
  filterButtonActive: {
    backgroundColor: "#00b894",
  },
  filterText: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
  },
  resultsList: {
    padding: 16,
  },
  resultCard: {
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
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginLeft: 8,
    flex: 1,
  },
  matchExcerpt: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 8,
    lineHeight: 20,
  },
  resultMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notebookName: {
    fontSize: 12,
    color: "#00b894",
    fontWeight: "500",
  },
  resultDate: {
    fontSize: 12,
    color: "#95a5a6",
  },
  recentSection: {
    padding: 16,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  clearButton: {
    fontSize: 14,
    color: "#00b894",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  recentText: {
    fontSize: 16,
    color: "#2c3e50",
    marginLeft: 12,
  },
});

export default function Search() {
  return (
    <ProtectedRoute>
      <SearchScreen />
    </ProtectedRoute>
  );
}
