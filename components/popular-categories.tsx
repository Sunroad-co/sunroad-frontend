import Link from 'next/link'
import { Camera, GalleryHorizontal, Landmark, Music, MapPin, ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface CategoryItem {
  id: number
  name: string
  icon: ReactNode
}

// ⚠️ Make sure these IDs match your Supabase DB 'categories' table!
const categories: CategoryItem[] = [
  {
    id: 6, 
    name: 'Photographers',
    icon: <Camera className="w-8 h-8" strokeWidth={1} />,
  },
  {
    id: 34, 
    name: 'Art Galleries',
    icon: <GalleryHorizontal className="w-8 h-8" strokeWidth={1} />,
  },
  {
    id: 45, 
    name: 'Museums',
    icon: <Landmark className="w-8 h-8" strokeWidth={1} />,
  },
  {
    id: 4, 
    name: 'Musicians',
    icon: <Music className="w-8 h-8" strokeWidth={1} />,
  },
  {
    id: 57, 
    name: 'Venues',
    icon: <MapPin className="w-8 h-8" strokeWidth={1} />,
  },
]

export default function PopularCategories() {
  return (
    <section className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/search?categories=${category.id}`}
            className="group relative flex flex-col items-center justify-center 
                       aspect-square sm:aspect-[4/5] md:aspect-auto md:h-48
                       bg-white rounded-3xl border border-stone-200 
                       overflow-hidden transition-all duration-500 ease-out
                       hover:border-amber-400 hover:shadow-[0_0_30px_-5px_rgba(251,191,36,0.3)]"
          >
            {/* Background Hover Gradient (Subtle) */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Kinetic Icon Container */}
            <div className="relative z-10 h-12 w-12 overflow-hidden mb-4">
              {/* Primary Icon (Slides Up) */}
              <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out group-hover:-translate-y-12 text-stone-600 group-hover:text-amber-600">
                {category.icon}
              </div>
              
              {/* Secondary Arrow (Slides In) */}
              <div className="absolute inset-0 flex items-center justify-center translate-y-12 transition-transform duration-500 ease-out group-hover:translate-y-0 text-amber-600">
                <ArrowUpRight className="w-8 h-8" />
              </div>
            </div>
            
            {/* Text */}
            <p className="relative z-10 text-base font-display font-medium text-stone-900 group-hover:text-amber-800 transition-colors">
              {category.name}
            </p>

            {/* Bottom Accent Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-left" />
          </Link>
        ))}
      </div>
    </section>
  )
}