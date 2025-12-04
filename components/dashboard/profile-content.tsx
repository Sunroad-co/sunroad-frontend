'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import EditButton from './edit-button'
import EditBioModal from './edit-bio-modal'
import EditLinksModal from './edit-links-modal'
import EditCategoriesModal from './edit-categories-modal'
import TruncatedBio from '@/components/truncated-bio'
import ArtistSocialLinks from '@/components/artist-social-links'
import { UserProfile } from '@/hooks/use-user-profile'

interface ProfileContentProps {
  user: User
  profile: UserProfile
  onProfileUpdate?: () => void
}

export default function ProfileContent({ user, profile, onProfileUpdate }: ProfileContentProps) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const [showBioModal, setShowBioModal] = useState(false)
  const [showLinksModal, setShowLinksModal] = useState(false)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [currentCategoryIds, setCurrentCategoryIds] = useState<number[]>([])

  // Fetch category IDs when profile changes
  useEffect(() => {
    const fetchCategoryIds = async () => {
      if (!profile?.id) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('artist_categories')
          .select('category_id')
          .eq('artist_id', profile.id)

        if (error) {
          console.error('Error fetching category IDs:', error)
          return
        }

        const categoryIds = data?.map((ac: { category_id: number }) => ac.category_id) || []
        setCurrentCategoryIds(categoryIds)
      } catch (err) {
        console.error('Unexpected error fetching category IDs:', err)
      }
    }

    fetchCategoryIds()
  }, [profile?.id])

  return (
    <>
      {/* Artist Info Section - Centered on mobile, left-aligned on desktop */}
      <header className="mt-0 md:mt-0 md:flex md:items-start md:gap-6 text-center md:text-left relative">
        {/* Spacer for avatar on desktop - matches avatar width + gap */}
        <div className="hidden md:block w-40 flex-shrink-0" />
        
        {/* Name and Info Section */}
        <div className="flex-1 min-w-0 relative group">
          {/* Artist Name */}
          <h1 className="text-2xl md:text-4xl font-display font-bold text-sunroad-brown-900 mb-3">
            {profile.display_name}
          </h1>
          
          {/* Edit Name Button */}
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <EditButton
              onClick={() => console.log('Edit name clicked')}
              label="Edit Name"
              size="sm"
            />
          </div>

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
          
          {/* Edit Categories Button */}
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <EditButton
              onClick={() => setShowCategoriesModal(true)}
              label="Edit Categories"
              size="sm"
            />
          </div>
        </div>
      </header>

      {/* Bio Section - Aligned with name section on desktop */}
      {profile.bio && (
        <section className="mb-8 md:flex md:items-start md:gap-6 relative group">
          {/* Left column: Social links on desktop */}
          <div className="hidden md:block w-40 flex-shrink-0 relative group/social">
            <ArtistSocialLinks
              websiteUrl={profile.website_url}
              instagramUrl={profile.instagram_url}
              facebookUrl={profile.facebook_url}
              artistName={profile.display_name}
              alignment="side"
            />
            {/* Edit Links Button - Desktop, appears on hover */}
            <div className="absolute top-0 right-0 opacity-0 group-hover/social:opacity-100 transition-opacity -mt-1">
              <EditButton
                onClick={() => setShowLinksModal(true)}
                label="Edit Links"
                size="sm"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <TruncatedBio bio={profile.bio} />
            
            {/* Social Links - Mobile Only, Below Bio */}
            <div className="flex flex-col items-center mt-4 md:hidden gap-3">
              <ArtistSocialLinks
                websiteUrl={profile.website_url}
                instagramUrl={profile.instagram_url}
                facebookUrl={profile.facebook_url}
                artistName={profile.display_name}
                alignment="center"
              />
              {/* Edit Links Button - Mobile */}
              <EditButton
                onClick={() => setShowLinksModal(true)}
                label="Edit Links"
                size="sm"
              />
            </div>
            
            {/* Edit Bio Button */}
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
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
        <section className="mb-8 md:flex md:items-start md:gap-6 relative group">
          {/* Left column: Social links on desktop */}
          <div className="hidden md:block w-40 flex-shrink-0 relative group/social">
            <ArtistSocialLinks
              websiteUrl={profile.website_url}
              instagramUrl={profile.instagram_url}
              facebookUrl={profile.facebook_url}
              artistName={profile.display_name}
              alignment="side"
            />
            {/* Edit Links Button - Desktop, appears on hover */}
            <div className="absolute top-0 right-0 opacity-0 group-hover/social:opacity-100 transition-opacity -mt-1">
              <EditButton
                onClick={() => setShowLinksModal(true)}
                label="Edit Links"
                size="sm"
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sunroad-brown-500 font-body italic mb-4">
              No bio added yet. Click edit to add your story!
            </p>
            
            {/* Social Links - Mobile Only, Below Empty Bio Message */}
            <div className="flex flex-col items-center mt-4 md:hidden gap-3">
              <ArtistSocialLinks
                websiteUrl={profile.website_url}
                instagramUrl={profile.instagram_url}
                facebookUrl={profile.facebook_url}
                artistName={profile.display_name}
                alignment="center"
              />
              {/* Edit Links Button - Mobile */}
              <EditButton
                onClick={() => setShowLinksModal(true)}
                label="Edit Links"
                size="sm"
              />
            </div>
            
            {/* Edit Bio Button */}
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
            // Update local state
            setCurrentCategoryIds(nextCategoryIds)
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
