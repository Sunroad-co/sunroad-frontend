/**
 * Valid MIME types for image uploads
 */
const VALID_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const

/**
 * HEIC/HEIF MIME types and extensions to reject
 */
const HEIC_MIME_TYPES = [
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
] as const

const HEIC_EXTENSIONS = ['.heic', '.heif'] as const

/**
 * Validate if a file is a supported image format
 * 
 * @param file - The file to validate
 * @returns Object with isValid flag and error message if invalid
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const mimeType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()

  // Check for HEIC/HEIF
  const isHeic = HEIC_MIME_TYPES.some(mime => mimeType.includes(mime)) ||
                 HEIC_EXTENSIONS.some(ext => fileName.endsWith(ext))

  if (isHeic) {
    return {
      isValid: false,
      error: "HEIC/HEIF isn't supported here. Please export to JPEG/PNG/WebP and try again."
    }
  }

  // Check MIME type whitelist
  const isValidMime = VALID_MIME_TYPES.some(validMime => 
    mimeType === validMime || mimeType.startsWith(validMime)
  )

  if (!isValidMime) {
    return {
      isValid: false,
      error: 'Please select a JPEG, PNG, or WebP image file.'
    }
  }

  return { isValid: true }
}

