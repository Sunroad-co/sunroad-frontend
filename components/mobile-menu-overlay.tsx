'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import SRImage from '@/components/media/SRImage'
import type { User } from '@supabase/supabase-js'
import { useUser } from '@/hooks/use-user'

interface MobileMenuOverlayProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onLogout: () => Promise<void>
}

/**
 * Full-screen mobile menu overlay.
 * Shows different content based on authentication state.
 */
export default function MobileMenuOverlay({ isOpen, onClose, user, onLogout }: MobileMenuOverlayProps) {
  // Get profile data from centralized context (cached, no duplicate calls)
  const { profile } = useUser()

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleLinkClick = () => {
    onClose()
  }

  const handleLogoutClick = async () => {
    await onLogout()
    onClose()
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 bottom-0 z-[9999] bg-black/85 backdrop-blur-md font-display transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
      style={{ margin: 0, padding: 0 }}
    >
      <div
        className="absolute top-0 left-0 right-0 bottom-0 flex flex-col overflow-y-auto bg-sunroad-brown-900/95"
        onClick={(e) => e.stopPropagation()}
        style={{ margin: 0, padding: 0, minHeight: '100vh' }}
      >
        {/* Top row: Logo and Close button */}
        <div className="flex justify-between items-center px-4 py-4 border-b border-sunroad-amber-800/30 flex-shrink-0" style={{ marginTop: 0 }}>
          <Link href="/" onClick={handleLinkClick} className="flex items-center space-x-2">
            <Image 
              src="/sunroad_logo.png" 
              alt="Sun Road Logo" 
              width={100} 
              height={32}
              className="h-10 w-auto"
            />
          </Link>
          
          <button
            onClick={onClose}
            className="p-2 text-sunroad-amber-100 hover:text-white transition-colors rounded-lg hover:bg-sunroad-amber-900/30"
            aria-label="Close menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 px-4 py-6">
          {user ? (
            // Authenticated menu
            <>
              {/* User header */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-sunroad-amber-800/30">
                {(() => {
                  // Get display name - prefer profile display_name, then full_name from metadata, fallback to email username
                  const displayName = profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
                  // Get avatar - prefer profile avatar_url, then user_metadata avatar_url
                  const avatarSrc = profile?.avatar_url || user.user_metadata?.avatar_url
                  return avatarSrc ? (
                    <SRImage
                      src={avatarSrc}
                      alt="Profile"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-sunroad-amber-600/50 shadow-lg"
                      mode="raw"
                      sizes="48px"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sunroad-amber-500 to-sunroad-amber-600 flex items-center justify-center flex-shrink-0 ring-2 ring-sunroad-amber-500/50 shadow-lg">
                      <span className="text-white text-lg font-semibold">
                        {displayName[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-base truncate mb-1">
                    {profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-sunroad-amber-200 text-sm truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Account section */}
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-sunroad-amber-400 uppercase tracking-wider mb-3">
                  Account
                </h2>
                <nav className="space-y-1">
                  <Link
                    href="/dashboard/profile"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-white hover:bg-sunroad-amber-900/40 rounded-lg transition-colors font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-white hover:bg-sunroad-amber-900/40 rounded-lg transition-colors font-medium"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="block w-full text-left px-4 py-3 text-white hover:bg-sunroad-amber-900/40 rounded-lg transition-colors font-medium"
                  >
                    Logout
                  </button>
                </nav>
              </div>

              {/* Discover section */}
              <div>
                <h2 className="text-xs font-semibold text-sunroad-amber-400 uppercase tracking-wider mb-3">
                  Discover
                </h2>
                <nav className="space-y-1">
                  <Link
                    href="/"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-white hover:bg-sunroad-amber-900/40 rounded-lg transition-colors font-medium"
                  >
                    Home
                  </Link>
                  <Link
                    href="/blog"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-white hover:bg-sunroad-amber-900/40 rounded-lg transition-colors font-medium"
                  >
                    Blog
                  </Link>
                  <Link
                    href="/search"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-white hover:bg-sunroad-amber-900/40 rounded-lg transition-colors font-medium"
                  >
                    Find creatives
                  </Link>
                </nav>
              </div>
            </>
          ) : (
            // Unauthenticated menu
            <>
              {/* Discover section */}
              <div className="mb-8">
                <h2 className="text-xs font-semibold text-sunroad-amber-400 uppercase tracking-wider mb-3">
                  Discover
                </h2>
                <nav className="space-y-1">
                  <Link
                    href="/"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-white hover:bg-sunroad-amber-900/40 rounded-lg transition-colors font-medium"
                  >
                    Home
                  </Link>
                  <Link
                    href="/blog"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-white hover:bg-sunroad-amber-900/40 rounded-lg transition-colors font-medium"
                  >
                    Blog
                  </Link>
                  <Link
                    href="/search"
                    onClick={handleLinkClick}
                    className="block px-4 py-3 text-white hover:bg-sunroad-amber-900/40 rounded-lg transition-colors font-medium"
                  >
                    Find creatives
                  </Link>
                </nav>
              </div>

              {/* Account section */}
              <div>
                <h2 className="text-xs font-semibold text-sunroad-amber-400 uppercase tracking-wider mb-3">
                  Account
                </h2>
                <nav className="space-y-3">
                  <Link
                    href="/auth/login"
                    onClick={handleLinkClick}
                    className="block w-full px-4 py-3 text-center text-sunroad-brown-900 bg-sunroad-amber-200 rounded-lg hover:bg-sunroad-amber-300 transition-colors font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    onClick={handleLinkClick}
                    className="block w-full px-4 py-3 text-center text-white bg-sunroad-amber-600 rounded-lg hover:bg-sunroad-amber-700 transition-colors font-medium shadow-lg shadow-sunroad-amber-600/30"
                  >
                    Sign Up
                  </Link>
                </nav>
              </div>
            </>
          )}
        </div>

        {/* Bottom branding */}
        <div className="px-4 py-4 border-t border-sunroad-amber-800/30 flex-shrink-0">
          <p className="text-xs text-sunroad-amber-300 text-center font-body">
            Sun Road · Find local creatives
          </p>
        </div>
      </div>
    </div>
  )
}

