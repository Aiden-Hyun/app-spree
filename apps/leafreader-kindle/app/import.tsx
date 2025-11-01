import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ProtectedRoute } from "../src/components/ProtectedRoute";

function ImportScreen() {
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (type: "files" | "url") => {
    setIsImporting(true);
    try {
      // TODO: Implement file picker and import logic
      Alert.alert(
        "Coming Soon",
        "File import functionality will be implemented soon."
      );
    } catch (error) {
      Alert.alert("Error", "Failed to import book");
    } finally {
      setIsImporting(false);
    }
  };

  const handleUrlImport = () => {
    Alert.alert("Import from URL", "Enter the URL of an EPUB or PDF file", [
      { text: "Cancel", style: "cancel" },
      { text: "Import", onPress: () => handleImport("url") },
    ]);
  };

  const importOptions = [
    {
      id: "device",
      icon: "phone-portrait-outline",
      title: "From Device",
      description: "Import books from your device storage",
      onPress: () => handleImport("files"),
    },
    {
      id: "url",
      icon: "link-outline",
      title: "From URL",
      description: "Import books from a web link",
      onPress: handleUrlImport,
    },
    {
      id: "sample",
      icon: "book-outline",
      title: "Sample Books",
      description: "Browse our collection of free books",
      onPress: () =>
        Alert.alert("Coming Soon", "Sample books will be available soon."),
    },
  ];

  const supportedFormats = ["EPUB", "PDF", "TXT", "MOBI"];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Import Books</Text>
        <Text style={styles.headerSubtitle}>
          Add books to your library from various sources
        </Text>
      </View>

      {/* Import Options */}
      <View style={styles.optionsContainer}>
        {importOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionCard}
            onPress={option.onPress}
            disabled={isImporting}
          >
            <View style={styles.optionIcon}>
              <Ionicons name={option.icon as any} size={32} color="#2d3436" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Supported Formats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supported Formats</Text>
        <View style={styles.formatsContainer}>
          {supportedFormats.map((format) => (
            <View key={format} style={styles.formatBadge}>
              <Text style={styles.formatText}>{format}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips</Text>
        <View style={styles.tipsContainer}>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
            <Text style={styles.tipText}>
              DRM-free books work best for importing
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
            <Text style={styles.tipText}>
              Books are stored securely in your personal cloud
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
            <Text style={styles.tipText}>
              Import progress syncs across all your devices
            </Text>
          </View>
        </View>
      </View>

      {/* Recent Imports */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Imports</Text>
        <View style={styles.emptyRecent}>
          <Text style={styles.emptyText}>No recent imports</Text>
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
  optionsContainer: {
    padding: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f3f7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2d3436",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666",
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
  formatsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  formatBadge: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  formatText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2d3436",
  },
  tipsContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    flex: 1,
  },
  emptyRecent: {
    backgroundColor: "white",
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
});

export default function Import() {
  return (
    <ProtectedRoute>
      <ImportScreen />
    </ProtectedRoute>
  );
}
