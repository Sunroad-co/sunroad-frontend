import Link from 'next/link'
import SRImage from '@/components/media/SRImage'
import { FeaturedBlogPost, FeaturedTheme } from '@/lib/sanity/queries'
import { urlForImageWithSize } from '@/lib/sanity/image'

interface FeaturedBlogProps {
  posts: FeaturedBlogPost[]
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Theme configuration for featured posts
 * Maps Sanity featuredTheme tokens to Tailwind classes
 * 
 * Brand themes (warm): use sunroad brown text
 * Cool themes (sky/slate): use slate text for better harmony
 * Special themes (white/black): high contrast options
 */
const themeConfig: Record<FeaturedTheme | 'default', {
  bg: string
  text: string
  textMuted: string
  badgeBg: string
  badgeText?: string // Optional: override text color for badges (defaults to textMuted)
  ctaPrimary: string
  ctaSecondary: string
  imagePlaceholder: string
}> = {
  // ===== SPECIAL THEMES (High Contrast) =====
  
  // White: clean white background
  white: {
    bg: 'bg-white',
    text: 'text-sunroad-brown-900',
    textMuted: 'text-sunroad-brown-700',
    badgeBg: 'bg-sunroad-brown-50',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-sunroad-brown-50 text-sunroad-brown-900 hover:bg-sunroad-brown-100',
    imagePlaceholder: 'bg-sunroad-brown-100',
  },
  // Black: bold dark background
  black: {
    bg: 'bg-black',
    text: 'text-white',
    textMuted: 'text-white/80',
    badgeBg: 'bg-white/10 border border-white/15',
    badgeText: 'text-white/90',
    ctaPrimary: 'bg-white text-black hover:bg-white/90',
    ctaSecondary: 'bg-white/10 text-white hover:bg-white/15 border border-white/20',
    imagePlaceholder: 'bg-white/10',
  },

  // ===== BRAND THEMES (Warm) =====
  
  // Default: warm brown tones (tasteful brand default)
  default: {
    bg: 'bg-sunroad-brown-100',
    text: 'text-sunroad-brown-900',
    textMuted: 'text-sunroad-brown-700',
    badgeBg: 'bg-white/70',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-sunroad-brown-900 hover:bg-sunroad-brown-50',
    imagePlaceholder: 'bg-sunroad-brown-200',
  },
  // Cream: main brand cream background
  cream: {
    bg: 'bg-sunroad-cream',
    text: 'text-sunroad-brown-900',
    textMuted: 'text-sunroad-brown-700',
    badgeBg: 'bg-black/5',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-sunroad-brown-900 hover:bg-sunroad-brown-50',
    imagePlaceholder: 'bg-sunroad-brown-100',
  },
  // Paper: very light neutral
  paper: {
    bg: 'bg-sunroad-brown-50',
    text: 'text-sunroad-brown-900',
    textMuted: 'text-sunroad-brown-700',
    badgeBg: 'bg-black/5',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-sunroad-brown-900 hover:bg-sunroad-brown-50',
    imagePlaceholder: 'bg-sunroad-brown-100',
  },
  // Amber Soft: light amber accent
  amberSoft: {
    bg: 'bg-sunroad-amber-50',
    text: 'text-sunroad-brown-900',
    textMuted: 'text-sunroad-brown-700',
    badgeBg: 'bg-black/5',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-sunroad-brown-900 hover:bg-sunroad-amber-50',
    imagePlaceholder: 'bg-sunroad-amber-100',
  },
  // Amber: medium amber accent
  amber: {
    bg: 'bg-sunroad-amber-100',
    text: 'text-sunroad-brown-900',
    textMuted: 'text-sunroad-brown-700',
    badgeBg: 'bg-white/70',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-sunroad-brown-900 hover:bg-sunroad-amber-50',
    imagePlaceholder: 'bg-sunroad-amber-200',
  },
  // Brown Soft: light brown
  brownSoft: {
    bg: 'bg-sunroad-brown-100',
    text: 'text-sunroad-brown-900',
    textMuted: 'text-sunroad-brown-700',
    badgeBg: 'bg-white/70',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-sunroad-brown-900 hover:bg-sunroad-brown-50',
    imagePlaceholder: 'bg-sunroad-brown-200',
  },
  // Brown: medium brown
  brown: {
    bg: 'bg-sunroad-brown-200',
    text: 'text-sunroad-brown-900',
    textMuted: 'text-sunroad-brown-700',
    badgeBg: 'bg-white/70',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-sunroad-brown-900 hover:bg-sunroad-brown-50',
    imagePlaceholder: 'bg-sunroad-brown-300',
  },

  // ===== ACCENT THEMES (Sage/Green) =====
  
  // Sage Soft: light sage/emerald
  sageSoft: {
    bg: 'bg-emerald-50',
    text: 'text-sunroad-brown-900',
    textMuted: 'text-sunroad-brown-700',
    badgeBg: 'bg-black/5',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-sunroad-brown-900 hover:bg-emerald-50',
    imagePlaceholder: 'bg-emerald-100',
  },
  // Sage: distinct medium sage (more visible)
  sage: {
    bg: 'bg-emerald-200',
    text: 'text-sunroad-brown-900',
    textMuted: 'text-sunroad-brown-700',
    badgeBg: 'bg-white/70',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-sunroad-brown-900 hover:bg-emerald-100',
    imagePlaceholder: 'bg-emerald-300',
  },

  // ===== COOL THEMES (Sky/Slate - use slate text) =====
  
  // Sky Soft: light sky blue
  skySoft: {
    bg: 'bg-sky-50',
    text: 'text-slate-900',
    textMuted: 'text-slate-700',
    badgeBg: 'bg-black/5',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-slate-900 hover:bg-sky-50',
    imagePlaceholder: 'bg-sky-100',
  },
  // Sky: distinct medium sky (more visible)
  sky: {
    bg: 'bg-sky-200',
    text: 'text-slate-900',
    textMuted: 'text-slate-700',
    badgeBg: 'bg-white/70',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-slate-900 hover:bg-sky-100',
    imagePlaceholder: 'bg-sky-300',
  },
  // Slate Soft: light slate gray
  slateSoft: {
    bg: 'bg-slate-50',
    text: 'text-slate-900',
    textMuted: 'text-slate-600',
    badgeBg: 'bg-black/5',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-slate-900 hover:bg-slate-50',
    imagePlaceholder: 'bg-slate-100',
  },
  // Slate: distinct medium slate (more visible)
  slate: {
    bg: 'bg-slate-200',
    text: 'text-slate-900',
    textMuted: 'text-slate-600',
    badgeBg: 'bg-white/70',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-slate-900 hover:bg-slate-100',
    imagePlaceholder: 'bg-slate-300',
  },

  // ===== ACCENT THEMES (Warm accents) =====
  
  // Rose Soft: light rose pink
  roseSoft: {
    bg: 'bg-rose-50',
    text: 'text-sunroad-brown-900',
    textMuted: 'text-sunroad-brown-700',
    badgeBg: 'bg-black/5',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-sunroad-brown-900 hover:bg-rose-50',
    imagePlaceholder: 'bg-rose-100',
  },
  // Rose: distinct medium rose (more visible)
  rose: {
    bg: 'bg-rose-200',
    text: 'text-sunroad-brown-900',
    textMuted: 'text-sunroad-brown-700',
    badgeBg: 'bg-white/70',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-sunroad-brown-900 hover:bg-rose-100',
    imagePlaceholder: 'bg-rose-300',
  },
  // Lavender Soft: light violet/lavender
  lavenderSoft: {
    bg: 'bg-violet-50',
    text: 'text-sunroad-brown-900',
    textMuted: 'text-sunroad-brown-700',
    badgeBg: 'bg-black/5',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-sunroad-brown-900 hover:bg-violet-50',
    imagePlaceholder: 'bg-violet-100',
  },
  // Sunset Soft: light orange/sunset
  sunsetSoft: {
    bg: 'bg-orange-50',
    text: 'text-sunroad-brown-900',
    textMuted: 'text-sunroad-brown-700',
    badgeBg: 'bg-black/5',
    ctaPrimary: 'bg-sunroad-brown-900 text-white hover:bg-sunroad-brown-800',
    ctaSecondary: 'bg-white text-sunroad-brown-900 hover:bg-orange-50',
    imagePlaceholder: 'bg-orange-100',
  },
}

function getTheme(theme?: FeaturedTheme | string) {
  // Safely look up theme, falling back to default for unknown/missing values
  if (theme && theme in themeConfig) {
    return themeConfig[theme as FeaturedTheme]
  }
  return themeConfig.default
}

/**
 * Sunroad watermark logo component
 * Renders as subtle decorative branding below content
 */
function SunroadWatermark({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'sm' 
    ? 'w-16 sm:w-20 h-auto' 
    : 'w-24 sm:w-32 h-auto'
  
  return (
    <div 
      className={`flex justify-center pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Sun-Road-Logo-svg.svg"
        alt=""
        className={`${sizeClasses} opacity-[0.12]`}
      />
    </div>
  )
}

/**
 * FeaturedBlog - Server component for homepage featured posts
 * 
 * Renders:
 * - Primary featured post (rank 1): text left, curved image right
 * - Two sub posts (rank 2 & 3): cards below on desktop, stack on mobile
 * - Placeholder card if fewer than 3 posts
 * 
 * Uses SRImage mode="raw" to avoid Vercel Image Optimization quota.
 */
export default function FeaturedBlog({ posts }: FeaturedBlogProps) {
  // If no posts, hide the section entirely
  if (!posts || posts.length === 0) {
    return null
  }

  const [primaryPost, ...subPosts] = posts
  const secondaryPosts = subPosts.slice(0, 2) // Max 2 sub posts
  
  // Determine if we need a placeholder card (when we have exactly 2 posts total)
  const showPlaceholder = posts.length === 2

  const primaryImageUrl = primaryPost.mainImage 
    ? urlForImageWithSize(primaryPost.mainImage, 800, 600) 
    : null

  const theme = getTheme(primaryPost.featuredTheme)

  return (
    <div className="space-y-6">
      {/* Primary Featured Post */}
      <article className="rounded-2xl shadow-sm overflow-hidden">
        <div className={`${theme.bg} grid grid-cols-1 lg:grid-cols-2 items-stretch min-h-[320px] lg:min-h-[380px]`}>
          {/* Left Side - Content (centered) */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center items-center text-center">
            {/* Title with hover underline */}
            <Link 
              href={`/blog/${primaryPost.slug}`}
              className="group/title"
            >
              <h3 className={`text-xl sm:text-2xl lg:text-3xl font-display font-bold tracking-tight ${theme.text} mb-3 line-clamp-2 group-hover/title:underline decoration-2 underline-offset-4`}>
                {primaryPost.title}
              </h3>
            </Link>
            
            {primaryPost.excerpt && (
              <p className={`${theme.textMuted} mb-6 line-clamp-3 text-sm sm:text-base max-w-md`}>
                {primaryPost.excerpt}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href={`/blog/${primaryPost.slug}`}
                className={`inline-flex items-center px-6 py-3 rounded-full font-semibold text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sunroad-amber-500 ${theme.ctaPrimary}`}
                aria-label={`Continue reading: ${primaryPost.title}`}
              >
                Continue reading
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/auth/sign-up"
                className={`inline-flex items-center px-6 py-3 rounded-full font-semibold text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sunroad-amber-500 ${theme.ctaSecondary}`}
              >
                Join Community
              </Link>
            </div>

            {/* Watermark logo below buttons */}
            <SunroadWatermark className="mt-6" />
          </div>
          
          {/* Right Side - Image with Inward Curve */}
          <div
            className="relative h-64 sm:h-80 lg:h-auto overflow-hidden 
              [clip-path:ellipse(150%_100%_at_100%_50%)] 
              lg:[clip-path:ellipse(100%_150%_at_100%_50%)]"
            aria-hidden="true"
          >
            {primaryImageUrl ? (
              <SRImage
                src={primaryImageUrl}
                alt={primaryPost.mainImage?.alt || primaryPost.title}
                fill
                className="object-cover object-center scale-110"
                sizes="(max-width: 1024px) 100vw, 50vw"
                mode="raw"
                priority
              />
            ) : (
              <div className={`absolute inset-0 w-full h-full ${theme.imagePlaceholder}`} />
            )}
          </div>
        </div>
      </article>

      {/* Secondary Posts Grid */}
      {(secondaryPosts.length > 0 || showPlaceholder) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {secondaryPosts.map((post) => (
            <SecondaryPostCard key={post._id} post={post} />
          ))}
          {showPlaceholder && <ExplorePlaceholderCard />}
        </div>
      )}
    </div>
  )
}

/**
 * Placeholder card for empty slots - links to /blog
 */
function ExplorePlaceholderCard() {
  const theme = themeConfig.cream // Use neutral cream theme
  
  return (
    <article className={`flex flex-col rounded-xl overflow-hidden h-full ${theme.bg}`}>
      <Link
        href="/blog"
        className="flex flex-col h-full group focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sunroad-amber-500"
        aria-label="Explore more stories from the Sunroad community"
      >
        {/* Placeholder image area */}
        <div className={`relative w-full h-36 sm:h-40 overflow-hidden flex-shrink-0 ${theme.imagePlaceholder}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              className="w-12 h-12 text-sunroad-brown-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" 
              />
            </svg>
          </div>
        </div>

        {/* Content (centered) */}
        <div className="flex flex-col flex-1 p-4 sm:p-5 text-center">
          {/* Title */}
          <h4 className={`text-base sm:text-lg font-display font-semibold ${theme.text} mb-2 line-clamp-2 group-hover:underline decoration-2 underline-offset-2`}>
            Explore more stories from the Sunroad community
          </h4>

          {/* CTA hint (centered) */}
          <div className={`flex items-center justify-center gap-2 text-sm ${theme.textMuted} mt-2`}>
            <span>View all posts</span>
            <svg 
              className="w-4 h-4 group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Spacer */}
          <div className="flex-1 min-h-2" />

          {/* Watermark logo at bottom */}
          <SunroadWatermark className="mt-auto pt-3" size="sm" />
        </div>
      </Link>
    </article>
  )
}

/**
 * Secondary post card component
 */
function SecondaryPostCard({ post }: { post: FeaturedBlogPost }) {
  const imageUrl = post.mainImage ? urlForImageWithSize(post.mainImage, 400, 240) : null
  const authorImageUrl = post.author?.image 
    ? urlForImageWithSize(post.author.image, 40, 40) 
    : null
  const authorName = post.author?.name || 'Anonymous'
  const theme = getTheme(post.featuredTheme)

  return (
    <article className={`flex flex-col rounded-xl overflow-hidden h-full transition-all duration-200 hover:shadow-md ${theme.bg}`}>
      <Link
        href={`/blog/${post.slug}`}
        className="flex flex-col h-full group focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sunroad-amber-500"
        aria-label={`Read article: ${post.title}`}
      >
        {/* Image area - always rendered for consistent height */}
        <div className="relative w-full h-36 sm:h-40 overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <SRImage
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, 50vw"
              mode="raw"
            />
          ) : (
            <div 
              className={`absolute inset-0 w-full h-full ${theme.imagePlaceholder}`}
              aria-hidden="true"
            />
          )}
        </div>

        {/* Content (centered) */}
        <div className="flex flex-col flex-1 p-4 sm:p-5 text-center">
          {/* Title */}
          <h4 className={`text-base sm:text-lg font-display font-semibold ${theme.text} mb-2 line-clamp-2 group-hover:underline decoration-2 underline-offset-2`}>
            {post.title}
          </h4>

          {/* Meta Info - Author + Date (centered) */}
          <div className={`flex items-center justify-center gap-3 text-sm ${theme.textMuted} mt-2`}>
            {/* Author */}
            <div className="flex items-center gap-2">
              {authorImageUrl ? (
                <SRImage
                  src={authorImageUrl}
                  alt={`${authorName}`}
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0 ring-1 ring-black/10"
                  sizes="24px"
                  mode="raw"
                />
              ) : (
                <div 
                  className={`w-6 h-6 rounded-full ${theme.imagePlaceholder} flex-shrink-0 ring-1 ring-black/10`}
                  aria-hidden="true"
                />
              )}
              <span className="text-xs sm:text-sm">{authorName}</span>
            </div>

            <span className="text-sunroad-brown-300">•</span>

            {/* Date */}
            <time 
              dateTime={post.publishedAt}
              className="text-xs flex-shrink-0 whitespace-nowrap"
            >
              {formatDate(post.publishedAt)}
            </time>
          </div>

          {/* Spacer */}
          <div className="flex-1 min-h-2" />

          {/* Watermark logo at bottom */}
          <SunroadWatermark className="mt-auto pt-3" size="sm" />
        </div>
      </Link>
    </article>
  )
}
