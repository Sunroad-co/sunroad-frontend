/**
 * Storage path utilities for media uploads
 */

/**
 * Converts a full storage key to its corresponding thumbnail key.
 * Inserts "thumbs" before the filename.
 * 
 * Example:
 *   toThumbKey("avatars/123/456-avatar.jpg") => "avatars/123/thumbs/456-avatar.jpg"
 *   toThumbKey("artworks/123/789-work.jpg") => "artworks/123/thumbs/789-work.jpg"
 * 
 * @param fullKey - The full storage key (e.g., "avatars/{id}/{filename}")
 * @returns The thumbnail storage key, or null if the key format is invalid
 */
export function toThumbKey(fullKey: string): string | null {
  if (!fullKey || typeof fullKey !== 'string') {
    return null
  }

  const parts = fullKey.split('/')
  if (parts.length < 3) {
    // Need at least: type/entityId/filename
    return null
  }

  const filename = parts.pop()
  if (!filename) {
    return null
  }

  // Join: [...parts, "thumbs", filename]
  return [...parts, 'thumbs', filename].join('/')
}
