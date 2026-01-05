import { sanityClient } from './client'

// Types for blog data
export interface BlogPostAuthor {
  name: string
  sunroadHandle?: string
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
      sunroadHandle
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

// GROQ query for a single blog post by slug
export const blogPostBySlugQuery = `
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
      sunroadHandle
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
 */
export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const post = await sanityClient.fetch<BlogPost | null>(
    blogPostBySlugQuery,
    { slug },
    {
      next: {
        tags: ['sanity:post', `sanity:post:${slug}`],
        // Cache indefinitely, revalidate only via revalidateTag
        revalidate: false,
      }
    }
  )

  return post || null
}

