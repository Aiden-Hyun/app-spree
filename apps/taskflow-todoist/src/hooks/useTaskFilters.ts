import { useMemo } from "react";
import { Task } from "../services/taskService";

export type SortBy = "dueDate" | "priority" | "createdAt" | "alphabetical";
export type SortOrder = "asc" | "desc";

export interface FilterOptions {
  status?: "todo" | "in_progress" | "completed" | "all";
  priority?: "low" | "medium" | "high" | "urgent" | "all";
  projectId?: string;
  labels?: string[];
  search?: string;
  hasDeadline?: boolean;
  isOverdue?: boolean;
}

export interface SortOptions {
  sortBy: SortBy;
  sortOrder: SortOrder;
}

export function useTaskFilters(
  tasks: Task[],
  filterOptions: FilterOptions = {},
  sortOptions: SortOptions = { sortBy: "dueDate", sortOrder: "asc" }
) {
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Filter by status
    if (filterOptions.status && filterOptions.status !== "all") {
      filtered = filtered.filter(
        (task) => task.status === filterOptions.status
      );
    }

    // Filter by priority
    if (filterOptions.priority && filterOptions.priority !== "all") {
      filtered = filtered.filter(
        (task) => task.priority === filterOptions.priority
      );
    }

    // Filter by project
    if (filterOptions.projectId) {
      filtered = filtered.filter(
        (task) => task.projectId === filterOptions.projectId
      );
    }

    // Filter by search term
    if (filterOptions.search) {
      const searchLower = filterOptions.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          (task.description &&
            task.description.toLowerCase().includes(searchLower))
      );
    }

    // Filter by has deadline
    if (filterOptions.hasDeadline !== undefined) {
      filtered = filtered.filter((task) =>
        filterOptions.hasDeadline
          ? task.dueDate !== null
          : task.dueDate === null
      );
    }

    // Filter by overdue
    if (filterOptions.isOverdue) {
      const now = new Date();
      filtered = filtered.filter((task) => {
        if (!task.dueDate || task.status === "completed") return false;
        return new Date(task.dueDate) < now;
      });
    }

    return filtered;
  }, [tasks, filterOptions]);

  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    const { sortBy, sortOrder } = sortOptions;

    sorted.sort((a, b) => {
      let compareResult = 0;

      switch (sortBy) {
        case "dueDate":
          // Tasks without due dates go to the end
          if (!a.dueDate && !b.dueDate) compareResult = 0;
          else if (!a.dueDate) compareResult = 1;
          else if (!b.dueDate) compareResult = -1;
          else {
            compareResult =
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          break;

        case "priority":
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          compareResult = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;

        case "createdAt":
          compareResult =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;

        case "alphabetical":
          compareResult = a.title.localeCompare(b.title);
          break;
      }

      // Apply sort order
      return sortOrder === "desc" ? -compareResult : compareResult;
    });

    return sorted;
  }, [filteredTasks, sortOptions]);

  // Group tasks by various criteria
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: Task[] } = {};

    // Group by date
    const groupByDate = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      groups["Overdue"] = [];
      groups["Today"] = [];
      groups["Tomorrow"] = [];
      groups["This Week"] = [];
      groups["Later"] = [];
      groups["No Date"] = [];

      sortedTasks.forEach((task) => {
        if (!task.dueDate) {
          groups["No Date"].push(task);
        } else {
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);

          if (taskDate < today && task.status !== "completed") {
            groups["Overdue"].push(task);
          } else if (taskDate.getTime() === today.getTime()) {
            groups["Today"].push(task);
          } else if (taskDate.getTime() === tomorrow.getTime()) {
            groups["Tomorrow"].push(task);
          } else if (
            taskDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          ) {
            groups["This Week"].push(task);
          } else {
            groups["Later"].push(task);
          }
        }
      });

      // Remove empty groups
      Object.keys(groups).forEach((key) => {
        if (groups[key].length === 0) {
          delete groups[key];
        }
      });
    };

    // Group by priority
    const groupByPriority = () => {
      groups["Urgent"] = [];
      groups["High"] = [];
      groups["Medium"] = [];
      groups["Low"] = [];

      sortedTasks.forEach((task) => {
        const key =
          task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        groups[key].push(task);
      });

      // Remove empty groups
      Object.keys(groups).forEach((key) => {
        if (groups[key].length === 0) {
          delete groups[key];
        }
      });
    };

    // Group by project
    const groupByProject = () => {
      sortedTasks.forEach((task) => {
        const projectName = task.project?.name || "Inbox";
        if (!groups[projectName]) {
          groups[projectName] = [];
        }
        groups[projectName].push(task);
      });
    };

    // Default grouping by date
    groupByDate();

    return groups;
  }, [sortedTasks]);

  // Task statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const overdue = tasks.filter((t) => {
      if (!t.dueDate || t.status === "completed") return false;
      return new Date(t.dueDate) < new Date();
    }).length;
    const todayCount = tasks.filter((t) => {
      if (!t.dueDate) return false;
      const today = new Date();
      const taskDate = new Date(t.dueDate);
      return taskDate.toDateString() === today.toDateString();
    }).length;

    return {
      total,
      completed,
      active: total - completed,
      overdue,
      today: todayCount,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks]);

  return {
    tasks: sortedTasks,
    groupedTasks,
    stats,
    totalCount: filteredTasks.length,
  };
}


