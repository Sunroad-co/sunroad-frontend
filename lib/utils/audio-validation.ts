import type { MediaSource } from '@/hooks/use-user-profile'

export interface AudioValidationResult {
  isValid: boolean
  error?: string
  mediaSource?: MediaSource
}

/**
 * Validates an audio URL and infers the media source
 * Supports SoundCloud and Spotify
 */
export function validateAudioUrl(url: string): AudioValidationResult {
  if (!url || url.trim() === '') {
    return {
      isValid: false,
      error: 'Please enter an audio URL'
    }
  }

  try {
    const urlObj = new URL(url.trim())
    const hostname = urlObj.hostname.toLowerCase()

    // SoundCloud
    if (hostname.includes('soundcloud.com')) {
      return {
        isValid: true,
        mediaSource: 'soundcloud'
      }
    }

    // Spotify
    if (hostname.includes('spotify.com') || hostname.includes('open.spotify.com')) {
      return {
        isValid: true,
        mediaSource: 'spotify'
      }
    }

    // Invalid URL
    return {
      isValid: false,
      error: 'Please enter a valid SoundCloud or Spotify URL'
    }
  } catch {
    return {
      isValid: false,
      error: 'Please enter a valid audio URL'
    }
  }
}

