'use client'

import { useEffect, useState } from 'react'
import { Work } from '@/hooks/use-user-profile'
import { MediaPreview } from './work-card'

interface WorkDetailModalProps {
  work: Work | null
  isOpen: boolean
  onClose: () => void
}

export default function WorkDetailModal({ work, isOpen, onClose }: WorkDetailModalProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  
  // Reset expanded state when work changes
  useEffect(() => {
    setIsDescriptionExpanded(false)
  }, [work?.id])

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 md:p-6 transition-opacity duration-200"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile: Single Column Layout */}
        <div className="flex flex-col md:hidden w-full h-full overflow-hidden">
          {/* Header with title and close button */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0 bg-white">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 flex-1 min-w-0 leading-tight">
                {work.title}
              </h2>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 -mt-1 -mr-1 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-500 hover:text-gray-900 transition-all duration-150"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Media - Clean white background, no gray */}
          <div className="w-full flex-shrink-0 bg-white">
            <MediaPreview work={work} variant="modal" />
          </div>

          {/* Content - Scrollable with better spacing */}
          <div className={`flex-1 px-5 py-4 ${isDescriptionExpanded ? 'overflow-y-auto' : 'overflow-hidden'} min-h-0 bg-white`}>
            {work.description && (
              <div className="prose prose-sm max-w-none">
                <div className="relative">
                  <p 
                    className="font-body text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3 transition-all duration-300"
                    style={{
                      display: !isDescriptionExpanded ? '-webkit-box' : 'block',
                      WebkitLineClamp: !isDescriptionExpanded ? 4 : undefined,
                      WebkitBoxOrient: !isDescriptionExpanded ? 'vertical' : undefined,
                      overflow: !isDescriptionExpanded ? 'hidden' : 'visible',
                    }}
                  >
                    {work.description}
                  </p>
                  {work.description.length > 150 && !isDescriptionExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                  )}
                </div>
                {work.description.length > 150 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-sunroad-amber-600 hover:text-sunroad-amber-700 font-medium text-sm transition-colors mb-4 -mt-1"
                  >
                    {isDescriptionExpanded ? 'Read less' : 'Read more'}
                  </button>
                )}
              </div>
            )}
            {work.src_url && work.media_source !== 'upload' && (
              <a
                href={work.src_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-sunroad-amber-50 hover:bg-sunroad-amber-100 border border-sunroad-amber-200 text-sunroad-amber-800 rounded-xl hover:shadow-sm transition-all duration-200 font-medium text-sm"
              >
                <span>View original</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Desktop: Two Column Layout */}
        <div className="hidden md:flex flex-col w-full h-full">
          {/* Header with title and close button */}
          <div className="px-8 pt-7 pb-5 border-b border-gray-100 flex-shrink-0 bg-white">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 flex-1 min-w-0 leading-tight">
                {work.title}
              </h2>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-2 -mt-1 -mr-1 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-500 hover:text-gray-900 transition-all duration-150"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Left: Media - Clean white background, centered */}
            <div className="flex-[2] flex items-center justify-center bg-white overflow-hidden min-w-0 border-r border-gray-100">
              <MediaPreview work={work} variant="modal" />
            </div>

            {/* Right: Content - Scrollable with refined styling */}
            <div className="flex-1 px-8 py-8 overflow-y-auto bg-gray-50/30 min-h-0">
              <div className="max-w-md">
                {work.description && (
                  <div className="prose prose-sm max-w-none mb-8">
                    <p className="font-body text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {work.description}
                    </p>
                  </div>
                )}
                {work.src_url && work.media_source !== 'upload' && (
                  <a
                    href={work.src_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-sunroad-amber-50 border border-gray-200 hover:border-sunroad-amber-300 text-gray-700 hover:text-sunroad-amber-800 rounded-xl hover:shadow-sm transition-all duration-200 font-medium text-sm"
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

