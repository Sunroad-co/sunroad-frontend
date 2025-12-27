'use client'

import { useState } from 'react'
import WorkCard, { isAudioEmbed } from '@/components/dashboard/work-card'
import WorkDetailModal from '@/components/dashboard/work-detail-modal'
import { Work } from '@/hooks/use-user-profile'

interface WorksGalleryProps {
  works: Work[]
}

export default function WorksGallery({ works }: WorksGalleryProps) {
  const [activeWork, setActiveWork] = useState<Work | null>(null)
  const [showWorkModal, setShowWorkModal] = useState(false)

  const handleOpenWork = (work: Work) => {
    setActiveWork(work)
    setShowWorkModal(true)
  }

  const handleCloseWorkModal = () => {
    setShowWorkModal(false)
    setActiveWork(null)
  }

  if (!works || works.length === 0) {
    return <p className="text-gray-500 text-center py-8">No works available yet.</p>
  }

  return (
    <>
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
                onOpen={handleOpenWork}
                // no onEdit prop → view-only
              />
            </div>
          )
        })}
      </div>
      <WorkDetailModal
        work={activeWork}
        isOpen={showWorkModal}
        onClose={handleCloseWorkModal}
      />
    </>
  )
}
