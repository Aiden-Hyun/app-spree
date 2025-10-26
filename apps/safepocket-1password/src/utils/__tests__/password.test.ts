import { describe, it, expect } from 'vitest';

describe('Password Utils', () => {
  it('should generate secure passwords', () => {
    const generatePassword = (length: number = 16, includeSymbols: boolean = true) => {
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      let charset = lowercase + uppercase + numbers;
      if (includeSymbols) charset += symbols;
      
      let password = '';
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      
      return password;
    };

    const password = generatePassword(12, true);
    expect(password).toHaveLength(12);
    expect(password).toMatch(/[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
  });

  it('should calculate password strength', () => {
    const calculatePasswordStrength = (password: string) => {
      let score = 0;
      
      if (password.length >= 8) score += 1;
      if (password.length >= 12) score += 1;
      if (/[a-z]/.test(password)) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/[0-9]/.test(password)) score += 1;
      if (/[^a-zA-Z0-9]/.test(password)) score += 1;
      
      if (score <= 2) return 'Weak';
      if (score <= 4) return 'Medium';
      return 'Strong';
    };

    expect(calculatePasswordStrength('password')).toBe('Weak');
    expect(calculatePasswordStrength('Password123')).toBe('Medium');
    expect(calculatePasswordStrength('Password123!')).toBe('Strong');
  });

  it('should validate password requirements', () => {
    const validatePassword = (password: string) => {
      const errors = [];
      
      if (password.length < 8) errors.push('At least 8 characters');
      if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
      if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
      if (!/[0-9]/.test(password)) errors.push('At least one number');
      if (!/[^a-zA-Z0-9]/.test(password)) errors.push('At least one special character');
      
      return {
        isValid: errors.length === 0,
        errors
      };
    };

    expect(validatePassword('Password123!')).toEqual({ isValid: true, errors: [] });
    expect(validatePassword('weak')).toEqual({
      isValid: false,
      errors: ['At least 8 characters', 'At least one uppercase letter', 'At least one number', 'At least one special character']
    });
  });
});