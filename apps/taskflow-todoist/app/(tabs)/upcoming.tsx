import React, { useState, useCallback } from "react";
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
import { EmptyState } from "../../src/components/EmptyState";
import { router, useFocusEffect } from "expo-router";
import { taskService } from "../../src/services/taskService";
import { useToast } from "../../src/hooks/useToast";

function UpcomingScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

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

  // Generate next 7 days for calendar view
  const getDaysOfWeek = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.getDate(),
        month: date.toLocaleDateString("en-US", { month: "short" }),
        isToday: i === 0,
        fullDate: date,
      });
    }
    return days;
  };

  const days = getDaysOfWeek();

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
                completedAt: task.status === "completed" ? null : new Date().toISOString(),
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

  const handleAddTask = () => {
    router.push("/quick-add");
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Week view */}
        <View style={styles.weekContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {days.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.dayCard, day.isToday && styles.todayCard]}
              >
                <Text style={[styles.dayText, day.isToday && styles.todayText]}>
                  {day.day}
                </Text>
                <Text
                  style={[styles.dateText, day.isToday && styles.todayDateText]}
                >
                  {day.date}
                </Text>
                <Text
                  style={[
                    styles.monthText,
                    day.isToday && styles.todayMonthText,
                  ]}
                >
                  {day.month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Task list or empty state */}
        {tasks.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No upcoming tasks"
            subtitle="Tasks with due dates will appear here"
          />
        ) : (
          <View style={styles.taskSection}>
            {Object.entries(tasksByDate).map(([dateString, dateTasks]) => {
              const date = new Date(dateString);
              const dateLabel = date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              });

              return (
                <View key={dateString} style={styles.dateSection}>
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
                  onDelete={handleDelete}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Quick add button */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={handleAddTask}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
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
  weekContainer: {
    marginBottom: 24,
  },
  dayCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: "center",
    minWidth: 80,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  todayCard: {
    backgroundColor: "#6c5ce7",
  },
  dayText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  todayText: {
    color: "white",
    fontWeight: "600",
  },
  dateText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  todayDateText: {
    color: "white",
  },
  monthText: {
    fontSize: 12,
    color: "#999",
  },
  todayMonthText: {
    color: "#e0e0ff",
  },
  taskSection: {
    marginTop: 20,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateSectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    paddingHorizontal: 16,
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
