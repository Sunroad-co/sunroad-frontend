import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

/**
 * Base skeleton component with shimmer animation using Sunroad brand colors
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-sunroad-amber-50 via-sunroad-amber-100/80 to-sunroad-amber-50 bg-[length:200%_100%] animate-shimmer rounded',
        className
      )}
      {...props}
    />
  )
}

