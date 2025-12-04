'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import NavbarAuth from './navbar-auth'
import MobileMenuOverlay from './mobile-menu-overlay'
import ArtistSearchControls from './artist-search-controls'
import Link from 'next/link'
import Image from 'next/image'
import { useNavbarUser } from '@/hooks/use-navbar-user'

interface NavbarProps {
  variant?: 'default' | 'opaque'
}

export default function Navbar({ variant }: NavbarProps = {}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const hideSearchControls = pathname?.startsWith('/search') ?? false
  const { user, loading, handleLogout } = useNavbarUser()

  // Automatically use opaque variant on search page, or use provided variant
  const isSearchPage = pathname?.startsWith('/search') ?? false
  const effectiveVariant = variant || (isSearchPage ? 'opaque' : 'default')

  // Determine background style based on variant
  const backgroundClass = effectiveVariant === 'opaque' 
    ? 'bg-sunroad-cream/95 backdrop-blur-sm' 
    : 'bg-gradient-to-br from-slate-50/98 via-amber-50/30/98 to-orange-50/20/98 backdrop-blur-sm'

  return (
    <header className={`sticky top-0 z-50 ${backgroundClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden md:flex justify-between items-center py-3">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <Image 
                src="/sunroad_logo.png" 
                alt="Sun Road" 
                width={120} 
                height={60}
                className="h-14 w-auto"
              />
            </Link>
          </div>
          
          {/* Search Bar */}
          {!hideSearchControls && (
            <div className="flex-1 max-w-2xl mx-8">
            <ArtistSearchControls 
              placeholder="Search for local creatives..."
              onResultClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
          )}
          
          {/* Right side - Auth */}
          <div className="flex items-center">
            <NavbarAuth />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden py-4">
          {/* Top row - Logo and Menu Trigger */}
          <div className="flex justify-between items-center mb-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image 
                src="/sunroad_logo.png" 
                alt="Sun Road" 
                width={100} 
                height={32}
                className="h-10 w-auto"
              />
            </Link>
            
            {/* Show avatar if authenticated, hamburger if not */}
            {!loading && (
              user ? (
                <NavbarAuth 
                  onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
                  showMobileAvatar={true}
                />
              ) : (
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 text-sunroad-brown-600 hover:text-sunroad-amber-600 transition-colors rounded-lg hover:bg-sunroad-amber-50"
                  aria-label="Open menu"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )
            )}
          </div>
          
          {/* Search Bar */}
          {!hideSearchControls && (
          <div className="mb-4">
            <ArtistSearchControls 
              placeholder="Search for local creatives"
              onResultClick={() => setIsMobileMenuOpen(false)}
            />
          </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay - Rendered outside navbar container for proper full-screen coverage */}
      <MobileMenuOverlay
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
    </header>
  )
}