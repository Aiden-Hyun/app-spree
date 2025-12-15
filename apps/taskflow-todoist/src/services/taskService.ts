import { supabase } from "../supabase";

export interface TaskInput {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: "todo" | "in_progress" | "completed" | "cancelled";
  dueDate?: Date | string | null;
  projectId?: string | null;
}

export interface Task extends TaskInput {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  position?: number;
  project?: {
    id: string;
    name: string;
    color: string;
  };
}

const normalizeDueDate = (value?: Date | string | null): string | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date.toISOString();
};

export const taskService = {
  // Create a new task
  async createTask(input: TaskInput): Promise<Task> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("User not authenticated");

    const taskData = {
      user_id: userData.user.id,
      title: input.title,
      description: input.description || null,
      priority: input.priority || "medium",
      status: input.status || "todo",
      due_date: normalizeDueDate(input.dueDate),
      project_id: input.projectId || null,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(taskData)
      .select(
        `
        *,
        project:projects(id, name, color)
      `
      )
      .single();

    if (error) throw error;
    return this.formatTask(data);
  },

  // Get all tasks for the current user
  async getTasks(filters?: {
    projectId?: string;
    status?: string;
    dueDate?: Date;
    search?: string;
  }): Promise<Task[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("User not authenticated");

    let query = supabase
      .from("tasks")
      .select(
        `
        *,
        project:projects(id, name, color)
      `
      )
      .eq("user_id", userData.user.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    // Apply filters
    if (filters?.projectId) {
      query = query.eq("project_id", filters.projectId);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.dueDate) {
      const startOfDay = new Date(filters.dueDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.dueDate);
      endOfDay.setHours(23, 59, 59, 999);

      query = query
        .gte("due_date", startOfDay.toISOString())
        .lte("due_date", endOfDay.toISOString());
    }

    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data.map(this.formatTask);
  },

  // Get tasks for today
  async getTodayTasks(): Promise<Task[]> {
    const today = new Date();
    return this.getTasks({ dueDate: today });
  },

  // Get upcoming tasks (next 7 days)
  async getUpcomingTasks(): Promise<Task[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("User not authenticated");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        project:projects(id, name, color)
      `
      )
      .eq("user_id", userData.user.id)
      .gte("due_date", today.toISOString())
      .lte("due_date", nextWeek.toISOString())
      .neq("status", "completed")
      .order("due_date", { ascending: true });

    if (error) throw error;
    return data.map(this.formatTask);
  },

  // Get inbox tasks (no project assigned)
  async getInboxTasks(): Promise<Task[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userData.user.id)
      .is("project_id", null)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data.map(this.formatTask);
  },

  // Update a task
  async updateTask(id: string, updates: Partial<TaskInput>): Promise<Task> {
    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      if (updates.status === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else if (updateData.completed_at) {
        updateData.completed_at = null;
      }
    }
    if (updates.dueDate !== undefined) {
      updateData.due_date = normalizeDueDate(updates.dueDate);
    }
    if (updates.projectId !== undefined)
      updateData.project_id = updates.projectId ?? null;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        project:projects(id, name, color)
      `
      )
      .single();

    if (error) throw error;

    // Update user stats if task was completed
    if (updates.status === "completed") {
      await this.updateUserStats();
    }

    return this.formatTask(data);
  },

  // Toggle task completion
  async toggleTaskComplete(id: string): Promise<Task> {
    // First get the current task status
    const { data: currentTask, error: fetchError } = await supabase
      .from("tasks")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const newStatus = currentTask.status === "completed" ? "todo" : "completed";
    return this.updateTask(id, { status: newStatus });
  },

  // Delete a task
  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) throw error;
  },

  // Update user productivity stats
  async updateUserStats(): Promise<void> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("User not authenticated");

    // Count total completed tasks
    const { count, error: countError } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userData.user.id)
      .eq("status", "completed");

    if (countError) throw countError;

    // Check if user completed any tasks today for streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayTasks, error: todayError } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", userData.user.id)
      .eq("status", "completed")
      .gte("completed_at", today.toISOString())
      .limit(1);

    if (todayError) throw todayError;

    // Update user stats
    const { error: updateError } = await supabase
      .from("users")
      .update({
        total_tasks_completed: count || 0,
        // Streak logic would be more complex in production
        current_streak: todayTasks && todayTasks.length > 0 ? 1 : 0,
      })
      .eq("id", userData.user.id);

    if (updateError) throw updateError;
  },

  // Update task position
  async updateTaskPosition(
    taskId: string,
    newPosition: number
  ): Promise<Task> {
    const { data, error } = await supabase
      .from("tasks")
      .update({ position: newPosition, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .select(
        `
        *,
        project:projects(id, name, color)
      `
      )
      .single();

    if (error) throw error;
    return this.formatTask(data);
  },

  // Batch update task positions (for reordering)
  async reorderTasks(
    taskIds: string[]
  ): Promise<void> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("User not authenticated");

    // Update each task's position based on its index in the array
    const updates = taskIds.map((id, index) =>
      supabase
        .from("tasks")
        .update({ position: index, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", userData.user!.id)
    );

    await Promise.all(updates);
  },

  // Helper to format task data
  formatTask(data: any): Task {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      dueDate: data.due_date,
      projectId: data.project_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at,
      position: data.position,
      project: data.project
        ? {
            id: data.project.id,
            name: data.project.name,
            color: data.project.color,
          }
        : undefined,
    };
  },
};
