import Link from 'next/link'
import SRImage from '@/components/media/SRImage'
import { BlogPostListItem } from '@/lib/sanity/queries'
import { urlForImage, urlForImageWithSize } from '@/lib/sanity/image'

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
  const authorImageUrl = post.author?.image ? urlForImageWithSize(post.author.image, 64, 64) : null

  return (
    <article className="flex flex-col bg-white rounded-lg border border-sunroad-brown-200/50 hover:border-sunroad-amber-400 hover:shadow-md transition-all duration-200 overflow-hidden h-full">
      <Link
        href={`/blog/${post.slug}`}
        className="flex flex-col h-full"
        aria-label={`Read article: ${post.title}`}
      >
        {/* Hero Image */}
        {imageUrl && (
          <div className="relative w-full h-48 sm:h-56 overflow-hidden flex-shrink-0">
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
        <div className="flex flex-col flex-1 p-4 sm:p-6">
          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-display font-semibold text-sunroad-brown-900 mb-3 line-clamp-2">
            {post.title}
          </h2>

          {/* Excerpt - Dynamic line clamping based on available space */}
          {excerpt && (
            <p className="text-sm sm:text-base text-sunroad-brown-600 mb-4 line-clamp-[4] flex-shrink-0">
              {excerpt}
            </p>
          )}

          {/* Spacer to push meta to bottom */}
          <div className="flex-1" />

          {/* Meta Info - Pinned to bottom (Author + Date on right) */}
          <div className="flex items-center justify-between gap-3 text-sm text-sunroad-brown-500 mt-auto pt-4 border-t border-sunroad-brown-100">
            {/* Author - Left */}
            <div className="flex items-center gap-2 min-w-0">
              {authorImageUrl ? (
                <div className="flex-shrink-0">
                  <SRImage
                    src={authorImageUrl}
                    alt={`${authorName} avatar`}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full object-cover"
                    mode="raw"
                    sizes="28px"
                  />
                </div>
              ) : null}
              <span className="truncate" itemProp="author" itemScope itemType="https://schema.org/Person">
                <span itemProp="name">{authorName}</span>
              </span>
            </div>

            {/* Date - Right */}
            <time 
              dateTime={post.publishedAt}
              className="flex items-center gap-1.5 text-xs flex-shrink-0 whitespace-nowrap"
            >
              <svg 
                className="h-3.5 w-3.5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(post.publishedAt)}
            </time>
          </div>
        </div>
      </Link>
    </article>
  )
}

