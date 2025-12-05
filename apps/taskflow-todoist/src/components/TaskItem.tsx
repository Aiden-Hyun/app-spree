import React, { useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

interface TaskItemProps {
  id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in_progress" | "completed" | "cancelled";
  dueDate?: Date;
  projectName?: string;
  projectColor?: string;
  onToggleComplete: (id: string) => void;
  onPress: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TaskItem({
  id,
  title,
  description,
  priority,
  status,
  dueDate,
  projectName,
  projectColor = "#6c5ce7",
  onToggleComplete,
  onPress,
  onDelete,
}: TaskItemProps) {
  const isCompleted = status === "completed";
  const isOverdue = dueDate && new Date(dueDate) < new Date() && !isCompleted;
  const swipeableRef = useRef<Swipeable | null>(null);

  const priorityColors = {
    low: "#95a5a6",
    medium: "#3498db",
    high: "#f39c12",
    urgent: "#e74c3c",
  };

  const priorityIcons = {
    low: "flag-outline",
    medium: "flag-outline",
    high: "flag",
    urgent: "flag",
  };

  const formatDueDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);

    if (dateObj.getTime() === today.getTime()) {
      return "Today";
    } else if (dateObj.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else if (dateObj < today) {
      const daysAgo = Math.floor(
        (today.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
      );
      return `${daysAgo} day${daysAgo > 1 ? "s" : ""} overdue`;
    } else {
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const renderRightActions = () => (
    <View style={styles.rightActionContainer}>
      <View style={styles.deleteAction}>
        <Ionicons name="trash-outline" size={20} color="white" />
        <Text style={styles.deleteActionText}>Delete</Text>
      </View>
    </View>
  );

  const handleSwipeOpen = () => {
    if (onDelete) {
      onDelete(id);
    }
    // Close after triggering delete to avoid lingering UI
    swipeableRef.current?.close();
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={onDelete ? renderRightActions : undefined}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      onSwipeableOpen={handleSwipeOpen}
    >
      <TouchableOpacity
        style={styles.container}
        onPress={() => onPress(id)}
        activeOpacity={0.7}
      >
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onToggleComplete(id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View
          style={[
            styles.checkboxInner,
            isCompleted && styles.checkboxCompleted,
            { borderColor: isCompleted ? priorityColors[priority] : "#ddd" },
          ]}
        >
          {isCompleted && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
      </TouchableOpacity>

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              isCompleted && styles.titleCompleted,
              isOverdue && styles.titleOverdue,
            ]}
          >
            {title}
          </Text>

        {description && !isCompleted && (
          <Text style={styles.description} numberOfLines={1}>
            {description}
          </Text>
        )}

        <View style={styles.metadata}>
          {dueDate && (
            <View
              style={[styles.dueDateBadge, isOverdue && styles.dueDateOverdue]}
            >
              <Ionicons
                name="calendar-outline"
                size={12}
                color={isOverdue ? "#e74c3c" : "#666"}
              />
              <Text
                style={[
                  styles.dueDateText,
                  isOverdue && styles.dueDateTextOverdue,
                ]}
              >
                {formatDueDate(dueDate)}
              </Text>
            </View>
          )}

          {projectName && (
            <View
              style={[
                styles.projectBadge,
                { backgroundColor: projectColor + "20" },
              ]}
            >
              <View
                style={[styles.projectDot, { backgroundColor: projectColor }]}
              />
              <Text style={[styles.projectText, { color: projectColor }]}>
                {projectName}
              </Text>
            </View>
          )}
        </View>
      </View>

        <View style={styles.trailing}>
          {priority !== "low" && !isCompleted && (
            <Ionicons
              name={priorityIcons[priority]}
              size={18}
              color={priorityColors[priority]}
              style={styles.priorityIcon}
            />
          )}
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => onPress(id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="information-circle-outline" size={20} color="#6c5ce7" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxCompleted: {
    backgroundColor: "#6c5ce7",
    borderColor: "#6c5ce7",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: "#333",
    marginBottom: 2,
  },
  titleCompleted: {
    color: "#999",
    textDecorationLine: "line-through",
  },
  titleOverdue: {
    color: "#e74c3c",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  metadata: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  dueDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  dueDateOverdue: {
    backgroundColor: "#fee",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  dueDateTextOverdue: {
    color: "#e74c3c",
    fontWeight: "500",
  },
  projectBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  projectText: {
    fontSize: 12,
    fontWeight: "500",
  },
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  priorityIcon: {
    marginLeft: 8,
  },
  detailsButton: {
    marginLeft: 12,
  },
  rightActionContainer: {
    justifyContent: "center",
  },
  deleteAction: {
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    width: 96,
    height: "100%",
    flexDirection: "column",
  },
  deleteActionText: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
});


