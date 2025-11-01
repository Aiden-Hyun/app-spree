import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import { ProjectCard } from "../../src/components/ProjectCard";
import { EmptyState } from "../../src/components/EmptyState";
import { useProjects } from "../../src/hooks/useProjects";
import { router } from "expo-router";

function ProjectsScreen() {
  const { projects, loading, error, refresh, refreshing } = useProjects();

  // Sample project colors for new projects
  const projectColors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"];

  const handleProjectPress = (id: string) => {
    router.push(`/project/${id}`);
  };

  const handleProjectLongPress = (id: string) => {
    // Show project options (edit, archive, delete)
    console.log("Project long pressed:", id);
  };

  const handleCreateProject = () => {
    router.push("/create-project");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Organize tasks by project</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleCreateProject}
          >
            <Ionicons name="add-circle-outline" size={28} color="#6c5ce7" />
          </TouchableOpacity>
        </View>

        {/* Project list */}
        {projects.length === 0 ? (
          <EmptyState
            icon="folder-open-outline"
            title="No projects yet"
            subtitle="Create projects to organize your tasks"
          >
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateProject}
            >
              <Ionicons
                name="add"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.createButtonText}>Create Project</Text>
            </TouchableOpacity>
          </EmptyState>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor="#6c5ce7"
              />
            }
          >
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                color={project.color || "#6c5ce7"}
                description={project.description}
                taskCount={project.taskCount || 0}
                completedTaskCount={project.completedTaskCount || 0}
                isArchived={project.isArchived}
                onPress={handleProjectPress}
                onLongPress={handleProjectLongPress}
              />
            ))}
          </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 16,
    color: "#666",
  },
  addButton: {
    padding: 4,
  },
  createButton: {
    flexDirection: "row",
    backgroundColor: "#6c5ce7",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function Projects() {
  return (
    <ProtectedRoute>
      <ProjectsScreen />
    </ProtectedRoute>
  );
}
