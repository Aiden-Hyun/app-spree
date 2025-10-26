import { describe, it, expect } from 'vitest';

describe('Reddit Utils', () => {
  it('should format karma for display', () => {
    const formatKarma = (karma: number) => {
      if (karma >= 1000000) {
        return `${(karma / 1000000).toFixed(1)}M`;
      }
      if (karma >= 1000) {
        return `${(karma / 1000).toFixed(1)}K`;
      }
      return karma.toString();
    };

    expect(formatKarma(0)).toBe('0');
    expect(formatKarma(999)).toBe('999');
    expect(formatKarma(1000)).toBe('1.0K');
    expect(formatKarma(1500)).toBe('1.5K');
    expect(formatKarma(1000000)).toBe('1.0M');
  });

  it('should calculate time ago', () => {
    const getTimeAgo = (date: Date) => {
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffMinutes < 1) return 'just now';
      if (diffMinutes < 60) return `${diffMinutes}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString();
    };

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    expect(getTimeAgo(now)).toBe('just now');
    expect(getTimeAgo(fiveMinutesAgo)).toBe('5m');
    expect(getTimeAgo(twoHoursAgo)).toBe('2h');
    expect(getTimeAgo(threeDaysAgo)).toBe('3d');
  });

  it('should validate subreddit name', () => {
    const isValidSubredditName = (name: string) => {
      const subredditRegex = /^[a-zA-Z0-9][a-zA-Z0-9_]{2,20}$/;
      return subredditRegex.test(name);
    };

    expect(isValidSubredditName('programming')).toBe(true);
    expect(isValidSubredditName('webdev')).toBe(true);
    expect(isValidSubredditName('a')).toBe(false); // Too short
    expect(isValidSubredditName('123')).toBe(true);
    expect(isValidSubredditName('test-subreddit')).toBe(false); // Hyphens not allowed
    expect(isValidSubredditName('')).toBe(false);
  });
});