'use client'

import { useState, useEffect, useRef } from 'react'

interface TruncatedBioProps {
  bio: string
}

const MIN_CHARS_FOR_TRUNCATION = 150 // Only consider truncation for bios longer than this

export default function TruncatedBio({ bio }: TruncatedBioProps) {
  // Calculate trimmed bio safely for initial state
  const trimmedBio = (bio && typeof bio === 'string') ? bio.trim() : ''
  const isLongBio = trimmedBio.length > MIN_CHARS_FOR_TRUNCATION
  
  // All hooks must be called before any early returns
  const [isExpanded, setIsExpanded] = useState(false)
  // Start with true for long bios, will be adjusted by measurement
  const [needsTruncation, setNeedsTruncation] = useState(isLongBio)
  const textRef = useRef<HTMLParagraphElement>(null)
  
  // Handle empty or falsy bio - ensure we always return something renderable
  if (!bio || typeof bio !== 'string' || !trimmedBio || trimmedBio.length === 0) {
    return null
  }

  // Check if text actually needs truncation by measuring rendered height
  useEffect(() => {
    if (!textRef.current || isExpanded) {
      // When expanded, we know it needed truncation (since we expanded it)
      if (isExpanded) {
        setNeedsTruncation(true)
      }
      return
    }
    
    // Small delay to ensure DOM has rendered with line-clamp
    const timeoutId = setTimeout(() => {
      if (!textRef.current) return
      const element = textRef.current
      
      // Check if text is actually truncated (scrollHeight > clientHeight)
      // line-clamp creates a fixed height, so if content exceeds it, scrollHeight will be larger
      const scrollHeight = element.scrollHeight
      const clientHeight = element.clientHeight
      
      // Check if truncation is actually happening
      // Add small buffer (2px) to account for rounding differences
      const isActuallyTruncated = scrollHeight > clientHeight + 2
      
      setNeedsTruncation(isActuallyTruncated)
    }, 250) // Longer delay to ensure CSS line-clamp is fully applied

    return () => clearTimeout(timeoutId)
  }, [isExpanded, trimmedBio])

  // For very short bios, render directly without truncation logic
  // Full bio always in HTML for SEO
  // Center-aligned on mobile, left-aligned on desktop
  if (trimmedBio.length <= MIN_CHARS_FOR_TRUNCATION) {
    return (
      <p className="text-sunroad-brown-800 font-body leading-relaxed text-center md:text-left block">
        {trimmedBio}
      </p>
    )
  }

  // For potentially longer bios, apply truncation and check if it's actually needed
  // Full bio content always present in HTML for SEO
  // Center-aligned on mobile, left-aligned on desktop
  return (
    <div className="text-center md:text-left">
      <p 
        ref={textRef}
        className={`text-sunroad-brown-800 font-body leading-relaxed ${isExpanded ? '' : 'line-clamp-4'}`}
      >
        {trimmedBio}
      </p>
      {/* Show toggle if text is actually truncated */}
      {needsTruncation && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-sm text-sunroad-amber-600 hover:text-sunroad-amber-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 focus:ring-offset-1 rounded block w-full md:w-auto"
          aria-label={isExpanded ? 'Show less bio' : 'Show more bio'}
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  )
}

