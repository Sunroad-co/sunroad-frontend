'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import Image from 'next/image'
import EditButton from './edit-button'
import EditBannerModal from './edit-banner-modal'
import EditAvatarModal from './edit-avatar-modal'
import { UserProfile } from '@/hooks/use-user-profile'

interface ProfileHeaderProps {
  user: User
  profile: UserProfile
}

export default function ProfileHeader({ user, profile }: ProfileHeaderProps) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const [showBannerModal, setShowBannerModal] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)

  return (
    <>
      <header className="relative max-w-6xl mx-auto">
        {/* Banner */}
        <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden group">
          {profile.banner_url ? (
            <Image
              src={profile.banner_url}
              alt={`${profile.display_name} banner`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sunroad-amber-200 to-sunroad-amber-300 flex items-center justify-center">
              <div className="text-center text-sunroad-brown-700">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Add a banner image</p>
              </div>
            </div>
          )}
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Edit Banner Button */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <EditButton
              onClick={() => setShowBannerModal(true)}
              label="Edit Banner"
              size="sm"
            />
          </div>
        </div>

        {/* Avatar + Name Section */}
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center sm:items-start sm:left-6 sm:transform-none">
          {/* Avatar */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white overflow-hidden shadow-lg bg-white group">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={`${profile.display_name} profile picture`}
                width={200}
                height={200}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full bg-sunroad-amber-100 flex items-center justify-center text-2xl text-sunroad-brown-600 rounded-full">
                {profile.display_name?.charAt(0)}
              </div>
            )}
            
            {/* Edit Avatar Button */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <EditButton
                onClick={() => setShowAvatarModal(true)}
                label="Edit Avatar"
                size="sm"
                variant="white"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      {showBannerModal && (
        <EditBannerModal
          isOpen={showBannerModal}
          onClose={() => setShowBannerModal(false)}
          currentBanner={profile.banner_url || undefined}
        />
      )}
      
      {showAvatarModal && (
        <EditAvatarModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          currentAvatar={profile.avatar_url || undefined}
        />
      )}
    </>
  )
}
