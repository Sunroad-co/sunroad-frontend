'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import SRImage from '@/components/media/SRImage'
import { useNavbarUser } from '@/hooks/use-navbar-user'
import { useUser } from '@/hooks/use-user'
import { getAvatarUrl } from '@/lib/media'

interface NavbarAuthProps {
  onMobileMenuOpen?: () => void
  showMobileAvatar?: boolean
}

/**
 * NavbarAuth component for desktop and mobile.
 * On desktop: shows avatar dropdown or login/signup buttons.
 * On mobile: can show avatar button that opens mobile menu (if showMobileAvatar is true).
 */
export default function NavbarAuth({ onMobileMenuOpen, showMobileAvatar = false }: NavbarAuthProps) {
  const { user, loading, handleLogout } = useNavbarUser()
  // Get profile data from centralized context (cached, no duplicate calls)
  const { profile, profileLoading } = useUser()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleLogoutClick = async () => {
    setShowDropdown(false)
    await handleLogout()
  }

  const handleAvatarClick = () => {
    if (showMobileAvatar && onMobileMenuOpen) {
      // On mobile, open the full-screen menu
      onMobileMenuOpen()
    } else {
      // On desktop, toggle dropdown
      setShowDropdown(!showDropdown)
    }
  }

  if (loading || profileLoading) {
    // Show single skeleton while loading (mobile shows skeleton in navbar, desktop shows buttons skeleton)
    if (showMobileAvatar) {
      // Mobile: return null, skeleton is handled in navbar
      return null
    }
    // Desktop: show single skeleton
    return (
      <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
    )
  }

  if (user) {
    // Get display name - prefer profile display_name, then full_name from metadata, fallback to email username
    const displayName = profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
    // Get avatar - use helper with small variant for navbar
    const avatarSrc = profile 
      ? getAvatarUrl(profile, 'small') 
      : (user.user_metadata?.avatar_url ? getAvatarUrl({ avatar_url: user.user_metadata.avatar_url }, 'small') : null)
    
    // Authenticated view
    return (
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={handleAvatarClick}
          className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-sunroad-amber-50 transition-all duration-200 group"
        >
          {avatarSrc ? (
              <SRImage
                src={avatarSrc}
                alt="Profile"
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-sunroad-amber-200 group-hover:ring-sunroad-amber-300 transition-all"
              mode="raw"
              sizes="36px"
              />
            ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sunroad-amber-500 to-sunroad-amber-600 flex items-center justify-center ring-2 ring-sunroad-amber-200 group-hover:ring-sunroad-amber-300 transition-all shadow-sm">
              <span className="text-white text-sm font-semibold">
                {displayName[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          {!showMobileAvatar && (
            <svg className="w-4 h-4 text-sunroad-brown-500 group-hover:text-sunroad-amber-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          )}
        </button>

        {/* Desktop Dropdown */}
        {!showMobileAvatar && showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-sunroad-amber-100/50 py-2 z-50 overflow-hidden">
            {/* User header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-sunroad-amber-50/50 to-transparent border-b border-sunroad-amber-100/50">
              {avatarSrc ? (
                <SRImage
                  src={avatarSrc}
                  alt="Profile"
                  width={44}
                  height={44}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-sunroad-amber-200 shadow-sm"
                  mode="raw"
                  sizes="44px"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sunroad-amber-500 to-sunroad-amber-600 flex items-center justify-center flex-shrink-0 ring-2 ring-sunroad-amber-200 shadow-sm">
                  <span className="text-white text-base font-semibold">
                    {displayName[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sunroad-brown-900 font-semibold text-sm truncate mb-0.5">
                  {displayName}
                </p>
                <p className="text-sunroad-brown-500 text-xs truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Account section */}
            <div className="py-1">
              <div className="px-3 py-1.5">
                <p className="text-xs font-semibold text-sunroad-brown-500 uppercase tracking-wider">
                  Account
                </p>
              </div>
            <Link
              href="/dashboard/profile"
                className="block px-4 py-2 text-sm text-sunroad-brown-900 hover:bg-sunroad-amber-50 transition-colors"
              onClick={() => setShowDropdown(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/settings"
                className="block px-4 py-2 text-sm text-sunroad-brown-900 hover:bg-sunroad-amber-50 transition-colors"
              onClick={() => setShowDropdown(false)}
            >
              Settings
            </Link>
            </div>

            {/* Divider */}
            <div className="border-t border-sunroad-amber-100/50 my-1" />

            {/* Discover section */}
            <div className="py-1">
              <div className="px-3 py-1.5">
                <p className="text-xs font-semibold text-sunroad-brown-500 uppercase tracking-wider">
                  Discover
                </p>
              </div>
              <Link
                href="/"
                className="block px-4 py-2 text-sm text-sunroad-brown-900 hover:bg-sunroad-amber-50 transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                Home
              </Link>
              <Link
                href="/search"
                className="block px-4 py-2 text-sm text-sunroad-brown-900 hover:bg-sunroad-amber-50 transition-colors"
                onClick={() => setShowDropdown(false)}
              >
                Find creatives
              </Link>
            </div>

            {/* Divider */}
            <div className="border-t border-sunroad-amber-100/50 my-1" />

            {/* Logout */}
            <button
              onClick={handleLogoutClick}
              className="block w-full text-left px-4 py-2 text-sm text-sunroad-brown-900 hover:bg-sunroad-amber-50 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    )
  }

  // Unauthenticated view (desktop only - mobile uses menu overlay)
  if (showMobileAvatar) {
    // On mobile, unauthenticated users see hamburger (handled in Navbar)
    return null
  }

  return (
    <div className="flex items-center space-x-4">
      <Link 
        href="/auth/login" 
        className="px-4 py-2 text-sunroad-brown-700 bg-sunroad-amber-100 rounded-lg hover:bg-sunroad-amber-200 transition-colors font-medium"
      >
        Login
      </Link>
      <Link 
        href="/signup" 
        className="px-4 py-2 text-white bg-sunroad-amber-600 rounded-lg hover:bg-sunroad-amber-700 transition-colors font-medium"
      >
        Sign Up
      </Link>
    </div>
  )
}
