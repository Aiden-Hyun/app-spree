import React, { useCallback, useState, useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Keyboard } from "react-native";
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
  onReorder?: (activeTasks: Task[], completedTasks: Task[]) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyMessage?: string;
  showCompletedSeparator?: boolean;
  showInlineAdd?: boolean;
  onCreateTask?: (title: string) => Promise<void>;
  onCancelAdd?: () => void;
  isDragEnabled?: boolean;
}

// Use branded types to distinguish display items
type ActiveTaskItem = Task & { __section: "active" };
type CompletedTaskItem = Task & { __section: "completed" };
type SeparatorItem = { id: string; type: "separator" };
type InlineAddItem = { id: string; type: "inline-add" };

type DisplayItem = ActiveTaskItem | CompletedTaskItem | SeparatorItem | InlineAddItem;

function isTask(item: DisplayItem): item is ActiveTaskItem | CompletedTaskItem {
  return !("type" in item);
}

function isActiveTask(item: DisplayItem): item is ActiveTaskItem {
  return isTask(item) && item.__section === "active";
}

function isCompletedTask(item: DisplayItem): item is CompletedTaskItem {
  return isTask(item) && item.__section === "completed";
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
  // Ref to track if we're in a post-drag state to prevent prop sync
  const isDraggingRef = useRef(false);
  const postDragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Separate completed and active tasks from props
  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status !== "completed"),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "completed"),
    [tasks]
  );

  // Build display items with section markers
  const buildDisplayItems = useCallback((): DisplayItem[] => {
    const items: DisplayItem[] = [];

    // Add active tasks with section marker
    activeTasks.forEach((task) => {
      items.push({ ...task, __section: "active" } as ActiveTaskItem);
    });

    // Add inline add input if enabled
    if (showInlineAdd && onCreateTask && onCancelAdd) {
      items.push({ id: "inline-add", type: "inline-add" });
    }

    // Add separator and completed tasks
    if (showCompletedSeparator && completedTasks.length > 0) {
      items.push({ id: "separator", type: "separator" });
      completedTasks.forEach((task) => {
        items.push({ ...task, __section: "completed" } as CompletedTaskItem);
      });
    }

    return items;
  }, [activeTasks, completedTasks, showInlineAdd, showCompletedSeparator, onCreateTask, onCancelAdd]);

  // Local state for display items
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>(() => buildDisplayItems());

  // Sync display items with props, but not during/after drag
  useEffect(() => {
    if (isDraggingRef.current) return;
    setDisplayItems(buildDisplayItems());
  }, [buildDisplayItems]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (postDragTimeoutRef.current) {
        clearTimeout(postDragTimeoutRef.current);
      }
    };
  }, []);

  const handleDragBegin = useCallback(() => {
    isDraggingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleDragEnd = useCallback(
    ({ data }: DragEndParams<DisplayItem>) => {
      // Find separator index to split active and completed
      const separatorIndex = data.findIndex(
        (item) => "type" in item && item.type === "separator"
      );

      let reorderedActive: Task[];
      let reorderedCompleted: Task[];

      if (separatorIndex === -1) {
        // No separator - all tasks are either active or there are no completed
        reorderedActive = data
          .filter((item): item is ActiveTaskItem | CompletedTaskItem => isTask(item))
          .map(({ __section, ...task }) => task as Task);
        reorderedCompleted = [];
      } else {
        // Split at separator - tasks before separator are active, after are completed
        const beforeSeparator = data.slice(0, separatorIndex);
        const afterSeparator = data.slice(separatorIndex + 1);

        reorderedActive = beforeSeparator
          .filter((item): item is ActiveTaskItem | CompletedTaskItem => isTask(item))
          .map(({ __section, ...task }) => task as Task);

        reorderedCompleted = afterSeparator
          .filter((item): item is ActiveTaskItem | CompletedTaskItem => isTask(item))
          .map(({ __section, ...task }) => task as Task);
      }

      // Update local display immediately with the new order
      setDisplayItems(data);

      // Notify parent with separated lists
      if (onReorder) {
        onReorder(reorderedActive, reorderedCompleted);
      }

      // Clear dragging state after a short delay to allow parent state to settle
      if (postDragTimeoutRef.current) {
        clearTimeout(postDragTimeoutRef.current);
      }
      postDragTimeoutRef.current = setTimeout(() => {
        isDraggingRef.current = false;
      }, 300);
    },
    [onReorder]
  );

  // Count completed tasks for separator display
  const completedCount = useMemo(
    () => displayItems.filter((item) => isCompletedTask(item)).length,
    [displayItems]
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<DisplayItem>) => {
      // Handle separator - not draggable
      if ("type" in item && item.type === "separator") {
        return (
          <View style={styles.separator}>
            <Text style={styles.separatorText}>
              Completed ({completedCount})
            </Text>
          </View>
        );
      }

      // Handle inline add - not draggable
      if ("type" in item && item.type === "inline-add" && onCreateTask && onCancelAdd) {
        return (
          <InlineTaskInput onSubmit={onCreateTask} onCancel={onCancelAdd} />
        );
      }

      // Handle regular task
      if (!isTask(item)) return null;
      
      const task = item;
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
      completedCount,
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
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
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

