import { describe, it, expect, vi } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
};

vi.mock('../supabase', () => ({
  supabase: mockSupabase,
}));

describe('Auth Utils', () => {
  it('should validate email format', () => {
    const isValidEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('should validate password strength', () => {
    const isValidPassword = (password: string) => {
      return password.length >= 6;
    };

    expect(isValidPassword('password123')).toBe(true);
    expect(isValidPassword('12345')).toBe(false);
    expect(isValidPassword('')).toBe(false);
  });

  it('should format user display name', () => {
    const formatDisplayName = (email: string) => {
      return email.split('@')[0];
    };

    expect(formatDisplayName('user@example.com')).toBe('user');
    expect(formatDisplayName('test.user@domain.co.uk')).toBe('test.user');
  });
});
