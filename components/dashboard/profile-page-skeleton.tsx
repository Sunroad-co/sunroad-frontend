import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton loader for the dashboard profile page
 * Matches the layout structure of the actual page
 */
export default function ProfilePageSkeleton() {
  return (
    <main className="min-h-screen bg-sunroad-cream">
      {/* Header Section */}
      <header className="relative max-w-6xl mx-auto">
        {/* Banner Skeleton */}
        <div className="relative h-48 sm:h-72 md:h-88 rounded-2xl overflow-hidden">
          <Skeleton className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-sunroad-brown-900/30 via-sunroad-amber-600/20 to-transparent" />
        </div>

        {/* Avatar + Name Section Skeleton */}
        <div className="absolute -bottom-12 md:-bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center md:items-start md:left-6 md:transform-none">
          {/* Avatar Skeleton */}
          <div className="relative w-24 h-24 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden shadow-lg bg-white">
            <Skeleton className="w-full h-full rounded-full" />
          </div>
        </div>
      </header>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20">
        {/* Name Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-8 w-48 sm:w-64 mb-2 rounded-md" />
        </div>

        {/* Categories Skeleton */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>

        {/* About Section Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-6 w-16 mb-4 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
        </div>

        {/* Social Links Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-6 w-24 mb-4 rounded-md" />
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>

        {/* Works Section Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-6 w-32 mb-6 rounded-md" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                <Skeleton className="w-full h-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

