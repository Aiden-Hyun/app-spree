import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { NotebookCard } from "../../src/components/notebooks/NotebookCard";
import { NotebookModal } from "../../src/components/notebooks/NotebookModal";
import { useNotebooks } from "../../src/hooks/useNotebooks";
import { router } from "expo-router";
import { Notebook } from "../../src/types";

function NotebooksScreen() {
  const { user } = useAuth();
  const { notebooks, loading, error, createNotebook, refresh } = useNotebooks();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);

  const handleCreateNotebook = () => {
    setSelectedNotebook(null);
    setModalVisible(true);
  };

  const handleNotebookPress = (notebook: Notebook) => {
    if (notebook.is_folder) {
      // Navigate to folder view
      router.push(`/notebooks/${notebook.id}`);
    } else {
      // Navigate to notes list for this notebook
      router.push(`/(tabs)/notes?notebook=${notebook.id}`);
    }
  };

  const handleOptionsPress = (notebook: Notebook) => {
    Alert.alert(notebook.title, "What would you like to do?", [
      {
        text: "Edit",
        onPress: () => {
          setSelectedNotebook(notebook);
          setModalVisible(true);
        },
      },
      {
        text: "Archive",
        onPress: () => handleArchive(notebook),
      },
      {
        text: "Delete",
        onPress: () => confirmDelete(notebook),
        style: "destructive",
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleArchive = async (notebook: Notebook) => {
    // TODO: Implement archive functionality
    Alert.alert("Archive", "Archive functionality coming soon");
  };

  const confirmDelete = (notebook: Notebook) => {
    Alert.alert(
      "Delete Notebook",
      `Are you sure you want to delete "${notebook.title}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => handleDelete(notebook),
          style: "destructive",
        },
      ]
    );
  };

  const handleDelete = async (notebook: Notebook) => {
    // TODO: Implement delete functionality
    Alert.alert("Delete", "Delete functionality coming soon");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="book-outline" size={64} color="#bdc3c7" />
      <Text style={styles.emptyTitle}>No Notebooks Yet</Text>
      <Text style={styles.emptyText}>
        Create your first notebook to start organizing your notes
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateNotebook}
      >
        <Text style={styles.createButtonText}>Create Notebook</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading notebooks...</Text>
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
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {notebooks.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.notebooksList}>
            {notebooks.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                notebook={notebook}
                onPress={handleNotebookPress}
                onOptionsPress={handleOptionsPress}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleCreateNotebook}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <NotebookModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedNotebook(null);
        }}
        onSave={createNotebook}
        notebook={selectedNotebook}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
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
  notebooksList: {
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

export default function Notebooks() {
  return (
    <ProtectedRoute>
      <NotebooksScreen />
    </ProtectedRoute>
  );
}
