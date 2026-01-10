'use client'

import { useState, useMemo, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { revalidateCache } from '@/lib/revalidate-client'
import { useFeature } from '@/hooks/use-feature'
import { useDashboardSnapshot } from '@/hooks/use-dashboard-snapshot'
import Link from 'next/link'
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
  const { allowed: canUploadWork, reason: uploadReason } = useFeature('upload_work')
  const { refresh: refreshSnapshot } = useDashboardSnapshot()

  // Use real works from profile data
  const works = profile.works

  // Split works into active and archived
  const activeWorks = works.filter(work => !work.is_archived)
  const archivedWorks = works.filter(work => work.is_archived && work.archived_reason === 'tier_limit')

  // Helper to check if work is archived and tier-limited
  const isArchivedTierLimited = (work: Work) => {
    return work.is_archived === true && work.archived_reason === 'tier_limit'
  }

  // Refresh both profile and snapshot after operations
  const handleRefresh = useCallback(() => {
    onRefreshProfile?.()
    refreshSnapshot()
  }, [onRefreshProfile, refreshSnapshot])

  const handleEditWork = (work: Work) => {
    // Don't allow editing archived tier-limited works
    if (isArchivedTierLimited(work)) {
      return
    }
    setSelectedWork(work)
    setShowEditWorkModal(true)
  }

  const handleDeleteWork = (work: Work) => {
    // Don't allow deleting archived tier-limited works
    if (isArchivedTierLimited(work)) {
      return
    }
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
      handleRefresh()
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
          {canUploadWork ? (
            <EditButton
              onClick={() => setShowAddWorkModal(true)}
              label="Add New Work"
              size="sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </EditButton>
          ) : (
            <Link
              href="/settings#billing-actions"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-sunroad-amber-700 bg-sunroad-amber-50 border border-sunroad-amber-200 rounded-lg hover:bg-sunroad-amber-100 transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Upgrade to Add More
            </Link>
          )}
        </div>

        {!canUploadWork && uploadReason && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">{uploadReason}</p>
            <Link
              href="/settings#billing-actions"
              className="text-sm font-medium text-amber-900 hover:text-amber-700 underline mt-1 inline-block"
            >
              Upgrade to Pro →
            </Link>
          </div>
        )}

        {activeWorks.length > 0 || archivedWorks.length > 0 ? (
          <div className="space-y-8">
            {/* Active Works */}
            {activeWorks.length > 0 && (
              <div>
                <h3 className="text-lg font-display font-medium tracking-tight text-gray-900 mb-4">Active Works</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[180px]" style={{ gridAutoFlow: 'dense' }}>
                  {activeWorks.map((work) => {
                    const isEmbedAudio = isAudioEmbed(work)
                    const isVideo = work.media_type === 'video'
                    
                    // Compute grid spans based on media type
                    let gridClasses = 'h-full'
                    if (isEmbedAudio) {
                      gridClasses += ' sm:col-span-2 sm:row-span-1'
                    } else if (isVideo) {
                      gridClasses += ' sm:col-span-2 sm:row-span-2'
                    }
                    
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
              </div>
            )}

            {/* Archived Works */}
            {archivedWorks.length > 0 && (
              <div>
                <h3 className="text-lg font-display font-medium tracking-tight text-gray-700 mb-4">Archived Works</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[180px]" style={{ gridAutoFlow: 'dense' }}>
                  {archivedWorks.map((work) => {
                    const isEmbedAudio = isAudioEmbed(work)
                    const isVideo = work.media_type === 'video'
                    
                    // Compute grid spans based on media type
                    let gridClasses = 'h-full relative'
                    if (isEmbedAudio) {
                      gridClasses += ' sm:col-span-2 sm:row-span-1'
                    } else if (isVideo) {
                      gridClasses += ' sm:col-span-2 sm:row-span-2'
                    }
                    
                    return (
                      <div
                        key={work.id}
                        className={gridClasses}
                      >
                        {/* Lock Badge Overlay */}
                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 bg-amber-600 text-white text-xs font-medium rounded-md shadow-lg">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Archived</span>
                        </div>
                        <div className="opacity-60">
                          <WorkCard
                            work={work}
                            onEdit={undefined}
                            onDelete={undefined}
                            onOpen={handleOpenWork}
                          />
                        </div>
                        {/* Upgrade CTA Overlay */}
                        <div className="absolute bottom-2 left-2 right-2 z-10">
                          <Link
                            href="/settings#billing-actions"
                            className="block px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-md hover:bg-amber-700 transition-colors text-center"
                          >
                            Upgrade to restore
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
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
            {canUploadWork ? (
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
            ) : (
              <Link
                href="/settings#billing-actions"
                className="inline-flex items-center px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 transition-colors font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Upgrade to Add Works
              </Link>
            )}
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
            handleRefresh()
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
            handleRefresh()
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
