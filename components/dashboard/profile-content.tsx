'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import EditButton from './edit-button'
import EditBioModal from './edit-bio-modal'
import EditLinksModal from './edit-links-modal'
import EditCategoriesModal from './edit-categories-modal'
import EditProfileBasicsModal from './edit-profile-basics-modal'
import TruncatedBio from '@/components/truncated-bio'
import ArtistSocialLinks from '@/components/artist-social-links'
import { UserProfile } from '@/hooks/use-user-profile'
import { Pencil } from 'lucide-react'

interface ProfileContentProps {
  user: User
  profile: UserProfile
  onProfileUpdate?: () => void
}

// Social Links Block Component - Extracted to avoid duplication
interface SocialLinksBlockProps {
  hasSocialLinks: boolean
  websiteUrl: string | null
  instagramUrl: string | null
  facebookUrl: string | null
  artistName: string
  onEditClick: (e?: React.MouseEvent) => void
  alignment: 'side' | 'center'
  isMobile?: boolean
}

function SocialLinksBlock({
  hasSocialLinks,
  websiteUrl,
  instagramUrl,
  facebookUrl,
  artistName,
  onEditClick,
  alignment,
  isMobile = false,
}: SocialLinksBlockProps) {
  if (hasSocialLinks) {
    return (
      <>
        <ArtistSocialLinks
          websiteUrl={websiteUrl}
          instagramUrl={instagramUrl}
          facebookUrl={facebookUrl}
          artistName={artistName}
          alignment={alignment}
        />
        {isMobile && (
          <EditButton
            onClick={() => onEditClick()}
            label="Edit Links"
            size="sm"
          />
        )}
      </>
    )
  }

  return (
    <div className={isMobile ? "text-center p-4 bg-sunroad-amber-50/50 rounded-lg border border-sunroad-amber-200 w-full max-w-sm" : "text-center"}>
      <p className={isMobile ? "text-sm text-sunroad-brown-600 mb-3 font-body" : "text-xs text-sunroad-brown-500 mb-2 font-body"}>
        Add your links so people can find you.
      </p>
      {isMobile ? (
        <EditButton
          onClick={() => onEditClick()}
          label="Add Links"
          size="sm"
        />
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEditClick(e)
          }}
          className="text-xs text-sunroad-amber-600 hover:text-sunroad-amber-700 font-medium transition-colors"
        >
          Add Links
        </button>
      )}
    </div>
  )
}

export default function ProfileContent({ user, profile, onProfileUpdate }: ProfileContentProps) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const [showBioModal, setShowBioModal] = useState(false)
  const [showLinksModal, setShowLinksModal] = useState(false)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [showProfileBasicsModal, setShowProfileBasicsModal] = useState(false)

  // Derive category IDs and location from profile (no extra queries needed)
  const currentCategoryIds = profile?.category_ids || []
  const currentLocationId = profile?.location_id ?? null
  const currentLocationFormatted = profile?.location?.formatted || null
  const currentLocationCity = profile?.location?.city || null
  const currentLocationState = profile?.location?.state || null

  // Check if social links are empty
  const hasSocialLinks = !!(profile.website_url || profile.instagram_url || profile.facebook_url)

  return (
    <>
      {/* Artist Info Section - Centered on mobile, left-aligned on desktop */}
      <header className="mt-0 md:mt-0 md:flex md:items-start md:gap-6 text-center md:text-left relative">
        {/* Spacer for avatar on desktop - matches avatar width + gap */}
        <div className="hidden md:block w-40 flex-shrink-0" />
        
        {/* Name and Info Section - Editable with hover highlight */}
        <div 
          className="flex-1 min-w-0 relative rounded-xl transition-all duration-200 md:group md:p-3 md:-m-2 md:mb-2 md:hover:bg-sunroad-amber-50/40 md:hover:ring-1 md:hover:ring-sunroad-amber-200"
        >
          {/* Artist Name */}
          <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
            <h1 className="text-2xl md:text-4xl font-display font-bold text-sunroad-brown-900">
              {profile.display_name}
            </h1>
            {/* Mobile Edit Icon */}
            <button
              onClick={() => setShowProfileBasicsModal(true)}
              className="md:hidden text-sunroad-brown-600 hover:text-sunroad-brown-800 transition-colors"
              aria-label="Edit profile basics"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          
          {/* Desktop Edit Profile Button - Always visible, more prominent on hover */}
          <div className="absolute top-0 right-0 hidden md:flex items-center gap-2">
            <span className="text-xs text-sunroad-brown-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Edit
            </span>
            <EditButton
              onClick={() => setShowProfileBasicsModal(true)}
              label="Edit Profile"
              size="sm"
            />
          </div>

          {/* Location - Both mobile and desktop */}
          {(currentLocationCity || currentLocationState) && (
            <div className="flex items-center justify-center md:justify-start gap-1.5 mb-3 text-sunroad-brown-600">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-body">
                {currentLocationCity && currentLocationState 
                  ? `${currentLocationCity}, ${currentLocationState}`
                  : currentLocationCity || currentLocationState || currentLocationFormatted
                }
              </span>
            </div>
          )}

          {/* Categories */}
          {profile.categories && profile.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4" role="list" aria-label="Artist categories">
              {profile.categories.map((category, i) => (
                <span
                  key={i}
                  role="listitem"
                  className="inline-block bg-sunroad-amber-50 text-sunroad-amber-700 text-xs font-medium px-3 py-1 rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Bio Section - Aligned with name section on desktop */}
      {profile.bio && (
        <section className="mb-8 md:flex md:items-start md:gap-6 relative">
          {/* Left column: Social links on desktop */}
          <div 
            className="hidden md:block w-40 flex-shrink-0 relative group/social rounded-xl transition-all duration-200 p-3 -m-3 hover:bg-sunroad-amber-50/40 hover:ring-1 hover:ring-sunroad-amber-200"
            onClick={() => setShowLinksModal(true)}
          >
            <SocialLinksBlock
              hasSocialLinks={hasSocialLinks}
              websiteUrl={profile.website_url}
              instagramUrl={profile.instagram_url}
              facebookUrl={profile.facebook_url}
              artistName={profile.display_name}
              onEditClick={(e) => {
                e?.stopPropagation()
                setShowLinksModal(true)
              }}
              alignment="side"
            />
            {/* Edit Links Button - Desktop, appears on hover */}
            <div className="absolute top-0 right-0 opacity-0 group-hover/social:opacity-100 transition-opacity -mt-1 flex items-center gap-2">
              <span className="text-xs text-sunroad-brown-500">Edit</span>
              <EditButton
                onClick={(e) => {
                  e.stopPropagation()
                  setShowLinksModal(true)
                }}
                label="Edit Links"
                size="sm"
              />
            </div>
          </div>
          <div 
            className="flex-1 min-w-0 relative rounded-xl transition-all duration-200 md:group md:p-3 md:-m-3 md:hover:bg-sunroad-amber-50/40 md:hover:ring-1 md:hover:ring-sunroad-amber-200"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <TruncatedBio bio={profile.bio} />
              </div>
              {/* Mobile Edit Icon for Bio */}
              <button
                onClick={() => setShowBioModal(true)}
                className="md:hidden text-sunroad-brown-600 hover:text-sunroad-brown-800 transition-colors mt-1"
                aria-label="Edit bio"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            
            {/* Social Links - Mobile Only, Below Bio */}
            <div className="flex flex-col items-center mt-4 md:hidden gap-3">
              <SocialLinksBlock
                hasSocialLinks={hasSocialLinks}
                websiteUrl={profile.website_url}
                instagramUrl={profile.instagram_url}
                facebookUrl={profile.facebook_url}
                artistName={profile.display_name}
                onEditClick={() => setShowLinksModal(true)}
                alignment="center"
                isMobile={true}
              />
            </div>
            
            {/* Edit Bio Button - Desktop */}
            <div className="absolute top-0 right-0 opacity-70 hover:opacity-100 transition-opacity mt-1 hidden md:flex items-center gap-2">
              <span className="text-xs text-sunroad-brown-500">Edit</span>
              <EditButton
                onClick={() => setShowBioModal(true)}
                label="Edit Bio"
                size="sm"
              />
            </div>
          </div>
        </section>
      )}
      
      {/* Bio Section - Empty state */}
      {!profile.bio && (
        <section className="mb-8 md:flex md:items-start md:gap-6 relative">
          {/* Left column: Social links on desktop */}
          <div 
            className="hidden md:block w-40 flex-shrink-0 relative group/social rounded-xl transition-all duration-200 p-3 -m-3 hover:bg-sunroad-amber-50/40 hover:ring-1 hover:ring-sunroad-amber-200"
          >
            <SocialLinksBlock
              hasSocialLinks={hasSocialLinks}
              websiteUrl={profile.website_url}
              instagramUrl={profile.instagram_url}
              facebookUrl={profile.facebook_url}
              artistName={profile.display_name}
              onEditClick={() => setShowLinksModal(true)}
              alignment="side"
            />
            {/* Edit Links Button - Desktop, appears on hover */}
            <div className="absolute top-0 right-0 opacity-0 group-hover/social:opacity-100 transition-opacity -mt-1 flex items-center gap-2">
              <span className="text-xs text-sunroad-brown-500">Edit</span>
              <EditButton
                onClick={() => setShowLinksModal(true)}
                label="Edit Links"
                size="sm"
              />
            </div>
          </div>
          <div 
            className="flex-1 min-w-0 relative rounded-xl transition-all duration-200 md:group md:p-3 md:-m-3 md:hover:bg-sunroad-amber-50/40 md:hover:ring-1 md:hover:ring-sunroad-amber-200"
          >
            <div className="flex items-start gap-2">
              <p className="text-sunroad-brown-500 font-body italic mb-4 flex-1">
                No bio added yet. Click edit to add your story!
              </p>
              {/* Mobile Edit Icon for Bio */}
              <button
                onClick={() => setShowBioModal(true)}
                className="md:hidden text-sunroad-brown-600 hover:text-sunroad-brown-800 transition-colors"
                aria-label="Edit bio"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            
            {/* Social Links - Mobile Only, Below Empty Bio Message */}
            <div className="flex flex-col items-center mt-4 md:hidden gap-3">
              <SocialLinksBlock
                hasSocialLinks={hasSocialLinks}
                websiteUrl={profile.website_url}
                instagramUrl={profile.instagram_url}
                facebookUrl={profile.facebook_url}
                artistName={profile.display_name}
                onEditClick={() => setShowLinksModal(true)}
                alignment="center"
                isMobile={true}
              />
            </div>
            
            {/* Edit Bio Button - Desktop */}
            <div className="absolute top-0 right-0 opacity-70 hover:opacity-100 transition-opacity hidden md:flex items-center gap-2">
              <span className="text-xs text-sunroad-brown-500">Edit</span>
              <EditButton
                onClick={() => setShowBioModal(true)}
                label="Edit Bio"
                size="sm"
              />
            </div>
          </div>
        </section>
      )}


      {/* Modals */}
      {showBioModal && (
        <EditBioModal
          isOpen={showBioModal}
          onClose={() => setShowBioModal(false)}
          currentBio={profile.bio || ''}
          profile={profile}
          onSuccess={(nextBio) => {
            // Update local state optimistically or trigger refetch
            if (onProfileUpdate) {
              onProfileUpdate()
            }
          }}
        />
      )}
      
      {showLinksModal && (
        <EditLinksModal
          isOpen={showLinksModal}
          onClose={() => setShowLinksModal(false)}
          currentLinks={{
            website: profile.website_url || undefined,
            instagram: profile.instagram_url || undefined,
            facebook: profile.facebook_url || undefined
          }}
          profile={profile}
          onSuccess={() => {
            // Trigger refetch to update profile
            if (onProfileUpdate) {
              onProfileUpdate()
            }
          }}
        />
      )}
      
      {showCategoriesModal && (
        <EditCategoriesModal
          isOpen={showCategoriesModal}
          onClose={() => setShowCategoriesModal(false)}
          profile={profile}
          currentCategoryIds={currentCategoryIds}
          onSuccess={(nextCategoryIds) => {
            // Trigger refetch to update profile (categoryIds are now in profile)
            if (onProfileUpdate) {
              onProfileUpdate()
            }
          }}
        />
      )}

      {showProfileBasicsModal && (
        <EditProfileBasicsModal
          isOpen={showProfileBasicsModal}
          onClose={() => setShowProfileBasicsModal(false)}
          profile={profile}
          currentCategoryIds={currentCategoryIds}
          currentLocationId={currentLocationId}
          currentLocationFormatted={currentLocationFormatted}
          onSuccess={() => {
            // Trigger refetch to update profile
            if (onProfileUpdate) {
              onProfileUpdate()
            }
          }}
        />
      )}
    </>
  )
}
