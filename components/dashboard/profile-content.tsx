'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import EditButton from './edit-button'
import EditBioModal from './edit-bio-modal'
import EditLinksModal from './edit-links-modal'
import EditCategoriesModal from './edit-categories-modal'
import TruncatedBio from '@/components/truncated-bio'
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
      <header className="mt-2 md:mt-0 md:flex md:items-start md:gap-6 text-center md:text-left relative">
        {/* Spacer for avatar on desktop - matches avatar width + gap */}
        <div className="hidden md:block w-40 flex-shrink-0" />
        
        {/* Name and Info Section */}
        <div className="flex-1 min-w-0 relative group">
          {/* Artist Name */}
          <h1 className="text-3xl md:text-5xl font-display font-bold text-sunroad-brown-900 mb-3">
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
          <div className="hidden md:block w-40 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <TruncatedBio bio={profile.bio} />
            
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
          <div className="hidden md:block w-40 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sunroad-brown-500 font-body italic mb-4">
              No bio added yet. Click edit to add your story!
            </p>
            
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

      {/* Social Links */}
      <nav className="mb-8 md:flex md:items-start md:gap-6 relative group">
        <div className="hidden md:block w-40 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-display font-semibold text-sunroad-brown-900 mb-4">Social Links</h2>
          <div className="flex flex-wrap gap-3">
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Website"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-sunroad-amber-800 text-white hover:bg-sunroad-amber-900 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 7 7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zM8.5 5v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472" />
                </svg>
              </a>
            )}
            {profile.instagram_url && (
              <a
                href={profile.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-sunroad-amber-800 text-white hover:bg-sunroad-amber-900 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2c1.6 0 3 1.4 3 3v10c0 1.6-1.4 3-3 3H7c-1.6 0-3-1.4-3-3V7c0-1.6 1.4-3 3-3h10zm-5 3a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm4.8-2.9a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2z"/>
              </svg>
            </a>
            )}
            {profile.facebook_url && (
              <a
                href={profile.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-sunroad-amber-800 text-white hover:bg-sunroad-amber-900 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.2l-.4 3h-1.8v7A10 10 0 0022 12"/>
                </svg>
              </a>
            )}
            {!profile.website_url && !profile.instagram_url && !profile.facebook_url && (
              <span className="text-sunroad-brown-500 text-sm italic">No social links added yet</span>
            )}
          </div>
          
          {/* Edit Links Button */}
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <EditButton
              onClick={() => setShowLinksModal(true)}
              label="Edit Links"
              size="sm"
            />
          </div>
        </div>
      </nav>

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
