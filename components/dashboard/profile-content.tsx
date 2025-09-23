'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import EditButton from './edit-button'
import EditBioModal from './edit-bio-modal'
import EditLinksModal from './edit-links-modal'
import EditCategoriesModal from './edit-categories-modal'
import { UserProfile } from '@/hooks/use-user-profile'

interface ProfileContentProps {
  user: User
  profile: UserProfile
}

export default function ProfileContent({ user, profile }: ProfileContentProps) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const [showBioModal, setShowBioModal] = useState(false)
  const [showLinksModal, setShowLinksModal] = useState(false)
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)

  return (
    <>
      <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Artist Name */}
        <header className="mt-3 text-center sm:text-left relative group">
          <h1 className="text-5xl sm:text-2xl font-bold text-gray-900 mb-2 drop-shadow-md">
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
        </header>

        {/* Categories */}
        <section className="mb-8 relative group">
          <div className="flex flex-wrap gap-2 mt-3">
            {profile.categories.length > 0 ? (
              profile.categories.map((category, i) => (
                <span
                  key={i}
                  className="inline-block mb-2 bg-amber-50 text-amber-700 text-xs font-medium px-3 py-1 rounded-full"
                >
                  {category}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm italic">No categories added yet</span>
            )}
          </div>
          
          {/* Edit Categories Button */}
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <EditButton
              onClick={() => setShowCategoriesModal(true)}
              label="Edit Categories"
              size="sm"
            />
          </div>
        </section>

        {/* About */}
        <section className="mb-8 relative group">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
          <p className="text-gray-700 mb-4">
            {profile.bio || "No bio added yet. Click edit to add your story!"}
          </p>
          
          {/* Edit Bio Button */}
          <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <EditButton
              onClick={() => setShowBioModal(true)}
              label="Edit Bio"
              size="sm"
            />
          </div>
        </section>

        {/* Social Links */}
        <nav className="mb-8 relative group">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Links</h2>
          <div className="flex flex-wrap gap-3">
            {profile.website_url && (
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Website"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-800 text-white hover:bg-amber-900 transition-colors"
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
                className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-800 text-white hover:bg-amber-900 transition-colors"
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
                className="w-10 h-10 flex items-center justify-center rounded-full bg-amber-800 text-white hover:bg-amber-900 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.1 1.8.1v2h-1c-1 0-1.3.6-1.3 1.2V12h2.2l-.4 3h-1.8v7A10 10 0 0022 12"/>
                </svg>
              </a>
            )}
            {!profile.website_url && !profile.instagram_url && !profile.facebook_url && (
              <span className="text-gray-500 text-sm italic">No social links added yet</span>
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
        </nav>
      </article>

      {/* Modals */}
      {showBioModal && (
        <EditBioModal
          isOpen={showBioModal}
          onClose={() => setShowBioModal(false)}
          currentBio={profile.bio || ''}
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
        />
      )}
      
      {showCategoriesModal && (
        <EditCategoriesModal
          isOpen={showCategoriesModal}
          onClose={() => setShowCategoriesModal(false)}
          currentCategories={profile.categories}
        />
      )}
    </>
  )
}
