export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  return { valid: true };
};

export const validateDisplayName = (name: string): { valid: boolean; message?: string } => {
  if (name.trim().length < 2) {
    return { valid: false, message: 'Display name must be at least 2 characters' };
  }
  if (name.length > 50) {
    return { valid: false, message: 'Display name too long (max 50 characters)' };
  }
  return { valid: true };
};

