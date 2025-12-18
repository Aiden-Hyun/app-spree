import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import { TaskItem } from "../../src/components/TaskItem";
import { InlineTaskInput } from "../../src/components/InlineTaskInput";
import { EmptyState } from "../../src/components/EmptyState";
import { ExpandableCalendar } from "../../src/components/ExpandableCalendar";
import { router, useFocusEffect } from "expo-router";
import { taskService } from "../../src/services/taskService";
import { animateListChanges } from "../../src/utils/layoutAnimation";
import { useToast } from "../../src/hooks/useToast";

function UpcomingScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const toast = useToast();

  // Refs for scroll-to-date functionality
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Map<string, number>>(new Map());
  const calendarHeight = useRef<number>(0);

  const loadUpcomingTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getUpcomingTasks();
      setTasks(data);
    } catch (err: any) {
      setError(err.message || "Failed to load upcoming tasks");
      console.error("Error loading upcoming tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload tasks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUpcomingTasks();
    }, [loadUpcomingTasks])
  );

  // Create a Set of date strings that have tasks for calendar dots
  const taskDates = useMemo(() => {
    const dates = new Set<string>();
    tasks.forEach((task) => {
      if (task.dueDate) {
        const date = new Date(task.dueDate);
        dates.add(date.toDateString());
      }
    });
    return dates;
  }, [tasks]);

  // Handle date selection from calendar
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    const dateKey = date.toDateString();
    const yOffset = sectionPositions.current.get(dateKey);
    
    if (yOffset !== undefined) {
      // Scroll to the section, accounting for calendar height + some padding
      scrollViewRef.current?.scrollTo({
        y: yOffset - 10,
        animated: true,
      });
    }
  }, []);

  // Track section positions for scroll-to-date
  const handleSectionLayout = useCallback((dateString: string, y: number) => {
    sectionPositions.current.set(dateString, y);
  }, []);

  const handleToggleComplete = async (id: string) => {
    try {
      // Find the task to check its current status
      const task = tasks.find((t) => t.id === id);
      const isCompleting = task?.status !== "completed";

      // Optimistically update the UI
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id
            ? {
                ...task,
                status: task.status === "completed" ? "todo" : "completed",
                completedAt:
                  task.status === "completed" ? null : new Date().toISOString(),
              }
            : task
        )
      );

      // Show success toast immediately for completing
      if (isCompleting) {
        toast.success("Completed!");
      }

      // Then update the database
      await taskService.toggleTaskComplete(id);
    } catch (error) {
      console.error("Failed to toggle task:", error);
      // Revert on error
      loadUpcomingTasks();
    }
  };

  const handleDelete = async (id: string) => {
    const previous = tasks;
    animateListChanges();
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await taskService.deleteTask(id);
      toast.success("Task deleted");
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
      setTasks(previous);
    }
  };

  const handleTaskPress = (id: string) => {
    router.push(`/task/${id}`);
  };

  const handleTaskDetails = (id: string) => {
    router.push({
      pathname: `/task/${id}`,
      params: { edit: "true" },
    });
  };

  const handleAddTask = () => {
    setShowInlineAdd(true);
  };

  const handleCreateTask = async (title: string) => {
    try {
      // Create task without due date (goes to inbox)
      await taskService.createTask({
        title,
        priority: "medium",
        status: "todo",
      });
      
      toast.success("Task created in inbox!");
      setShowInlineAdd(false);
      // Don't add to local state since this task won't appear in upcoming (no due date)
    } catch (error: any) {
      toast.error(error.message || "Failed to create task");
      throw error; // Re-throw so InlineTaskInput knows to stay visible
    }
  };

  const handleCancelAdd = () => {
    setShowInlineAdd(false);
  };

  const handleTitleChange = async (id: string, newTitle: string) => {
    // Optimistically update the UI
    const previous = tasks;
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, title: newTitle } : task
      )
    );

    try {
      await taskService.updateTask(id, { title: newTitle });
    } catch (error) {
      console.error("Failed to update task title:", error);
      toast.error("Failed to update task");
      // Revert on error
      setTasks(previous);
    }
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

  // Group tasks by date
  const tasksByDate: { [key: string]: typeof tasks } = {};
  tasks.forEach((task) => {
    if (task.dueDate) {
      const dateKey = new Date(task.dueDate).toDateString();
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = [];
      }
      tasksByDate[dateKey].push(task);
    }
  });

  return (
    <View style={styles.container}>
      {/* Expandable Calendar */}
      <View style={styles.calendarContainer}>
        <ExpandableCalendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          taskDates={taskDates}
        />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Task list or empty state */}
          {tasks.length === 0 && !showInlineAdd ? (
            <EmptyState
              icon="calendar-outline"
              title="No upcoming tasks"
              subtitle="Tasks with due dates will appear here"
            />
          ) : (
            <View style={styles.taskSection}>
              {showInlineAdd && (
                <View style={styles.inlineAddContainer}>
                  <InlineTaskInput
                    onSubmit={handleCreateTask}
                    onCancel={handleCancelAdd}
                    placeholder="New Task (will be added to Inbox)"
                  />
                </View>
              )}
              {Object.entries(tasksByDate).map(([dateString, dateTasks]) => {
                const date = new Date(dateString);
                const dateLabel = date.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <View
                    key={dateString}
                    style={styles.dateSection}
                    onLayout={(event) => {
                      const { y } = event.nativeEvent.layout;
                      handleSectionLayout(dateString, y);
                    }}
                  >
                    <Text style={styles.dateSectionHeader}>{dateLabel}</Text>
                    {dateTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        id={task.id}
                        title={task.title}
                        description={task.description}
                        priority={task.priority}
                        status={task.status}
                        dueDate={task.dueDate}
                        projectName={task.project?.name}
                        projectColor={task.project?.color}
                        onToggleComplete={handleToggleComplete}
                        onPress={handleTaskPress}
                        onDetails={handleTaskDetails}
                        onDelete={handleDelete}
                        onTitleChange={handleTitleChange}
                      />
                    ))}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Quick add button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={handleAddTask}
        disabled={showInlineAdd}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
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
  calendarContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
  },
  taskSection: {
    marginTop: 8,
  },
  inlineAddContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  dateSection: {
    marginBottom: 24,
  },
  dateSectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6c5ce7",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
});

export default function Upcoming() {
  return (
    <ProtectedRoute>
      <UpcomingScreen />
    </ProtectedRoute>
  );
}
