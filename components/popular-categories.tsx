import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import SRImage from '@/components/media/SRImage'

interface CategoryItem {
  id: number
  name: string
  illustrationSrc: string
  illustrationAlt: string
}

// ⚠️ Make sure these IDs match your Supabase DB 'categories' table!
// These IDs are validated against the repo's shared category ID mapping.
const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '')
const toAbsoluteUrl = (path: string) => `${APP_BASE_URL}${path}`

const categories: CategoryItem[] = [
  {
    id: 6,
    name: 'Photography',
    illustrationSrc: toAbsoluteUrl('/categories/PHOTOGRAPHY.png'),
    illustrationAlt: 'Photography',
  },
  {
    id: 57,
    name: 'Venues',
    illustrationSrc: toAbsoluteUrl('/categories/VENUE.png'),
    illustrationAlt: 'Venues',
  },
  {
    id: 45,
    name: 'Museums',
    illustrationSrc: toAbsoluteUrl('/categories/MUESUM.png'),
    illustrationAlt: 'Museums',
  },
  {
    id: 64,
    name: 'Fine Artists',
    illustrationSrc: toAbsoluteUrl('/categories/FINE%20ARTIST.png'),
    illustrationAlt: 'Fine Artists',
  },
  {
    id: 34,
    name: 'Art Galleries',
    illustrationSrc: toAbsoluteUrl('/categories/GALLERY.png'),
    illustrationAlt: 'Art Galleries',
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
            className="group relative flex flex-col items-center justify-between
                       aspect-square sm:aspect-[4/5] md:aspect-auto md:h-48
                       bg-gradient-to-b from-white to-stone-50/80 rounded-3xl border border-stone-200/80
                       overflow-hidden transition-all duration-500 ease-out
                       hover:border-amber-300 hover:shadow-[0_18px_45px_-22px_rgba(120,113,108,0.35),0_0_30px_-10px_rgba(251,191,36,0.25)]
                       px-5 pt-5 pb-5"
          >
            {/* Background Hover Gradient (Subtle) */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-amber-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Inner paper highlight */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/70" />

            {/* Kinetic Icon Container */}
            <div className="relative z-10 w-full flex-1 overflow-hidden mt-1">
              {/* Primary Icon (Slides Up) */}
              <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out group-hover:-translate-y-full">
                <SRImage
                  src={category.illustrationSrc}
                  alt={category.illustrationAlt}
                  fill
                  sizes="(min-width: 768px) 180px, (min-width: 640px) 28vw, 42vw"
                  className="object-contain px-2 pb-0 pt-0 scale-[1.7] drop-shadow-[0_18px_34px_rgba(0,0,0,0.09)]"
                />
              </div>
              
              {/* Secondary Arrow (Slides In) */}
              <div className="absolute inset-0 flex items-center justify-center translate-y-full transition-transform duration-500 ease-out group-hover:translate-y-0 text-amber-600">
                <ArrowUpRight className="w-8 h-8" />
              </div>
            </div>
            
            {/* Text */}
            <p className="relative z-10 w-full text-center text-[15px] font-display font-medium tracking-tight text-stone-900/90 group-hover:text-amber-800 transition-colors">
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