import { Metadata } from 'next'
import { fetchBlogPosts } from '@/lib/sanity/queries'
import BlogListClient from '@/components/blog/blog-list-client'
import BlogCard from '@/components/blog/blog-card'

// Route config - Static until explicit revalidation
export const revalidate = false // Cache forever until manually revalidated
export const dynamic = 'error' // Fail build if anything forces dynamic

export const metadata: Metadata = {
  title: 'Blog | Sun Road',
  description: 'Read the latest stories, insights, and updates from the Sun Road creative community.',
  openGraph: {
    title: 'Blog | Sun Road',
    description: 'Read the latest stories, insights, and updates from the Sun Road creative community.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog | Sun Road',
    description: 'Read the latest stories, insights, and updates from the Sun Road creative community.',
  },
}

export default async function BlogPage() {
  let initialPosts: Awaited<ReturnType<typeof fetchBlogPosts>> = []
  
  try {
    // Fetch initial posts for SSG (first page)
    initialPosts = await fetchBlogPosts(12) // Load first 12 posts
  } catch (error) {
    console.error('[BlogPage] Error fetching initial posts:', error)
    // Continue with empty array - BlogListClient will handle fetching
  }

  return (
    <main className="min-h-screen bg-sunroad-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8 sm:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-sunroad-brown-900 mb-4">
            Blog
          </h1>
          <p className="text-base sm:text-lg text-sunroad-brown-600 max-w-2xl mx-auto">
            Stories, insights, and updates from the Sun Road creative community
          </p>
        </header>

        {/* Initial Posts - Rendered server-side for SEO */}
        {initialPosts.length > 0 ? (
          <section aria-label="Blog posts">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {initialPosts.map((post) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-12" role="status" aria-live="polite">
            <p className="text-sunroad-brown-600 text-lg">
              Unable to load blog posts at this time. Please try again later.
            </p>
          </div>
        )}

        {/* Client component handles infinite scroll for additional posts */}
        <BlogListClient initialPosts={initialPosts} />
      </div>
    </main>
  )
}

