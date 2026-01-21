/**
 * Media URL normalization and helper functions.
 * 
 * Single source of truth for converting Supabase storage keys or full URLs
 * into displayable URLs. Uses deterministic string manipulation (no Supabase client calls).
 */

/** Valid storage key prefixes for cleanup operations */
const VALID_KEY_PREFIXES = ['avatars/', 'banners/', 'artworks/'] as const;

/**
 * Normalize a full URL or storage key to a raw storage key.
 * Used for cleanup operations where we need the relative key, not the full URL.
 * 
 * - If input is null/empty => null
 * - If input starts with "http", extract the part after "/media/" (bucket name in URL)
 *   Example: https://<proj>.supabase.co/storage/v1/object/public/media/avatars/<id>/x.jpg
 *   Result: avatars/<id>/x.jpg
 * - If input already looks like a valid key (starts with avatars/, banners/, artworks/), return as-is
 * - Otherwise return null (do not delete unknown paths)
 */
export function normalizeStorageKey(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;

  const trimmed = String(pathOrUrl).trim();
  if (!trimmed) return null;

  // If it's a full URL, extract the storage key
  if (/^https?:\/\//i.test(trimmed)) {
    // Look for /media/ in the URL and extract everything after it
    const mediaIndex = trimmed.indexOf('/media/');
    if (mediaIndex !== -1) {
      const key = trimmed.substring(mediaIndex + '/media/'.length);
      // Validate that the extracted key starts with a valid prefix
      if (VALID_KEY_PREFIXES.some(prefix => key.startsWith(prefix))) {
        return key;
      }
    }
    // URL doesn't contain /media/ or extracted key is invalid
    return null;
  }

  // Check if it's already a valid storage key
  if (VALID_KEY_PREFIXES.some(prefix => trimmed.startsWith(prefix))) {
    return trimmed;
  }

  // Unknown format - don't delete
  return null;
}

/**
 * Build a deduplicated list of storage keys to remove.
 * Filters out nulls, normalizes all paths, and removes duplicates.
 */
export function buildCleanupPaths(...pathsOrUrls: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const pathOrUrl of pathsOrUrls) {
    const key = normalizeStorageKey(pathOrUrl);
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }

  return result;
}

/**
 * Derive the thumbnail storage key from a full-size storage key.
 * Thumbnails live in a `thumbs/` subfolder with the SAME filename.
 * 
 * Examples:
 *   "avatars/<id>/123.jpg" -> "avatars/<id>/thumbs/123.jpg"
 *   "banners/<id>/abc.jpg" -> "banners/<id>/thumbs/abc.jpg"
 *   "artworks/<id>/xyz.png" -> "artworks/<id>/thumbs/xyz.png"
 * 
 * - If input is null/empty => null
 * - First normalizes the input via normalizeStorageKey
 * - If key already contains '/thumbs/' => returns the key as-is (already a thumb)
 * - If key doesn't start with valid prefixes => null
 * - Otherwise inserts '/thumbs/' before the filename
 */
export function deriveThumbKey(fullKeyOrUrl: string | null | undefined): string | null {
  // First normalize (handles full URLs -> storage keys)
  const key = normalizeStorageKey(fullKeyOrUrl);
  if (!key) return null;

  // If already a thumb path, return as-is
  if (key.includes('/thumbs/')) {
    return key;
  }

  // Must start with a valid prefix
  if (!VALID_KEY_PREFIXES.some(prefix => key.startsWith(prefix))) {
    return null;
  }

  // Find the last slash to insert /thumbs/ before the filename
  const lastSlashIndex = key.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    // No slash found - invalid key format
    return null;
  }

  // Insert /thumbs/ before the filename
  // e.g., "avatars/<id>/file.jpg" -> "avatars/<id>/thumbs/file.jpg"
  const dirPart = key.substring(0, lastSlashIndex);
  const filePart = key.substring(lastSlashIndex + 1);
  
  return `${dirPart}/thumbs/${filePart}`;
}

/**
 * Build cleanup paths with automatic thumb derivation fallback.
 * For each full key, if no explicit thumb key is provided, derives one as fallback.
 * 
 * Usage:
 *   buildCleanupPathsWithThumbFallback(oldFullKey, oldThumbKey)
 *   - If oldThumbKey is truthy: includes both oldFullKey and oldThumbKey
 *   - If oldThumbKey is falsy: includes oldFullKey AND derives thumb from oldFullKey
 * 
 * This ensures old thumbs are always cleaned up even if thumb_url field is missing.
 */
export function buildCleanupPathsWithThumbFallback(
  fullKey: string | null | undefined,
  explicitThumbKey: string | null | undefined
): string[] {
  const normalizedFull = normalizeStorageKey(fullKey);
  const normalizedThumb = normalizeStorageKey(explicitThumbKey);
  
  // If no full key, nothing to clean up
  if (!normalizedFull) {
    return normalizedThumb ? [normalizedThumb] : [];
  }
  
  // Use explicit thumb if available, otherwise derive from full key
  const thumbKey = normalizedThumb ?? deriveThumbKey(normalizedFull);
  
  // Build deduplicated list
  return buildCleanupPaths(normalizedFull, thumbKey);
}

/**
 * Normalize a storage key or URL to a full public URL.
 * 
 * - If input is null/empty => null
 * - If input starts with "http" => return as-is (already a full URL)
 * - Else treat as storage key => return `${NEXT_PUBLIC_SUPABASE_MEDIA_URL}/${key}`
 */
export function getMediaUrl(keyOrUrl?: string | null): string | null {
  if (!keyOrUrl) return null;

  const trimmed = String(keyOrUrl).trim();
  if (!trimmed) return null;

  // If it's already a full URL, return as-is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Treat as storage key - normalize and prefix with media URL
  const base = (process.env.NEXT_PUBLIC_SUPABASE_MEDIA_URL || "").replace(/\/+$/, "");
  const key = trimmed.replace(/^\/+/, ""); // remove leading slashes

  if (!base) {
    // In development, warn if env var is missing
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getMediaUrl] NEXT_PUBLIC_SUPABASE_MEDIA_URL not set');
    }
    return null;
  }

  return `${base}/${key}`;
}

/**
 * Get avatar URL with size-based fallback strategy.
 * 
 * @param artist - Artist object with avatar_url and optionally avatar_thumb_url
 * @param size - 'small' for navbar/dropdowns/lists (prefer thumb), 'full' for profile/hero (prefer full)
 */
export function getAvatarUrl(
  artist: { avatar_url?: string | null; avatar_thumb_url?: string | null },
  size: 'small' | 'full' = 'small'
): string | null {
  if (size === 'small') {
    // Small UI: prefer thumbnail for performance
    if (artist.avatar_thumb_url) {
      const url = getMediaUrl(artist.avatar_thumb_url);
      if (url) return url;
    }
    // Fallback to full avatar_url
    if (artist.avatar_url) {
      return getMediaUrl(artist.avatar_url);
    }
  } else {
    // Full UI: prefer full resolution
    if (artist.avatar_url) {
      const url = getMediaUrl(artist.avatar_url);
      if (url) return url;
    }
    // Fallback to thumbnail if full URL not available
    if (artist.avatar_thumb_url) {
      return getMediaUrl(artist.avatar_thumb_url);
    }
  }
  
  return null;
}

/**
 * Get banner URL with size-based fallback strategy.
 * 
 * @param artist - Artist object with banner_url and optionally banner_thumb_url
 * @param size - 'small' for cards/lists (prefer thumb), 'full' for profile/hero (prefer full)
 */
export function getBannerUrl(
  artist: { banner_url?: string | null; banner_thumb_url?: string | null },
  size: 'small' | 'full' = 'full'
): string | null {
  if (size === 'small') {
    // Small UI: prefer thumbnail for performance
    if (artist.banner_thumb_url) {
      const url = getMediaUrl(artist.banner_thumb_url);
      if (url) return url;
    }
    // Fallback to full banner_url
    if (artist.banner_url) {
      return getMediaUrl(artist.banner_url);
    }
  } else {
    // Full UI: prefer full resolution
    if (artist.banner_url) {
      const url = getMediaUrl(artist.banner_url);
      if (url) return url;
    }
    // Fallback to thumbnail if full URL not available
    if (artist.banner_thumb_url) {
      return getMediaUrl(artist.banner_thumb_url);
    }
  }
  
  return null;
}

/**
 * Get URL for artwork card thumbnail.
 * Prefers thumb_url, falls back to src_url, normalizes via getMediaUrl.
 * Returns null if neither available.
 */
export function getArtworkCardUrl(work: { thumb_url?: string | null; src_url?: string | null }): string | null {
  // Prefer thumb_url for cards (smaller, faster)
  if (work.thumb_url) {
    const url = getMediaUrl(work.thumb_url);
    if (url) return url;
  }
  
  // Fallback to src_url if thumb_url is missing or invalid
  if (work.src_url) {
    return getMediaUrl(work.src_url);
  }
  
  return null;
}

/**
 * Get URL for artwork modal/full-size view.
 * Prefers src_url (original/high quality), falls back to thumb_url, normalizes via getMediaUrl.
 * Returns null if neither available.
 */
export function getArtworkModalUrl(work: { thumb_url?: string | null; src_url?: string | null }): string | null {
  // Prefer src_url for modal (original/high quality)
  if (work.src_url) {
    const url = getMediaUrl(work.src_url);
    if (url) return url;
  }
  
  // Fallback to thumb_url if src_url is missing or invalid
  if (work.thumb_url) {
    return getMediaUrl(work.thumb_url);
  }
  
  return null;
}
