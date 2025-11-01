import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useTemplates } from "../../src/hooks/useTemplates";
import { router } from "expo-router";

import { Template } from "../../src/types";

const TEMPLATE_CATEGORIES = [
  { id: "all", title: "All", icon: "apps" },
  { id: "journal", title: "Journal", icon: "book" },
  { id: "planner", title: "Planner", icon: "calendar" },
  { id: "notes", title: "Notes", icon: "document-text" },
  { id: "education", title: "Education", icon: "school" },
  { id: "business", title: "Business", icon: "briefcase" },
];

function TemplatesScreen() {
  const { user } = useAuth();
  const { templates, loading, error, refresh } = useTemplates();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const filteredTemplates =
    selectedCategory === "all"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const handleTemplatePress = (template: Template) => {
    // Create new note with template
    router.push(`/editor/index?mode=create&template=${template.id}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleCreateCustomTemplate = () => {
    Alert.alert(
      "Create Template",
      "Custom template creation will be available soon!"
    );
  };

  const renderTemplate = (template: Template) => (
    <TouchableOpacity
      key={template.id}
      style={styles.templateCard}
      onPress={() => handleTemplatePress(template)}
    >
      <View style={styles.templatePreview}>
        <Ionicons name={template.icon as any} size={48} color="#00b894" />
      </View>

      <View style={styles.templateInfo}>
        <Text style={styles.templateTitle}>{template.title}</Text>
        <Text style={styles.templateDescription} numberOfLines={2}>
          {template.description}
        </Text>
      </View>

      {template.is_system && (
        <View style={styles.systemBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#00b894" />
          <Text style={styles.systemText}>System</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCategory = (category: (typeof TEMPLATE_CATEGORIES)[0]) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryChip,
        selectedCategory === category.id && styles.categoryChipActive,
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Ionicons
        name={category.icon as any}
        size={16}
        color={selectedCategory === category.id ? "#fff" : "#7f8c8d"}
      />
      <Text
        style={[
          styles.categoryText,
          selectedCategory === category.id && styles.categoryTextActive,
        ]}
      >
        {category.title}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading templates...</Text>
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
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {TEMPLATE_CATEGORIES.map(renderCategory)}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Choose a Template</Text>
          <Text style={styles.sectionSubtitle}>
            Start with a pre-designed template or create your own
          </Text>
        </View>

        {filteredTemplates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyTitle}>No Templates Found</Text>
            <Text style={styles.emptyText}>
              {selectedCategory === "all"
                ? "No templates available yet"
                : `No templates in ${selectedCategory} category`}
            </Text>
          </View>
        ) : (
          <View style={styles.templatesGrid}>
            {filteredTemplates.map(renderTemplate)}
          </View>
        )}

        <TouchableOpacity
          style={styles.createTemplateButton}
          onPress={handleCreateCustomTemplate}
        >
          <Ionicons name="add-circle-outline" size={24} color="#00b894" />
          <Text style={styles.createTemplateText}>Create Custom Template</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  categoriesContainer: {
    maxHeight: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#00b894",
  },
  categoryText: {
    fontSize: 14,
    color: "#7f8c8d",
    marginLeft: 6,
  },
  categoryTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  templatesGrid: {
    paddingHorizontal: 16,
  },
  templateCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  templatePreview: {
    width: 80,
    height: 80,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: "#7f8c8d",
    lineHeight: 20,
  },
  systemBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5f2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    position: "absolute",
    top: 12,
    right: 12,
  },
  systemText: {
    fontSize: 11,
    color: "#00b894",
    marginLeft: 4,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
  },
  createTemplateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    margin: 16,
    borderWidth: 2,
    borderColor: "#00b894",
    borderStyle: "dashed",
  },
  createTemplateText: {
    fontSize: 16,
    color: "#00b894",
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default function Templates() {
  return (
    <ProtectedRoute>
      <TemplatesScreen />
    </ProtectedRoute>
  );
}
