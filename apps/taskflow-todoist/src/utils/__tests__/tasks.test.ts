import { describe, it, expect } from 'vitest';

describe('Task Utils', () => {
  it('should calculate task priority score', () => {
    const getPriorityScore = (priority: string, dueDate?: Date) => {
      const priorityScores = { low: 1, medium: 2, high: 3, urgent: 4 };
      let score = priorityScores[priority as keyof typeof priorityScores] || 0;
      
      if (dueDate) {
        const now = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue < 0) score += 2; // Overdue
        else if (daysUntilDue <= 1) score += 1; // Due today/tomorrow
      }
      
      return score;
    };

    expect(getPriorityScore('low')).toBe(1);
    expect(getPriorityScore('urgent')).toBe(4);
    expect(getPriorityScore('medium', new Date(Date.now() + 24 * 60 * 60 * 1000))).toBe(3); // Due tomorrow
  });

  it('should format task due date', () => {
    const formatDueDate = (dueDate: Date) => {
      const now = new Date();
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Overdue';
      if (diffDays === 0) return 'Due today';
      if (diffDays === 1) return 'Due tomorrow';
      if (diffDays <= 7) return `Due in ${diffDays} days`;
      return dueDate.toLocaleDateString();
    };

    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    expect(formatDueDate(today)).toBe('Due today');
    expect(formatDueDate(tomorrow)).toBe('Due tomorrow');
    expect(formatDueDate(nextWeek)).toBe('Due in 7 days');
  });

  it('should calculate task completion percentage', () => {
    const calculateCompletionPercentage = (completedSubtasks: number, totalSubtasks: number) => {
      if (totalSubtasks === 0) return 0;
      return Math.round((completedSubtasks / totalSubtasks) * 100);
    };

    expect(calculateCompletionPercentage(0, 0)).toBe(0);
    expect(calculateCompletionPercentage(2, 4)).toBe(50);
    expect(calculateCompletionPercentage(3, 3)).toBe(100);
  });
});