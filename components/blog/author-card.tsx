import Link from 'next/link'
import { BlogPostAuthor } from '@/lib/sanity/queries'

interface AuthorCardProps {
  author?: BlogPostAuthor
}

export default function AuthorCard({ author }: AuthorCardProps) {
  if (!author) return null

  const authorName = author.name || 'Anonymous'
  const hasSunroadHandle = !!author.sunroadHandle

  return (
    <div className="bg-sunroad-amber-50 rounded-lg p-4 sm:p-6 border border-sunroad-amber-200">
      <div className="flex items-center gap-4">
        {/* Avatar placeholder */}
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-sunroad-amber-200 to-sunroad-amber-300 flex items-center justify-center flex-shrink-0">
          <span className="text-sunroad-amber-700 font-semibold text-lg sm:text-xl">
            {authorName.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Author Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-sunroad-brown-600 mb-1">Written by</p>
          {hasSunroadHandle ? (
            <Link
              href={`/artists/${author.sunroadHandle}`}
              className="text-lg sm:text-xl font-display font-semibold text-sunroad-brown-900 hover:text-sunroad-amber-600 transition-colors"
            >
              {authorName}
            </Link>
          ) : (
            <p className="text-lg sm:text-xl font-display font-semibold text-sunroad-brown-900">
              {authorName}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

