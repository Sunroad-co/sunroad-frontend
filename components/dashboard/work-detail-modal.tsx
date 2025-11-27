'use client'

import { useEffect } from 'react'
import { Work } from '@/hooks/use-user-profile'
import { MediaPreview } from './work-card'

interface WorkDetailModalProps {
  work: Work | null
  isOpen: boolean
  onClose: () => void
}

export default function WorkDetailModal({ work, isOpen, onClose }: WorkDetailModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !work) return null

  // Get media source label
  const getMediaSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      upload: 'Upload',
      youtube: 'YouTube',
      vimeo: 'Vimeo',
      mux: 'Mux',
      spotify: 'Spotify',
      soundcloud: 'SoundCloud',
      other_url: 'External URL',
    }
    return labels[source] || source
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-sunroad-cream rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 transition-colors shadow-lg"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Mobile: Single Column Layout */}
        <div className="flex flex-col md:hidden w-full">
          {/* Title at top */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-200/50">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-gray-900">
              {work.title}
            </h2>
          </div>

          {/* Media */}
          <div className="w-full">
            <MediaPreview work={work} variant="modal" />
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto">
            {work.description && (
              <p className="font-body text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
                {work.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-xs font-body">
              <span className="px-3 py-1.5 bg-sunroad-amber-100 text-sunroad-amber-800 rounded-full font-medium">
                {work.media_type.charAt(0).toUpperCase() + work.media_type.slice(1)}
              </span>
              <span className="px-3 py-1.5 bg-sunroad-brown-100 text-sunroad-brown-800 rounded-full font-medium">
                {getMediaSourceLabel(work.media_source)}
              </span>
              {work.src_url && work.media_source !== 'upload' && (
                <a
                  href={work.src_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white border border-sunroad-amber-300 text-sunroad-amber-700 rounded-full hover:bg-sunroad-amber-50 transition-colors font-medium"
                >
                  View original →
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Desktop: Two Column Layout with Title at Top */}
        <div className="hidden md:flex flex-col w-full h-full">
          {/* Title at top spanning full width */}
          <div className="px-8 pt-6 pb-4 border-b border-gray-200/50">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-gray-900">
              {work.title}
            </h2>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left: Media - Wider (2/3) */}
            <div className="flex-[2] p-6 flex items-center justify-center bg-gradient-to-br from-gray-50 to-sunroad-cream/50 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <MediaPreview work={work} variant="modal" />
              </div>
            </div>

            {/* Right: Content - Narrower (1/3) */}
            <div className="flex-1 p-6 overflow-y-auto bg-white/50 border-l border-gray-200/50">
              {work.description && (
                <p className="font-body text-sm text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                  {work.description}
                </p>
              )}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2 text-xs font-body">
                  <span className="px-3 py-1.5 bg-sunroad-amber-100 text-sunroad-amber-800 rounded-full font-medium">
                    {work.media_type.charAt(0).toUpperCase() + work.media_type.slice(1)}
                  </span>
                  <span className="px-3 py-1.5 bg-sunroad-brown-100 text-sunroad-brown-800 rounded-full font-medium">
                    {getMediaSourceLabel(work.media_source)}
                  </span>
                </div>
                {work.src_url && work.media_source !== 'upload' && (
                  <a
                    href={work.src_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-sunroad-amber-300 text-sunroad-amber-700 rounded-lg hover:bg-sunroad-amber-50 transition-colors font-medium text-sm"
                  >
                    <span>View original</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

