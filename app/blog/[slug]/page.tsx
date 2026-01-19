import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { fetchBlogPostBySlug } from '@/lib/sanity/queries'
import PostBody from '@/components/blog/post-body'
import AuthorCard from '@/components/blog/author-card'
import BlogShareButton from '@/components/blog/share-button'
import Breadcrumbs from '@/components/blog/breadcrumbs'
import SRImage from '@/components/media/SRImage'
import { urlForImage, urlForImageWithSize } from '@/lib/sanity/image'

// Route config - ISR cached indefinitely
export const revalidate = false // Cache forever until manually revalidated
export const dynamic = 'error' // Fail build if anything forces dynamic

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Cached fetch function shared between generateMetadata and page component
// Uses unstable_cache to ensure both calls reuse the same cached result
const getCachedBlogPost = (slug: string) => {
  return unstable_cache(
    async () => {
      try {
        return await fetchBlogPostBySlug(slug)
      } catch (error) {
        console.error(`[getCachedBlogPost] Error fetching post ${slug}:`, error)
        return { post: null, otherReads: [] }
      }
    },
    [`blog-post-${slug}`],
    {
      tags: ['sanity:post', `sanity:post:${slug}`, 'sanity:blog'],
      revalidate: false, // Cache forever until manually revalidated
    }
  )()
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  
  try {
    const { post } = await getCachedBlogPost(slug)

    if (!post) {
      return {
        title: 'Post Not Found | Sun Road Blog',
        description: 'The requested blog post could not be found.',
      }
    }

    const seo = post.seo || {}
    const title = seo.title || post.title
    const description = seo.description || post.excerpt || 'Read this post on Sun Road'
    const imageUrl = post.mainImage ? urlForImage(post.mainImage) : null
    const authorName = post.author?.name || 'Sun Road'

    const metadata: Metadata = {
      title: `${title} | Sun Road Blog`,
      description,
      ...(seo.canonicalUrl && {
        alternates: {
          canonical: seo.canonicalUrl,
        },
      }),
      ...(seo.noIndex && {
        robots: {
          index: false,
          follow: false,
        },
      }),
      authors: [{ name: authorName }],
      openGraph: {
        title: `${title} | Sun Road Blog`,
        description,
        type: 'article',
        publishedTime: post.publishedAt,
        authors: [authorName],
        ...(imageUrl && {
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: post.mainImage?.alt || post.title,
            },
          ],
        }),
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | Sun Road Blog`,
        description,
        ...(imageUrl && {
          images: [imageUrl],
        }),
      },
    }

    return metadata
  } catch (error) {
    console.error('[generateMetadata] Error generating metadata:', error)
    return {
      title: 'Blog Post | Sun Road Blog',
      description: 'Read this post on Sun Road',
    }
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  
  let postData: Awaited<ReturnType<typeof getCachedBlogPost>>
  
  try {
    // Reuse cached result from generateMetadata (if called) or fetch fresh
    postData = await getCachedBlogPost(slug)
  } catch (error) {
    console.error(`[BlogPostPage] Error fetching post ${slug}:`, error)
    notFound()
  }

  const { post, otherReads } = postData

  if (!post) {
    notFound()
  }

  const imageUrl = post.mainImage ? urlForImage(post.mainImage) : null
  const authorName = post.author?.name || 'Anonymous'
  const authorImageUrl = post.author?.image ? urlForImageWithSize(post.author.image, 44, 44) : null

  return (
    <main className="min-h-screen bg-sunroad-cream">
      <article 
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
        itemScope 
        itemType="https://schema.org/BlogPosting"
      >
        {/* Breadcrumbs */}
        <Breadcrumbs postTitle={post.title} />

        {/* Header */}
        <header className="mb-8">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-sunroad-brown-900 mb-6" itemProp="headline">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm sm:text-base text-sunroad-brown-600 mb-6">
            {/* Author - Left */}
            <div className="flex items-center gap-3">
              {authorImageUrl ? (
                <SRImage
                  src={authorImageUrl}
                  alt={`${authorName} avatar`}
                  width={44}
                  height={44}
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  mode="raw"
                  sizes="44px"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sunroad-amber-200 to-sunroad-amber-300 flex items-center justify-center flex-shrink-0">
                  <svg 
                    className="h-6 w-6 text-sunroad-amber-700" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <span itemProp="author" itemScope itemType="https://schema.org/Person">
                <span itemProp="name">{authorName}</span>
              </span>
            </div>

            {/* Date - Right */}
            <time 
              dateTime={post.publishedAt}
              itemProp="datePublished"
              className="flex items-center gap-1.5"
            >
              <svg 
                className="h-4 w-4" 
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

          {/* Hero Image */}
          {imageUrl && (
            <figure className="relative w-full h-64 sm:h-96 md:h-[500px] rounded-lg overflow-hidden mb-8">
              <SRImage
                src={imageUrl}
                alt={post.mainImage?.alt || post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                mode="raw"
                priority
              />
              {post.mainImage?.caption && (
                <figcaption className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm p-4 text-center">
                  {post.mainImage.caption}
                </figcaption>
              )}
            </figure>
          )}
        </header>

        {/* Post Body */}
        <div className="prose prose-lg max-w-none mb-8" itemProp="articleBody">
          <PostBody content={post.body} />
        </div>

        {/* Categories - Below body, centered */}
        {post.categories && post.categories.length > 0 && (
          <nav 
            className="flex flex-wrap justify-center gap-2 mb-8" 
            aria-label="Post categories"
          >
            {post.categories.map((category, index) => (
              <span
                key={index}
                className="inline-block bg-sunroad-amber-50 text-sunroad-amber-700 text-xs font-medium px-3 py-1 rounded-full border border-sunroad-amber-200"
                itemProp="articleSection"
              >
                {category.title}
              </span>
            ))}
          </nav>
        )}

        {/* Share Button */}
        <div className="flex justify-center mb-8">
          <BlogShareButton
            title={post.title}
            slug={post.slug}
            className="!bg-gradient-to-b !from-sunroad-amber-500 !to-sunroad-amber-600 hover:!from-sunroad-amber-600 hover:!to-sunroad-amber-700 !shadow-md !shadow-amber-200/40"
          />
        </div>

        {/* Author Card */}
        <div className="pt-8 mt-8 border-t border-sunroad-brown-200/60">
          <AuthorCard author={post.author} />
        </div>

        {/* Other Reads Section */}
        {otherReads && otherReads.length > 0 && (
          <section className="mt-12" aria-label="Other reads">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-sunroad-brown-900 mb-6">
              Other reads
            </h2>
            <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 no-scrollbar">
              <div className="flex gap-4 pb-4 snap-x snap-mandatory">
                {otherReads.map((otherPost) => {
                  const otherImageUrl = otherPost.mainImage ? urlForImage(otherPost.mainImage) : null
                  return (
                    <Link
                      key={otherPost._id}
                      href={`/blog/${otherPost.slug}`}
                      className="flex-shrink-0 w-[280px] sm:w-[320px] bg-white rounded-lg border border-sunroad-brown-200/50 hover:border-sunroad-amber-400 hover:shadow-md transition-all duration-200 overflow-hidden snap-start"
                      aria-label={`Read article: ${otherPost.title}`}
                    >
                      {/* Hero Image */}
                      {otherImageUrl ? (
                        <div className="relative w-full h-40 overflow-hidden">
                          <SRImage
                            src={otherImageUrl}
                            alt={otherPost.mainImage?.alt || otherPost.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 280px, 320px"
                            mode="raw"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-sunroad-amber-50" />
                      )}

                      {/* Content */}
                      <div className="p-4">
                        {/* Categories */}
                        {otherPost.categories && otherPost.categories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {otherPost.categories.slice(0, 2).map((category, index) => (
                              <span
                                key={index}
                                className="inline-block bg-sunroad-amber-50 text-sunroad-amber-700 text-xs font-medium px-2 py-0.5 rounded-full border border-sunroad-amber-200"
                              >
                                {category.title}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Title */}
                        <h3 className="text-lg font-display font-semibold text-sunroad-brown-900 line-clamp-2 mb-2">
                          {otherPost.title}
                        </h3>

                        {/* Excerpt */}
                        {otherPost.excerpt && (
                          <p className="text-sm text-sunroad-brown-600 line-clamp-2">
                            {otherPost.excerpt}
                          </p>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}
      </article>
    </main>
  )
}

