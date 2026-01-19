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

