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

  const checkOverflow = () => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    const overflowing = scrollWidth > clientWidth
    
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
    <div className="relative mb-4 overflow-visible">
      {/* Scroll container - break out of parent padding on mobile for edge-to-edge scroll, but add internal padding to match page padding */}
      <div
        ref={scrollContainerRef}
        className={`flex flex-nowrap md:flex-wrap gap-2 justify-start overflow-x-auto no-scrollbar overscroll-x-contain touch-pan-x -mx-4 pl-4 pr-4 sm:-mx-6 sm:pl-6 sm:pr-6 md:mx-0 md:pl-0 md:pr-0 ${className}`}
        role="list"
        aria-label={ariaLabel}
      >
        {categories.map((category, i) => (
          <span
            key={i}
            role="listitem"
            className="inline-block bg-sunroad-amber-50 text-sunroad-amber-700 text-xs font-medium px-3 py-1 rounded-full flex-shrink-0"
          >
            {category}
          </span>
        ))}
      </div>

      {/* Left chevron hint (mobile only, when scrolled right) */}
      {showLeftHint && (
        <div 
          className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none md:hidden z-10 flex items-center justify-center w-6 h-6 rounded-full bg-sunroad-cream/90 backdrop-blur-sm"
          aria-hidden="true"
        >
          <svg 
            className="w-3 h-3 text-sunroad-brown-700" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
      )}

      {/* Right chevron hint (mobile only, when scrollable) */}
      {showRightHint && (
        <div 
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none md:hidden z-10 flex items-center justify-center w-6 h-6 rounded-full bg-sunroad-cream/90 backdrop-blur-sm"
          aria-hidden="true"
        >
          <svg 
            className="w-3 h-3 text-sunroad-brown-700" 
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
