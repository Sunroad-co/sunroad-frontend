import { sanityClient } from './client'
import { BlogPostImage } from './queries'
import { createImageUrlBuilder } from '@sanity/image-url'

const builder = createImageUrlBuilder(sanityClient)

/** Portable Text / block image value: asset can be ref string, { _ref, _id }, or top-level _ref */
export type SanityImageSource =
  | BlogPostImage
  | { asset?: string | { _ref?: string; _id?: string; _type?: string }; _ref?: string; alt?: string; caption?: string }
  | null
  | undefined

/**
 * Extract a Sanity image reference string from various block/value shapes.
 * Handles: value.asset (string), value.asset._ref, value.asset._id, value._ref.
 */
function getImageRef(source: SanityImageSource): string | null {
  if (!source) return null
  const asset = (source as { asset?: string | { _ref?: string; _id?: string }; _ref?: string }).asset
  const topRef = (source as { _ref?: string })._ref
  if (typeof asset === 'string') return asset
  if (asset && typeof asset === 'object') {
    const ref = asset._ref ?? asset._id ?? null
    if (ref) return ref
  }
  if (topRef) return topRef
  return null
}

/**
 * Generate a URL for a Sanity image
 */
export function urlForImage(source: BlogPostImage | null | undefined): string | null {
  const imageRef = getImageRef(source as SanityImageSource)
  if (!imageRef) return null

  try {
    const imageBuilder = builder.image(imageRef)
    return imageBuilder
      .width(1200)
      .height(630)
      .fit('max')
      .auto('format')
      .url()
  } catch (error) {
    console.error('Error generating image URL:', error)
    return null
  }
}

/**
 * Generate a URL for a Sanity image with custom dimensions.
 * Accepts BlogPostImage or Portable Text image value (asset._ref, asset as object, or top-level _ref).
 */
export function urlForImageWithSize(
  source: SanityImageSource,
  width: number,
  height?: number
): string | null {
  const imageRef = getImageRef(source)
  if (!imageRef) return null

  try {
    let imageBuilder = builder.image(imageRef).width(width)
    if (height) {
      imageBuilder = imageBuilder.height(height)
    }
    return imageBuilder.fit('max').auto('format').url()
  } catch (error) {
    console.error('Error generating image URL:', error)
    return null
  }
}

