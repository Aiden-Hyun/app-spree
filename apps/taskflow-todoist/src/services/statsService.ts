import { supabase } from "../supabase";

export interface ProductivityStats {
  totalTasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  tasksByDay: { date: string; count: number }[];
  tasksByProject: { projectName: string; count: number; color: string }[];
  tasksByPriority: { priority: string; count: number }[];
  averageCompletionTime: number; // in hours
  mostProductiveDay: string;
  mostProductiveHour: number;
}

export const statsService = {
  // Get comprehensive productivity stats for the user
  async getProductivityStats(
    userId: string,
    days: number = 30
  ): Promise<ProductivityStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get completed tasks
    const { data: completedTasks, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        project:projects(name, color)
      `
      )
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("completed_at", startDate.toISOString())
      .order("completed_at", { ascending: true });

    if (error) throw error;

    // Calculate stats
    const totalTasksCompleted = completedTasks?.length || 0;

    // Tasks by day
    const tasksByDay = this.calculateTasksByDay(completedTasks || [], days);

    // Current streak
    const currentStreak = this.calculateCurrentStreak(tasksByDay);

    // Longest streak
    const longestStreak = this.calculateLongestStreak(tasksByDay);

    // Tasks by project
    const tasksByProject = this.calculateTasksByProject(completedTasks || []);

    // Tasks by priority
    const tasksByPriority = this.calculateTasksByPriority(completedTasks || []);

    // Average completion time
    const averageCompletionTime = await this.calculateAverageCompletionTime(
      userId
    );

    // Most productive day and hour
    const { mostProductiveDay, mostProductiveHour } =
      this.calculateProductiveTimes(completedTasks || []);

    return {
      totalTasksCompleted,
      currentStreak,
      longestStreak,
      tasksByDay,
      tasksByProject,
      tasksByPriority,
      averageCompletionTime,
      mostProductiveDay,
      mostProductiveHour,
    };
  },

  // Calculate tasks completed by day
  calculateTasksByDay(
    tasks: any[],
    days: number
  ): { date: string; count: number }[] {
    const tasksByDay: { [key: string]: number } = {};

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      tasksByDay[dateKey] = 0;
    }

    // Count tasks by day
    tasks.forEach((task) => {
      if (task.completed_at) {
        const dateKey = task.completed_at.split("T")[0];
        if (tasksByDay[dateKey] !== undefined) {
          tasksByDay[dateKey]++;
        }
      }
    });

    // Convert to array and sort
    return Object.entries(tasksByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  // Calculate current streak
  calculateCurrentStreak(
    tasksByDay: { date: string; count: number }[]
  ): number {
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];

    // Start from today and go backwards
    for (let i = tasksByDay.length - 1; i >= 0; i--) {
      const dayData = tasksByDay[i];

      // Skip future days
      if (dayData.date > today) continue;

      // If today has no tasks yet, start checking from yesterday
      if (dayData.date === today && dayData.count === 0 && streak === 0) {
        continue;
      }

      if (dayData.count > 0) {
        streak++;
      } else if (streak > 0) {
        // Streak broken
        break;
      }
    }

    return streak;
  },

  // Calculate longest streak
  calculateLongestStreak(
    tasksByDay: { date: string; count: number }[]
  ): number {
    let currentStreak = 0;
    let longestStreak = 0;

    tasksByDay.forEach((day) => {
      if (day.count > 0) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return longestStreak;
  },

  // Calculate tasks by project
  calculateTasksByProject(
    tasks: any[]
  ): { projectName: string; count: number; color: string }[] {
    const projectMap: { [key: string]: { count: number; color: string } } = {};

    tasks.forEach((task) => {
      const projectName = task.project?.name || "Inbox";
      const color = task.project?.color || "#6c5ce7";

      if (!projectMap[projectName]) {
        projectMap[projectName] = { count: 0, color };
      }
      projectMap[projectName].count++;
    });

    return Object.entries(projectMap)
      .map(([projectName, data]) => ({
        projectName,
        count: data.count,
        color: data.color,
      }))
      .sort((a, b) => b.count - a.count);
  },

  // Calculate tasks by priority
  calculateTasksByPriority(
    tasks: any[]
  ): { priority: string; count: number }[] {
    const priorityMap: { [key: string]: number } = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    tasks.forEach((task) => {
      if (priorityMap[task.priority] !== undefined) {
        priorityMap[task.priority]++;
      }
    });

    return Object.entries(priorityMap)
      .map(([priority, count]) => ({ priority, count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => {
        const order = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (
          order[b.priority as keyof typeof order] -
          order[a.priority as keyof typeof order]
        );
      });
  },

  // Calculate average completion time (from creation to completion)
  async calculateAverageCompletionTime(userId: string): Promise<number> {
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("created_at, completed_at")
      .eq("user_id", userId)
      .eq("status", "completed")
      .not("completed_at", "is", null);

    if (error || !tasks || tasks.length === 0) return 0;

    const totalHours = tasks.reduce((sum, task) => {
      const created = new Date(task.created_at);
      const completed = new Date(task.completed_at);
      const hoursToComplete =
        (completed.getTime() - created.getTime()) / (1000 * 60 * 60);
      return sum + hoursToComplete;
    }, 0);

    return Math.round(totalHours / tasks.length);
  },

  // Calculate most productive day of week and hour of day
  calculateProductiveTimes(tasks: any[]): {
    mostProductiveDay: string;
    mostProductiveHour: number;
  } {
    const dayMap: { [key: string]: number } = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };
    const hourMap: { [key: number]: number } = {};

    // Initialize hours
    for (let i = 0; i < 24; i++) {
      hourMap[i] = 0;
    }

    tasks.forEach((task) => {
      if (task.completed_at) {
        const date = new Date(task.completed_at);
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        const hour = date.getHours();

        dayMap[dayName]++;
        hourMap[hour]++;
      }
    });

    // Find most productive day
    let mostProductiveDay = "Monday";
    let maxDayCount = 0;
    Object.entries(dayMap).forEach(([day, count]) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        mostProductiveDay = day;
      }
    });

    // Find most productive hour
    let mostProductiveHour = 9;
    let maxHourCount = 0;
    Object.entries(hourMap).forEach(([hour, count]) => {
      if (count > maxHourCount) {
        maxHourCount = count;
        mostProductiveHour = parseInt(hour);
      }
    });

    return { mostProductiveDay, mostProductiveHour };
  },

  // Get task completion rate by date range
  async getCompletionRate(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const { data: allTasks, error: allError } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    const { data: completedTasks, error: completedError } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (allError || completedError || !allTasks) return 0;

    const total = (allTasks as any).count || 0;
    const completed = (completedTasks as any).count || 0;

    return total > 0 ? Math.round((completed / total) * 100) : 0;
  },
};


