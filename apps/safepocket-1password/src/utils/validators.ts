// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    // Also accept URLs without protocol
    try {
      new URL(`https://${url}`);
      return true;
    } catch {
      return false;
    }
  }
}

// Password validation for master password
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validateMasterPassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Title validation for password entries
export function validatePasswordTitle(title: string): string | null {
  if (!title || title.trim().length === 0) {
    return "Title is required";
  }

  if (title.length > 100) {
    return "Title must be less than 100 characters";
  }

  return null;
}

// Category name validation
export function validateCategoryName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return "Category name is required";
  }

  if (name.length > 50) {
    return "Category name must be less than 50 characters";
  }

  return null;
}

// Username validation (optional field)
export function validateUsername(username: string): string | null {
  if (username && username.length > 200) {
    return "Username must be less than 200 characters";
  }

  return null;
}

// Notes validation (optional field)
export function validateNotes(notes: string): string | null {
  if (notes && notes.length > 1000) {
    return "Notes must be less than 1000 characters";
  }

  return null;
}

// Auto-lock timeout validation
export function validateAutoLockTimeout(minutes: number): string | null {
  if (!Number.isInteger(minutes)) {
    return "Timeout must be a whole number";
  }

  if (minutes < 0) {
    return "Timeout cannot be negative";
  }

  if (minutes > 1440) {
    // 24 hours
    return "Timeout cannot exceed 24 hours";
  }

  return null;
}

// Validate password entry form
export interface PasswordEntryValidation {
  isValid: boolean;
  errors: {
    title?: string;
    username?: string;
    website?: string;
    notes?: string;
  };
}

export function validatePasswordEntry(entry: {
  title: string;
  username?: string;
  website?: string;
  notes?: string;
}): PasswordEntryValidation {
  const errors: PasswordEntryValidation["errors"] = {};

  const titleError = validatePasswordTitle(entry.title);
  if (titleError) errors.title = titleError;

  if (entry.username) {
    const usernameError = validateUsername(entry.username);
    if (usernameError) errors.username = usernameError;
  }

  if (entry.website && !isValidUrl(entry.website)) {
    errors.website = "Please enter a valid URL";
  }

  if (entry.notes) {
    const notesError = validateNotes(entry.notes);
    if (notesError) errors.notes = notesError;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}


