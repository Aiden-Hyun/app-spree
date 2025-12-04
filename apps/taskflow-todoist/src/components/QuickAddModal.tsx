import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TaskInput } from "../services/taskService";
import { Project } from "../services/projectService";

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: TaskInput) => Promise<void>;
  projects: Project[];
  defaultProjectId?: string;
  defaultDueDate?: Date;
}

export function QuickAddModal({
  visible,
  onClose,
  onSubmit,
  projects,
  defaultProjectId,
  defaultDueDate,
}: QuickAddModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskInput["priority"]>("medium");
  const [selectedProjectId, setSelectedProjectId] = useState(
    defaultProjectId || ""
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(defaultDueDate);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const priorities: Array<{
    value: TaskInput["priority"];
    label: string;
    color: string;
  }> = [
    { value: "low", label: "Low", color: "#95a5a6" },
    { value: "medium", label: "Medium", color: "#3498db" },
    { value: "high", label: "High", color: "#f39c12" },
    { value: "urgent", label: "Urgent", color: "#e74c3c" },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        projectId: selectedProjectId || undefined,
        dueDate,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      setSelectedProjectId(defaultProjectId || "");
      setDueDate(defaultDueDate);
      setShowDetails(false);

      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Task</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.input}
              placeholder="Task name"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="next"
            />

            {showDetails && (
              <>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description (optional)"
                  placeholderTextColor="#999"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {/* Project selector */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Project</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.projectList}
                  >
                    <TouchableOpacity
                      style={[
                        styles.projectChip,
                        !selectedProjectId && styles.projectChipSelected,
                      ]}
                      onPress={() => setSelectedProjectId("")}
                    >
                      <View
                        style={[
                          styles.projectDot,
                          { backgroundColor: "#6c5ce7" },
                        ]}
                      />
                      <Text style={styles.projectChipText}>Inbox</Text>
                    </TouchableOpacity>

                    {projects.map((project) => (
                      <TouchableOpacity
                        key={project.id}
                        style={[
                          styles.projectChip,
                          selectedProjectId === project.id &&
                            styles.projectChipSelected,
                        ]}
                        onPress={() => setSelectedProjectId(project.id)}
                      >
                        <View
                          style={[
                            styles.projectDot,
                            { backgroundColor: project.color },
                          ]}
                        />
                        <Text style={styles.projectChipText}>
                          {project.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Priority selector */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Priority</Text>
                  <View style={styles.priorityList}>
                    {priorities.map((p) => (
                      <TouchableOpacity
                        key={p.value}
                        style={[
                          styles.priorityChip,
                          priority === p.value && styles.priorityChipSelected,
                          { borderColor: p.color },
                          priority === p.value && {
                            backgroundColor: p.color + "20",
                          },
                        ]}
                        onPress={() => setPriority(p.value)}
                      >
                        <Ionicons
                          name="flag"
                          size={16}
                          color={priority === p.value ? p.color : "#999"}
                        />
                        <Text
                          style={[
                            styles.priorityChipText,
                            priority === p.value && { color: p.color },
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Due date selector */}
                <TouchableOpacity style={styles.dueDateButton}>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.dueDateText}>
                    {dueDate ? dueDate.toLocaleDateString() : "Set due date"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {!showDetails && (
              <TouchableOpacity
                style={styles.showDetailsButton}
                onPress={() => setShowDetails(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#6c5ce7" />
                <Text style={styles.showDetailsText}>Add details</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.quickInfo}>
              {selectedProject && (
                <View style={styles.quickInfoItem}>
                  <View
                    style={[
                      styles.projectDot,
                      { backgroundColor: selectedProject.color },
                    ]}
                  />
                  <Text style={styles.quickInfoText}>
                    {selectedProject.name}
                  </Text>
                </View>
              )}
              {dueDate && (
                <View style={styles.quickInfoItem}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.quickInfoText}>
                    {dueDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                !title.trim() && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!title.trim() || loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? "Adding..." : "Add task"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 20,
    paddingTop: 10,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    color: "#333",
  },
  textArea: {
    minHeight: 80,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  projectList: {
    flexDirection: "row",
  },
  projectChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  projectChipSelected: {
    backgroundColor: "#e8e4ff",
  },
  projectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  projectChipText: {
    fontSize: 14,
    color: "#333",
  },
  priorityList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priorityChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  priorityChipSelected: {
    borderWidth: 2,
  },
  priorityChipText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  dueDateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  dueDateText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  showDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  showDetailsText: {
    fontSize: 16,
    color: "#6c5ce7",
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  quickInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  quickInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  quickInfoText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: "#6c5ce7",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ddd",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});


