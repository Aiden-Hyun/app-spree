import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import { TaskList } from "../../src/components/TaskList";
import { EmptyState } from "../../src/components/EmptyState";
import { useTasks } from "../../src/hooks/useTasks";
import { router, useFocusEffect } from "expo-router";
import { taskService } from "../../src/services/taskService";

function InboxScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toggleTaskComplete } = useTasks();

  const loadInboxTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getInboxTasks();
      setTasks(data);
    } catch (err: any) {
      setError(err.message || "Failed to load inbox tasks");
      console.error("Error loading inbox tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload tasks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadInboxTasks();
    }, [loadInboxTasks])
  );

  const handleToggleComplete = async (id: string) => {
    try {
      await toggleTaskComplete(id);
    } catch (error) {
      console.error("Failed to toggle task:", error);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>All your tasks in one place</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push("/search")}
        >
          <Ionicons name="search" size={20} color="#6c5ce7" />
        </TouchableOpacity>
      </View>

      {tasks.length === 0 ? (
        <EmptyState
          icon="inbox-outline"
          title="Your inbox is empty"
          subtitle="Tasks without a project will appear here"
        />
      ) : (
        <TaskList
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
          onTaskPress={handleTaskPress}
          emptyMessage="No tasks in your inbox"
        />
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
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 16,
    color: "#666",
    flex: 1,
  },
  searchButton: {
    padding: 8,
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

export default function Inbox() {
  return (
    <ProtectedRoute>
      <InboxScreen />
    </ProtectedRoute>
  );
}
