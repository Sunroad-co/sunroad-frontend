/**
 * Build a full public media URL from a DB path or an absolute URL.
 *
 * - If `path` is already an http(s) URL → return as-is.
 * - If it's a storage key like "avatars/..." or "artworks/..." → prefix with SUPABASE_MEDIA_URL.
 */
export function getMediaUrl(path?: string | null): string | null {
  if (!path) return null;

  const trimmed = String(path).trim();
  if (!trimmed) return null;

  // If it's already an absolute URL, don't touch it (future-proof)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const base =
    (process.env.NEXT_PUBLIC_SUPABASE_MEDIA_URL || "").replace(/\/+$/, "");
  const key = trimmed.replace(/^\/+/, ""); // avoid double slashes

  return `${base}/${key}`;
}

