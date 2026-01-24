'use client'

import Link from 'next/link'
import { BlogPostAuthor } from '@/lib/sanity/queries'
import SRImage from '../media/SRImage'
import { urlForImageWithSize } from '@/lib/sanity/image'
import { PortableText } from '@portabletext/react'
import { getProfileUrl } from '@/lib/utils/profile-url'

interface AuthorCardProps {
  author?: BlogPostAuthor
}

// Helper function to extract plain text from Portable Text for line clamping
function extractPlainText(content: any): string {
  if (!content || !Array.isArray(content)) return ''
  
  return content
    .map((block: any) => {
      if (block._type === 'block' && block.children) {
        return block.children
          .map((child: any) => (typeof child === 'string' ? child : child.text || ''))
          .join('')
      }
      return ''
    })
    .join(' ')
    .trim()
}

export default function AuthorCard({ author }: AuthorCardProps) {
  if (!author) return null

  const authorName = author.name || 'Anonymous'
  const hasSunroadHandle = !!author.sunroadHandle
  const authorImageUrl = author.image ? urlForImageWithSize(author.image, 64, 64) : null
  const authorBio = author.bio
  const bioPlainText = authorBio ? extractPlainText(authorBio) : null

  return (
    <div className="bg-gradient-to-br from-sunroad-cream/50 to-sunroad-amber-50/30 rounded-2xl p-6 sm:p-8 border border-sunroad-amber-200/50 shadow-lg">
      <div className="flex items-start gap-4 sm:gap-6">
        {/* Avatar */}
        {authorImageUrl ? (
          <div className="flex-shrink-0">
            <SRImage
              src={authorImageUrl}
              alt={authorName}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
              mode="raw"
              sizes="64px"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sunroad-amber-200 to-sunroad-amber-300 flex items-center justify-center flex-shrink-0">
            <span className="text-sunroad-amber-700 font-semibold text-xl">
              {authorName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Author Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-sunroad-brown-500 mb-1.5 uppercase tracking-wide">Written by</p>
          {hasSunroadHandle ? (
            <Link
              href={getProfileUrl(author.sunroadHandle!)}
              className="text-xl font-display font-semibold text-sunroad-brown-900 hover:text-sunroad-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sunroad-amber-400 focus:ring-offset-2 rounded"
            >
              {authorName}
            </Link>
          ) : (
            <p className="text-xl font-display font-semibold text-sunroad-brown-900">
              {authorName}
            </p>
          )}
          {authorBio && Array.isArray(authorBio) && authorBio.length > 0 && (
            <div className="text-sm text-sunroad-brown-600 mt-2 line-clamp-3">
              <PortableText
                value={authorBio}
                components={{
                  block: {
                    normal: ({ children }) => <p className="mb-0">{children}</p>,
                  },
                  marks: {
                    link: ({ value, children }) => {
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
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

