'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import BlogCard from './blog-card'
import { BlogPostListItem } from '@/lib/sanity/queries'

interface BlogListClientProps {
  initialPosts: BlogPostListItem[]
}

const POSTS_PER_PAGE = 12

export default function BlogListClient({ initialPosts }: BlogListClientProps) {
  const [posts, setPosts] = useState<BlogPostListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length >= POSTS_PER_PAGE)
  const [page, setPage] = useState(1)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const response = await fetch(`/api/blog?page=${page + 1}&limit=${POSTS_PER_PAGE}`)
      if (!response.ok) {
        throw new Error('Failed to load more posts')
      }
      const newPosts: BlogPostListItem[] = await response.json()
      
      if (newPosts.length === 0) {
        setHasMore(false)
      } else {
        setPosts(prev => [...prev, ...newPosts])
        setPage(prev => prev + 1)
        setHasMore(newPosts.length >= POSTS_PER_PAGE)
      }
    } catch (error) {
      console.error('Error loading more posts:', error)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page])

  // Auto-fetch page 1 if initialPosts is empty
  useEffect(() => {
    if (initialPosts.length === 0) {
      setLoading(true)
      fetch(`/api/blog?page=1&limit=${POSTS_PER_PAGE}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch posts')
          }
          return res.json()
        })
        .then((newPosts: BlogPostListItem[]) => {
          setPosts(newPosts)
          setHasMore(newPosts.length >= POSTS_PER_PAGE)
          setPage(1)
        })
        .catch(error => {
          console.error('Error fetching initial posts:', error)
        })
        .finally(() => {
          setLoading(false)
        })
    } else if (initialPosts.length < POSTS_PER_PAGE) {
      setHasMore(false)
    }
  }, [initialPosts.length])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before sentinel enters viewport
      }
    )

    observer.observe(sentinelRef.current)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, loading, loadMore])

  // Show loading state when fetching initial posts
  if (loading && posts.length === 0 && initialPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sunroad-brown-600 text-lg">Loading posts...</p>
      </div>
    )
  }

  // Show empty state if no posts after initial fetch
  if (posts.length === 0 && !loading && initialPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sunroad-brown-600 text-lg">
          No blog posts yet. Check back soon!
        </p>
      </div>
    )
  }

  // Only render additional posts (initial posts are rendered server-side)
  if (posts.length === 0) {
    return null
  }

  return (
    <>
      {/* Additional Posts Grid (initial posts already rendered server-side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {posts.map((post) => (
          <BlogCard key={post._id} post={post} />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center mt-8">
          <p className="text-sunroad-brown-600">Loading more posts...</p>
        </div>
      )}

      {/* Fallback button for accessibility (optional) */}
      {hasMore && !loading && (
        <div className="flex justify-center mt-8">
          <button
            onClick={loadMore}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-sunroad-amber-600 hover:bg-sunroad-amber-700 text-white hover:shadow-lg transform hover:scale-105"
            aria-label="Load more blog posts"
          >
            Load More Posts
          </button>
        </div>
      )}
    </>
  )
}

