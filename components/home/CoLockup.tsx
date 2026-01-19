'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

const suffixes = ['llaboration', 'nnection', 'mmunity']
const DISPLAY_TIME = 4000 // 4 seconds per word
const TRANSITION_DURATION = 800 // 800ms transition (between 600-900ms)

export default function CoLockup() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [slotHeight, setSlotHeight] = useState(0)
  const windowRef = useRef<HTMLDivElement>(null)

  // Measure window height for pixel-based animation
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const updateSlotHeight = () => {
      if (windowRef.current) {
        setSlotHeight(windowRef.current.clientHeight)
      }
    }

    updateSlotHeight()
    window.addEventListener('resize', updateSlotHeight)
    return () => window.removeEventListener('resize', updateSlotHeight)
  }, [])

  useEffect(() => {
    // Check for reduced motion preference
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % suffixes.length)
    }, DISPLAY_TIME)

    return () => clearInterval(interval)
  }, [prefersReducedMotion])

  // Calculate pixel-based translate
  const translateY = prefersReducedMotion ? 0 : -(currentIndex * slotHeight)

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex justify-center align-middle">
      <div className="flex justify-center">
        {/* Centered inline-flex wrapper for logo + suffix */}
        <div className="relative inline-flex flex-nowrap items-baseline justify-center sm:flex-nowrap gap-0">
          {/* SVG Logo - scaled so "Co" is large enough, bigger on mobile */}
          <div className="flex items-baseline">
            <Image 
              src="/Sun-Road-Logo-svg.svg" 
              alt="Sun Road Co" 
              width={300} 
              height={200}
              className="h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36 w-auto"
              priority
            />
          </div>

          {/* Animated Suffix Container - inline with logo, tight gap, upward offset for alignment */}
          <div 
            ref={windowRef}
            className="relative overflow-hidden h-16 sm:h-20 md:h-20 lg:h-24 xl:h-28 -ml-1 sm:-ml-2 -translate-y-0.5 sm:-translate-y-1 md:-translate-y-1.5 w-[min(52vw,150px)] sm:w-[min(50vw,280px)] min-w-0"
            style={{
              paddingLeft: '0.5rem', // Direct padding on suffix window
            }}
          >
            {/* Rolling track - flex column with pixel-based translate */}
            <div
              className="absolute top-[-11px] sm:top-[-20px] flex flex-col transition-transform ease-in-out"
              style={{
                transform: `translateY(${translateY}px)`,
                transitionDuration: prefersReducedMotion ? '0ms' : `${TRANSITION_DURATION}ms`,
                width: 'max-content', // Natural width based on content
              }}
            >
              {suffixes.map((suffix, index) => (
                <div
                  key={suffix}
                  className="flex-shrink-0 flex items-center h-16 sm:h-20 md:h-20 lg:h-24 xl:h-28"
                >
                  <span
                    className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-sans font-semibold whitespace-nowrap leading-none"
                    style={{
                      color: '#DFC7B2', // Matches logo cream
                      WebkitTextStroke: '2.8px black',
                      stroke: '2px #000',
                      paintOrder: 'stroke fill',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {suffix}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
