import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ProtectedRoute } from "../src/components/ProtectedRoute";
import { useProjects } from "../src/hooks/useProjects";
import { useTasks } from "../src/hooks/useTasks";
import { TaskInput } from "../src/services/taskService";

function QuickAddScreen() {
  const params = useLocalSearchParams();
  const defaultProjectId = params.projectId as string | undefined;
  const defaultDueDate = params.dueDate
    ? new Date(params.dueDate as string)
    : undefined;

  const { projects } = useProjects();
  const { createTask } = useTasks();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskInput["priority"]>("medium");
  const [selectedProjectId, setSelectedProjectId] = useState(
    defaultProjectId || ""
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(defaultDueDate);
  const [loading, setLoading] = useState(false);

  const priorities: Array<{
    value: TaskInput["priority"];
    label: string;
    color: string;
    icon: string;
  }> = [
    { value: "low", label: "Low", color: "#95a5a6", icon: "flag-outline" },
    {
      value: "medium",
      label: "Medium",
      color: "#3498db",
      icon: "flag-outline",
    },
    { value: "high", label: "High", color: "#f39c12", icon: "flag" },
    { value: "urgent", label: "Urgent", color: "#e74c3c", icon: "flag" },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a task name");
      return;
    }

    setLoading(true);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        projectId: selectedProjectId || undefined,
        dueDate,
      });

      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

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
        <Text style={styles.headerTitle}>New Task</Text>
        <TouchableOpacity
          style={[
            styles.saveButton,
            !title.trim() && styles.saveButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!title.trim() || loading}
        >
          <Text
            style={[
              styles.saveButtonText,
              !title.trim() && styles.saveButtonTextDisabled,
            ]}
          >
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.titleInput}
          placeholder="Task name"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          autoFocus
          returnKeyType="next"
        />

        <TextInput
          style={styles.descriptionInput}
          placeholder="Description"
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.projectChip,
                !selectedProjectId && styles.projectChipSelected,
              ]}
              onPress={() => setSelectedProjectId("")}
            >
              <View
                style={[styles.projectDot, { backgroundColor: "#6c5ce7" }]}
              />
              <Text
                style={[
                  styles.projectChipText,
                  !selectedProjectId && styles.projectChipTextSelected,
                ]}
              >
                Inbox
              </Text>
            </TouchableOpacity>

            {projects
              .filter((p) => !p.isArchived)
              .map((project) => (
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
                  <Text
                    style={[
                      styles.projectChipText,
                      selectedProjectId === project.id &&
                        styles.projectChipTextSelected,
                    ]}
                  >
                    {project.name}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        {/* Priority selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.priorityGrid}>
            {priorities.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priorityButton,
                  priority === p.value && styles.priorityButtonSelected,
                  { borderColor: priority === p.value ? p.color : "#ddd" },
                ]}
                onPress={() => setPriority(p.value)}
              >
                <Ionicons
                  name={p.icon as any}
                  size={20}
                  color={priority === p.value ? p.color : "#999"}
                />
                <Text
                  style={[
                    styles.priorityText,
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Due Date</Text>
          <View style={styles.dueDateGrid}>
            <TouchableOpacity
              style={[
                styles.dueDateButton,
                dueDate && isToday(dueDate) && styles.dueDateButtonSelected,
              ]}
              onPress={() => setDueDate(new Date())}
            >
              <Ionicons name="sunny-outline" size={20} color="#f39c12" />
              <Text style={styles.dueDateButtonText}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dueDateButton,
                dueDate && isTomorrow(dueDate) && styles.dueDateButtonSelected,
              ]}
              onPress={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setDueDate(tomorrow);
              }}
            >
              <Ionicons name="moon-outline" size={20} color="#3498db" />
              <Text style={styles.dueDateButtonText}>Tomorrow</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dueDateButton,
                dueDate &&
                  !isToday(dueDate) &&
                  !isTomorrow(dueDate) &&
                  styles.dueDateButtonSelected,
              ]}
              onPress={() => {
                // This would open a date picker in a real app
                Alert.alert("Date Picker", "Date picker would open here");
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#6c5ce7" />
              <Text style={styles.dueDateButtonText}>
                {dueDate && !isToday(dueDate) && !isTomorrow(dueDate)
                  ? dueDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Pick date"}
              </Text>
            </TouchableOpacity>

            {dueDate && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => setDueDate(undefined)}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
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
    padding: 16,
  },
  titleInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    marginBottom: 12,
    color: "#333",
  },
  descriptionInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    minHeight: 100,
    color: "#333",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  projectChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  projectChipSelected: {
    backgroundColor: "#6c5ce7",
    borderColor: "#6c5ce7",
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
  projectChipTextSelected: {
    color: "white",
  },
  priorityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priorityButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  priorityButtonSelected: {
    backgroundColor: "#f8f9fa",
  },
  priorityText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  dueDateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dueDateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dueDateButtonSelected: {
    backgroundColor: "#6c5ce7",
    borderColor: "#6c5ce7",
  },
  dueDateButtonText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  clearDateButton: {
    padding: 10,
  },
});

export default function QuickAdd() {
  return (
    <ProtectedRoute>
      <QuickAddScreen />
    </ProtectedRoute>
  );
}
