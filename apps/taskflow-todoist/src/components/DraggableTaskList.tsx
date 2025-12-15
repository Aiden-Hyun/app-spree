import React, { useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
  DragEndParams,
} from "react-native-draggable-flatlist";
import * as Haptics from "expo-haptics";
import { TaskItem } from "./TaskItem";
import { InlineTaskInput } from "./InlineTaskInput";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Task } from "../services/taskService";

export type { Task };

interface DraggableTaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onTaskPress: (id: string) => void;
  onTaskDetails?: (id: string) => void;
  onDelete?: (id: string) => void;
  onTitleChange?: (id: string, newTitle: string) => void;
  onReorder?: (tasks: Task[]) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
  showCompletedSeparator?: boolean;
  showInlineAdd?: boolean;
  onCreateTask?: (title: string) => Promise<void>;
  onCancelAdd?: () => void;
  isDragEnabled?: boolean;
}

export function DraggableTaskList({
  tasks,
  onToggleComplete,
  onTaskPress,
  onTaskDetails,
  onDelete,
  onTitleChange,
  onReorder,
  emptyMessage = "No tasks yet",
  showCompletedSeparator = true,
  showInlineAdd = false,
  onCreateTask,
  onCancelAdd,
  isDragEnabled = true,
}: DraggableTaskListProps) {
  // Separate completed and active tasks
  const activeTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  // Build display list with special items
  type DisplayItem =
    | Task
    | { id: string; type: "inline-add" }
    | { id: string; type: "separator" };

  let displayItems: DisplayItem[] = [...activeTasks];

  // Add inline input after active tasks
  if (showInlineAdd && onCreateTask && onCancelAdd) {
    displayItems.push({ id: "inline-add", type: "inline-add" });
  }

  // Add separator and completed tasks if needed
  if (showCompletedSeparator && completedTasks.length > 0) {
    displayItems.push({ id: "separator", type: "separator" });
    displayItems = [...displayItems, ...completedTasks];
  }

  const handleDragBegin = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleDragEnd = useCallback(
    ({ data }: DragEndParams<DisplayItem>) => {
      if (!onReorder) return;

      // Extract only actual tasks (not separators or inline-add)
      const reorderedTasks = data.filter(
        (item): item is Task => !("type" in item)
      );

      onReorder(reorderedTasks);
    },
    [onReorder]
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<DisplayItem>) => {
      // Handle separator
      if ("type" in item && item.type === "separator") {
        return (
          <View style={styles.separator}>
            <Text style={styles.separatorText}>
              Completed ({completedTasks.length})
            </Text>
          </View>
        );
      }

      // Handle inline add
      if ("type" in item && item.type === "inline-add" && onCreateTask && onCancelAdd) {
        return (
          <InlineTaskInput onSubmit={onCreateTask} onCancel={onCancelAdd} />
        );
      }

      // Handle regular task
      const task = item as Task;
      const isCompleted = task.status === "completed";

      return (
        <ScaleDecorator>
          <TaskItem
            id={task.id}
            title={task.title}
            description={task.description}
            priority={task.priority || "medium"}
            status={task.status || "todo"}
            dueDate={task.dueDate ? new Date(task.dueDate) : undefined}
            projectName={task.project?.name}
            projectColor={task.project?.color}
            onToggleComplete={onToggleComplete}
            onPress={onTaskPress}
            onDetails={onTaskDetails}
            onDelete={onDelete}
            onTitleChange={onTitleChange}
            drag={isDragEnabled && !isCompleted ? drag : undefined}
            isActive={isActive}
          />
        </ScaleDecorator>
      );
    },
    [
      completedTasks.length,
      isDragEnabled,
      onCancelAdd,
      onCreateTask,
      onDelete,
      onTaskDetails,
      onTaskPress,
      onTitleChange,
      onToggleComplete,
    ]
  );

  // Only show empty state if there are no tasks AND no inline add is showing
  if (tasks.length === 0 && !showInlineAdd) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <DraggableFlatList
        data={displayItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onDragBegin={handleDragBegin}
        onDragEnd={handleDragEnd}
        contentContainerStyle={styles.listContent}
        activationDistance={isDragEnabled ? 10 : 1000}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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

