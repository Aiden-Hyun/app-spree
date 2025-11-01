import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";

function ReadingScreen() {
  const router = useRouter();

  // TODO: Fetch currently reading books from Supabase
  const currentlyReading = []; // Placeholder

  const handleContinueReading = (bookId: string) => {
    router.push(`/reader/${bookId}`);
  };

  const handleViewDetails = (bookId: string) => {
    router.push(`/book/${bookId}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Currently Reading</Text>
        <Text style={styles.headerSubtitle}>
          {currentlyReading.length}{" "}
          {currentlyReading.length === 1 ? "book" : "books"} in progress
        </Text>
      </View>

      {currentlyReading.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={64} color="#ddd" />
          <Text style={styles.emptyStateTitle}>No books in progress</Text>
          <Text style={styles.emptyStateText}>
            Visit your library to start reading a book
          </Text>
          <TouchableOpacity
            style={styles.libraryButton}
            onPress={() => router.push("/(tabs)/library")}
          >
            <Text style={styles.libraryButtonText}>Go to Library</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.booksList}>
          {/* Reading progress cards will go here */}
        </View>
      )}

      {/* Recent Reading Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        <View style={styles.sessionsList}>
          <Text style={styles.noSessionsText}>No recent reading sessions</Text>
        </View>
      </View>

      {/* Reading Goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        <View style={styles.goalCard}>
          <View style={styles.goalInfo}>
            <Text style={styles.goalLabel}>Reading Goal</Text>
            <Text style={styles.goalValue}>0 / 30 minutes</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "0%" }]} />
          </View>
        </View>
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
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
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
  libraryButton: {
    backgroundColor: "#2d3436",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  libraryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  booksList: {
    padding: 16,
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
  sessionsList: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noSessionsText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  goalCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: 16,
    color: "#666",
  },
  goalValue: {
    fontSize: 16,
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
    backgroundColor: "#27ae60",
    borderRadius: 4,
  },
});

export default function Reading() {
  return (
    <ProtectedRoute>
      <ReadingScreen />
    </ProtectedRoute>
  );
}
