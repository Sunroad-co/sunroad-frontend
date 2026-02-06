'use client'

import { PortableText, PortableTextComponents } from '@portabletext/react'
import SRImage from '@/components/media/SRImage'
import Link from 'next/link'
import { urlForImageWithSize } from '@/lib/sanity/image'
import { BlogPostImage } from '@/lib/sanity/queries'
import { getProfileUrl } from '@/lib/utils/profile-url'

interface PostBodyProps {
  content: any // Portable Text content
}

// Custom components for Portable Text rendering
const components: PortableTextComponents = {
  types: {
    image: ({ value }: { value: BlogPostImage }) => {
      if (!value?.asset) return null

      const imageUrl = urlForImageWithSize(value, 1200, 800)
      if (!imageUrl) return null

      return (
        <figure className="my-8">
          <div className="relative w-full h-64 sm:h-96 md:h-[500px] rounded-lg overflow-hidden">
            <SRImage
              src={imageUrl}
              alt={value.alt || 'Blog post image'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              mode="raw"
            />
          </div>
          {value.caption && (
            <figcaption className="mt-2 text-sm text-center text-sunroad-brown-600 italic">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
    embed: ({ value }: { value: { provider?: string; url?: string; caption?: string } }) => {
      if (!value?.url) return null

      // Handle different embed providers
      if (value.provider === 'youtube' || value.url.includes('youtube.com') || value.url.includes('youtu.be')) {
        // Extract YouTube video ID
        const videoId = value.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
        if (!videoId) return null

        return (
          <figure className="my-8">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
            {value.caption && (
              <figcaption className="mt-2 text-sm text-center text-sunroad-brown-600 italic">
                {value.caption}
              </figcaption>
            )}
          </figure>
        )
      }

      // Generic iframe embed
      return (
        <figure className="my-8">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden">
            <iframe
              src={value.url}
              title="Embedded content"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
          {value.caption && (
            <figcaption className="mt-2 text-sm text-center text-sunroad-brown-600 italic">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
  marks: {
    link: ({ value, children }: { value?: { href?: string; _type?: string; reference?: any }; children: React.ReactNode }) => {
      // Handle internal links (e.g., to artists)
      if (!value) {
        return <>{children}</>
      }

      if (value._type === 'internalLink') {
        // Handle different reference types
        if (value.reference) {
          const ref = value.reference
          
          // Artist reference
          if (ref._type === 'artist' && ref.handle) {
            return (
              <Link href={getProfileUrl(ref.handle)} className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline" prefetch={false}>
                {children}
              </Link>
            )
          }
          
          // Blog post reference
          if (ref._type === 'post' && ref.slug?.current) {
            return (
              <Link href={`/blog/${ref.slug.current}`} className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline" prefetch={false}>
                {children}
              </Link>
            )
          }
        }
        
        // Fallback: if _ref is a string (legacy format), try to use it as handle
        if (typeof value.reference === 'string') {
          return (
            <Link href={getProfileUrl(value.reference)} className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline" prefetch={false}>
              {children}
            </Link>
          )
        }
      }

      // External links
      const href = value?.href || '#'
      const isExternal = href.startsWith('http')
      
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline"
        >
          {children}
        </a>
      )
    },
  },
  block: {
    h1: ({ children }) => (
      <h1 className="text-3xl sm:text-4xl font-display font-bold text-sunroad-brown-900 mt-8 mb-4">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl sm:text-3xl font-display font-semibold text-sunroad-brown-900 mt-6 mb-3">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl sm:text-2xl font-display font-semibold text-sunroad-brown-900 mt-5 mb-2">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg sm:text-xl font-display font-semibold text-sunroad-brown-900 mt-4 mb-2">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="text-base sm:text-lg text-sunroad-brown-700 mb-4 leading-relaxed">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-sunroad-amber-400 pl-4 py-2 my-4 italic text-sunroad-brown-600">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-2 text-sunroad-brown-700">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-sunroad-brown-700">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="ml-4">{children}</li>,
    number: ({ children }) => <li className="ml-4">{children}</li>,
  },
}

export default function PostBody({ content }: PostBodyProps) {
  if (!content) return null

  return (
    <div className="prose prose-lg max-w-none">
      <PortableText value={content} components={components} />
    </div>
  )
}

