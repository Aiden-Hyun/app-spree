import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ProtectedRoute } from "../src/components/ProtectedRoute";
import { useProjects } from "../src/hooks/useProjects";

function CreateProjectScreen() {
  const { createProject } = useProjects();

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectColor, setProjectColor] = useState("#6c5ce7");
  const [saving, setSaving] = useState(false);

  const colors = [
    "#e74c3c",
    "#e67e22",
    "#f39c12",
    "#f1c40f",
    "#2ecc71",
    "#27ae60",
    "#3498db",
    "#2980b9",
    "#9b59b6",
    "#8e44ad",
    "#34495e",
    "#6c5ce7",
    "#1abc9c",
    "#16a085",
    "#95a5a6",
    "#7f8c8d",
  ];

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      Alert.alert("Error", "Please enter a project name");
      return;
    }

    setSaving(true);
    try {
      await createProject({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        color: projectColor,
      });

      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Project</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            !projectName.trim() && styles.saveButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!projectName.trim() || saving}
        >
          <Text
            style={[
              styles.saveButtonText,
              !projectName.trim() && styles.saveButtonTextDisabled,
            ]}
          >
            {saving ? "Creating..." : "Create"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.preview}>
          <View
            style={[styles.previewColorBar, { backgroundColor: projectColor }]}
          />
          <View style={styles.previewContent}>
            <View
              style={[
                styles.previewIcon,
                { backgroundColor: projectColor + "20" },
              ]}
            >
              <Ionicons name="folder" size={32} color={projectColor} />
            </View>
            <Text style={styles.previewName}>
              {projectName || "Project Name"}
            </Text>
            {projectDescription && (
              <Text style={styles.previewDescription}>
                {projectDescription}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="Project name"
              placeholderTextColor="#999"
              autoFocus
              maxLength={50}
            />
            <Text style={styles.charCount}>{projectName.length}/50</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={projectDescription}
              onChangeText={setProjectDescription}
              placeholder="What's this project about?"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
            />
            <Text style={styles.charCount}>
              {projectDescription.length}/200
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <View style={styles.colorGrid}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    projectColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setProjectColor(color)}
                >
                  {projectColor === color && (
                    <Ionicons name="checkmark" size={20} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Tips for great projects:</Text>
            <View style={styles.tip}>
              <Ionicons name="bulb-outline" size={16} color="#666" />
              <Text style={styles.tipText}>
                Keep project names short and descriptive
              </Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="color-palette-outline" size={16} color="#666" />
              <Text style={styles.tipText}>
                Choose a color that represents the project well
              </Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="folder-open-outline" size={16} color="#666" />
              <Text style={styles.tipText}>
                Use projects to group related tasks together
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6c5ce7",
  },
  saveButtonTextDisabled: {
    color: "#999",
  },
  content: {
    flex: 1,
  },
  preview: {
    backgroundColor: "white",
    marginVertical: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  previewColorBar: {
    height: 4,
    width: "100%",
  },
  previewContent: {
    padding: 16,
    alignItems: "center",
  },
  previewIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  previewName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: "#333",
  },
  textArea: {
    minHeight: 80,
    paddingTop: 16,
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#333",
  },
  tips: {
    backgroundColor: "#f0f7ff",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
});

export default function CreateProject() {
  return (
    <ProtectedRoute>
      <CreateProjectScreen />
    </ProtectedRoute>
  );
}


