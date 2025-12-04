'use client'

import { useState, useMemo } from 'react'

interface ArtistSocialLinksProps {
  websiteUrl?: string | null
  instagramUrl?: string | null
  facebookUrl?: string | null
  artistName: string
  alignment?: 'side' | 'center'
  className?: string
}

interface SocialLink {
  type: 'website' | 'instagram' | 'facebook'
  url: string
  label: string
}

export default function ArtistSocialLinks({
  websiteUrl,
  instagramUrl,
  facebookUrl,
  artistName,
  alignment = 'side',
  className = '',
}: ArtistSocialLinksProps) {
  const [showModal, setShowModal] = useState(false)

  // Build array of links
  const links = useMemo(() => {
    const linkArray: SocialLink[] = []
    if (websiteUrl) {
      linkArray.push({ type: 'website', url: websiteUrl, label: 'Website' })
    }
    if (instagramUrl) {
      linkArray.push({ type: 'instagram', url: instagramUrl, label: 'Instagram' })
    }
    if (facebookUrl) {
      linkArray.push({ type: 'facebook', url: facebookUrl, label: 'Facebook' })
    }
    return linkArray
  }, [websiteUrl, instagramUrl, facebookUrl])

  // If no links, render nothing
  if (links.length === 0) {
    return null
  }

  // Determine which links to show (first 4) and if we need +N
  const visibleLinks = links.slice(0, 4)
  const hiddenLinks = links.slice(4)
  const hasMore = hiddenLinks.length > 0

  // Icon component for each type - Subtle, elegant, premium
  const renderIcon = (type: SocialLink['type']) => {
    switch (type) {
      case 'website':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        )
      case 'instagram':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
        )
      case 'facebook':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
          </svg>
        )
    }
  }

  // Alignment classes
  const containerClasses = alignment === 'side'
    ? 'flex flex-col items-start text-left'
    : 'flex flex-row flex-wrap items-center justify-center text-center'

  const gridClasses = alignment === 'side'
    ? 'grid grid-cols-2 gap-2'
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
          {visibleLinks.map((link) => (
            <a
              key={link.type}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              className="group w-9 h-9 rounded-full flex items-center justify-center bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 text-sunroad-brown-600 hover:bg-sunroad-amber-100/80 hover:border-sunroad-amber-300/80 hover:text-sunroad-brown-700 transition-all duration-200"
            >
              {renderIcon(link.type)}
            </a>
          ))}
          
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

      {/* Modal for additional links */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Connect with {artistName}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                {links.map((link) => (
                  <a
                    key={link.type}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 text-sunroad-brown-600 flex-shrink-0 group-hover:bg-sunroad-amber-100/80 group-hover:border-sunroad-amber-300/80 transition-all duration-200">
                      {renderIcon(link.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{link.label}</p>
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
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

