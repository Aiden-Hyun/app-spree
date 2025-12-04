import { useState, useEffect, useCallback } from "react";
import { taskService, Task, TaskInput } from "../services/taskService";

interface UseTasksOptions {
  projectId?: string;
  status?: string;
  dueDate?: Date;
  search?: string;
  autoRefresh?: boolean;
}

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const data = await taskService.getTasks(options);
      setTasks(data);
    } catch (err: any) {
      setError(err.message || "Failed to load tasks");
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [options.projectId, options.status, options.dueDate, options.search]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(async (input: TaskInput) => {
    try {
      const newTask = await taskService.createTask(input);
      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    } catch (err: any) {
      setError(err.message || "Failed to create task");
      throw err;
    }
  }, []);

  const updateTask = useCallback(
    async (id: string, updates: Partial<TaskInput>) => {
      try {
        const updatedTask = await taskService.updateTask(id, updates);
        setTasks((prev) =>
          prev.map((task) => (task.id === id ? updatedTask : task))
        );
        return updatedTask;
      } catch (err: any) {
        setError(err.message || "Failed to update task");
        throw err;
      }
    },
    []
  );

  const toggleTaskComplete = useCallback(async (id: string) => {
    try {
      const updatedTask = await taskService.toggleTaskComplete(id);
      setTasks((prev) =>
        prev.map((task) => (task.id === id ? updatedTask : task))
      );
      return updatedTask;
    } catch (err: any) {
      setError(err.message || "Failed to toggle task");
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await taskService.deleteTask(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete task");
      throw err;
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(loadTasks, 30000);
      return () => clearInterval(interval);
    }
  }, [options.autoRefresh, loadTasks]);

  return {
    tasks,
    loading,
    error,
    refreshing,
    refresh,
    createTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
  };
}

// Specialized hooks for different views
export function useTodayTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTodayTasks = async () => {
      try {
        const data = await taskService.getTodayTasks();
        setTasks(data);
      } catch (err: any) {
        setError(err.message || "Failed to load today tasks");
      } finally {
        setLoading(false);
      }
    };

    loadTodayTasks();
  }, []);

  return { tasks, loading, error };
}

export function useUpcomingTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUpcomingTasks = async () => {
      try {
        const data = await taskService.getUpcomingTasks();
        setTasks(data);
      } catch (err: any) {
        setError(err.message || "Failed to load upcoming tasks");
      } finally {
        setLoading(false);
      }
    };

    loadUpcomingTasks();
  }, []);

  return { tasks, loading, error };
}

export function useInboxTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInboxTasks = async () => {
      try {
        const data = await taskService.getInboxTasks();
        setTasks(data);
      } catch (err: any) {
        setError(err.message || "Failed to load inbox tasks");
      } finally {
        setLoading(false);
      }
    };

    loadInboxTasks();
  }, []);

  return { tasks, loading, error };
}


