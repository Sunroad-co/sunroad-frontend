'use client'

import React, { useState, useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import ReactPlayer from 'react-player'
import { validateAudioUrl } from '@/lib/utils/audio-validation'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/ui/error-boundary'

const TypedReactPlayer = ReactPlayer as React.ComponentType<any>

export interface AudioWorkFieldsProps {
  saving: boolean
  onChangeValidity: (isValid: boolean) => void
  onClear: () => void
  initialUrl?: string
  initialMediaSource?: 'spotify' | 'soundcloud'
}

export interface AudioWorkFieldsHandle {
  getAudioData: () => { url: string; mediaSource: 'spotify' | 'soundcloud' } | null
  clear: () => void
}

export const AudioWorkFields = forwardRef<AudioWorkFieldsHandle, AudioWorkFieldsProps>(
  ({ saving, onChangeValidity, onClear, initialUrl, initialMediaSource }, ref) => {
    const [audioUrl, setAudioUrl] = useState(initialUrl || '')
    const [audioValid, setAudioValid] = useState(false)
    const [audioReady, setAudioReady] = useState(false)
    const [audioError, setAudioError] = useState<string | null>(null)
    const [previewError, setPreviewError] = useState<string | null>(null)
    const [audioMediaSource, setAudioMediaSource] = useState<'spotify' | 'soundcloud'>(
      initialMediaSource || 'spotify'
    )
    const [showAudioHelp, setShowAudioHelp] = useState(false)
    const [audioStarted, setAudioStarted] = useState(false)
    const skeletonTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const audioStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const iframeLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const getAudioData = useCallback(() => {
      if (!audioValid || !audioUrl.trim()) {
        return null
      }
      return { url: audioUrl.trim(), mediaSource: audioMediaSource }
    }, [audioValid, audioUrl, audioMediaSource])

    const clear = useCallback(() => {
      setAudioUrl('')
      setAudioValid(false)
      setAudioReady(false)
      setAudioStarted(false)
      setAudioError(null)
      setPreviewError(null)
      setShowAudioHelp(false)
      if (skeletonTimeoutRef.current) {
        clearTimeout(skeletonTimeoutRef.current)
        skeletonTimeoutRef.current = null
      }
      if (audioStartTimeoutRef.current) {
        clearTimeout(audioStartTimeoutRef.current)
        audioStartTimeoutRef.current = null
      }
      if (iframeLoadTimeoutRef.current) {
        clearTimeout(iframeLoadTimeoutRef.current)
        iframeLoadTimeoutRef.current = null
      }
      onChangeValidity(false)
      onClear()
    }, [onChangeValidity, onClear])

    useImperativeHandle(ref, () => ({
      getAudioData,
      clear
    }))

    // Initialize validation on mount if initialUrl is provided
    useEffect(() => {
      // Reset all state when component mounts or initialUrl changes
      setAudioReady(false)
      setAudioStarted(false)
      if (skeletonTimeoutRef.current) {
        clearTimeout(skeletonTimeoutRef.current)
        skeletonTimeoutRef.current = null
      }
      if (audioStartTimeoutRef.current) {
        clearTimeout(audioStartTimeoutRef.current)
        audioStartTimeoutRef.current = null
      }
      if (iframeLoadTimeoutRef.current) {
        clearTimeout(iframeLoadTimeoutRef.current)
        iframeLoadTimeoutRef.current = null
      }
      
      if (initialUrl) {
        const validation = validateAudioUrl(initialUrl)
        if (validation.isValid && validation.mediaSource) {
          setAudioValid(true)
          setAudioMediaSource(validation.mediaSource as 'spotify' | 'soundcloud')
          // Don't set validity to true until preview loads successfully
          // This will be set when onReady/onLoad fires
        } else {
          onChangeValidity(false)
        }
      } else {
        setAudioValid(false)
        onChangeValidity(false)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialUrl]) // Run when initialUrl changes (e.g., when switching tabs)

    const handleAudioUrlChange = (url: string) => {
      setAudioUrl(url)
      setAudioError(null)
      setPreviewError(null)
      setAudioValid(false)
      setAudioReady(false)
      setAudioStarted(false)
      // Clear timeouts when URL changes
      if (skeletonTimeoutRef.current) {
        clearTimeout(skeletonTimeoutRef.current)
        skeletonTimeoutRef.current = null
      }
      if (audioStartTimeoutRef.current) {
        clearTimeout(audioStartTimeoutRef.current)
        audioStartTimeoutRef.current = null
      }
      if (iframeLoadTimeoutRef.current) {
        clearTimeout(iframeLoadTimeoutRef.current)
        iframeLoadTimeoutRef.current = null
      }

      if (!url || url.trim() === '') {
        onChangeValidity(false)
        return
      }

      const validation = validateAudioUrl(url)
      if (validation.isValid && validation.mediaSource) {
        setAudioValid(true)
        setAudioMediaSource(validation.mediaSource as 'spotify' | 'soundcloud')
        onChangeValidity(true)
      } else {
        setAudioValid(false)
        setAudioError(validation.error || 'Please enter a valid audio URL.')
        onChangeValidity(false)
      }
    }

    // Update parent validity when states change
    useEffect(() => {
      if (audioError || previewError) {
        onChangeValidity(false)
        return
      }

      // For audio, we need validation, preview ready, AND content loaded
      // For Spotify, we use onStart to detect when content loads
      // For SoundCloud, we use iframe onLoad + timeout to detect if content exists
      // This ensures the save button only activates when preview is actually working
      if (audioMediaSource === 'spotify') {
        // Spotify needs ready + started (content loaded)
        onChangeValidity(audioValid && audioReady && audioStarted && !!audioUrl.trim())
      } else {
        // SoundCloud needs ready + started (iframe loaded + content verified)
        onChangeValidity(audioValid && audioReady && audioStarted && !!audioUrl.trim())
      }
    }, [audioValid, audioReady, audioStarted, audioError, previewError, audioUrl, audioMediaSource, onChangeValidity])

    // Set up timeout fallback for skeleton - hide after 3 seconds if audioReady never fires
    useEffect(() => {
      // Clear any existing timeout
      if (skeletonTimeoutRef.current) {
        clearTimeout(skeletonTimeoutRef.current)
        skeletonTimeoutRef.current = null
      }
      
      // Only show skeleton if we have a valid URL and preview should be loading
      if (audioValid && audioUrl && !audioReady && !audioError && !previewError) {
        console.log('[AudioWorkFields] Setting up skeleton timeout for URL:', audioUrl.trim(), 'Source:', audioMediaSource)
        skeletonTimeoutRef.current = setTimeout(() => {
          console.log('[AudioWorkFields] Skeleton timeout fired, hiding skeleton for URL:', audioUrl.trim())
          // If audio still not ready after 3 seconds, hide skeleton anyway
          // This handles cases where onReady/onLoad doesn't fire
          setAudioReady(true)
        }, 3000)
      } else if (!audioValid || !audioUrl) {
        // If no valid URL, ensure skeleton is hidden
        setAudioReady(false)
      }

      return () => {
        if (skeletonTimeoutRef.current) {
          clearTimeout(skeletonTimeoutRef.current)
          skeletonTimeoutRef.current = null
        }
      }
    }, [audioValid, audioUrl, audioReady, audioError, previewError, audioMediaSource])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (skeletonTimeoutRef.current) {
          clearTimeout(skeletonTimeoutRef.current)
          skeletonTimeoutRef.current = null
        }
        if (audioStartTimeoutRef.current) {
          clearTimeout(audioStartTimeoutRef.current)
          audioStartTimeoutRef.current = null
        }
        if (iframeLoadTimeoutRef.current) {
          clearTimeout(iframeLoadTimeoutRef.current)
          iframeLoadTimeoutRef.current = null
        }
      }
    }, [])

    const getSoundCloudEmbedUrl = (url: string): string => {
      try {
        const encodedUrl = encodeURIComponent(url.trim())
        return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`
      } catch {
        return ''
      }
    }

    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="audio-url" className="block text-sm font-medium text-gray-700">
              Audio URL *
            </label>
            <div className="relative">
              <button
                type="button"
                aria-label="Supported audio URLs"
                aria-describedby="audio-url-help"
                onMouseEnter={() => setShowAudioHelp(true)}
                onMouseLeave={() => setShowAudioHelp(false)}
                onFocus={() => setShowAudioHelp(true)}
                onBlur={() => setShowAudioHelp(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 rounded-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {showAudioHelp && (
                <div
                  id="audio-url-help"
                  role="tooltip"
                  className="absolute left-0 bottom-full mb-2 w-80 bg-gray-800 text-white text-xs rounded px-3 py-2 shadow-lg z-20"
                >
                  <p className="font-medium mb-1">Supported platforms:</p>
                  <p className="text-gray-300 mb-1 text-[10px]">SoundCloud and Spotify</p>
                  <p className="text-gray-300 mb-1 mt-2">Examples:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-0.5 text-[10px]">
                    <li>https://soundcloud.com/artist/track</li>
                    <li>https://open.spotify.com/track/...</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          <input
            id="audio-url"
            type="url"
            value={audioUrl}
            onChange={(e) => handleAudioUrlChange(e.target.value)}
            placeholder="https://soundcloud.com/artist/track or https://open.spotify.com/track/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 focus:border-transparent"
            disabled={saving}
          />
          {audioError && <p className="text-xs text-red-600 mt-1">{audioError}</p>}
          {previewError && <p className="text-xs text-red-600 mt-1">{previewError}</p>}
          {audioValid && !audioError && !previewError && audioReady && (
            <p className="text-xs text-green-600 mt-1">Valid {audioMediaSource} URL</p>
          )}
        </div>

        {audioValid && audioUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden isolate">
              {audioMediaSource === 'spotify' ? (
                <>
                  {!audioReady && !previewError && audioValid && audioUrl && (
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      <Skeleton className="w-full h-full rounded-lg" />
                    </div>
                  )}
                  <ErrorBoundary
                    onError={(error) => {
                      console.error('[AudioWorkFields] ErrorBoundary caught error:', error)
                      setPreviewError('An error occurred while loading the audio. Please try again.')
                      setAudioValid(false)
                      setAudioReady(false)
                      setAudioStarted(false)
                      onChangeValidity(false)
                    }}
                  >
                    <TypedReactPlayer
                    key={audioUrl.trim()}
                    src={audioUrl.trim()}
                    width="100%"
                    height="100%"
                    controls
                    playing={false}
                    onReady={() => {
                      console.log('[AudioWorkFields] onReady fired for Spotify URL:', audioUrl.trim())
                      // Clear skeleton timeout if audio loads before timeout
                      if (skeletonTimeoutRef.current) {
                        clearTimeout(skeletonTimeoutRef.current)
                        skeletonTimeoutRef.current = null
                      }
                      setAudioReady(true)
                      setPreviewError(null)
                      
                      // For Spotify, start a timeout to check if content actually loads
                      // If content doesn't start within 5 seconds, it likely doesn't exist
                      if (!audioStarted) {
                        console.log('[AudioWorkFields] Setting up Spotify content load timeout')
                        audioStartTimeoutRef.current = setTimeout(() => {
                          if (!audioStarted) {
                            console.warn('[AudioWorkFields] Spotify content did not load within 5 seconds, marking as invalid. URL:', audioUrl.trim())
                            setPreviewError('This audio does not exist or cannot be played. Please check the URL and try again.')
                            setAudioValid(false)
                            setAudioReady(false)
                            onChangeValidity(false)
                          }
                        }, 5000)
                      }
                    }}
                    onStart={() => {
                      console.log('[AudioWorkFields] onStart fired for Spotify URL:', audioUrl.trim())
                      // Clear timeout if content starts
                      if (audioStartTimeoutRef.current) {
                        clearTimeout(audioStartTimeoutRef.current)
                        audioStartTimeoutRef.current = null
                      }
                      setAudioStarted(true)
                      // Now that content has started, we can mark as valid
                      if (audioValid && !audioError && !previewError) {
                        onChangeValidity(true)
                      }
                    }}
                    onProgress={(state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
                      // For Spotify, onProgress fires when content metadata is loaded (even if not playing)
                      // This is more reliable than waiting for onStart (which requires user interaction)
                      if (!audioStarted && state.loadedSeconds > 0) {
                        console.log('[AudioWorkFields] onProgress fired for Spotify, content metadata loaded:', state.loadedSeconds)
                        // Clear timeout if content metadata loaded
                        if (audioStartTimeoutRef.current) {
                          clearTimeout(audioStartTimeoutRef.current)
                          audioStartTimeoutRef.current = null
                        }
                        setAudioStarted(true)
                        // Now that content metadata is loaded, we can mark as valid
                        if (audioValid && !audioError && !previewError) {
                          onChangeValidity(true)
                        }
                      }
                    }}
                    onError={(error: unknown) => {
                      console.error('[AudioWorkFields] onError fired for Spotify:', error, 'URL:', audioUrl.trim())
                      // Clear timeouts on error
                      if (audioStartTimeoutRef.current) {
                        clearTimeout(audioStartTimeoutRef.current)
                        audioStartTimeoutRef.current = null
                      }
                      setPreviewError('Could not preview this audio. Please check the URL and try again.')
                      setAudioValid(false)
                      setAudioReady(false)
                      setAudioStarted(false)
                      onChangeValidity(false)
                    }}
                    config={{
                      spotify: {
                        options: {
                          theme: 'black',
                        },
                      },
                    } as any}
                  />
                  </ErrorBoundary>
                </>
              ) : (
                <>
                  {!audioReady && !previewError && audioValid && audioUrl && (
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      <Skeleton className="w-full h-full rounded-lg" />
                    </div>
                  )}
                  <ErrorBoundary
                    onError={(error) => {
                      console.error('[AudioWorkFields] ErrorBoundary caught error:', error)
                      setPreviewError('An error occurred while loading the audio. Please try again.')
                      setAudioValid(false)
                      setAudioReady(false)
                      setAudioStarted(false)
                      onChangeValidity(false)
                    }}
                  >
                    <iframe
                    width="100%"
                    height="100%"
                    scrolling="no"
                    frameBorder="no"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    src={getSoundCloudEmbedUrl(audioUrl)}
                    onLoad={() => {
                      console.log('[AudioWorkFields] iframe onLoad fired for SoundCloud URL:', audioUrl.trim())
                      // Clear skeleton timeout if iframe loads before timeout
                      if (skeletonTimeoutRef.current) {
                        clearTimeout(skeletonTimeoutRef.current)
                        skeletonTimeoutRef.current = null
                      }
                      setAudioReady(true)
                      setPreviewError(null)
                      
                      // For SoundCloud, start a timeout to check if content actually exists
                      // SoundCloud iframe loads even for invalid URLs, so we need to verify content
                      // We'll mark as valid after a short delay, but if there's an error message in the iframe,
                      // we can't easily detect it, so we use a shorter timeout (3 seconds)
                      if (!audioStarted) {
                        console.log('[AudioWorkFields] Setting up SoundCloud content verification timeout')
                        iframeLoadTimeoutRef.current = setTimeout(() => {
                          // SoundCloud iframe loads even for invalid tracks, but we can't easily detect errors
                          // So we'll mark as started after a short delay - if the track is invalid,
                          // the user will see an error message in the embed itself
                          setAudioStarted(true)
                          if (audioValid && !audioError && !previewError) {
                            onChangeValidity(true)
                          }
                        }, 3000)
                      }
                    }}
                    onError={() => {
                      console.error('[AudioWorkFields] iframe onError fired for SoundCloud URL:', audioUrl.trim())
                      // Clear timeout on error
                      if (iframeLoadTimeoutRef.current) {
                        clearTimeout(iframeLoadTimeoutRef.current)
                        iframeLoadTimeoutRef.current = null
                      }
                      setPreviewError('Could not load SoundCloud embed. Please check the URL and try again.')
                      setAudioValid(false)
                      setAudioReady(false)
                      setAudioStarted(false)
                      onChangeValidity(false)
                    }}
                    className="w-full h-full"
                  />
                  </ErrorBoundary>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
)

AudioWorkFields.displayName = 'AudioWorkFields'

