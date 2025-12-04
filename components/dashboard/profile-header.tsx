'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import Image from 'next/image'
import EditButton from './edit-button'
import EditBannerModal from './edit-banner-modal'
import EditAvatarModal from './edit-avatar-modal'
import { UserProfile } from '@/hooks/use-user-profile'
import { getMediaUrl } from '@/lib/media'

interface ProfileHeaderProps {
  user: User
  profile: UserProfile
  onProfileUpdate?: () => void
}

export default function ProfileHeader({ user, profile, onProfileUpdate }: ProfileHeaderProps) {
  const [showBannerModal, setShowBannerModal] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)

  return (
    <>
      <header className="relative max-w-6xl mx-auto font-display">
        {/* Banner */}
        <div className="relative h-48 sm:h-72 md:h-88 rounded-2xl overflow-hidden group">
          {(() => {
            const bannerSrc = getMediaUrl(profile.banner_url);
            return bannerSrc ? (
              <Image
                src={bannerSrc}
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
            );
          })()}
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Hover Overlay with Edit Button */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowBannerModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-sunroad-brown-800 rounded-lg transition-colors font-medium text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Update Banner</span>
            </button>
          </div>
        </div>

        {/* Avatar + Name Section */}
        <div className="absolute -bottom-12 md:-bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center md:items-start md:left-6 md:transform-none">
          {/* Avatar */}
          <div className="relative w-24 h-24 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden shadow-lg bg-white group">
            {(() => {
              const avatarSrc = getMediaUrl(profile.avatar_url);
              return avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={`${profile.display_name} profile picture`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
              <div className="w-full h-full font-display bg-sunroad-amber-100 flex items-center justify-center text-2xl text-sunroad-brown-600 rounded-full">
                {profile.display_name?.charAt(0)}
              </div>
              );
            })()}
            
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
          profile={profile}
          onSuccess={onProfileUpdate}
        />
      )}
      
      {showAvatarModal && (
        <EditAvatarModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          currentAvatar={profile.avatar_url || undefined}
          profile={profile}
          onSuccess={onProfileUpdate}
        />
      )}
    </>
  )
}
