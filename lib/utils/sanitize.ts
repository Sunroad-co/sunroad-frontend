/**
 * Sanitizes user input to prevent XSS attacks by escaping HTML entities
 * Use this only when rendering text as HTML (e.g., dangerouslySetInnerHTML).
 * For plain text storage and React text rendering, use sanitizeAndTrim instead.
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
 * Sanitizes and trims plain text input for storage in database.
 * This function is designed for plain text fields (title, description, bio) that
 * will be rendered as text (not HTML). It preserves normal punctuation and symbols.
 * 
 * What it does:
 * - Trims leading/trailing whitespace
 * - Collapses multiple consecutive whitespace characters to single spaces
 * - Removes control characters (ASCII 0-31 except space, tab, newline, carriage return)
 * - Normalizes line breaks to \n
 * - Preserves all normal punctuation including ', &, quotes, commas, etc.
 * 
 * @param input - The input string to sanitize and trim
 * @returns Sanitized and trimmed string safe for plain text storage
 */
export function sanitizeAndTrim(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  // Trim leading and trailing whitespace
  let sanitized = input.trim()

  // Remove control characters (ASCII 0-31) except space (32), tab (9), newline (10), carriage return (13)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Normalize line breaks: convert \r\n and \r to \n
  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Collapse multiple consecutive whitespace (spaces, tabs) to single space, but preserve line breaks
  sanitized = sanitized.replace(/[ \t]+/g, ' ')

  // Collapse multiple consecutive line breaks to maximum of 2 (for paragraph separation)
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n')

  return sanitized
}

