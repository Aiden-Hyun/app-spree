export interface PasswordStrength {
  score: number; // 0-4
  label: "Very Weak" | "Weak" | "Fair" | "Good" | "Strong";
  color: string;
  suggestions: string[];
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  const suggestions: string[] = [];

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length < 8) {
    suggestions.push("Use at least 8 characters");
  }

  // Character variety checks
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
    password
  );

  if (hasUpperCase) score += 0.5;
  if (hasLowerCase) score += 0.5;
  if (hasNumbers) score += 0.5;
  if (hasSpecialChars) score += 0.5;

  // Suggestions based on missing elements
  if (!hasUpperCase) suggestions.push("Add uppercase letters");
  if (!hasLowerCase) suggestions.push("Add lowercase letters");
  if (!hasNumbers) suggestions.push("Add numbers");
  if (!hasSpecialChars) suggestions.push("Add special characters");

  // Common patterns check
  const hasSequentialNumbers = /(?:012|123|234|345|456|567|678|789|890)/.test(
    password
  );
  const hasSequentialLetters =
    /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(
      password
    );
  const hasRepeatingChars = /(.)\1{2,}/.test(password);

  if (hasSequentialNumbers || hasSequentialLetters) {
    score -= 0.5;
    suggestions.push("Avoid sequential characters");
  }
  if (hasRepeatingChars) {
    score -= 0.5;
    suggestions.push("Avoid repeating characters");
  }

  // Common passwords check
  const commonPasswords = [
    "password",
    "123456",
    "qwerty",
    "abc123",
    "password123",
  ];
  if (
    commonPasswords.some((common) => password.toLowerCase().includes(common))
  ) {
    score = Math.max(0, score - 2);
    suggestions.push("Avoid common passwords");
  }

  // Ensure score is between 0 and 4
  score = Math.max(0, Math.min(4, Math.floor(score)));

  // Determine label and color
  const strengthMap: Record<
    number,
    { label: PasswordStrength["label"]; color: string }
  > = {
    0: { label: "Very Weak", color: "#e74c3c" },
    1: { label: "Weak", color: "#e67e22" },
    2: { label: "Fair", color: "#f39c12" },
    3: { label: "Good", color: "#27ae60" },
    4: { label: "Strong", color: "#2ecc71" },
  };

  const { label, color } = strengthMap[score];

  return {
    score,
    label,
    color,
    suggestions: suggestions.slice(0, 3), // Limit to 3 suggestions
  };
}

// Generate a strong password
export function generatePassword(
  options: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeSimilar?: boolean;
    excludeAmbiguous?: boolean;
  } = {}
): string {
  const {
    length = 16,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = false,
    excludeAmbiguous = false,
  } = options;

  let charset = "";

  if (includeLowercase) {
    charset += excludeSimilar
      ? "abcdefghjkmnpqrstuvwxyz"
      : "abcdefghijklmnopqrstuvwxyz";
  }

  if (includeUppercase) {
    charset += excludeSimilar
      ? "ABCDEFGHJKLMNPQRSTUVWXYZ"
      : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  }

  if (includeNumbers) {
    charset += excludeSimilar ? "23456789" : "0123456789";
  }

  if (includeSymbols) {
    charset += excludeAmbiguous ? "!@#$%^&*-_=+" : "!@#$%^&*()_+-=[]{}|;:,.<>?";
  }

  if (!charset) {
    charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  }

  let password = "";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  for (let i = 0; i < length; i++) {
    password += charset.charAt(array[i] % charset.length);
  }

  return password;
}

// Password generation presets
export const passwordPresets = {
  memorable: {
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: true,
    excludeAmbiguous: true,
  },
  strong: {
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
  },
  maximum: {
    length: 32,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
  },
  pinCode: {
    length: 6,
    includeUppercase: false,
    includeLowercase: false,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: false,
    excludeAmbiguous: false,
  },
};
