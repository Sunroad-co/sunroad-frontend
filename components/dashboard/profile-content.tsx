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
import ScrollableCategories from '@/components/scrollable-categories'
import { UserProfile } from '@/hooks/use-user-profile'
import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot'
import { Pencil } from 'lucide-react'
import { getProfileUrl } from '@/lib/utils/profile-url'

interface ProfileContentProps {
  user: User
  profile: UserProfile
  onProfileUpdate?: () => void
}

// Social Links Block Component - Extracted to avoid duplication
interface SocialLinksBlockProps {
  hasSocialLinks: boolean
  links: Array<{
    id?: number
    platform_key: string
    url: string
    label?: string | null
    platform?: {
      display_name?: string
      icon_key?: string
    } | null
  }>
  artistName: string
  onEditClick: (e?: React.MouseEvent) => void
  alignment: 'side' | 'center'
  isMobile?: boolean
}

function SocialLinksBlock({
  hasSocialLinks,
  links,
  artistName,
  onEditClick,
  alignment,
  isMobile = false,
}: SocialLinksBlockProps) {
  if (hasSocialLinks) {
    return (
      <>
        <ArtistSocialLinks
          links={links}
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

  // Get limits from dashboard snapshot to check can_receive_contact
  const { limits } = useDashboardSnapshot()
  const canReceiveContact = limits?.can_receive_contact === true

  // Derive category IDs, category names, and location from snapshot.profile (no extra queries)
  // Ensure empty-state decisions are based on snapshot.profile (not on local state that starts empty)
  const currentCategoryIds = profile?.category_ids || []
  const categoryNames = profile?.categories || []
  const currentLocationId = profile?.location_id ?? null
  const currentLocationFormatted = profile?.location?.formatted || null
  const currentLocationCity = profile?.location?.city || null
  const currentLocationState = profile?.location?.state || null

  // Compute links from artist_links (filter public and active platforms)
  const links = (profile.artist_links ?? []).filter(l => l.is_public !== false && (l.platform?.is_active ?? true))
  const hasSocialLinks = links.length > 0

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
          
          {/* Mobile View Public Profile Button */}
          <div className="flex justify-center md:hidden mb-3">
            <a
              href={getProfileUrl(profile.handle)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sunroad-brown-600 hover:text-sunroad-brown-900 hover:bg-sunroad-amber-50 rounded transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>View public profile</span>
            </a>
          </div>
          
          {/* Desktop Edit Profile Button - Always visible, more prominent on hover */}
          <div className="absolute top-0 right-0 hidden md:flex items-center gap-2">
            <a
              href={getProfileUrl(profile.handle)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-sunroad-brown-600 hover:text-sunroad-brown-900 hover:bg-sunroad-amber-50 rounded transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>View public profile</span>
            </a>
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
          {categoryNames && categoryNames.length > 0 && (
            <ScrollableCategories 
              categories={categoryNames}
              aria-label="Artist categories"
            />
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
              links={links}
              artistName={profile.display_name}
              onEditClick={(e) => {
                e?.stopPropagation()
                setShowLinksModal(true)
              }}
              alignment="side"
            />
            {/* Edit Links Button - Desktop, appears on hover */}
            <div 
              className="absolute top-0 right-0 opacity-0 group-hover/social:opacity-100 transition-opacity -mt-1 flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
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
                links={links}
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
              links={links}
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
                links={links}
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

      {/* Contact Form Info Card */}
      {canReceiveContact && (
        <section className="mb-8">
          <div className="bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="w-6 h-6 text-sunroad-amber-700"
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
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-sunroad-brown-900 mb-1">
                  Contact Form Enabled
                </h3>
                <p className="text-sm text-sunroad-brown-700">
                  Visitors can reach you via a contact form on your public profile. Messages go to your Sun Road account email.
                </p>
              </div>
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
          currentLinks={profile.artist_links}
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
