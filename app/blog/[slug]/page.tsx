import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { fetchBlogPostBySlug } from '@/lib/sanity/queries'
import PostBody from '@/components/blog/post-body'
import AuthorCard from '@/components/blog/author-card'
import BlogShareButton from '@/components/blog/share-button'
import Breadcrumbs from '@/components/blog/breadcrumbs'
import SRImage from '@/components/media/SRImage'
import { urlForImage } from '@/lib/sanity/image'

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

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchBlogPostBySlug(slug)

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
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await fetchBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const imageUrl = post.mainImage ? urlForImage(post.mainImage) : null
  const authorName = post.author?.name || 'Anonymous'

  return (
    <main className="min-h-screen bg-sunroad-cream">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumbs */}
        <Breadcrumbs postTitle={post.title} />

        {/* Header */}
        <header className="mb-8">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-sunroad-brown-900 mb-6">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base text-sunroad-brown-600 mb-6">
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
            <div className="flex flex-wrap gap-2 mb-6">
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

          {/* Hero Image */}
          {imageUrl && (
            <div className="relative w-full h-64 sm:h-96 md:h-[500px] rounded-lg overflow-hidden mb-8">
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
            </div>
          )}
        </header>

        {/* Post Body */}
        <div className="prose prose-lg max-w-none mb-8">
          <PostBody content={post.body} />
        </div>

        {/* Share Button */}
        <div className="flex justify-center mb-8">
          <BlogShareButton
            title={post.title}
            slug={post.slug}
            className="!bg-gradient-to-b !from-sunroad-amber-500 !to-sunroad-amber-600 hover:!from-sunroad-amber-600 hover:!to-sunroad-amber-700 !shadow-md !shadow-amber-200/40"
          />
        </div>

        {/* Author Card */}
        <AuthorCard author={post.author} />
      </article>
    </main>
  )
}

