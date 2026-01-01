/**
 * Validates password against policy:
 * - Minimum 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 * 
 * Returns null if valid, or a user-friendly error message if invalid.
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
  }
  return null;
}

/**
 * Maps Supabase password policy errors to user-friendly messages.
 * Prevents leaking raw Supabase error strings.
 */
export function mapPasswordError(errorMessage: string): string {
  const lowerMessage = errorMessage.toLowerCase();
  
  if (lowerMessage.includes('password') && lowerMessage.includes('policy')) {
    return "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";
  }
  if (lowerMessage.includes('password') && lowerMessage.includes('weak')) {
    return "Password is too weak. Please use a stronger password.";
  }
  if (lowerMessage.includes('password') && lowerMessage.includes('length')) {
    return "Password must be at least 8 characters long.";
  }
  
  // Return generic message for other password-related errors
  if (lowerMessage.includes('password')) {
    return "Invalid password. Please check the requirements and try again.";
  }
  
  // Return original message if not password-related
  return errorMessage;
}

