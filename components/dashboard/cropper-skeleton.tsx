import { Skeleton } from '@/components/ui/skeleton'

interface CropperSkeletonProps {
  aspectRatio?: 'square' | 'rectangular'
  className?: string
}

/**
 * Skeleton loader for the image cropper component
 * - Square: for avatar (circular crop)
 * - Rectangular: for banner (3:1 ratio)
 */
export default function CropperSkeleton({ 
  aspectRatio = 'square',
  className 
}: CropperSkeletonProps) {
  const isSquare = aspectRatio === 'square'
  
  return (
    <div className={`relative w-full ${isSquare ? 'h-64 sm:h-80' : 'h-48 sm:h-64'} bg-sunroad-cream rounded-lg overflow-hidden ${className || ''}`}>
      {/* Base shimmer background */}
      <Skeleton className="w-full h-full rounded-lg" />
      
      {/* Crop overlay indicator */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className={`border-2 border-white/90 ${isSquare ? 'rounded-full w-48 h-48 sm:w-56 sm:h-56' : 'rounded-lg w-3/4 h-24 sm:h-32'} shadow-xl backdrop-blur-sm`}
          style={{
            boxShadow: '0 0 0 1px rgba(217, 119, 6, 0.15), 0 4px 12px rgba(217, 119, 6, 0.1)'
          }}
        />
      </div>
      
      {/* Subtle grid pattern overlay with brand colors */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(217, 119, 6, 0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(217, 119, 6, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }} 
        />
      </div>
    </div>
  )
}

