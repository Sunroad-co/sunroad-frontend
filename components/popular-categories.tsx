'use client'

import Image from 'next/image'
import Link from 'next/link'

const categories = [
  {
    name: 'Photography',
    image: '/api/placeholder/200/200',
    href: '/categories/photography'
  },
  {
    name: 'Galleries',
    image: '/api/placeholder/200/200',
    href: '/categories/galleries'
  },
  {
    name: 'Museums',
    image: '/api/placeholder/200/200',
    href: '/categories/museums'
  },
  {
    name: 'Musicians',
    image: '/api/placeholder/200/200',
    href: '/categories/musicians'
  },
  {
    name: 'Venues',
    image: '/api/placeholder/200/200',
    href: '/categories/venues'
  }
]

export default function PopularCategories() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
      {categories.map((category) => (
        <Link
          key={category.name}
          href={category.href}
          className="group text-center"
        >
          <div className="relative w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden bg-gray-100 group-hover:scale-105 transition-transform">
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover"
            />
          </div>
          <p className="text-sm font-medium text-gray-900 group-hover:text-amber-600 transition-colors">
            {category.name}
          </p>
        </Link>
      ))}
    </div>
  )
}
