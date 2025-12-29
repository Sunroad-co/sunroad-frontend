'use client'

import { useState, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { revalidateCache } from '@/lib/revalidate-client'
import EditButton from './edit-button'
import AddWorkModal from './add-work-modal'
import EditWorkModal from './edit-work-modal'
import WorkDetailModal from './work-detail-modal'
import WorkCard, { isAudioEmbed } from './work-card'
import ConfirmDialog from '@/components/ui/confirm-dialog'
import Toast from '@/components/ui/toast'
import { UserProfile, Work } from '@/hooks/use-user-profile'

interface WorksSectionProps {
  user: User
  profile: UserProfile
  onRefreshProfile?: () => void
}

export default function WorksSection({ user, profile, onRefreshProfile }: WorksSectionProps) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const [showAddWorkModal, setShowAddWorkModal] = useState(false)
  const [showEditWorkModal, setShowEditWorkModal] = useState(false)
  const [showWorkModal, setShowWorkModal] = useState(false)
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)
  const [activeWork, setActiveWork] = useState<Work | null>(null)
  const [workToDelete, setWorkToDelete] = useState<Work | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const supabase = useMemo(() => createClient(), [])

  // Use real works from profile data
  const works = profile.works

  const handleEditWork = (work: Work) => {
    setSelectedWork(work)
    setShowEditWorkModal(true)
  }

  const handleDeleteWork = (work: Work) => {
    setWorkToDelete(work)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!workToDelete) return

    try {
      setDeleting(true)

      // If it's an uploaded image, attempt to remove from storage
      if (workToDelete.media_source === 'upload') {
        const pathsToRemove: string[] = []
        if (workToDelete.thumb_url && workToDelete.thumb_url.startsWith('artworks/')) {
          pathsToRemove.push(workToDelete.thumb_url)
        }
        if (workToDelete.src_url && workToDelete.src_url.startsWith('artworks/') && workToDelete.src_url !== workToDelete.thumb_url) {
          pathsToRemove.push(workToDelete.src_url)
        }

        if (pathsToRemove.length > 0) {
          await supabase.storage
            .from('media')
            .remove(pathsToRemove)
            .catch(() => {
              // Ignore cleanup errors
            })
        }
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('artworks_min')
        .delete()
        .eq('id', workToDelete.id)

      if (deleteError) {
        throw new Error(`Failed to delete work: ${deleteError.message}`)
      }

      // Revalidate cache
      if (profile.handle) {
        await revalidateCache({
          handle: profile.handle,
          artistId: profile.id,
          tags: [`artist:${profile.handle}`, `artist-works:${profile.id}`],
        })
      }

      // Success
      setToastMessage('Work deleted successfully!')
      setShowToast(true)
      setShowDeleteConfirm(false)
      setWorkToDelete(null)
      onRefreshProfile?.()
    } catch (err) {
      console.error('Error deleting work:', err)
      setToastMessage(err instanceof Error ? err.message : 'Failed to delete work. Please try again.')
      setShowToast(true)
    } finally {
      setDeleting(false)
    }
  }

  const handleOpenWork = (work: Work) => {
    setActiveWork(work)
    setShowWorkModal(true)
  }

  const handleCloseWorkModal = () => {
    setShowWorkModal(false)
    setActiveWork(null)
  }

  return (
    <>
      <section className="mb-12 relative group">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold tracking-tight text-gray-900">My Works</h2>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[180px]" style={{ gridAutoFlow: 'dense' }}>
            {works.map((work) => {
              const isEmbedAudio = isAudioEmbed(work)
              const isVideo = work.media_type === 'video'
              
              // Compute grid spans based on media type
              let gridClasses = 'h-full'
              if (isEmbedAudio) {
                gridClasses += ' sm:col-span-2 sm:row-span-1'
              } else if (isVideo) {
                gridClasses += ' sm:col-span-2 sm:row-span-2'
              }
              // Images default to 1x1 (no additional spans needed)
              
              return (
                <div
                  key={work.id}
                  className={gridClasses}
                >
                  <WorkCard
                    work={work}
                    onEdit={handleEditWork}
                    onDelete={handleDeleteWork}
                    onOpen={handleOpenWork}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-display font-medium tracking-tight text-gray-900 mb-2">No works yet</h3>
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
          profile={profile}
          onSuccess={() => {
            setShowAddWorkModal(false)
            onRefreshProfile?.()
          }}
        />
      )}
      
      {showEditWorkModal && selectedWork && (
        <EditWorkModal
          isOpen={showEditWorkModal}
          onClose={() => {
            setShowEditWorkModal(false)
            setSelectedWork(null)
          }}
          profile={profile}
          work={selectedWork}
          onSuccess={() => {
            setShowEditWorkModal(false)
            setSelectedWork(null)
            onRefreshProfile?.()
          }}
        />
      )}

      {/* Work Detail Modal */}
      <WorkDetailModal
        work={activeWork}
        isOpen={showWorkModal}
        onClose={handleCloseWorkModal}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Work?"
        message="Are you sure you want to delete this work? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setWorkToDelete(null)
        }}
        isLoading={deleting}
        loadingLabel="Deleting..."
      />

      {/* Toast */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}
