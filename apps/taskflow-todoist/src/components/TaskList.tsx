import React from "react";
import { View, FlatList, Text, StyleSheet, RefreshControl } from "react-native";
import { TaskItem } from "./TaskItem";
import { InlineTaskInput } from "./InlineTaskInput";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "completed" | "cancelled";
  dueDate?: Date;
  projectId?: string;
  projectName?: string;
  projectColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onTaskPress: (id: string) => void;
  onTaskDetails?: (id: string) => void;
  onDelete?: (id: string) => void;
  onTitleChange?: (id: string, newTitle: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
  showCompletedSeparator?: boolean;
  showInlineAdd?: boolean;
  onCreateTask?: (title: string) => Promise<void>;
  onCancelAdd?: () => void;
}

export function TaskList({
  tasks,
  onToggleComplete,
  onTaskPress,
  onTaskDetails,
  onDelete,
  onTitleChange,
  refreshing = false,
  onRefresh,
  emptyMessage = "No tasks yet",
  showCompletedSeparator = true,
  showInlineAdd = false,
  onCreateTask,
  onCancelAdd,
}: TaskListProps) {
  // Separate completed and active tasks
  const activeTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  // Combine with inline add input, separator, and completed tasks
  let displayTasks: any[] = [...activeTasks];
  
  // Add inline input after active tasks
  if (showInlineAdd && onCreateTask && onCancelAdd) {
    displayTasks.push({ id: "inline-add", type: "inline-add" });
  }
  
  // Add separator and completed tasks if needed
  if (showCompletedSeparator && completedTasks.length > 0) {
    displayTasks.push({ id: "separator", type: "separator" });
    displayTasks = [...displayTasks, ...completedTasks];
  } else if (!showInlineAdd) {
    // If not showing inline add and no separator, just show all tasks
    displayTasks = tasks;
  }

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === "separator") {
      return (
        <View style={styles.separator}>
          <Text style={styles.separatorText}>
            Completed ({completedTasks.length})
          </Text>
        </View>
      );
    }

    if (item.type === "inline-add" && onCreateTask && onCancelAdd) {
      return (
        <InlineTaskInput
          onSubmit={onCreateTask}
          onCancel={onCancelAdd}
        />
      );
    }

    return (
      <TaskItem
        id={item.id}
        title={item.title}
        description={item.description}
        priority={item.priority}
        status={item.status}
        dueDate={item.dueDate}
        projectName={item.projectName}
        projectColor={item.projectColor}
        onToggleComplete={onToggleComplete}
        onPress={onTaskPress}
        onDetails={onTaskDetails}
        onDelete={onDelete}
        onTitleChange={onTitleChange}
      />
    );
  };

  // Only show empty state if there are no tasks AND no inline add is showing
  if (tasks.length === 0 && !showInlineAdd) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={displayTasks}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6c5ce7"
          />
        ) : undefined
      }
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  separator: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  separatorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
});


