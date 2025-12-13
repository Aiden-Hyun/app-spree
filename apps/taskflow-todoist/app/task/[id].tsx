import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Animated,
  Easing,
  LayoutChangeEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { useTasks } from "../../src/hooks/useTasks";
import { useProjects } from "../../src/hooks/useProjects";
import { taskService, Task, TaskInput } from "../../src/services/taskService";
import { useToast } from "../../src/hooks/useToast";
import { InlineCalendar } from "../../src/components/InlineCalendar";
import { InlineTimePicker } from "../../src/components/InlineTimePicker";
import { Dropdown, DropdownOption } from "../../src/components/Dropdown";
import {
  TimeValue,
  dateToTimeValue,
  getDefaultTimeValue,
  mergeDateAndTime,
} from "../../src/utils/dateTime";

const DEFAULT_CALENDAR_HEIGHT = 360;

function TaskDetailScreen() {
  const { id } = useLocalSearchParams();
  const taskId = id as string;
  const initialEditing = true; // always open in edit mode per new UX

  const { updateTask, deleteTask } = useTasks();
  const { projects } = useProjects();
  const toast = useToast();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(initialEditing);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskInput["priority"]>("medium");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [dueTime, setDueTime] = useState<TimeValue | null>(null);
  const [isDueDateEnabled, setIsDueDateEnabled] = useState(false);
  const [isDueTimeEnabled, setIsDueTimeEnabled] = useState(false);
  const [calendarContentHeight, setCalendarContentHeight] = useState(
    DEFAULT_CALENDAR_HEIGHT
  );
  const calendarAnim = useRef(
    new Animated.Value(isDueDateEnabled ? 1 : 0)
  ).current;

  const priorities: Array<{
    value: TaskInput["priority"];
    label: string;
    color: string;
    icon: any;
  }> = [
    { value: "medium", label: "Normal", color: "#666", icon: null },
    {
      value: "urgent",
      label: "Urgent",
      color: "#e74c3c",
      icon: "alert-circle",
    },
    { value: "high", label: "Important", color: "#f39c12", icon: "flag" },
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
        const parsedDate = foundTask.dueDate
          ? new Date(foundTask.dueDate)
          : undefined;
        setDueDate(parsedDate);
        const hasTime =
          parsedDate &&
          (parsedDate.getHours() !== 0 || parsedDate.getMinutes() !== 0);
        setIsDueTimeEnabled(!!hasTime);
        setDueTime(parsedDate && hasTime ? dateToTimeValue(parsedDate) : null);
        setIsDueDateEnabled(!!parsedDate);
      } else {
        toast.error("Task not found");
        router.back();
      }
    } catch (error) {
      console.error("Failed to load task:", error);
      toast.error("Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Animated.timing(calendarAnim, {
      toValue: isDueDateEnabled ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [calendarAnim, isDueDateEnabled]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setSaving(true);
    try {
      await updateTask(taskId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        projectId: selectedProjectId ? selectedProjectId : null, // null clears to Inbox
        dueDate: isDueDateEnabled ? dueDate : null,
      });

      toast.success("Task updated successfully");
      router.back();
    } catch (error: any) {
      toast.error(error.message || "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(taskId);
      toast.success("Task deleted");
      router.back();
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleDueDateToggle = (value: boolean) => {
    setIsDueDateEnabled(value);
    if (value) {
      setDueDate((prev) => {
        const base = prev || new Date();
        const nextTime = isDueTimeEnabled
          ? dueTime || getDefaultTimeValue()
          : null;
        if (isDueTimeEnabled && !dueTime) {
          setDueTime(nextTime);
        }
        return mergeDateAndTime(base, nextTime);
      });
    } else {
      setDueDate(undefined);
      setDueTime(null);
      setIsDueTimeEnabled(false);
    }
  };

  const handleDueTimeToggle = (value: boolean) => {
    setIsDueTimeEnabled(value);
    if (value) {
      const nextTime = dueTime || getDefaultTimeValue();
      setDueTime(nextTime);
      setDueDate((prev) => {
        const base = prev || new Date();
        return mergeDateAndTime(base, nextTime);
      });
    } else {
      setDueTime(null);
      setDueDate((prev) => {
        if (!prev) return prev;
        return mergeDateAndTime(prev, null);
      });
    }
  };

  const handleDateChange = (selectedDate: Date) => {
    if (!isDueDateEnabled) return;
    const nextTime =
      isDueTimeEnabled && dueTime
        ? dueTime
        : isDueTimeEnabled
        ? getDefaultTimeValue()
        : null;
    if (isDueTimeEnabled && !dueTime) {
      setDueTime(nextTime);
    }
    setDueDate(mergeDateAndTime(selectedDate, nextTime));
  };

  const handleTimeChange = (nextTime: TimeValue) => {
    if (!isDueDateEnabled || !isDueTimeEnabled) return;
    setDueTime(nextTime);
    setDueDate((prev) => {
      const base = prev || new Date();
      return mergeDateAndTime(base, nextTime);
    });
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
  const storedDueDate = task.dueDate ? new Date(task.dueDate) : null;
  const hasStoredTime =
    storedDueDate &&
    (storedDueDate.getHours() !== 0 || storedDueDate.getMinutes() !== 0);
  const taskDueDateDisplay = storedDueDate
    ? storedDueDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "No due date";
  const taskDueTimeDisplay =
    storedDueDate && hasStoredTime
      ? storedDueDate.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      : null;
  const calendarHeight = calendarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, calendarContentHeight || DEFAULT_CALENDAR_HEIGHT],
  });

  const handleCalendarLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height && Math.abs(height - calendarContentHeight) > 1) {
      setCalendarContentHeight(height);
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
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setEditing(true)}
              >
                <Ionicons name="create-outline" size={24} color="#6c5ce7" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={24} color="#e74c3c" />
              </TouchableOpacity>
            </View>
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
          {editing ? (
            <>
              <Dropdown
                label="Project"
                value={selectedProjectId || null}
                placeholder="Inbox"
                options={[
                  { label: "Inbox", value: null, color: "#6c5ce7" },
                  ...projects
                    .filter((p) => !p.isArchived)
                    .map((p) => ({
                      label: p.name,
                      value: p.id,
                      color: p.color,
                    })),
                ]}
                onSelect={(value) => setSelectedProjectId(value || "")}
                disabled={saving}
              />
            </>
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
          {editing ? (
            <Dropdown
              label="Priority"
              value={priority}
              placeholder="Normal"
              options={priorities.map((p) => ({
                label: p.label,
                value: p.value,
                color: p.color,
                icon: p.icon,
              }))}
              onSelect={(value) =>
                setPriority((value as TaskInput["priority"]) || "medium")
              }
              disabled={saving}
            />
          ) : (
            <View style={styles.priorityDisplay}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityValueRow}>
                {priorities.find((p) => p.value === task.priority)?.icon && (
                  <Ionicons
                    name={
                      priorities.find((p) => p.value === task.priority)?.icon
                    }
                    size={20}
                    color={
                      priorities.find((p) => p.value === task.priority)?.color
                    }
                    style={{ marginRight: 8 }}
                  />
                )}
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
            </View>
          )}
        </View>

        {/* Due Date */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Due Date</Text>
            {editing && (
              <Switch
                value={isDueDateEnabled}
                onValueChange={handleDueDateToggle}
                trackColor={{ false: "#d1d5db", true: "#cbb5ff" }}
                thumbColor={isDueDateEnabled ? "#6c5ce7" : "#f4f4f5"}
                ios_backgroundColor="#d1d5db"
              />
            )}
          </View>
          {editing ? (
            <>
              <View
                style={[
                  styles.dueDateButton,
                  !isDueDateEnabled && styles.dueDateButtonDisabled,
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={isDueDateEnabled ? "#666" : "#999"}
                />
                <Text
                  style={[
                    styles.dueDateText,
                    !isDueDateEnabled && styles.dueDateTextDisabled,
                  ]}
                >
                  {isDueDateEnabled && dueDate
                    ? dueDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "No due date"}
                </Text>
              </View>
              <Animated.View
                style={[
                  styles.calendarWrapper,
                  { height: calendarHeight, opacity: calendarAnim },
                ]}
                pointerEvents={isDueDateEnabled ? "auto" : "none"}
              >
                <View onLayout={handleCalendarLayout}>
                  <InlineCalendar
                    value={dueDate || new Date()}
                    onChange={handleDateChange}
                    minimumDate={new Date(2000, 0, 1)}
                    maximumDate={new Date(2100, 11, 31)}
                  />
                </View>
              </Animated.View>
              {isDueDateEnabled && (
                <View style={styles.timeToggleRow}>
                  <Text style={styles.subLabel}>Due Time</Text>
                  <Switch
                    value={isDueTimeEnabled}
                    onValueChange={handleDueTimeToggle}
                    trackColor={{ false: "#d1d5db", true: "#cbb5ff" }}
                    thumbColor={isDueTimeEnabled ? "#6c5ce7" : "#f4f4f5"}
                    ios_backgroundColor="#d1d5db"
                  />
                </View>
              )}

              {isDueDateEnabled && isDueTimeEnabled && (
                <InlineTimePicker
                  value={dueTime || getDefaultTimeValue()}
                  onChange={handleTimeChange}
                />
              )}
            </>
          ) : (
            <Text style={styles.value}>
              {taskDueDateDisplay}
              {taskDueTimeDisplay ? ` · ${taskDueTimeDisplay}` : ""}
            </Text>
          )}
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
  headerActions: {
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  subLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  timeToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
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
  priorityDisplay: {
    marginBottom: 8,
  },
  priorityValueRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
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
  dueDateButtonDisabled: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e0e0e0",
  },
  dueDateText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  dueDateTextDisabled: {
    color: "#999",
  },
  calendarWrapper: {
    overflow: "hidden",
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
