import { describe, it, expect } from 'vitest';

describe('Alarm Utils', () => {
  it('should format time for display', () => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    expect(formatTime('07:30')).toBe('7:30 AM');
    expect(formatTime('13:45')).toBe('1:45 PM');
    expect(formatTime('00:00')).toBe('12:00 AM');
  });

  it('should calculate time until alarm', () => {
    const getTimeUntilAlarm = (alarmTime: string, currentTime: string) => {
      const [alarmHour, alarmMinute] = alarmTime.split(':').map(Number);
      const [currentHour, currentMinute] = currentTime.split(':').map(Number);
      
      const alarmMinutes = alarmHour * 60 + alarmMinute;
      const currentMinutes = currentHour * 60 + currentMinute;
      
      let diff = alarmMinutes - currentMinutes;
      if (diff < 0) diff += 24 * 60; // Next day
      
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      
      return { hours, minutes };
    };

    expect(getTimeUntilAlarm('08:00', '07:30')).toEqual({ hours: 0, minutes: 30 });
    expect(getTimeUntilAlarm('09:00', '07:30')).toEqual({ hours: 1, minutes: 30 });
  });

  it('should validate alarm time format', () => {
    const isValidTime = (time: string) => {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return timeRegex.test(time);
    };

    expect(isValidTime('07:30')).toBe(true);
    expect(isValidTime('23:59')).toBe(true);
    expect(isValidTime('24:00')).toBe(false);
    expect(isValidTime('7:30')).toBe(false);
    expect(isValidTime('invalid')).toBe(false);
  });
});
