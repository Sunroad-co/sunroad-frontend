'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import ContactArtistModal from './contact-artist-modal'

interface ContactArtistCTAProps {
  artistHandle: string
  displayName: string
}

export default function ContactArtistCTA({ artistHandle, displayName }: ContactArtistCTAProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-b from-sunroad-amber-500 to-sunroad-amber-600 hover:from-sunroad-amber-600 hover:to-sunroad-amber-700 shadow-md shadow-amber-200/40 text-white font-medium"
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
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        Get in touch
      </Button>
      {isModalOpen && (
        <ContactArtistModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          artistHandle={artistHandle}
          displayName={displayName}
        />
      )}
    </>
  )
}
