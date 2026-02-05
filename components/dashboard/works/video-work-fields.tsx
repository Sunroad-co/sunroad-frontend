'use client'

import React, { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import LazyReactPlayer from '@/components/media/LazyReactPlayer'
import { validateVideoUrl } from '@/lib/utils/video-validation'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/ui/error-boundary'

// Type assertion for LazyReactPlayer to work around Next.js type issues
const TypedReactPlayer = LazyReactPlayer as React.ComponentType<any>

export interface VideoWorkFieldsProps {
  saving: boolean
  onChangeValidity: (isValid: boolean) => void
  onClear: () => void
  initialUrl?: string
  initialMediaSource?: 'youtube' | 'vimeo' | 'mux' | 'other_url'
}

export interface VideoWorkFieldsHandle {
  getVideoData: () => { url: string; mediaSource: 'youtube' | 'vimeo' | 'mux' | 'other_url' } | null
  getCurrentUrl: () => string
  clear: () => void
}

export const VideoWorkFields = forwardRef<VideoWorkFieldsHandle, VideoWorkFieldsProps>(
  ({ saving, onChangeValidity, onClear, initialUrl, initialMediaSource }, ref) => {
    const [videoUrl, setVideoUrl] = useState(initialUrl || '')
    const [videoValid, setVideoValid] = useState(false)
    const [videoReady, setVideoReady] = useState(false)
    const [videoError, setVideoError] = useState<string | null>(null) // validation errors
    const [previewError, setPreviewError] = useState<string | null>(null) // player errors
    const [videoMediaSource, setVideoMediaSource] = useState<'youtube' | 'vimeo' | 'mux' | 'other_url'>(
      initialMediaSource || 'youtube'
    )
    const [showVideoHelp, setShowVideoHelp] = useState(false)
    const skeletonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const videoStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [videoStarted, setVideoStarted] = useState(false)

    // Global error handler for uncaught errors (scoped to this component)
    useEffect(() => {
      if (!videoUrl || !videoValid) return

      const handleError = (event: ErrorEvent) => {
        // Check if error is related to video player and our current URL
        const errorMessage = event.message || ''
        const errorStack = event.error?.stack || ''
        const isVideoError = (
          errorMessage.includes('video') || 
          errorMessage.includes('Video') ||
          errorMessage.includes('does not exist') ||
          errorMessage.includes('NotFoundError') ||
          errorStack.includes('player') ||
          errorStack.includes('react-player')
        )
        
        if (isVideoError) {
          console.warn('[VideoWorkFields] Preview error detected (non-blocking):', event.error, event.message)
          // Only set preview error - don't invalidate URL as it may still be valid
          // Validity is based on URL pattern validation, not preview loading
          if (videoUrl && videoValid && !previewError) {
            setPreviewError('Preview unavailable (URL may still be valid). You can still save if the URL is correct.')
            // Don't set videoValid to false - keep validity based on URL pattern
            setVideoReady(false)
            setVideoStarted(false)
          }
        }
      }

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        // Check if rejection is related to video player
        const reason = event.reason
        const errorMessage = reason?.message || ''
        const errorName = reason?.name || ''
        const isVideoError = (
          errorMessage.includes('video') ||
          errorMessage.includes('Video') ||
          errorMessage.includes('does not exist') ||
          errorName === 'NotFoundError'
        )
        
        if (isVideoError) {
          console.warn('[VideoWorkFields] Preview error detected (non-blocking):', reason)
          // Only set preview error - don't invalidate URL as it may still be valid
          // Validity is based on URL pattern validation, not preview loading
          if (videoUrl && videoValid && !previewError) {
            setPreviewError('Preview unavailable (URL may still be valid). You can still save if the URL is correct.')
            // Don't set videoValid to false - keep validity based on URL pattern
            setVideoReady(false)
            setVideoStarted(false)
          }
        }
      }

      window.addEventListener('error', handleError)
      window.addEventListener('unhandledrejection', handleUnhandledRejection)

      return () => {
        window.removeEventListener('error', handleError)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }
    }, [videoUrl, videoValid, previewError, onChangeValidity])

    const getVideoData = useCallback(() => {
      if (!videoValid || !videoUrl.trim()) {
        return null
      }
      return { url: videoUrl.trim(), mediaSource: videoMediaSource }
    }, [videoValid, videoUrl, videoMediaSource])

    const getCurrentUrl = useCallback(() => {
      return videoUrl.trim()
    }, [videoUrl])

    const clear = useCallback(() => {
      setVideoUrl('')
      setVideoValid(false)
      setVideoReady(false)
      setVideoStarted(false)
      setVideoError(null)
      setPreviewError(null)
      setShowVideoHelp(false)
      if (skeletonTimeoutRef.current) {
        clearTimeout(skeletonTimeoutRef.current)
        skeletonTimeoutRef.current = null
      }
      if (videoStartTimeoutRef.current) {
        clearTimeout(videoStartTimeoutRef.current)
        videoStartTimeoutRef.current = null
      }
      onChangeValidity(false)
      onClear()
    }, [onChangeValidity, onClear])

    useImperativeHandle(ref, () => ({
      getVideoData,
      getCurrentUrl,
      clear
    }))

    // Initialize validation on mount if initialUrl is provided
    useEffect(() => {
      if (initialUrl) {
        setVideoUrl(initialUrl)
        const validation = validateVideoUrl(initialUrl)
        if (validation.isValid && validation.mediaSource) {
          setVideoValid(true)
          setVideoMediaSource(validation.mediaSource as 'youtube' | 'vimeo' | 'mux' | 'other_url')
          // Set validity immediately based on URL pattern - preview loading is optional
          onChangeValidity(true)
        } else {
          setVideoValid(false)
          onChangeValidity(false)
        }
      } else {
        setVideoUrl('')
        setVideoValid(false)
        onChangeValidity(false)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialUrl]) // Run when initialUrl changes

    const handleVideoUrlChange = (url: string) => {
      setVideoUrl(url)
      setVideoError(null)
      setPreviewError(null)
      setVideoValid(false)
      setVideoReady(false)
      setVideoStarted(false)

      if (!url || url.trim() === '') {
        onChangeValidity(false)
        return
      }

      // Use our validation function - it's more reliable than ReactPlayer.canPlay()
      const validation = validateVideoUrl(url)
      if (validation.isValid && validation.mediaSource) {
        setVideoValid(true)
        setVideoMediaSource(validation.mediaSource as 'youtube' | 'vimeo' | 'mux' | 'other_url')
        // Call onChangeValidity immediately after validation passes
        onChangeValidity(true)
      } else {
        setVideoValid(false)
        setVideoError(validation.error || 'Please enter a valid video URL.')
        onChangeValidity(false)
      }
    }

    // Check if URL is a direct video file (has extension)
    const isDirectVideoFile = useCallback((url: string) => {
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv']
      return videoExtensions.some(ext => url.toLowerCase().includes(ext))
    }, [])

    // Update parent validity when videoValid, videoReady, videoStarted, or errors change
    useEffect(() => {
      // Only invalidate if URL pattern validation failed (videoError)
      // Don't invalidate due to preview errors (previewError) as these can be caused by CORS/network issues
      if (videoError) {
        onChangeValidity(false)
        return
      }
      
      // For video, we primarily rely on URL pattern validation
      // If URL pattern is valid, allow saving - preview loading is optional
      // This ensures save button works even if preview has network/CORS issues
      onChangeValidity(videoValid && !!videoUrl.trim())
    }, [videoValid, videoError, videoUrl, onChangeValidity])

    useEffect(() => {
      setVideoReady(false)
      setVideoStarted(false)
      // Clear any existing timeouts
      if (skeletonTimeoutRef.current) {
        clearTimeout(skeletonTimeoutRef.current)
        skeletonTimeoutRef.current = null
      }
      if (videoStartTimeoutRef.current) {
        clearTimeout(videoStartTimeoutRef.current)
        videoStartTimeoutRef.current = null
      }
    }, [videoUrl])

    // Set up timeout fallback for skeleton - hide after 3 seconds if videoReady never fires
    useEffect(() => {
      if (videoValid && videoUrl && !videoReady && !videoError && !previewError) {
        skeletonTimeoutRef.current = setTimeout(() => {
          // If video still not ready after 3 seconds, hide skeleton anyway
          // This handles cases where onReady doesn't fire but video is actually playing
          setVideoReady(true)
          if (videoValid && !videoError && !previewError) {
            onChangeValidity(true)
          }
        }, 3000)
      }

      return () => {
        if (skeletonTimeoutRef.current) {
          clearTimeout(skeletonTimeoutRef.current)
          skeletonTimeoutRef.current = null
        }
        if (videoStartTimeoutRef.current) {
          clearTimeout(videoStartTimeoutRef.current)
          videoStartTimeoutRef.current = null
        }
      }
    }, [videoValid, videoUrl, videoReady, videoError, previewError, onChangeValidity])

    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="video-url" className="block text-sm font-medium text-gray-700">
              Video URL *
            </label>
            <div className="relative">
              <button
                type="button"
                aria-label="Supported video URLs"
                aria-describedby="video-url-help"
                onMouseEnter={() => setShowVideoHelp(true)}
                onMouseLeave={() => setShowVideoHelp(false)}
                onFocus={() => setShowVideoHelp(true)}
                onBlur={() => setShowVideoHelp(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 rounded-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {showVideoHelp && (
                <div
                  id="video-url-help"
                  role="tooltip"
                  className="absolute left-0 bottom-full mb-2 w-80 bg-gray-800 text-white text-xs rounded px-3 py-2 shadow-lg z-20"
                >
                  <p className="font-medium mb-1">Supported platforms:</p>
                  <p className="text-gray-300 mb-1 text-[10px]">YouTube, Vimeo, Mux, Facebook, Twitch, Streamable, Wistia, DailyMotion, Vidyard, Kaltura, and direct video file URLs (mp4, webm, etc.)</p>
                  <p className="text-gray-300 mb-1 mt-2">Examples:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-0.5 text-[10px]">
                    <li>https://www.youtube.com/watch?v=...</li>
                    <li>https://vimeo.com/…</li>
                    <li>https://stream.mux.com/…</li>
                    <li>https://www.twitch.tv/…</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          <input
            id="video-url"
            type="url"
            value={videoUrl}
            onChange={(e) => handleVideoUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 focus:border-transparent"
            disabled={saving}
          />
          {videoError && (
            <p className="text-xs text-red-600 mt-1">{videoError}</p>
          )}
          {previewError && (
            <p className="text-xs text-red-600 mt-1">{previewError}</p>
          )}
          {videoValid && !videoError && !previewError && videoReady && videoMediaSource !== 'other_url' && (
            <p className="text-xs text-green-600 mt-1">Valid {videoMediaSource} URL</p>
          )}
        </div>

        {videoValid && videoUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden isolate">
              {!videoReady && !videoError && !previewError && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>
              )}
              <ErrorBoundary
                onError={(error) => {
                  console.error('[VideoWorkFields] ErrorBoundary caught error:', error)
                  if (error.message.includes('does not exist') || error.name === 'NotFoundError') {
                    setPreviewError('This video does not exist. Please check the URL and try again.')
                  } else {
                    setPreviewError('An error occurred while loading the video. Please try again.')
                  }
                  setVideoValid(false)
                  setVideoReady(false)
                  setVideoStarted(false)
                  onChangeValidity(false)
                }}
              >
                <TypedReactPlayer
                key={videoUrl.trim()}
                src={videoUrl.trim()}
                width="100%"
                height="100%"
                controls
                playing={false}
                onReady={() => {
                  try {
                  console.log('[VideoWorkFields] onReady fired for URL:', videoUrl.trim(), 'Source:', videoMediaSource)
                  // Clear skeleton timeout if video loads before timeout
                  if (skeletonTimeoutRef.current) {
                    clearTimeout(skeletonTimeoutRef.current)
                    skeletonTimeoutRef.current = null
                  }
                  setVideoReady(true)
                  setPreviewError(null)
                  
                  // For Vimeo, we use onProgress to detect when metadata loads (more reliable than onStart)
                  // For Twitch (non-direct-file other_url), we still need onStart
                  // If video doesn't load within 5 seconds, it likely doesn't exist
                  const needsStartCheck = videoMediaSource === 'other_url' && !isDirectVideoFile(videoUrl)
                  
                  if (needsStartCheck && !videoStarted) {
                    console.log('[VideoWorkFields] Setting up video start timeout for', videoMediaSource, 'URL:', videoUrl.trim())
                    videoStartTimeoutRef.current = setTimeout(() => {
                      if (!videoStarted) {
                        console.warn('[VideoWorkFields] Video did not start within 5 seconds, marking as invalid. URL:', videoUrl.trim(), 'Source:', videoMediaSource)
                        setPreviewError('This video does not exist or cannot be played. Please check the URL and try again.')
                        setVideoValid(false)
                        setVideoReady(false)
                        onChangeValidity(false)
                      }
                    }, 5000)
                  } else if (videoMediaSource === 'vimeo' && !videoStarted) {
                    // For Vimeo, set a longer timeout (6 seconds) to wait for onDuration/onProgress
                    // onDuration fires when metadata loads, which is the most reliable indicator
                    console.log('[VideoWorkFields] Setting up Vimeo metadata load timeout, URL:', videoUrl.trim())
                    videoStartTimeoutRef.current = setTimeout(() => {
                      if (!videoStarted) {
                        console.warn('[VideoWorkFields] Vimeo video metadata did not load within 6 seconds, marking as invalid. URL:', videoUrl.trim())
                        setPreviewError('This video does not exist or cannot be played. Please check the URL and try again.')
                        setVideoValid(false)
                        setVideoReady(false)
                        onChangeValidity(false)
                      }
                    }, 6000)
                  }
                  } catch (err) {
                    console.error('[VideoWorkFields] Error in onReady callback:', err)
                    setPreviewError('An error occurred while loading the video. Please try again.')
                    setVideoValid(false)
                    setVideoReady(false)
                    onChangeValidity(false)
                  }
                }}
                onStart={() => {
                  try {
                    console.log('[VideoWorkFields] onStart fired for URL:', videoUrl.trim())
                    // Clear video start timeout if video starts
                    if (videoStartTimeoutRef.current) {
                      clearTimeout(videoStartTimeoutRef.current)
                      videoStartTimeoutRef.current = null
                    }
                    setVideoStarted(true)
                    // Now that video has started, we can mark as valid
                    if (videoValid && !videoError && !previewError) {
                      onChangeValidity(true)
                    }
                  } catch (err) {
                    console.error('[VideoWorkFields] Error in onStart callback:', err)
                    // Don't break the flow, just log the error
                  }
                }}
                onProgress={(state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number; duration?: number }) => {
                  try {
                    // For Vimeo, onProgress fires when video metadata is loaded (even if not playing)
                    // This is more reliable than waiting for onStart (which requires user interaction)
                    // Check if we have duration (indicates valid video) or loadedSeconds > 0
                    if (videoMediaSource === 'vimeo' && !videoStarted) {
                      const hasValidMetadata = (state.duration && state.duration > 0) || state.loadedSeconds > 0
                      if (hasValidMetadata) {
                        console.log('[VideoWorkFields] onProgress fired for Vimeo, video metadata loaded:', {
                          duration: state.duration,
                          loadedSeconds: state.loadedSeconds
                        })
                        // Clear video start timeout if video metadata loaded
                        if (videoStartTimeoutRef.current) {
                          clearTimeout(videoStartTimeoutRef.current)
                          videoStartTimeoutRef.current = null
                        }
                        setVideoStarted(true)
                        // Now that video metadata is loaded, we can mark as valid
                        if (videoValid && !videoError && !previewError) {
                          onChangeValidity(true)
                        }
                      }
                    }
                  } catch (err) {
                    console.error('[VideoWorkFields] Error in onProgress callback:', err)
                    // Don't break the flow, just log the error
                  }
                }}
                onDuration={(duration: number) => {
                  try {
                    // For Vimeo, onDuration fires when video metadata is available
                    // This is the most reliable way to detect valid videos
                    if (videoMediaSource === 'vimeo' && !videoStarted && duration > 0) {
                      console.log('[VideoWorkFields] onDuration fired for Vimeo, duration:', duration, 'URL:', videoUrl.trim())
                      // Clear video start timeout if video duration is available
                      if (videoStartTimeoutRef.current) {
                        clearTimeout(videoStartTimeoutRef.current)
                        videoStartTimeoutRef.current = null
                      }
                      setVideoStarted(true)
                      // Now that video duration is available, we can mark as valid
                      if (videoValid && !videoError && !previewError) {
                        onChangeValidity(true)
                      }
                    }
                  } catch (err) {
                    console.error('[VideoWorkFields] Error in onDuration callback:', err)
                    // Don't break the flow, just log the error
                  }
                }}
                onError={(error: unknown) => {
                  try {
                    console.error('[VideoWorkFields] onError fired:', error, 'URL:', videoUrl.trim(), 'Source:', videoMediaSource)
                    // Clear timeouts on error
                    if (videoStartTimeoutRef.current) {
                      clearTimeout(videoStartTimeoutRef.current)
                      videoStartTimeoutRef.current = null
                    }
                    
                    // Handle specific error types
                    let errorMessage = 'Could not preview this video. Please check the URL and try again.'
                    if (error instanceof Error) {
                      if (error.name === 'NotFoundError' || error.message.includes('does not exist')) {
                        errorMessage = 'This video does not exist. Please check the URL and try again.'
                      } else if (error.message.includes('404')) {
                        errorMessage = 'This video could not be found. Please check the URL and try again.'
                      }
                    }
                    
                    setPreviewError(errorMessage)
                    setVideoValid(false)
                    setVideoReady(false)
                    setVideoStarted(false)
                    onChangeValidity(false)
                  } catch (err) {
                    console.error('[VideoWorkFields] Error in onError callback:', err)
                    // Fallback error handling
                    setPreviewError('An error occurred while loading the video. Please try again.')
                    setVideoValid(false)
                    setVideoReady(false)
                    setVideoStarted(false)
                    onChangeValidity(false)
                  }
                }}
                config={{
                  youtube: {
                    playerVars: {
                      autoplay: 0,
                      controls: 1,
                      rel: 0,
                      modestbranding: 1,
                    },
                  },
                  vimeo: {
                    playerOptions: {
                      autoplay: false,
                      controls: true,
                    },
                  },
                } as any}
              />
              </ErrorBoundary>
            </div>
          </div>
        )}
      </div>
    )
  }
)

VideoWorkFields.displayName = 'VideoWorkFields'

