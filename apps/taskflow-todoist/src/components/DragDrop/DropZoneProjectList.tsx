import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { projectService, Project } from "../../services/projectService";

interface DropZoneProjectListProps {
  visible: boolean;
  onProjectSelected: (projectId: string | null) => void;
  highlightedProjectId?: string | null;
  currentProjectId?: string | null;
}

export function DropZoneProjectList({
  visible,
  onProjectSelected,
  highlightedProjectId,
  currentProjectId,
}: DropZoneProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (visible) {
      loadProjects();
    }
  }, [visible]);

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Ionicons name="folder-outline" size={16} color="#6c5ce7" />
        <Text style={styles.headerText}>Drop to move to project</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Inbox option */}
        <TouchableOpacity
          style={[
            styles.projectItem,
            currentProjectId === null && styles.projectItemCurrent,
            highlightedProjectId === null && styles.projectItemHighlighted,
          ]}
          onPress={() => onProjectSelected(null)}
        >
          <View style={[styles.projectDot, { backgroundColor: "#6c5ce7" }]} />
          <Text
            style={[
              styles.projectLabel,
              highlightedProjectId === null && styles.projectLabelHighlighted,
            ]}
          >
            Inbox
          </Text>
        </TouchableOpacity>

        {projects.map((project) => (
          <TouchableOpacity
            key={project.id}
            style={[
              styles.projectItem,
              currentProjectId === project.id && styles.projectItemCurrent,
              highlightedProjectId === project.id && styles.projectItemHighlighted,
            ]}
            onPress={() => onProjectSelected(project.id)}
          >
            <View
              style={[styles.projectDot, { backgroundColor: project.color }]}
            />
            <Text
              style={[
                styles.projectLabel,
                highlightedProjectId === project.id &&
                  styles.projectLabelHighlighted,
              ]}
            >
              {project.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f0fdf4",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16a34a",
    marginLeft: 6,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  projectItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  projectItemCurrent: {
    opacity: 0.5,
  },
  projectItemHighlighted: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  projectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  projectLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  projectLabelHighlighted: {
    color: "white",
  },
});

