import { sanityClient } from './client'
import { BlogPostImage } from './queries'
import { createImageUrlBuilder } from '@sanity/image-url'

const builder = createImageUrlBuilder(sanityClient)

/**
 * Generate a URL for a Sanity image
 */
export function urlForImage(source: BlogPostImage | null | undefined): string | null {
  if (!source?.asset) {
    return null
  }

  // Handle both direct _ref and nested asset structure
  const imageRef = typeof source.asset === 'string' 
    ? source.asset 
    : source.asset._ref

  if (!imageRef) {
    return null
  }

  try {
    const imageBuilder = builder.image(imageRef)
    
    // Apply default transformations for blog images
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
 * Generate a URL for a Sanity image with custom dimensions
 */
export function urlForImageWithSize(
  source: BlogPostImage | null | undefined,
  width: number,
  height?: number
): string | null {
  if (!source?.asset) {
    return null
  }

  // Handle both direct _ref and nested asset structure
  const imageRef = typeof source.asset === 'string' 
    ? source.asset 
    : source.asset._ref

  if (!imageRef) {
    return null
  }

  try {
    let imageBuilder = builder.image(imageRef).width(width)
    
    if (height) {
      imageBuilder = imageBuilder.height(height)
    }
    
    return imageBuilder
      .fit('max')
      .auto('format')
      .url()
  } catch (error) {
    console.error('Error generating image URL:', error)
    return null
  }
}

