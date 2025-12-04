import { useState, useEffect, useCallback } from "react";
import {
  projectService,
  Project,
  ProjectInput,
} from "../services/projectService";

export function useProjects(includeArchived = false) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      setError(null);
      const data = await projectService.getProjects(includeArchived);
      setProjects(data);
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [includeArchived]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjects();
  }, [loadProjects]);

  const createProject = useCallback(async (input: ProjectInput) => {
    try {
      const newProject = await projectService.createProject(input);
      setProjects((prev) => [...prev, newProject]);
      return newProject;
    } catch (err: any) {
      setError(err.message || "Failed to create project");
      throw err;
    }
  }, []);

  const updateProject = useCallback(
    async (id: string, updates: Partial<ProjectInput>) => {
      try {
        const updatedProject = await projectService.updateProject(id, updates);
        setProjects((prev) =>
          prev.map((project) => (project.id === id ? updatedProject : project))
        );
        return updatedProject;
      } catch (err: any) {
        setError(err.message || "Failed to update project");
        throw err;
      }
    },
    []
  );

  const toggleProjectArchive = useCallback(
    async (id: string) => {
      try {
        const updatedProject = await projectService.toggleProjectArchive(id);
        if (!includeArchived && updatedProject.isArchived) {
          // Remove from list if we're not showing archived projects
          setProjects((prev) => prev.filter((project) => project.id !== id));
        } else {
          setProjects((prev) =>
            prev.map((project) =>
              project.id === id ? updatedProject : project
            )
          );
        }
        return updatedProject;
      } catch (err: any) {
        setError(err.message || "Failed to toggle project archive");
        throw err;
      }
    },
    [includeArchived]
  );

  const deleteProject = useCallback(async (id: string) => {
    try {
      await projectService.deleteProject(id);
      setProjects((prev) => prev.filter((project) => project.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete project");
      throw err;
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    projects,
    loading,
    error,
    refreshing,
    refresh,
    createProject,
    updateProject,
    toggleProjectArchive,
    deleteProject,
  };
}

// Hook to get a single project
export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        const data = await projectService.getProject(id);
        setProject(data);
      } catch (err: any) {
        setError(err.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadProject();
    }
  }, [id]);

  return { project, loading, error };
}


