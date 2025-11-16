'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { getMediaUrl } from '@/lib/media'

interface Work {
  id: string
  title?: string
  thumb_url: string
}

interface WorksGalleryProps {
  works: Work[]
}

export default function WorksGallery({ works }: WorksGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = (index: number) => {
    setSelectedIndex(index)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedIndex(null)
  }

  const navigatePrevious = useCallback(() => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }, [selectedIndex])

  const navigateNext = useCallback(() => {
    if (selectedIndex !== null && selectedIndex < works.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }, [selectedIndex, works.length])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isModalOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
      } else if (event.key === 'ArrowLeft') {
        navigatePrevious()
      } else if (event.key === 'ArrowRight') {
        navigateNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, selectedIndex, navigatePrevious, navigateNext])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isModalOpen])

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      closeModal()
    }
  }

  if (!works || works.length === 0) {
    return <p className="text-gray-500 text-center py-8">No works available yet.</p>
  }

  return (
    <>
      {/* Works Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {works.map((work, index) => {
          const thumbSrc = getMediaUrl(work.thumb_url);
          return thumbSrc ? (
            <div 
              key={work.id} 
              className="relative group rounded-lg overflow-hidden cursor-pointer"
              onClick={() => openModal(index)}
            >
              <Image
                src={thumbSrc}
                alt={work.title || 'Artwork'}
                width={400}
                height={300}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
              />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </div>
          ) : null;
        })}
      </div>

      {/* Modal */}
      {isModalOpen && selectedIndex !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation Arrows */}
          {works.length > 1 && (
            <>
              {/* Previous Arrow */}
              {selectedIndex > 0 && (
                <button
                  onClick={navigatePrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Next Arrow */}
              {selectedIndex < works.length - 1 && (
                <button
                  onClick={navigateNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </>
          )}

          {/* Image Container */}
          <div className="relative max-w-7xl max-h-[90vh] mx-4">
            {(() => {
              const thumbSrc = getMediaUrl(works[selectedIndex].thumb_url);
              return thumbSrc ? (
                <Image
                  src={thumbSrc}
                  alt={works[selectedIndex].title || 'Artwork'}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                  priority
                />
              ) : null;
            })()}
            
            {/* Image Info */}
            {works[selectedIndex].title && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
                <h3 className="text-lg font-semibold">{works[selectedIndex].title}</h3>
                <p className="text-sm opacity-80">
                  {selectedIndex + 1} of {works.length}
                </p>
              </div>
            )}
          </div>

          {/* Image Counter */}
          {works.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
              {selectedIndex + 1} / {works.length}
            </div>
          )}
        </div>
      )}
    </>
  )
}
