'use client'

import { useEffect, useRef, useState } from 'react'

interface ScrollableCategoriesProps {
  categories: string[]
  className?: string
  'aria-label'?: string
}

export default function ScrollableCategories({ 
  categories, 
  className = '',
  'aria-label': ariaLabel = 'Artist categories'
}: ScrollableCategoriesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftHint, setShowLeftHint] = useState(false)
  const [showRightHint, setShowRightHint] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)

  const checkOverflow = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    const overflowing = scrollWidth > clientWidth
    
    setIsOverflowing(overflowing)
    
    // Show left hint only when scrolled away from start
    setShowLeftHint(overflowing && scrollLeft > 5) // 5px threshold to avoid flicker
    
    // Show right hint when there's more content to scroll
    setShowRightHint(overflowing && scrollLeft < scrollWidth - clientWidth - 5) // 5px threshold
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Initial check with a small delay to ensure layout is complete
    const timeoutId = setTimeout(checkOverflow, 100)

    // Check on scroll
    container.addEventListener('scroll', checkOverflow, { passive: true })

    // Check on resize using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      // Small delay to ensure layout is stable
      setTimeout(checkOverflow, 50)
    })
    resizeObserver.observe(container)

    // Also listen to window resize as fallback
    window.addEventListener('resize', checkOverflow, { passive: true })

    return () => {
      clearTimeout(timeoutId)
      container.removeEventListener('scroll', checkOverflow)
      resizeObserver.disconnect()
      window.removeEventListener('resize', checkOverflow)
    }
  }, [categories])

  return (
    <div className="relative mb-4 overflow-visible -mx-4 sm:-mx-6 md:mx-0">
      {/* Scroll container - always reserve space for arrows when overflowing to prevent layout shift */}
      <div
        ref={scrollContainerRef}
        className={`flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto no-scrollbar overscroll-x-contain touch-pan-x scroll-smooth md:pl-0 md:pr-0 md:justify-start ${
          isOverflowing 
            ? 'justify-start pl-12 pr-12 sm:pl-12 sm:pr-12' 
            : 'justify-center pl-4 pr-4 sm:pl-6 sm:pr-6'
        } ${className}`}
        role="list"
        aria-label={ariaLabel}
      >
        {categories.map((category, i) => (
          <span
            key={i}
            role="listitem"
            className="inline-block bg-sunroad-amber-50 text-sunroad-amber-700 text-xs font-medium px-3 py-1 rounded-full flex-shrink-0 border border-sunroad-amber-200"
          >
            {category}
          </span>
        ))}
      </div>

      {/* Left arrow (mobile only, when scrolled right) */}
      {showLeftHint && (
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none md:hidden z-20 flex items-center justify-center w-8 h-7 bg-sunroad-cream transition-opacity duration-200"
          aria-hidden="true"
        >
          <svg 
            className="w-3 h-3 text-sunroad-brown-700 ml-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
      )}

      {/* Right arrow (mobile only, when scrollable) */}
      {showRightHint && (
        <div 
          className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none md:hidden z-20 flex items-center justify-center w-8 h-7 bg-sunroad-cream transition-opacity duration-200"
          aria-hidden="true"
        >
          <svg 
            className="w-3 h-3 text-sunroad-brown-700 mr-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </div>
  )
}
