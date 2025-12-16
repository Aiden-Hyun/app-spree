import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Pressable,
} from "react-native";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import { DraggableTaskList } from "../../src/components/DraggableTaskList";
import { EmptyState } from "../../src/components/EmptyState";
import { router, useFocusEffect } from "expo-router";
import { taskService, Task } from "../../src/services/taskService";
import { animateListChanges } from "../../src/utils/layoutAnimation";
import { useToast } from "../../src/hooks/useToast";
import { DropZoneDateStrip, DropZoneProjectList } from "../../src/components/DragDrop";

function TodayScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const toast = useToast();

  const loadTodayTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getTodayTasks();
      setTasks(data);
    } catch (err: any) {
      setError(err.message || "Failed to load today tasks");
      console.error("Error loading today tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload tasks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTodayTasks();
    }, [loadTodayTasks])
  );

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

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
      loadTodayTasks();
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
      // Create task with today's date as due date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const newTask = await taskService.createTask({
        title,
        priority: "medium",
        status: "todo",
        dueDate: today,
      });
      
      // Optimistically add the task to the list without refreshing
      setTasks((prevTasks) => [...prevTasks, newTask]);
      toast.success("Task created!");
      setShowInlineAdd(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create task");
      throw error; // Re-throw so InlineTaskInput knows to stay visible
    }
  };

  const handleCancelAdd = () => {
    setShowInlineAdd(false);
  };

  const handleReorder = async (activeTasks: Task[], completedTasks: Task[]) => {
    // Merge active and completed tasks back together
    const allTasks = [...activeTasks, ...completedTasks];
    
    // Update local state immediately for responsiveness
    setTasks(allTasks);
    
    // Sync to database in background (only reorder active tasks)
    try {
      const activeIds = activeTasks.map((t) => t.id);
      await taskService.reorderTasks(activeIds);
    } catch (error) {
      console.error("Failed to reorder tasks:", error);
      toast.error("Failed to save order");
      loadTodayTasks();
    }
  };

  const handleReschedule = async (date: Date) => {
    toast.success(`Rescheduled to ${date.toLocaleDateString()}`);
    setIsDragging(false);
  };

  const handleMoveToProject = async (projectId: string | null) => {
    toast.success(projectId ? "Moved to project" : "Moved to Inbox");
    setIsDragging(false);
    loadTodayTasks();
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

  const activeTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  return (
    <Pressable style={styles.container} onPress={() => Keyboard.dismiss()}>
      {/* Drop zones - appear when dragging */}
      <DropZoneDateStrip visible={isDragging} onDateSelected={handleReschedule} />
      <DropZoneProjectList
        visible={isDragging}
        onProjectSelected={handleMoveToProject}
        currentProjectId={null}
      />

      <View style={styles.header}>
        <Text style={styles.dateText}>{today}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {activeTasks.length} {activeTasks.length === 1 ? "task" : "tasks"}{" "}
            remaining
          </Text>
          {completedTasks.length > 0 && (
            <Text style={styles.statsText}>
              • {completedTasks.length} completed
            </Text>
          )}
        </View>
      </View>

      {tasks.length === 0 && !showInlineAdd ? (
        <EmptyState
          icon="sunny-outline"
          iconColor="#f1c40f"
          title="All clear!"
          subtitle="Enjoy the rest of your day"
        />
      ) : (
        <DraggableTaskList
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
          onTaskPress={handleTaskPress}
          onTaskDetails={handleTaskDetails}
          onDelete={handleDelete}
          onTitleChange={handleTitleChange}
          onReorder={handleReorder}
          emptyMessage="No tasks for today"
          showCompletedSeparator={true}
          showInlineAdd={showInlineAdd}
          onCreateTask={handleCreateTask}
          onCancelAdd={handleCancelAdd}
        />
      )}

      {/* Quick add button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={handleAddTask}
        disabled={showInlineAdd}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </Pressable>
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
    padding: 16,
    paddingBottom: 8,
  },
  dateText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsText: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
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

export default function Today() {
  return (
    <ProtectedRoute>
      <TodayScreen />
    </ProtectedRoute>
  );
}
