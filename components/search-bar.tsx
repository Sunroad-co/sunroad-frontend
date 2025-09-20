'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearch } from '@/hooks/use-search'

interface SearchBarProps {
  placeholder?: string
  className?: string
  onResultClick?: () => void
}

export default function SearchBar({ 
  placeholder = "Search for local creatives...",
  className = "",
  onResultClick
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const {
    query,
    setQuery,
    results,
    loading,
    error,
    isOpen,
    setIsOpen
  } = useSearch({
    debounceMs: 300,
    minQueryLength: 2,
    limit: 8
  })


  // Handle click outside to close dropdown and prevent scrolling
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    // Prevent scrolling when dropdown is open
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    document.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [setIsOpen, isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    
    // Show dropdown with skeleton loader immediately when typing 2+ characters
    if (value.length >= 2) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }

  const handleInputFocus = () => {
    setIsFocused(true)
    if (query.length >= 2) {
      setIsOpen(true)
    }
  }

  const handleInputBlur = () => {
    setIsFocused(false)
    // Delay closing to allow clicking on results
    setTimeout(() => setIsOpen(false), 150)
  }

  const handleResultClick = () => {
    setIsOpen(false)
    onResultClick?.()
  }

  const handleClearSearch = () => {
    setQuery('')
    setIsOpen(false)
  }

  const formatLocation = (city: string | null, state: string | null) => {
    if (!city && !state) return null
    return [city, state].filter(Boolean).join(', ')
  }

  const formatCategories = (categories: string | null) => {
    if (!categories) return null
    return categories.split(',').slice(0, 2).join(', ')
  }

  // Skeleton loader component
  const SkeletonLoader = () => (
    <div className="py-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
          <div className="flex items-center space-x-3">
            {/* Avatar skeleton */}
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
            
            {/* Arrow skeleton */}
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-full 
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent 
                     shadow-sm transition-all duration-200 ${
                       isFocused ? 'shadow-md' : ''
                     }`}
        />
        
        {/* Search Icon */}
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
          {loading ? (
            <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full" />
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-8 pr-2 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Backdrop - desktop only, exclude navbar area */}
      {isOpen && (
        <div 
          className="hidden md:block fixed top-20 left-0 right-0 bottom-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown Results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto
                     animate-in slide-in-from-top-2 fade-in duration-200"
        >
          {error ? (
            <div className="p-4 text-center text-red-600">
              <p className="text-sm">Failed to search artists</p>
              <button
                onClick={() => setQuery(query)}
                className="mt-2 text-xs text-amber-600 hover:text-amber-700"
              >
                Try again
              </button>
            </div>
          ) : loading ? (
            <SkeletonLoader />
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artists/${artist.handle}`}
                  prefetch={false}
                  onClick={handleResultClick}
                  className="block px-4 py-3 hover:bg-gray-50 transition-all duration-150 border-b border-gray-100 last:border-b-0 
                             hover:shadow-sm hover:scale-[1.01]"
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {artist.avatar_url ? (
                        <Image
                          src={artist.avatar_url}
                          alt={artist.display_name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                          <span className="text-amber-600 font-medium text-sm">
                            {artist.display_name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Artist Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {artist.display_name}
                        </h4>
                        {artist.rank > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Match
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-1 space-y-1">
                        {formatLocation(artist.city, artist.state) && (
                          <p className="text-xs text-gray-500 truncate">
                            📍 {formatLocation(artist.city, artist.state)}
                          </p>
                        )}
                        {formatCategories(artist.categories) && (
                          <p className="text-xs text-amber-600 truncate">
                            🎨 {formatCategories(artist.categories)}
                          </p>
                        )}
                        {artist.bio && (
                          <p className="text-xs text-gray-600 truncate">
                            {artist.bio.length > 60 ? `${artist.bio.substring(0, 60)}...` : artist.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
              
              {/* View All Results */}
              {results.length >= 8 && (
                <div className="px-4 py-2 border-t border-gray-100">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    prefetch={false}
                    onClick={handleResultClick}
                    className="block text-center text-sm text-amber-600 hover:text-amber-700 font-medium 
                               transition-colors duration-150 hover:bg-amber-50 py-2 rounded-lg"
                  >
                    View all results for &quot;{query}&quot;
                  </Link>
                </div>
              )}
            </div>
          ) : query.length >= 2 && !loading && results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No artists found for &quot;{query}&quot;</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
