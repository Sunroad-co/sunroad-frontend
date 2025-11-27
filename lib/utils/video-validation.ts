import type { MediaSource } from '@/hooks/use-user-profile'

export interface VideoValidationResult {
  isValid: boolean
  error?: string
  mediaSource?: MediaSource
}

/**
 * Validates a video URL and infers the media source
 * Supports all platforms that react-player supports:
 * YouTube, Vimeo, Facebook, Twitch, Streamable, Wistia,
 * Mixcloud, DailyMotion, Vidyard, Kaltura, Mux, and direct video files
 */
export function validateVideoUrl(url: string): VideoValidationResult {
  if (!url || url.trim() === '') {
    return {
      isValid: false,
      error: 'Please enter a video URL'
    }
  }

  try {
    const urlObj = new URL(url.trim())
    const hostname = urlObj.hostname.toLowerCase()
    const pathname = urlObj.pathname.toLowerCase()

    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return {
        isValid: true,
        mediaSource: 'youtube'
      }
    }

    // Vimeo
    if (hostname.includes('vimeo.com')) {
      return {
        isValid: true,
        mediaSource: 'vimeo'
      }
    }

    // Mux
    if (hostname.includes('mux.com') || hostname.includes('stream.mux.com')) {
      return {
        isValid: true,
        mediaSource: 'mux'
      }
    }

    // Facebook
    if (hostname.includes('facebook.com') || hostname.includes('fb.com') || hostname.includes('fb.watch')) {
      return {
        isValid: true,
        mediaSource: 'other_url'
      }
    }

    // Twitch
    if (hostname.includes('twitch.tv')) {
      return {
        isValid: true,
        mediaSource: 'other_url'
      }
    }

    // Streamable
    if (hostname.includes('streamable.com')) {
      return {
        isValid: true,
        mediaSource: 'other_url'
      }
    }

    // Wistia
    if (hostname.includes('wistia.com') || hostname.includes('wistia.net')) {
      return {
        isValid: true,
        mediaSource: 'other_url'
      }
    }

    // Mixcloud
    if (hostname.includes('mixcloud.com')) {
      return {
        isValid: true,
        mediaSource: 'other_url'
      }
    }

    // DailyMotion
    if (hostname.includes('dailymotion.com') || hostname.includes('dai.ly')) {
      return {
        isValid: true,
        mediaSource: 'other_url'
      }
    }

    // Vidyard
    if (hostname.includes('vidyard.com')) {
      return {
        isValid: true,
        mediaSource: 'other_url'
      }
    }

    // Kaltura
    if (hostname.includes('kaltura.com')) {
      return {
        isValid: true,
        mediaSource: 'other_url'
      }
    }

    // Direct video file URLs (mp4, webm, ogg, mov, etc.)
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv']
    const hasVideoExtension = videoExtensions.some(ext => pathname.endsWith(ext))
    if (hasVideoExtension) {
      return {
        isValid: true,
        mediaSource: 'other_url'
      }
    }

    // If it's a valid URL but not a recognized platform, still allow it
    // react-player might support it or it could be a direct video URL without extension
    return {
      isValid: true,
      mediaSource: 'other_url'
    }
  } catch {
    return {
      isValid: false,
      error: 'Please enter a valid video URL'
    }
  }
}

