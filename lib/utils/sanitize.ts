/**
 * Sanitizes user input to prevent XSS attacks by escaping HTML entities
 * @param input - The input string to sanitize
 * @returns Sanitized string with HTML entities escaped
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return input.replace(/[&<>"'/]/g, (char) => map[char] || char)
}

/**
 * Sanitizes and trims user input
 * @param input - The input string to sanitize and trim
 * @returns Sanitized and trimmed string
 */
export function sanitizeAndTrim(input: string): string {
  return sanitizeInput(input.trim())
}

