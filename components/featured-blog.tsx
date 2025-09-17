'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function FeaturedBlog() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="grid md:grid-cols-2">
        {/* Left Side - Content */}
        <div className="bg-green-600 p-8 flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Moriah is new to Tulsa but she is already thriving...
          </h3>
          <p className="text-green-100 mb-6">
            Discover how this talented creative found her community and opportunities in the local arts scene.
          </p>
          <Link
            href="/blog/moriah-tulsa-story"
            className="inline-block px-6 py-3 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-colors font-semibold"
          >
            Read the Full Article
          </Link>
        </div>
        
        {/* Right Side - Image */}
        <div className="relative aspect-[4/3] md:aspect-auto">
          <Image
            src="/api/placeholder/600/400"
            alt="Moriah working on her laptop"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </div>
  )
}
