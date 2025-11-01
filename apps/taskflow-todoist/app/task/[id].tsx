import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useTasks } from "../../src/hooks/useTasks";
import { useProjects } from "../../src/hooks/useProjects";
import { taskService, Task, TaskInput } from "../../src/services/taskService";

function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const taskId = id as string;

  const { updateTask, deleteTask } = useTasks();
  const { projects } = useProjects();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskInput["priority"]>("medium");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();

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

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      const tasks = await taskService.getTasks();
      const foundTask = tasks.find((t) => t.id === taskId);

      if (foundTask) {
        setTask(foundTask);
        setTitle(foundTask.title);
        setDescription(foundTask.description || "");
        setPriority(foundTask.priority);
        setSelectedProjectId(foundTask.projectId || "");
        setDueDate(foundTask.dueDate ? new Date(foundTask.dueDate) : undefined);
      } else {
        Alert.alert("Error", "Task not found");
        router.back();
      }
    } catch (error) {
      console.error("Failed to load task:", error);
      Alert.alert("Error", "Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Task title is required");
      return;
    }

    setSaving(true);
    try {
      await updateTask(taskId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        projectId: selectedProjectId || undefined,
        dueDate,
      });

      setEditing(false);
      Alert.alert("Success", "Task updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTask(taskId);
            router.back();
          } catch (error) {
            Alert.alert("Error", "Failed to delete task");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={styles.headerButtons}>
          {editing ? (
            <>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setEditing(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, styles.saveButton]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveText}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setEditing(true)}
            >
              <Ionicons name="create-outline" size={24} color="#6c5ce7" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Task name"
              editable={!saving}
            />
          ) : (
            <Text style={styles.value}>{task.title}</Text>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          {editing ? (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add description..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!saving}
            />
          ) : (
            <Text style={styles.value}>
              {task.description || "No description"}
            </Text>
          )}
        </View>

        {/* Project */}
        <View style={styles.section}>
          <Text style={styles.label}>Project</Text>
          {editing ? (
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
          ) : (
            <View style={styles.projectDisplay}>
              <View
                style={[
                  styles.projectDot,
                  {
                    backgroundColor:
                      task.project?.color ||
                      selectedProject?.color ||
                      "#6c5ce7",
                  },
                ]}
              />
              <Text style={styles.value}>
                {task.project?.name || selectedProject?.name || "Inbox"}
              </Text>
            </View>
          )}
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={styles.label}>Priority</Text>
          {editing ? (
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
          ) : (
            <View style={styles.priorityDisplay}>
              <Ionicons
                name={
                  priorities.find((p) => p.value === task.priority)?.icon as any
                }
                size={20}
                color={priorities.find((p) => p.value === task.priority)?.color}
              />
              <Text
                style={[
                  styles.value,
                  {
                    color: priorities.find((p) => p.value === task.priority)
                      ?.color,
                  },
                ]}
              >
                {priorities.find((p) => p.value === task.priority)?.label}
              </Text>
            </View>
          )}
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Due Date</Text>
          {editing ? (
            <TouchableOpacity
              style={styles.dueDateButton}
              onPress={() => {
                Alert.alert("Date Picker", "Date picker would open here");
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.dueDateText}>
                {dueDate
                  ? dueDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Set due date"}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.value}>
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No due date"}
            </Text>
          )}
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>
            {task.status.charAt(0).toUpperCase() +
              task.status.slice(1).replace("_", " ")}
          </Text>
        </View>

        {/* Timestamps */}
        <View style={styles.section}>
          <Text style={styles.label}>Created</Text>
          <Text style={styles.value}>
            {new Date(task.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
          </Text>
        </View>

        {/* Delete button */}
        {editing && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={saving}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
            <Text style={styles.deleteButtonText}>Delete Task</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginLeft: 16,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: "#6c5ce7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: {
    color: "white",
    fontWeight: "600",
  },
  cancelText: {
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: "#333",
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
    minHeight: 100,
    paddingTop: 16,
  },
  projectDisplay: {
    flexDirection: "row",
    alignItems: "center",
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
  priorityDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  dueDateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dueDateText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  deleteButton: {
    flexDirection: "row",
    backgroundColor: "#e74c3c",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 32,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default function TaskDetail() {
  return (
    <ProtectedRoute>
      <TaskDetailScreen />
    </ProtectedRoute>
  );
}
