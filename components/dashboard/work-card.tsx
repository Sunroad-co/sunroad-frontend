'use client'

import { useState, useEffect, useRef } from 'react'
import SRImage from '@/components/media/SRImage'
import ReactPlayer from 'react-player'
import { Work } from '@/hooks/use-user-profile'
import { getMediaUrl } from '@/lib/media'
import { Skeleton } from '@/components/ui/skeleton'
import EditButton from './edit-button'

// Type assertion for ReactPlayer to work around Next.js type issues
const TypedReactPlayer = ReactPlayer as React.ComponentType<any>

interface WorkCardProps {
  work: Work
  onEdit?: (work: Work) => void
  onDelete?: (work: Work) => void
  onOpen: (work: Work) => void
}

/**
 * Generate SoundCloud embed URL from a SoundCloud track URL
 */
function getSoundCloudEmbedUrl(url: string): string {
  try {
    const encodedUrl = encodeURIComponent(url.trim())
    return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`
  } catch {
    return ''
  }
}

/**
 * Generate Spotify embed URL from a Spotify track/album/playlist URL
 */
function getSpotifyEmbedUrl(url: string): string {
  try {
    // Extract Spotify ID from URL
    // Supports: https://open.spotify.com/track/..., album/..., playlist/...
    const urlObj = new URL(url.trim())
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    
    if (pathParts.length >= 2) {
      const type = pathParts[0] // track, album, playlist, etc.
      const id = pathParts[1].split('?')[0] // Remove query params
      return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`
    }
    
    return ''
  } catch {
    return ''
  }
}

/**
 * Check if work is an audio embed (Spotify or SoundCloud)
 */
export function isAudioEmbed(work: Work): boolean {
  return work.media_type === 'audio' && 
         (work.media_source === 'spotify' || work.media_source === 'soundcloud')
}

/**
 * MediaPreview component handles rendering different media types
 * @param variant - 'card' for grid cards, 'modal' for detail modal
 */
export function MediaPreview({ work, variant = 'card' }: { work: Work; variant?: 'card' | 'modal' }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const readyRef = useRef(false)
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const iframeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const imageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [iframeError, setIframeError] = useState(false)

  // Reset state when work changes
  useEffect(() => {
    setIsLoading(true)
    setHasError(false)
    readyRef.current = false
    setIframeLoaded(false)
    setIframeError(false)
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current)
      readyTimeoutRef.current = null
    }
    if (iframeTimeoutRef.current) {
      clearTimeout(iframeTimeoutRef.current)
      iframeTimeoutRef.current = null
    }
    if (imageTimeoutRef.current) {
      clearTimeout(imageTimeoutRef.current)
      imageTimeoutRef.current = null
    }
  }, [work.id, work.src_url, work.thumb_url])

  // Set up timeout fallback for video and audio (ReactPlayer)
  // Timeout only hides skeleton - doesn't show error (error only on onError callback)
  useEffect(() => {
    if (
      (work.media_type === 'video' || (work.media_type === 'audio' && work.media_source !== 'soundcloud' && work.media_source !== 'spotify')) &&
      work.src_url &&
      !readyRef.current &&
      !hasError &&
      isLoading
    ) {
      readyTimeoutRef.current = setTimeout(() => {
        if (!readyRef.current) {
          // Just hide skeleton, don't show error - player might still be loading
          // Only onError callback should set error state
          console.warn('[MediaPreview] Timeout waiting for ReactPlayer onReady, hiding skeleton. URL:', work.src_url)
          setIsLoading(false)
          // Don't set hasError - let the player continue loading
        }
        readyTimeoutRef.current = null
      }, 2500) // 15 second timeout
    }

    return () => {
      if (readyTimeoutRef.current) {
        clearTimeout(readyTimeoutRef.current)
      }
    }
  }, [work.media_type, work.media_source, work.src_url, hasError, isLoading])

  // Set up timeout for SoundCloud and Spotify iframes
  useEffect(() => {
    if (
      work.media_type === 'audio' &&
      (work.media_source === 'soundcloud' || work.media_source === 'spotify') &&
      work.src_url &&
      !iframeLoaded &&
      !iframeError
    ) {
      iframeTimeoutRef.current = setTimeout(() => {
        if (!iframeLoaded) {
          setIframeError(true)
          setHasError(true)
        }
        iframeTimeoutRef.current = null
      }, 1500)
    }

    return () => {
      if (iframeTimeoutRef.current) {
        clearTimeout(iframeTimeoutRef.current)
      }
    }
  }, [work.media_type, work.media_source, work.src_url, iframeLoaded, iframeError])

  const isModal = variant === 'modal'
  const isEmbedAudio =
    work.media_type === 'audio' &&
    (work.media_source === 'spotify' || work.media_source === 'soundcloud')

  const usesCardAspect =
    !isModal &&
    !isEmbedAudio &&
    (work.media_type === 'image' ||
      work.media_type === 'video' ||
      work.media_type === 'audio')

  const aspectClass = isModal
    ? '' // No forced aspect for modal - let images display naturally
    : usesCardAspect
      ? 'aspect-[5/4]'
      : ''
  const roundedClass = isModal ? 'rounded-xl' : 'rounded-2xl'

  // Check if image is already cached when work changes (for image media type)
  useEffect(() => {
    if (work.media_type === 'image' && work.thumb_url) {
      const imageSrc = getMediaUrl(work.thumb_url)
      if (!imageSrc) return

      // Set up timeout fallback to hide skeleton after reasonable time
      // This handles cases where onLoad doesn't fire (cached images, etc.)
      imageTimeoutRef.current = setTimeout(() => {
        setIsLoading(false)
        imageTimeoutRef.current = null
      }, 2000) // 2 second timeout fallback
      
      // Check if image is already cached using a small delay
      // This gives the browser time to check cache
      const checkCacheTimeout = setTimeout(() => {
        const img = new window.Image()
        img.src = imageSrc
        
        // If image is already complete (cached), hide skeleton immediately
        if (img.complete) {
          if (imageTimeoutRef.current) {
            clearTimeout(imageTimeoutRef.current)
            imageTimeoutRef.current = null
          }
          setIsLoading(false)
        }
      }, 50) // Small delay to allow cache check
      
      // Clean up
      return () => {
        clearTimeout(checkCacheTimeout)
        if (imageTimeoutRef.current) {
          clearTimeout(imageTimeoutRef.current)
          imageTimeoutRef.current = null
        }
      }
    }
  }, [work.id, work.thumb_url, work.media_type])

  // Image media
  if (work.media_type === 'image') {
    const imageSrc = getMediaUrl(work.thumb_url)
    
    if (!imageSrc) {
      return (
        <div className={`w-full ${aspectClass} bg-gray-100 ${roundedClass} flex items-center justify-center`}>
          <div className="text-center p-4">
            <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-gray-500 font-body">Image not available</p>
          </div>
        </div>
      )
    }

    const handleImageLoad = () => {
      if (imageTimeoutRef.current) {
        clearTimeout(imageTimeoutRef.current)
        imageTimeoutRef.current = null
      }
      setIsLoading(false)
    }

    const handleImageError = () => {
      if (imageTimeoutRef.current) {
        clearTimeout(imageTimeoutRef.current)
        imageTimeoutRef.current = null
      }
      setIsLoading(false)
      setHasError(true)
    }

    return (
      <div className={`relative w-full ${aspectClass} ${isModal ? 'bg-white' : 'bg-gray-100'} ${roundedClass} ${isModal ? '' : 'overflow-hidden'}`}>
        {isModal ? (
          // Modal: Photograph-like effect with off-white border and shadow
          <div className="relative w-full flex items-center justify-center p-3 sm:p-4 md:p-12 min-h-[300px] sm:min-h-[400px] max-h-[60vh] sm:max-h-[75vh]">
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="relative inline-block" style={{
                borderLeft: '8px solid #faf9f6',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: '#fff'
              }}>
                <SRImage
                  src={work.thumb_url}
                  alt={work.title}
                  width={1600}
                  height={1600}
                  className="object-contain max-w-full max-h-full block"
                  style={{ width: 'auto', height: 'auto', display: 'block' }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  mode="raw"
                  sizes="(max-width: 768px) 100vw, 66vw"
                />
              </div>
            </div>
            {isLoading && (
              <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                <div className="w-64 h-64 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            )}
            {hasError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="text-center p-6">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-400 font-body">Could not load image</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Card: Original behavior with aspect ratio
          <>
            <div className="relative w-full h-full">
              <SRImage
                src={work.thumb_url}
                alt={work.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
                className="object-cover transition-transform duration-300 group-hover/work:scale-105"
                onLoad={handleImageLoad}
                onError={handleImageError}
                mode="raw"
              />
            </div>
            {isLoading && (
              <div className="absolute inset-0 z-10 pointer-events-none">
                <Skeleton className={`w-full h-full ${roundedClass}`} />
              </div>
            )}
            {hasError && (
              <div className={`absolute inset-0 z-10 flex items-center justify-center bg-gray-50 pointer-events-none`}>
                <p className="text-xs text-gray-500 text-center px-4 font-body">Could not load this media. Please check the original URL.</p>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // Video media
  if (work.media_type === 'video') {
    if (!work.src_url) {
      return (
        <div className={`w-full ${aspectClass} bg-gray-100 ${roundedClass} flex items-center justify-center`}>
          <div className="text-center p-4">
            <p className="text-xs text-gray-500 font-body">Video URL not available</p>
          </div>
        </div>
      )
    }

    return (
      <div className={`relative w-full ${aspectClass} ${isModal ? 'bg-white' : 'bg-gray-100'} ${roundedClass} ${isModal ? '' : 'overflow-hidden'}`}>
        {isModal ? (
          // Modal: Clean centered video player
          <div className="relative w-full flex items-center justify-center p-3 sm:p-4 md:p-12 min-h-[300px] sm:min-h-[400px] max-h-[60vh] sm:max-h-[75vh]">
            <div className="relative w-full max-w-4xl" style={{ aspectRatio: '16/9' }}>
              {isLoading && !hasError && (
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                  <div className="w-full h-full bg-gray-100 rounded-xl animate-pulse" />
                </div>
              )}
              {hasError ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 rounded-xl pointer-events-none">
                  <p className="text-sm text-gray-500 text-center px-4 font-body">
                    Could not load this media. Please check the original URL.
                  </p>
                </div>
              ) : (
                <TypedReactPlayer
                  key={work.src_url}
                  src={work.src_url}
                  width="100%"
                  height="100%"
                  controls={true}
                  playing={false}
                  config={{
                    youtube: {
                      playerVars: {
                        autoplay: 0,
                        controls: 1,
                        rel: 0,
                        modestbranding: 1,
                        enablejsapi: 1,
                      },
                    },
                    vimeo: {
                      playerOptions: {
                        autoplay: false,
                        controls: true,
                      },
                    },
                  } as any}
                  onReady={() => {
                    if (readyTimeoutRef.current) {
                      clearTimeout(readyTimeoutRef.current)
                      readyTimeoutRef.current = null
                    }
                    readyRef.current = true
                    setIsLoading(false)
                    setHasError(false)
                  }}
                  onError={(error: unknown) => {
                    console.error('[ReactPlayer] Video error:', error, 'URL:', work.src_url)
                    if (readyTimeoutRef.current) {
                      clearTimeout(readyTimeoutRef.current)
                      readyTimeoutRef.current = null
                    }
                    setIsLoading(false)
                    setHasError(true)
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          // Card: Original behavior
          <>
            {isLoading && !hasError && (
              <div className="absolute inset-0 z-10 pointer-events-none">
                <Skeleton className={`w-full h-full ${roundedClass}`} />
              </div>
            )}
            {hasError ? (
              <div className={`absolute inset-0 z-10 flex items-center justify-center bg-gray-50 pointer-events-none`}>
                <p className="text-xs text-gray-500 text-center px-4 font-body">
                  Could not load this media. Please check the original URL.
                </p>
              </div>
            ) : (
              <>
                <TypedReactPlayer
                  key={work.src_url}
                  src={work.src_url}
                  width="100%"
                  height="100%"
                  controls={false}
                  playing={false}
                  config={{
                    youtube: {
                      playerVars: {
                        autoplay: 0,
                        controls: 0,
                        rel: 0,
                        modestbranding: 1,
                        enablejsapi: 1,
                      },
                    },
                    vimeo: {
                      playerOptions: {
                        autoplay: false,
                        controls: false,
                      },
                    },
                  } as any}
                  onReady={() => {
                    if (readyTimeoutRef.current) {
                      clearTimeout(readyTimeoutRef.current)
                      readyTimeoutRef.current = null
                    }
                    readyRef.current = true
                    setIsLoading(false)
                    setHasError(false)
                  }}
                  onError={(error: unknown) => {
                    console.error('[ReactPlayer] Video error:', error, 'URL:', work.src_url)
                    if (readyTimeoutRef.current) {
                      clearTimeout(readyTimeoutRef.current)
                      readyTimeoutRef.current = null
                    }
                    setIsLoading(false)
                    setHasError(true)
                  }}
                />
                {/* Click overlay for cards - prevents interaction with player */}
                <div className="absolute inset-0 z-20 cursor-pointer" aria-hidden="true" />
              </>
            )}
          </>
        )}
      </div>
    )
  }

  // Audio media
  if (work.media_type === 'audio') {
    if (!work.src_url) {
      return (
        <div className={`w-full ${aspectClass} bg-gray-100 ${roundedClass} flex items-center justify-center`}>
          <div className="text-center p-4">
            <p className="text-xs text-gray-500 font-body">Audio URL not available</p>
          </div>
        </div>
      )
    }

    // Spotify - use iframe embed (like SoundCloud)
    if (work.media_source === 'spotify') {
      const spotifyContent = (
        <>
          {!iframeLoaded && !iframeError && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              <Skeleton className="w-full h-[152px]" />
            </div>
          )}
          {iframeError || hasError ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 pointer-events-none">
              <p className="text-xs text-gray-500 text-center px-4 font-body">
                Could not load this media. Please check the original URL.
              </p>
            </div>
          ) : (
            <iframe
              width="100%"
              height="152"
              className="w-full h-[152px]"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              src={getSpotifyEmbedUrl(work.src_url)}
              onLoad={() => {
                if (iframeTimeoutRef.current) {
                  clearTimeout(iframeTimeoutRef.current)
                  iframeTimeoutRef.current = null
                }
                setIframeLoaded(true)
                setIframeError(false)
                setIsLoading(false)
              }}
              onError={() => {
                console.error('[Spotify] Iframe error for URL:', work.src_url)
                setIframeError(true)
                setHasError(true)
                setIsLoading(false)
              }}
              style={{ pointerEvents: isModal ? 'auto' : 'none' }}
            />
          )}
        </>
      )

      // For card variant, return without wrapper (will be handled by WorkCard)
      // For modal variant, wrap it with clean styling
      if (isModal) {
        return (
          <div className="relative w-full flex items-center justify-center p-3 sm:p-4 md:p-12 min-h-[150px] sm:min-h-[200px]">
            <div className="w-full max-w-2xl">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {spotifyContent}
              </div>
            </div>
          </div>
        )
      }
      
      // For card variant, return standalone (no wrapper)
      return (
        <div className="relative w-full">
          {spotifyContent}
        </div>
      )
    }

    // Other audio sources (not Spotify or SoundCloud) - use ReactPlayer as fallback
    // We've already handled spotify and soundcloud above, so this is for other audio sources
    if (work.media_source !== 'soundcloud') {
      return (
        <div className={`relative w-full ${aspectClass} ${isModal ? 'bg-white' : 'bg-gray-100'} ${roundedClass} ${isModal ? '' : 'overflow-hidden'}`}>
          {isModal ? (
          // Modal: Clean centered audio player
          <div className="relative w-full flex items-center justify-center p-3 sm:p-4 md:p-12 min-h-[150px] sm:min-h-[200px]">
              <div className="relative w-full max-w-2xl">
                {isLoading && !hasError && (
                  <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                    <div className="w-full h-32 bg-gray-100 rounded-xl animate-pulse" />
                  </div>
                )}
                {hasError ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 rounded-xl pointer-events-none">
                    <p className="text-sm text-gray-500 text-center px-4 font-body">
                      Could not load this media. Please check the original URL.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <TypedReactPlayer
                      key={work.src_url}
                      src={work.src_url}
                      width="100%"
                      height="100%"
                      controls={true}
                      playing={false}
                      onReady={() => {
                        if (readyTimeoutRef.current) {
                          clearTimeout(readyTimeoutRef.current)
                          readyTimeoutRef.current = null
                        }
                        readyRef.current = true
                        setIsLoading(false)
                        setHasError(false)
                      }}
                      onError={(error: unknown) => {
                        console.error('[ReactPlayer] Audio error:', error, 'URL:', work.src_url)
                        if (readyTimeoutRef.current) {
                          clearTimeout(readyTimeoutRef.current)
                          readyTimeoutRef.current = null
                        }
                        setIsLoading(false)
                        setHasError(true)
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Card: Original behavior
            <>
              {isLoading && !hasError && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  <Skeleton className={`w-full h-full ${roundedClass}`} />
                </div>
              )}
              {hasError ? (
                <div className={`absolute inset-0 z-10 flex items-center justify-center bg-gray-50 pointer-events-none`}>
                  <p className="text-xs text-gray-500 text-center px-4 font-body">
                    Could not load this media. Please check the original URL.
                  </p>
                </div>
              ) : (
                <>
                  <TypedReactPlayer
                    key={work.src_url}
                    src={work.src_url}
                    width="100%"
                    height="100%"
                    controls={false}
                    playing={false}
                    onReady={() => {
                      if (readyTimeoutRef.current) {
                        clearTimeout(readyTimeoutRef.current)
                        readyTimeoutRef.current = null
                      }
                      readyRef.current = true
                      setIsLoading(false)
                      setHasError(false)
                    }}
                    onError={(error: unknown) => {
                      console.error('[ReactPlayer] Audio error:', error, 'URL:', work.src_url)
                      if (readyTimeoutRef.current) {
                        clearTimeout(readyTimeoutRef.current)
                        readyTimeoutRef.current = null
                      }
                      setIsLoading(false)
                      setHasError(true)
                    }}
                  />
                  {/* Click overlay for cards - prevents interaction with player */}
                  <div className="absolute inset-0 z-20 cursor-pointer" aria-hidden="true" />
                </>
              )}
            </>
          )}
        </div>
      )
    }

    // SoundCloud - use iframe embed
    if (work.media_source === 'soundcloud') {
      const soundcloudContent = (
        <>
          {!iframeLoaded && !iframeError && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              <Skeleton className="w-full h-[166px]" />
            </div>
          )}
          {iframeError || hasError ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 pointer-events-none">
              <p className="text-xs text-gray-500 text-center px-4 font-body">
                Could not load this media. Please check the original URL.
              </p>
            </div>
          ) : (
            <iframe
              width="100%"
              height="166"
              className="w-full h-[166px]"
              scrolling="no"
              frameBorder="no"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              src={getSoundCloudEmbedUrl(work.src_url)}
              onLoad={() => {
                if (iframeTimeoutRef.current) {
                  clearTimeout(iframeTimeoutRef.current)
                  iframeTimeoutRef.current = null
                }
                setIframeLoaded(true)
                setIframeError(false)
                setIsLoading(false)
              }}
              onError={() => {
                console.error('[SoundCloud] Iframe error for URL:', work.src_url)
                setIframeError(true)
                setHasError(true)
                setIsLoading(false)
              }}
              style={{ pointerEvents: isModal ? 'auto' : 'none' }}
            />
          )}
        </>
      )

      // For card variant, return without wrapper (will be handled by WorkCard)
      // For modal variant, wrap it with clean styling
      if (isModal) {
        return (
          <div className="relative w-full flex items-center justify-center p-3 sm:p-4 md:p-12 min-h-[150px] sm:min-h-[200px]">
            <div className="w-full max-w-2xl">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {soundcloudContent}
              </div>
            </div>
          </div>
        )
      }
      
      // For card variant, return standalone (no wrapper)
      return (
        <div className="relative w-full">
          {soundcloudContent}
        </div>
      )
    }
  }

  // Fallback for unknown media types
  return (
    <div className={`w-full ${aspectClass} bg-gray-100 ${roundedClass} flex items-center justify-center`}>
      <div className="text-center p-4">
        <p className="text-xs text-gray-500 font-body">Unsupported media type</p>
      </div>
    </div>
  )
}

/**
 * WorkCard component displays a single work with media preview, title overlay (images only), and edit/delete buttons
 */
export default function WorkCard({ work, onEdit, onDelete, onOpen }: WorkCardProps) {
  const handleCardClick = () => {
    onOpen(work)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onEdit) return
    onEdit(work)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDelete) return
    onDelete(work)
  }

  const isEmbedAudio = isAudioEmbed(work)

  // For audio embeds, render without card wrapper
  if (isEmbedAudio) {
    return (
      <div 
        className="relative w-full group/work cursor-pointer"
        onClick={handleCardClick}
      >
        <MediaPreview work={work} variant="card" />
        {/* Click overlay for audio embeds - makes whole area clickable */}
        <div className="absolute inset-0 z-10 cursor-pointer" aria-hidden="true" />
        {/* Action Buttons for audio embeds */}
        {(onEdit || onDelete) && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-100 md:opacity-0 md:group-hover/work:opacity-100 transition-opacity duration-200 z-20">
            {onDelete && (
              <div onClick={handleDeleteClick}>
                <EditButton
                  onClick={() => onDelete(work)}
                  label="Delete Work"
                  size="sm"
                  variant="white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </EditButton>
              </div>
            )}
            {onEdit && (
              <div onClick={handleEditClick}>
                <EditButton
                  onClick={() => onEdit(work)}
                  label="Edit Work"
                  size="sm"
                  variant="white"
                />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // For other media types, use card wrapper
  return (
    <div 
      className="relative group/work rounded-2xl overflow-hidden bg-black/100 border border-gray-200/70 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Media Preview */}
      <div className="relative flex items-center justify-center flex-col w-full h-full">
        <MediaPreview work={work} variant="card" />
        
        {/* Title Overlay - Only for images */}
        {work.media_type === 'image' && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pointer-events-none z-10 transition-all duration-300 group-hover/work:from-black/80 group-hover/work:via-black/50">
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-3 transition-transform duration-300 group-hover/work:translate-y-[-4px]">
              <h3 className="font-display text-sm font-semibold tracking-tight text-white line-clamp-1 mb-1">
                {work.title}
              </h3>
              {work.description && (
                <p className="font-body text-xs text-white/90 line-clamp-2 opacity-0 group-hover/work:opacity-100 transition-opacity duration-300 delay-75">
                  {work.description}
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Action Buttons - visible on mobile by default, on hover on desktop */}
        {(onEdit || onDelete) && (
          <div className="absolute top-2 right-2 flex gap-2 opacity-100 md:opacity-0 md:group-hover/work:opacity-100 transition-opacity duration-200 z-20">
            {onDelete && (
              <div onClick={handleDeleteClick}>
                <EditButton
                  onClick={() => onDelete(work)}
                  label="Delete Work"
                  size="sm"
                  variant="white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </EditButton>
              </div>
            )}
            {onEdit && (
              <div onClick={handleEditClick}>
                <EditButton
                  onClick={() => onEdit(work)}
                  label="Edit Work"
                  size="sm"
                  variant="white"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
