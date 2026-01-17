import Link from 'next/link'
import SRImage from '@/components/media/SRImage'
import { BlogPostListItem } from '@/lib/sanity/queries'
import { urlForImage } from '@/lib/sanity/image'

interface BlogCardProps {
  post: BlogPostListItem
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BlogCard({ post }: BlogCardProps) {
  const imageUrl = post.mainImage ? urlForImage(post.mainImage) : null
  const authorName = post.author?.name || 'Anonymous'
  const excerpt = post.excerpt || ''

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block bg-white rounded-lg border border-sunroad-brown-200/50 hover:border-sunroad-amber-400 hover:shadow-md transition-all duration-200 overflow-hidden h-full"
    >
      {/* Hero Image */}
      {imageUrl && (
        <div className="relative w-full h-48 sm:h-56 overflow-hidden">
          <SRImage
            src={imageUrl}
            alt={post.mainImage?.alt || post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            mode="raw"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-display font-semibold text-sunroad-brown-900 mb-2 line-clamp-2">
          {post.title}
        </h2>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm sm:text-base text-sunroad-brown-600 mb-4 line-clamp-3">
            {excerpt}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-sunroad-brown-500">
          {/* Date */}
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
          </div>

          {/* Author */}
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{authorName}</span>
          </div>
        </div>

        {/* Categories */}
        {post.categories && post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.categories.map((category, index) => (
              <span
                key={index}
                className="inline-block bg-sunroad-amber-50 text-sunroad-amber-700 text-xs font-medium px-3 py-1 rounded-full border border-sunroad-amber-200"
              >
                {category.title}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

