import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Keyboard,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { DraggableTaskList } from "../../src/components/DraggableTaskList";
import { EmptyState } from "../../src/components/EmptyState";
import { useTasks } from "../../src/hooks/useTasks";
import { useProject, useProjects } from "../../src/hooks/useProjects";
import { useToast } from "../../src/hooks/useToast";
import { taskService, Task } from "../../src/services/taskService";
import { DropZoneDateStrip, DropZoneProjectList } from "../../src/components/DragDrop";
import { animateListChanges } from "../../src/utils/layoutAnimation";

function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const projectId = id as string;

  const {
    project,
    loading: projectLoading,
    error: projectError,
  } = useProject(projectId);
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    toggleTaskComplete,
    createTask,
    deleteTask,
  } = useTasks({ projectId });
  const { updateProject, deleteProject, toggleProjectArchive } = useProjects();
  const toast = useToast();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectColor, setProjectColor] = useState("#6c5ce7");
  const [saving, setSaving] = useState(false);
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  const colors = [
    "#e74c3c",
    "#e67e22",
    "#f39c12",
    "#f1c40f",
    "#2ecc71",
    "#27ae60",
    "#3498db",
    "#2980b9",
    "#9b59b6",
    "#8e44ad",
    "#34495e",
    "#6c5ce7",
  ];

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
      setProjectDescription(project.description || "");
      setProjectColor(project.color);
    }
  }, [project]);

  // Sync local tasks with fetched tasks
  useEffect(() => {
    setLocalTasks(tasks as Task[]);
  }, [tasks]);

  const handleToggleComplete = async (id: string) => {
    try {
      await toggleTaskComplete(id);
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const handleTitleChange = async (id: string, newTitle: string) => {
    try {
      await taskService.updateTask(id, { title: newTitle });
    } catch (error) {
      console.error("Failed to update task title:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (id: string) => {
    const previous = localTasks;
    // Animate before state change
    animateListChanges();
    setLocalTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTask(id);
      toast.success("Task deleted");
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
      setLocalTasks(previous);
    }
  };

  const handleTaskPress = (id: string) => {
    router.push(`/task/${id}`);
  };

  const handleAddTask = () => {
    setShowInlineAdd(true);
  };

  const handleCreateTask = async (title: string) => {
    try {
      await createTask({
        title,
        priority: "medium",
        status: "todo",
        projectId,
      });
      
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

  const handleReorder = async (reorderedTasks: Task[]) => {
    const previousTasks = localTasks;
    setLocalTasks(reorderedTasks);

    try {
      const taskIds = reorderedTasks.map((t) => t.id);
      await taskService.reorderTasks(taskIds);
    } catch (error) {
      console.error("Failed to reorder tasks:", error);
      toast.error("Failed to save order");
      setLocalTasks(previousTasks);
    }
  };

  const handleReschedule = async (date: Date) => {
    toast.success(`Rescheduled to ${date.toLocaleDateString()}`);
    setIsDragging(false);
  };

  const handleMoveToProject = async (newProjectId: string | null) => {
    toast.success(newProjectId ? "Moved to project" : "Moved to Inbox");
    setIsDragging(false);
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    setSaving(true);
    try {
      await updateProject(projectId, {
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
        color: projectColor,
      });

      setEditModalVisible(false);
      toast.success("Project updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const handleArchiveProject = () => {
    Alert.alert(
      project?.isArchived ? "Unarchive Project" : "Archive Project",
      `Are you sure you want to ${
        project?.isArchived ? "unarchive" : "archive"
      } this project?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: project?.isArchived ? "Unarchive" : "Archive",
          onPress: async () => {
            try {
              await toggleProjectArchive(projectId);
              toast.success(project?.isArchived ? "Project unarchived" : "Project archived");
              if (!project?.isArchived) {
                router.back();
              }
            } catch (error) {
              toast.error("Failed to update project");
            }
          },
        },
      ]
    );
  };

  const handleDeleteProject = () => {
    Alert.alert(
      "Delete Project",
      "Are you sure you want to delete this project? All tasks in this project will also be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProject(projectId);
              toast.success("Project deleted");
              router.back();
            } catch (error) {
              toast.error("Failed to delete project");
            }
          },
        },
      ]
    );
  };

  const loading = projectLoading || tasksLoading;
  const error = projectError || tasksError;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load project</Text>
      </View>
    );
  }

  const completionPercentage =
    project.taskCount && project.taskCount > 0
      ? Math.round(
          ((project.completedTaskCount || 0) / project.taskCount) * 100
        )
      : 0;

  return (
    <Pressable style={styles.container} onPress={() => Keyboard.dismiss()}>
      <View style={[styles.header, { backgroundColor: project.color }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.projectName}>{project.name}</Text>
          {project.description && (
            <Text style={styles.projectDescription}>{project.description}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setEditModalVisible(true)}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{project.taskCount || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>
            {project.completedTaskCount || 0}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{completionPercentage}%</Text>
          <Text style={styles.statLabel}>Progress</Text>
        </View>
      </View>

      {/* Drop zones - appear when dragging */}
      <DropZoneDateStrip visible={isDragging} onDateSelected={handleReschedule} />
      <DropZoneProjectList
        visible={isDragging}
        onProjectSelected={handleMoveToProject}
        currentProjectId={projectId}
      />

      {/* Task list */}
      {localTasks.length === 0 && !showInlineAdd ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="folder-open-outline"
            title="No tasks yet"
            subtitle="Add your first task to this project"
          />
        </View>
      ) : (
        <DraggableTaskList
          tasks={localTasks}
          onToggleComplete={handleToggleComplete}
          onTaskPress={handleTaskPress}
          onTitleChange={handleTitleChange}
          onDelete={handleDelete}
          onReorder={handleReorder}
          emptyMessage="No tasks in this project"
          showCompletedSeparator={true}
          showInlineAdd={showInlineAdd}
          onCreateTask={handleCreateTask}
          onCancelAdd={handleCancelAdd}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: project.color }]}
        activeOpacity={0.8}
        onPress={handleAddTask}
        disabled={showInlineAdd}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Project</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={projectName}
                onChangeText={setProjectName}
                placeholder="Project name"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={projectDescription}
                onChangeText={setProjectDescription}
                placeholder="Project description (optional)"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      projectColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setProjectColor(color)}
                  >
                    {projectColor === color && (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleArchiveProject}
                >
                  <Ionicons
                    name={project.isArchived ? "archive-outline" : "archive"}
                    size={20}
                    color="#666"
                  />
                  <Text style={styles.secondaryButtonText}>
                    {project.isArchived ? "Unarchive" : "Archive"}
                  </Text>
                </TouchableOpacity>

                {project.name !== "Inbox" && (
                  <TouchableOpacity
                    style={styles.dangerButton}
                    onPress={handleDeleteProject}
                  >
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                    <Text style={styles.dangerButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: projectColor }]}
                onPress={handleSaveProject}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  projectName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  moreButton: {
    padding: 4,
  },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 60,
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  textArea: {
    minHeight: 80,
    paddingTop: 16,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#333",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
  },
  secondaryButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
  },
  dangerButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#e74c3c",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});

export default function ProjectDetail() {
  return (
    <ProtectedRoute>
      <ProjectDetailScreen />
    </ProtectedRoute>
  );
}


