'use client'

import Image, { ImageProps } from 'next/image'
import { getMediaUrl } from '@/lib/media'

interface SRImageProps extends Omit<ImageProps, 'src'> {
  src: string | null | undefined
  mode?: 'raw' | 'optimized'
  alt: string
}

/**
 * SRImage - Sun Road Image component
 * 
 * Wrapper around Next.js Image that defaults to unoptimized mode for user-uploaded
 * Supabase Storage images to reduce Vercel Image Optimization quota usage.
 * 
 * - mode="raw" (default): Uses unoptimized Image, serves directly from Supabase CDN
 * - mode="optimized": Uses normal Next.js Image optimization (for banners and fullscreen modals)
 * 
 * Always requires explicit sizes prop - does NOT default to "100vw" to prevent oversized srcsets.
 */
export default function SRImage({
  src,
  alt,
  mode = 'raw',
  sizes,
  ...props
}: SRImageProps) {
  const imageSrc = getMediaUrl(src)

  if (!imageSrc) {
    // Return placeholder div matching the expected dimensions
    if (props.fill) {
      return <div className={props.className} aria-label={alt} />
    }
    return (
      <div
        className={props.className}
        style={{
          width: props.width,
          height: props.height,
        }}
        aria-label={alt}
      />
    )
  }

  // Raw mode: unoptimized, serves directly from Supabase CDN
  if (mode === 'raw') {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        unoptimized
        sizes={sizes}
        {...props}
      />
    )
  }

  // Optimized mode: normal Next.js Image optimization
  // Requires explicit sizes - do not default to 100vw
  return (
    <Image
      src={imageSrc}
      alt={alt}
      sizes={sizes}
      {...props}
    />
  )
}

