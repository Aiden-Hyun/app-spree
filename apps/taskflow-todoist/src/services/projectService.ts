import { supabase } from "../supabase";

export interface ProjectInput {
  name: string;
  description?: string;
  color?: string;
}

export interface Project extends ProjectInput {
  id: string;
  userId: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
  completedTaskCount?: number;
}

export const projectService = {
  // Create a new project
  async createProject(input: ProjectInput): Promise<Project> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("User not authenticated");

    const projectData = {
      user_id: userData.user.id,
      name: input.name,
      description: input.description || null,
      color: input.color || "#6c5ce7",
      is_archived: false,
    };

    const { data, error } = await supabase
      .from("projects")
      .insert(projectData)
      .select()
      .single();

    if (error) throw error;
    return this.formatProject(data);
  },

  // Get all projects for the current user
  async getProjects(includeArchived = false): Promise<Project[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error("User not authenticated");

    let query = supabase
      .from("projects")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });

    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get task counts for each project
    const projectsWithCounts = await Promise.all(
      data.map(async (project) => {
        const counts = await this.getProjectTaskCounts(project.id);
        return {
          ...this.formatProject(project),
          ...counts,
        };
      })
    );

    return projectsWithCounts;
  },

  // Get a single project by ID
  async getProject(id: string): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    const counts = await this.getProjectTaskCounts(id);
    return {
      ...this.formatProject(data),
      ...counts,
    };
  },

  // Update a project
  async updateProject(
    id: string,
    updates: Partial<ProjectInput>
  ): Promise<Project> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.color !== undefined) updateData.color = updates.color;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const counts = await this.getProjectTaskCounts(id);
    return {
      ...this.formatProject(data),
      ...counts,
    };
  },

  // Archive/unarchive a project
  async toggleProjectArchive(id: string): Promise<Project> {
    const { data: currentProject, error: fetchError } = await supabase
      .from("projects")
      .select("is_archived")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from("projects")
      .update({
        is_archived: !currentProject.is_archived,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    const counts = await this.getProjectTaskCounts(id);
    return {
      ...this.formatProject(data),
      ...counts,
    };
  },

  // Delete a project (and all its tasks)
  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) throw error;
  },

  // Get task counts for a project
  async getProjectTaskCounts(projectId: string): Promise<{
    taskCount: number;
    completedTaskCount: number;
  }> {
    const { data: totalTasks, count: totalCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    const { data: completedTasks, count: completedCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("status", "completed");

    return {
      taskCount: totalCount || 0,
      completedTaskCount: completedCount || 0,
    };
  },

  // Create default Inbox project for new users
  async createInboxProject(): Promise<Project> {
    return this.createProject({
      name: "Inbox",
      description: "Default project for unorganized tasks",
      color: "#6c5ce7",
    });
  },

  // Helper to format project data
  formatProject(data: any): Project {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      color: data.color,
      isArchived: data.is_archived,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};
