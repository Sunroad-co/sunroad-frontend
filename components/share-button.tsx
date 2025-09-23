'use client'

import { useState } from 'react'
import Toast from './ui/toast'

interface ShareButtonProps {
  artistName: string
  artistHandle: string
  className?: string
}

export default function ShareButton({ artistName, artistHandle, className = '' }: ShareButtonProps) {
  const [showToast, setShowToast] = useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}/artists/${artistHandle}`
    const text = `Hey, check out this amazing artist ${artistName} on Sun Road! 🎨✨\n\n${url}`
    
    try {
      if (navigator.share) {
        // Use native share API if available
        await navigator.share({
          title: `${artistName} | Sun Road`,
          text: text,
          url: url
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(text)
        setShowToast(true)
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // Fallback to clipboard if native share fails
      try {
        await navigator.clipboard.writeText(text)
        setShowToast(true)
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError)
      }
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        className={`
          inline-flex items-center space-x-2 px-4 py-2 
          bg-sunroad-amber-600 hover:bg-sunroad-amber-700 
          text-white rounded-lg transition-all duration-200 
          transform hover:scale-105 hover:shadow-lg
          font-medium text-sm
          ${className}
        `}
        aria-label={`Share ${artistName}'s profile`}
      >
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" 
          />
        </svg>
        <span>Share</span>
      </button>

      <Toast
        message="Link copied to clipboard! 🎨"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}
