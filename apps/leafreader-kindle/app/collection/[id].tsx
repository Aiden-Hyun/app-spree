import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";

function CollectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [collectionName, setCollectionName] = useState("My Collection");
  const [description, setDescription] = useState(
    "A collection of my favorite books"
  );

  // TODO: Fetch collection details and books from Supabase
  const books = []; // Placeholder

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    // TODO: Save collection changes to Supabase
    setIsEditing(false);
  };

  const handleBookPress = (bookId: string) => {
    router.push(`/book/${bookId}`);
  };

  const handleAddBooks = () => {
    // TODO: Navigate to book selection screen
    router.push("/(tabs)/library");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Collection Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={[styles.colorBadge, { backgroundColor: "#2d3436" }]} />
          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity onPress={handleSave}>
                <Ionicons name="checkmark" size={24} color="#27ae60" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEditToggle}
                style={styles.cancelButton}
              >
                <Ionicons name="close" size={24} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleEditToggle}>
              <Ionicons name="create-outline" size={24} color="#2d3436" />
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <>
            <TextInput
              style={styles.nameInput}
              value={collectionName}
              onChangeText={setCollectionName}
              placeholder="Collection Name"
            />
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              multiline
            />
          </>
        ) : (
          <>
            <Text style={styles.collectionName}>{collectionName}</Text>
            <Text style={styles.description}>{description}</Text>
          </>
        )}

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{books.length}</Text>
            <Text style={styles.statLabel}>Books</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Reading</Text>
          </View>
        </View>
      </View>

      {/* Books Section */}
      <View style={styles.booksSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Books</Text>
          <TouchableOpacity onPress={handleAddBooks}>
            <Ionicons name="add-circle-outline" size={24} color="#2d3436" />
          </TouchableOpacity>
        </View>

        {books.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color="#ddd" />
            <Text style={styles.emptyStateText}>
              No books in this collection
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddBooks}>
              <Text style={styles.addButtonText}>Add Books</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.booksGrid}>{/* Book cards will go here */}</View>
        )}
      </View>

      {/* Collection Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="share-social-outline" size={20} color="#2d3436" />
          <Text style={styles.actionText}>Share Collection</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Ionicons name="download-outline" size={20} color="#2d3436" />
          <Text style={styles.actionText}>Export List</Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity style={[styles.actionItem, styles.dangerAction]}>
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
            <Text style={[styles.actionText, styles.dangerText]}>
              Delete Collection
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  colorBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  editActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  cancelButton: {
    marginLeft: 16,
  },
  collectionName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 8,
    padding: 0,
  },
  descriptionInput: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    padding: 0,
    minHeight: 60,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e0e0e0",
  },
  booksSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#2d3436",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  booksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actions: {
    padding: 20,
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
});

export default function Collection() {
  return (
    <ProtectedRoute>
      <CollectionScreen />
    </ProtectedRoute>
  );
}
