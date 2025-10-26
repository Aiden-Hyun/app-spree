import { describe, it, expect } from 'vitest';

describe('Language Utils', () => {
  it('should calculate XP for lesson completion', () => {
    const calculateXP = (baseXP: number, score: number, streak: number) => {
      const scoreMultiplier = score / 100;
      const streakBonus = Math.min(streak * 0.1, 0.5); // Max 50% bonus
      return Math.floor(baseXP * scoreMultiplier * (1 + streakBonus));
    };

    expect(calculateXP(100, 100, 0)).toBe(100);
    expect(calculateXP(100, 80, 5)).toBe(104); // 100 * 0.8 * 1.3
    expect(calculateXP(50, 90, 10)).toBe(67); // 50 * 0.9 * 1.5
  });

  it('should determine lesson difficulty', () => {
    const getDifficultyLevel = (userLevel: number, lessonXP: number) => {
      if (lessonXP <= userLevel * 10) return 'easy';
      if (lessonXP <= userLevel * 20) return 'medium';
      return 'hard';
    };

    expect(getDifficultyLevel(5, 30)).toBe('easy');
    expect(getDifficultyLevel(5, 80)).toBe('medium');
    expect(getDifficultyLevel(5, 120)).toBe('hard');
  });

  it('should format learning streak', () => {
    const formatStreak = (days: number) => {
      if (days === 0) return 'Start your streak!';
      if (days === 1) return '1 day streak';
      if (days < 7) return `${days} days streak`;
      if (days < 30) return `${Math.floor(days / 7)} week streak`;
      return `${Math.floor(days / 30)} month streak`;
    };

    expect(formatStreak(0)).toBe('Start your streak!');
    expect(formatStreak(1)).toBe('1 day streak');
    expect(formatStreak(5)).toBe('5 days streak');
    expect(formatStreak(14)).toBe('2 week streak');
    expect(formatStreak(60)).toBe('2 month streak');
  });
});