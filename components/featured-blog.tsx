'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function FeaturedBlog() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
     {/* <div className="bg-amber-800 border-2 border-gray-900 rounded-3xl overflow-hidden"> */}
    <div className="bg-green-600 grid grid-cols-1 lg:grid-cols-2 items-stretch">
      
        {/* Left Side - Content */}
        <div className="bg-green-600 p-8 flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Moriah is new to Tulsa but she is already thriving...
          </h3>
          <p className="text-green-100 mb-6">
            Discover how this talented creative found her community and opportunities in the local arts scene.
          </p>
          <div className="flex justify-center lg:justify-start">
            <Link
              href="/auth/sign-up"
              className="inline-block px-8 py-4 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-semibold text-lg"
            >
              Join the Community
            </Link>
          </div>
        </div>
        
        {/* Right Side - Image */}
            {/* Right Panel - Image with Inward Curve */}
            <div
  className="relative h-80 lg:h-auto overflow-hidden 
  [clip-path:ellipse(150%_100%_at_100%_50%)] 
  lg:[clip-path:ellipse(100%_150%_at_100%_50%)]"
>
  <Image
    src="/head_guitarist.jpg"
    alt="Local creative performing"
    fill
    className="object-cover object-center scale-110"
    priority
  />
</div>
      </div>
    </div>
  )
}
