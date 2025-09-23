'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import Image from 'next/image'
import EditButton from './edit-button'
import AddWorkModal from './add-work-modal'
import EditWorkModal from './edit-work-modal'
import { UserProfile } from '@/hooks/use-user-profile'

interface Work {
  id: string
  title: string
  thumb_url: string
  description?: string
}

interface WorksSectionProps {
  user: User
  profile: UserProfile
}

export default function WorksSection({ user, profile }: WorksSectionProps) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const [showAddWorkModal, setShowAddWorkModal] = useState(false)
  const [showEditWorkModal, setShowEditWorkModal] = useState(false)
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)

  // Use real works from profile data
  const works = profile.works

  const handleEditWork = (work: Work) => {
    setSelectedWork(work)
    setShowEditWorkModal(true)
  }

  return (
    <>
      <section className="mb-12 relative group">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">My Works</h2>
          <EditButton
            onClick={() => setShowAddWorkModal(true)}
            label="Add New Work"
            size="sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </EditButton>
        </div>

        {works.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {works.map((work) => (
              <div
                key={work.id}
                className="relative group/work rounded-lg overflow-hidden cursor-pointer"
              >
                <Image
                  src={work.thumb_url}
                  alt={work.title}
                  width={400}
                  height={300}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover/work:scale-105"
                />
                
                {/* Work Info Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/work:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="font-medium text-sm mb-1">{work.title}</h3>
                    {work.description && (
                      <p className="text-xs text-gray-200 line-clamp-2">{work.description}</p>
                    )}
                  </div>
                </div>

                {/* Edit Work Button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover/work:opacity-100 transition-opacity">
                  <EditButton
                    onClick={() => handleEditWork(work)}
                    label="Edit Work"
                    size="sm"
                    variant="white"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No works yet</h3>
            <p className="text-gray-500 mb-4">Start building your portfolio by adding your first work</p>
            <EditButton
              onClick={() => setShowAddWorkModal(true)}
              label="Add Your First Work"
              size="md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Work
            </EditButton>
          </div>
        )}
      </section>

      {/* Modals */}
      {showAddWorkModal && (
        <AddWorkModal
          isOpen={showAddWorkModal}
          onClose={() => setShowAddWorkModal(false)}
        />
      )}
      
      {showEditWorkModal && selectedWork && (
        <EditWorkModal
          isOpen={showEditWorkModal}
          onClose={() => setShowEditWorkModal(false)}
          work={selectedWork}
        />
      )}
    </>
  )
}
