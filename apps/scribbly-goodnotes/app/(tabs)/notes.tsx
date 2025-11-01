import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { NoteCard } from "../../src/components/notes/NoteCard";
import { useNotes } from "../../src/hooks/useNotes";
import { router, useLocalSearchParams } from "expo-router";
import { Note } from "../../src/types";

function NotesScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const notebookId = params.notebook as string | undefined;

  const { notes, loading, error, toggleFavorite, deleteNote, refresh } =
    useNotes(notebookId);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery, showFavorites]);

  const filterNotes = () => {
    let filtered = notes;

    if (showFavorites) {
      filtered = filtered.filter((note) => note.is_favorite);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          (note.content && note.content.toLowerCase().includes(query)) ||
          note.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredNotes(filtered);
  };

  const handleCreateNote = () => {
    if (notebookId) {
      router.push(`/editor/index?mode=create&notebook=${notebookId}`);
    } else {
      router.push("/editor/index?mode=create");
    }
  };

  const handleNotePress = (note: Note) => {
    router.push(`/editor/index?id=${note.id}`);
  };

  const handleFavoritePress = async (note: Note) => {
    try {
      await toggleFavorite(note.id);
    } catch (error) {
      Alert.alert("Error", "Failed to update favorite status");
    }
  };

  const handleOptionsPress = (note: Note) => {
    Alert.alert(note.title, "What would you like to do?", [
      {
        text: "Move",
        onPress: () => handleMoveNote(note),
      },
      {
        text: "Duplicate",
        onPress: () => handleDuplicateNote(note),
      },
      {
        text: "Delete",
        onPress: () => confirmDeleteNote(note),
        style: "destructive",
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleMoveNote = (note: Note) => {
    // TODO: Implement move functionality
    Alert.alert("Move Note", "Move functionality coming soon");
  };

  const handleDuplicateNote = (note: Note) => {
    // TODO: Implement duplicate functionality
    Alert.alert("Duplicate Note", "Duplicate functionality coming soon");
  };

  const confirmDeleteNote = (note: Note) => {
    Alert.alert(
      "Delete Note",
      `Are you sure you want to delete "${note.title}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteNote(note.id);
            } catch (error) {
              Alert.alert("Error", "Failed to delete note");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color="#bdc3c7" />
      <Text style={styles.emptyTitle}>
        {searchQuery
          ? "No Notes Found"
          : showFavorites
          ? "No Favorite Notes"
          : "No Notes Yet"}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? "Try a different search term"
          : showFavorites
          ? "Star notes to see them here"
          : "Start writing your thoughts and ideas"}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateNote}
        >
          <Text style={styles.createButtonText}>Create Note</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading notes...</Text>
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
      <View style={styles.header}>
        {notebookId && (
          <View style={styles.notebookHeader}>
            <Text style={styles.notebookHeaderText}>
              Notebook: {notes[0]?.notebook?.title || "Loading..."}
            </Text>
          </View>
        )}

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#95a5a6"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
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
              showFavorites && styles.filterButtonActive,
            ]}
            onPress={() => setShowFavorites(!showFavorites)}
          >
            <Ionicons
              name="star"
              size={16}
              color={showFavorites ? "#fff" : "#7f8c8d"}
            />
            <Text
              style={[
                styles.filterText,
                showFavorites && styles.filterTextActive,
              ]}
            >
              Favorites
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredNotes.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.notesList}>
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPress={handleNotePress}
                onFavoritePress={handleFavoritePress}
                onOptionsPress={handleOptionsPress}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleCreateNote}>
        <Ionicons name="create" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
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
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#00b894",
  },
  filterText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#7f8c8d",
  },
  filterTextActive: {
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: "#00b894",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  notesList: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  notebookHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#e8f5f2",
    borderBottomWidth: 1,
    borderBottomColor: "#d0e8e3",
  },
  notebookHeaderText: {
    fontSize: 14,
    color: "#00b894",
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#00b894",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default function Notes() {
  return (
    <ProtectedRoute>
      <NotesScreen />
    </ProtectedRoute>
  );
}
