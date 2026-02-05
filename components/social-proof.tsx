'use client'

import Image from 'next/image'

const institutions = [
  {
    name: 'Bob Dylan Center',
    logo: '/Logos_bob_dylan.png',
    alt: 'Bob Dylan Center'
  },
  {
    name: 'Cain\'s Ballroom',
    logo: '/logos_cains.png',
    alt: 'Cain\'s Ballroom'
  },
  {
    name: 'Circle Cinema',
    logo: '/logos_circle_cinema.png',
    alt: 'Circle Cinema'
  },
  {
    name: 'Crystal Museum',
    logo: '/logos_crystal_museum.png',
    alt: 'Crystal Museum'
  },
  {
    name: 'Tulsa Ballet',
    logo: '/logos_tulsa_balet.png',
    alt: 'Tulsa Ballet'
  }
]

export default function SocialProof() {
  return (
    <section className="py-12 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="text-center mb-8">
            <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">
              Trusted by leading institutions
            </p>
          </div>
          <div className="flex items-center justify-center space-x-12 lg:space-x-16">
            {institutions.map((institution) => (
              <div
                key={institution.name}
                className="flex items-center justify-center opacity-60 hover:opacity-80 transition-opacity duration-300"
              >
                {/* Static logo - unoptimized to avoid Vercel Image Optimization quota */}
                <Image
                  src={institution.logo}
                  alt={institution.alt}
                  width={120}
                  height={80}
                  className="h-15 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Layout - Marquee */}
        <div className="md:hidden">
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">
              Trusted by leading institutions
            </p>
          </div>
          <div className="relative overflow-hidden">
          <div className="flex animate-marquee min-w-max space-x-8">
    {/* First set of logos */}
    {institutions.map((institution) => (
      <div
        key={`first-${institution.name}`}
        className="flex-shrink-0 flex items-center justify-center opacity-60"
      >
        {/* Static logo - unoptimized to avoid Vercel Image Optimization quota */}
        <Image
          src={institution.logo}
          alt={institution.alt}
          width={100}
          height={50}
          className="h-10 w-auto object-contain filter grayscale"
          unoptimized
        />
      </div>
    ))}
    {/* Duplicate set for seamless loop */}
    {institutions.map((institution) => (
      <div
        key={`second-${institution.name}`}
        className="flex-shrink-0 flex items-center justify-center opacity-60"
      >
        {/* Static logo - unoptimized to avoid Vercel Image Optimization quota */}
        <Image
          src={institution.logo}
          alt={institution.alt}
          width={100}
          height={50}
          className="h-10 w-auto object-contain filter grayscale"
          unoptimized
        />
      </div>
    ))}
  </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-marquee {
          animation: marquee 14s linear infinite;
        }
        
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  )
}
