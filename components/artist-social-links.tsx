'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { simpleIcons } from '@/lib/simpleIcons'
import { Link, Globe } from 'lucide-react'
import LinkedInIcon from './social-icons/linkedin-icon'
import { checkPlatformUrlMatch } from '@/lib/utils/platform-url-validation'

interface ArtistSocialLinksProps {
  links: Array<{
    id?: number
    platform_key: string
    url: string
    label?: string | null
    platform?: {
      display_name?: string
      icon_key?: string
    } | null
  }>
  artistName: string
  alignment?: 'side' | 'center'
  className?: string
}

interface SocialLink {
  id?: number
  platform_key: string
  url: string
  label: string
}

// Helper to get simple-icons icon by platform key or icon_key
function getSimpleIcon(platformKey: string, iconKey?: string | null) {
  // Try icon_key first if provided
  if (iconKey) {
    const iconKeyLower = iconKey.toLowerCase().replace(/[^a-z0-9]/g, '')
    const iconName = `si${iconKeyLower.charAt(0).toUpperCase() + iconKeyLower.slice(1)}` as keyof typeof simpleIcons
    if (simpleIcons[iconName]) {
      return simpleIcons[iconName]
    }
  }

  // Map platform_key to simple-icons
  // Note: simple-icons uses PascalCase with 'si' prefix
  const keyMap: Record<string, keyof typeof simpleIcons> = {
    instagram: 'siInstagram',
    facebook: 'siFacebook',
    x: 'siX',
    twitter: 'siX', // X (formerly Twitter) uses siX
    youtube: 'siYoutube',
    tiktok: 'siTiktok',
    spotify: 'siSpotify',
    soundcloud: 'siSoundcloud',
    bandcamp: 'siBandcamp',
    pinterest: 'siPinterest',
    etsy: 'siEtsy',
    behance: 'siBehance',
    dribbble: 'siDribbble',
    vimeo: 'siVimeo',
    github: 'siGithub',
    gitlab: 'siGitlab',
    bitbucket: 'siBitbucket',
    codewars: 'siCodewars',
    imdb: 'siImdb',
  }

  const iconName = keyMap[platformKey.toLowerCase()]
  if (iconName && simpleIcons[iconName]) {
    return simpleIcons[iconName]
  }

  return null
}

// Render icon component
function renderIcon(link: SocialLink, platform?: { icon_key?: string | null } | null) {
  // Handle LinkedIn manually (not in simple-icons)
  if (link.platform_key.toLowerCase() === 'linkedin') {
    return <LinkedInIcon className="w-5 h-5" />
  }

  const icon = getSimpleIcon(link.platform_key, platform?.icon_key)
  
  if (icon) {
    // Render simple-icons SVG path
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d={icon.path} />
      </svg>
    )
  }

  // Fallback: use generic link icon for website/custom/link-in-bio
  if (link.platform_key === 'website' || link.platform_key === 'custom' || link.platform_key === 'link-in-bio') {
    return <Globe className="w-5 h-5" />
  }

  // Final fallback: generic link icon
  return <Link className="w-5 h-5" />
}

export default function ArtistSocialLinks({
  links,
  artistName,
  alignment = 'side',
  className = '',
}: ArtistSocialLinksProps) {
  const [showModal, setShowModal] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Ensure we only render portal on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showModal])

  // Handle escape key
  useEffect(() => {
    if (!showModal) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowModal(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showModal])

  // Filter and transform links
  const processedLinks = useMemo(() => {
    return links.map(link => ({
      id: link.id,
      platform_key: link.platform_key,
      url: link.url,
      label: link.label || link.platform?.display_name || link.platform_key.charAt(0).toUpperCase() + link.platform_key.slice(1),
    }))
  }, [links])

  // If no links, render nothing
  if (processedLinks.length === 0) {
    return null
  }

  // Determine which links to show based on alignment
  const MAX_VISIBLE_SIDE = 6
  const MAX_VISIBLE_CENTER = 4
  
  const maxVisible = alignment === 'side' ? MAX_VISIBLE_SIDE : MAX_VISIBLE_CENTER
  const visibleLinks = processedLinks.slice(0, maxVisible)
  const hiddenLinks = processedLinks.slice(maxVisible)
  const hasMore = hiddenLinks.length > 0

  // Alignment classes
  const containerClasses = alignment === 'side'
    ? 'flex flex-col items-start text-left'
    : 'flex flex-row flex-wrap items-center justify-center text-center'

  const gridClasses = alignment === 'side'
    ? 'grid grid-cols-3 gap-2'
    : 'flex flex-row flex-wrap gap-3 justify-center'

  return (
    <>
      <div className={`${containerClasses} ${className}`}>
        {/* Connect label - shown for both side and center alignment */}
        <p className={`text-xs font-medium uppercase tracking-wide text-sunroad-brown-500 mb-2 ${alignment === 'center' ? 'text-center w-full' : ''}`}>
          Connect
        </p>
        
        {/* Icon buttons */}
        <div className={gridClasses}>
          {visibleLinks.map((link) => {
            const originalLink = links.find(l => l.id === link.id)
            // Check if URL matches platform (for display validation)
            const isValidMatch = checkPlatformUrlMatch(link.url, link.platform_key)
            return (
              <a
                key={String(link.id)}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                title={!isValidMatch ? `Warning: This URL may not match the ${link.platform_key} platform` : link.label}
                className={`group relative w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 ${
                  !isValidMatch
                    ? 'bg-red-50/60 border-red-200/60 text-red-600 hover:bg-red-100/80 hover:border-red-300/80 hover:text-red-700'
                    : 'bg-sunroad-amber-50/60 border-sunroad-amber-200/60 text-sunroad-brown-600 hover:bg-sunroad-amber-100/80 hover:border-sunroad-amber-300/80 hover:text-sunroad-brown-700'
                }`}
              >
                {renderIcon(link, originalLink?.platform)}
                {!isValidMatch && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" aria-label="URL mismatch warning" />
                )}
              </a>
            )
          })}
          
          {/* +N button if there are more links */}
          {hasMore && (
            <button
              onClick={() => setShowModal(true)}
              aria-label={`Show ${hiddenLinks.length} more social links`}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 text-sunroad-brown-600 hover:bg-sunroad-amber-100/80 hover:border-sunroad-amber-300/80 hover:text-sunroad-brown-700 transition-all duration-200 text-xs font-medium"
            >
              +{hiddenLinks.length}
            </button>
          )}
        </div>
      </div>

      {/* Modal for additional links - Rendered via portal to document.body */}
      {showModal && isMounted && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="social-links-modal-title"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h2 id="social-links-modal-title" className="text-xl font-semibold text-gray-900">
                Connect with {artistName}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {processedLinks.map((link) => {
                  const originalLink = links.find(l => l.id === link.id)
                  const isValidMatch = checkPlatformUrlMatch(link.url, link.platform_key)
                  return (
                    <a
                      key={String(link.id)}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors group ${
                        !isValidMatch ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border flex-shrink-0 transition-all duration-200 ${
                        !isValidMatch
                          ? 'bg-red-50/60 border-red-200/60 text-red-600 group-hover:bg-red-100/80 group-hover:border-red-300/80'
                          : 'bg-sunroad-amber-50/60 border-sunroad-amber-200/60 text-sunroad-brown-600 group-hover:bg-sunroad-amber-100/80 group-hover:border-sunroad-amber-300/80'
                      }`}>
                        {renderIcon(link, originalLink?.platform)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{link.label}</p>
                          {!isValidMatch && (
                            <span className="text-xs text-red-600 font-medium" title={`URL doesn't match ${link.platform_key} platform`}>
                              ⚠️
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{link.url}</p>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
