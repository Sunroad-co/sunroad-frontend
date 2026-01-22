import { sanityClient } from './client'

// Types for blog data
export interface BlogPostAuthor {
  name: string
  sunroadHandle?: string
  image?: BlogPostImage
  bio?: any // Portable Text content (array)
}

export interface BlogPostCategory {
  title: string
  slug: { current: string }
}

export interface BlogPostSEO {
  title?: string
  description?: string
  noIndex?: boolean
  canonicalUrl?: string
}

export interface BlogPostImage {
  asset: {
    _ref: string
    _type: 'reference'
  } | string // Can be direct string reference or object
  alt?: string
  caption?: string
}

export interface BlogPostListItem {
  _id: string
  slug: string // GROQ query uses "slug": slug.current, so this is a string
  title: string
  excerpt?: string
  publishedAt: string
  mainImage?: BlogPostImage
  author?: BlogPostAuthor
  categories?: BlogPostCategory[]
  seo?: BlogPostSEO
}

export interface BlogPost extends BlogPostListItem {
  body: any // Portable Text content
}

export interface BlogPostWithOtherReads {
  post: BlogPost | null
  otherReads: BlogPostListItem[]
}

// GROQ query for listing blog posts
export const blogPostsListQuery = `
  *[_type == "post" && defined(publishedAt) && publishedAt <= now() && !(_id in path("drafts.**"))] | order(publishedAt desc) {
    _id,
    "slug": slug.current,
    title,
    excerpt,
    publishedAt,
    mainImage {
      asset {
        _ref,
        _type
      },
      alt,
      caption
    },
    author-> {
      name,
      sunroadHandle,
      image {
        asset {
          _ref,
          _type
        },
        alt
      },
      bio
    },
    categories[]-> {
      title,
      "slug": slug.current
    },
    seo {
      title,
      description,
      noIndex,
      canonicalUrl
    }
  }
`

// GROQ query for a single blog post by slug with other reads
export const blogPostBySlugQuery = `
  {
    "post": *[_type == "post" && slug.current == $slug && defined(publishedAt) && publishedAt <= now() && !(_id in path("drafts.**"))][0] {
      _id,
      "slug": slug.current,
      title,
      excerpt,
      publishedAt,
      mainImage {
        asset {
          _ref,
          _type
        },
        alt,
        caption
      },
      author-> {
        name,
        sunroadHandle,
        image {
          asset {
            _ref,
            _type
          },
          alt
        },
        bio
      },
      categories[]-> {
        title,
        "slug": slug.current
      },
      body,
      seo {
        title,
        description,
        noIndex,
        canonicalUrl
      }
    },
    "otherReads": *[_type == "post" && slug.current != $slug && defined(publishedAt) && publishedAt <= now() && !(_id in path("drafts.**"))] | order(publishedAt desc) [0...4] {
      _id,
      "slug": slug.current,
      title,
      excerpt,
      publishedAt,
      mainImage {
        asset {
          _ref,
          _type
        },
        alt,
        caption
      },
      categories[]-> {
        title,
        "slug": slug.current
      }
    }
  }
`

/**
 * Fetch list of blog posts with caching
 */
export async function fetchBlogPosts(limit?: number): Promise<BlogPostListItem[]> {
  const query = limit 
    ? `${blogPostsListQuery}[0...${limit}]`
    : blogPostsListQuery

  const posts = await sanityClient.fetch<BlogPostListItem[]>(query, {}, {
    next: {
      tags: ['sanity:blog', 'sanity:post'],
      // Cache indefinitely, revalidate only via revalidateTag
      revalidate: false,
    }
  })

  return posts || []
}

/**
 * Fetch a single blog post by slug with caching
 * Returns the post and other reads in a single query
 */
export async function fetchBlogPostBySlug(slug: string): Promise<BlogPostWithOtherReads> {
  const result = await sanityClient.fetch<BlogPostWithOtherReads>(
    blogPostBySlugQuery,
    { slug },
    {
      next: {
        tags: ['sanity:post', `sanity:post:${slug}`, 'sanity:blog'],
        // Cache indefinitely, revalidate only via revalidateTag
        revalidate: false,
      }
    }
  )

  return result || { post: null, otherReads: [] }
}

/**
 * Featured theme tokens supported by Sanity
 * Maps to Sunroad brand colors in tailwind.config.ts
 */
export type FeaturedTheme = 
  | 'white' | 'black'
  | 'cream' | 'paper' 
  | 'amberSoft' | 'amber' 
  | 'brownSoft' | 'brown'
  | 'sageSoft' | 'sage'
  | 'skySoft' | 'sky'
  | 'slateSoft' | 'slate'
  | 'roseSoft' | 'rose'
  | 'lavenderSoft'
  | 'sunsetSoft'

/**
 * Featured post type (extends BlogPostListItem with featured-specific fields)
 */
export interface FeaturedBlogPost extends BlogPostListItem {
  featuredRank?: number
  featuredTheme?: FeaturedTheme
}

// Shared projection for featured posts
const featuredPostProjection = `{
  _id,
  "slug": slug.current,
  title,
  excerpt,
  publishedAt,
  featuredRank,
  featuredTheme,
  mainImage {
    asset {
      _ref,
      _type
    },
    alt,
    caption
  },
  author-> {
    name,
    sunroadHandle,
    image {
      asset {
        _ref,
        _type
      },
      alt
    },
    bio
  },
  categories[]-> {
    title,
    "slug": slug.current
  }
}`

/**
 * Single GROQ query that returns featured posts + fallback posts in one call
 * Featured posts: isFeatured == true, within optional date range, ordered by rank then date
 * Fallback posts: most recent posts excluding featured ones, to fill remaining slots
 */
export const featuredWithFallbackQuery = `{
  "featured": *[
    _type == "post" 
    && defined(publishedAt) 
    && publishedAt <= now() 
    && !(_id in path("drafts.**"))
    && isFeatured == true
    && (!defined(featuredStartAt) || featuredStartAt <= now())
    && (!defined(featuredEndAt) || featuredEndAt > now())
  ] | order(
    coalesce(featuredRank, 9999) asc,
    publishedAt desc
  ) [0...$limit] ${featuredPostProjection},
  
  "fallback": *[
    _type == "post" 
    && defined(publishedAt) 
    && publishedAt <= now() 
    && !(_id in path("drafts.**"))
    && (
      isFeatured != true
      || !(!defined(featuredStartAt) || featuredStartAt <= now())
      || !(!defined(featuredEndAt) || featuredEndAt > now())
    )
  ] | order(publishedAt desc) [0...$limit] ${featuredPostProjection}
}`

interface FeaturedWithFallbackResult {
  featured: FeaturedBlogPost[]
  fallback: FeaturedBlogPost[]
}

/**
 * Fetch featured blog posts for homepage
 * Returns up to `limit` posts: featured posts first, then fallback posts to fill remaining slots
 * Uses a single GROQ query and merges results client-side to avoid duplicates
 */
export async function fetchFeaturedPosts(limit: number = 3): Promise<FeaturedBlogPost[]> {
  const result = await sanityClient.fetch<FeaturedWithFallbackResult>(
    featuredWithFallbackQuery,
    { limit },
    {
      next: {
        tags: ['sanity:featured', 'sanity:post', 'sanity:blog'],
        // Cache indefinitely, revalidate only via revalidateTag
        revalidate: false,
      }
    }
  )

  const featured = result?.featured || []
  const fallback = result?.fallback || []

  // If we have enough featured posts, return them
  if (featured.length >= limit) {
    return featured.slice(0, limit)
  }

  // Merge featured + fallback, excluding duplicates
  const featuredIds = new Set(featured.map(p => p._id))
  const uniqueFallback = fallback.filter(p => !featuredIds.has(p._id))
  const merged = [...featured, ...uniqueFallback]

  return merged.slice(0, limit)
}

/**
 * Legacy function for backward compatibility (used in generateMetadata)
 */
export async function fetchBlogPostBySlugLegacy(slug: string): Promise<BlogPost | null> {
  const query = `
    *[_type == "post" && slug.current == $slug && defined(publishedAt) && publishedAt <= now() && !(_id in path("drafts.**"))][0] {
      _id,
      "slug": slug.current,
      title,
      excerpt,
      publishedAt,
      mainImage {
        asset {
          _ref,
          _type
        },
        alt,
        caption
      },
      author-> {
        name,
        sunroadHandle,
        image {
          asset {
            _ref,
            _type
          },
          alt
        },
        bio
      },
      categories[]-> {
        title,
        "slug": slug.current
      },
      body,
      seo {
        title,
        description,
        noIndex,
        canonicalUrl
      }
    }
  `
  
  const post = await sanityClient.fetch<BlogPost | null>(
    query,
    { slug },
    {
      next: {
        tags: ['sanity:post', `sanity:post:${slug}`],
        revalidate: false,
      }
    }
  )

  return post || null
}

