'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/hooks/use-user-profile'
import { revalidateCache } from '@/lib/revalidate-client'
import { useSocialPlatforms } from '@/hooks/use-social-platforms'
import * as simpleIcons from 'simple-icons'
import { Link, Globe } from 'lucide-react'
import ConfirmDialog from '@/components/ui/confirm-dialog'

interface EditLinksModalProps {
  isOpen: boolean
  onClose: () => void
  currentLinks: UserProfile['artist_links']
  profile: UserProfile
  onSuccess?: () => void
}

interface LinkEdit {
  id?: number // undefined for new links
  platform_key: string
  url: string
  label: string | null
  isNew?: boolean
  isDeleted?: boolean
}

// URL normalization helper
function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed)
      return trimmed
    } catch {
      return ''
    }
  }
  
  try {
    new URL(`https://${trimmed}`)
    return `https://${trimmed}`
  } catch {
    return ''
  }
}

// Platform-specific URL validation
function validatePlatformUrl(url: string, platformKey: string): { valid: boolean; error?: string } {
  if (!url) return { valid: false, error: 'URL is required' }
  
  let urlObj: URL
  try {
    urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }
  
  const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '')
  
  // Platform-specific validation rules
  const platformRules: Record<string, string[]> = {
    instagram: ['instagram.com'],
    facebook: ['facebook.com', 'fb.com'],
    linkedin: ['linkedin.com'],
    youtube: ['youtube.com', 'youtu.be'],
    x: ['x.com', 'twitter.com'],
    twitter: ['x.com', 'twitter.com'],
    pinterest: ['pinterest.com'],
    tiktok: ['tiktok.com'],
    etsy: ['etsy.com'],
    vimeo: ['vimeo.com'],
    soundcloud: ['soundcloud.com'],
    bandcamp: ['bandcamp.com'], // Also matches *.bandcamp.com
    website: [], // Any valid URL
    custom: [], // Any valid URL
  }
  
  const allowedHosts = platformRules[platformKey.toLowerCase()]
  
  // website and custom allow any hostname
  if (platformKey === 'website' || platformKey === 'custom') {
    return { valid: true }
  }
  
  // Check if hostname matches allowed hosts
  if (!allowedHosts || allowedHosts.length === 0) {
    return { valid: true } // Unknown platform, allow it
  }
  
  const matches = allowedHosts.some(allowed => {
    if (platformKey === 'bandcamp') {
      return hostname === allowed || hostname.endsWith(`.${allowed}`)
    }
    return hostname === allowed || hostname.endsWith(`.${allowed}`)
  })
  
  if (!matches) {
    const platformName = platformKey.charAt(0).toUpperCase() + platformKey.slice(1)
    return { 
      valid: false, 
      error: `This URL doesn't appear to be a ${platformName} link. Expected: ${allowedHosts.join(' or ')}` 
    }
  }
  
  return { valid: true }
}

// Icon rendering helpers (reused from ArtistSocialLinks)
function getSimpleIcon(platformKey: string, iconKey?: string | null) {
  // Try icon_key first if provided
  if (iconKey) {
    const iconKeyLower = iconKey.toLowerCase().replace(/[^a-z0-9]/g, '')
    const iconName = `si${iconKeyLower.charAt(0).toUpperCase() + iconKeyLower.slice(1)}` as keyof typeof simpleIcons
    if (simpleIcons[iconName]) {
      return simpleIcons[iconName]
    }
  }

  // Map platform_key to simple-icons
  const keyMap: Record<string, keyof typeof simpleIcons> = {
    instagram: 'siInstagram',
    facebook: 'siFacebook',
    x: 'siX',
    twitter: 'siX',
    youtube: 'siYoutube',
    tiktok: 'siTiktok',
    spotify: 'siSpotify',
    soundcloud: 'siSoundcloud',
    bandcamp: 'siBandcamp',
    pinterest: 'siPinterest',
    etsy: 'siEtsy',
    behance: 'siBehance',
    dribbble: 'siDribbble',
    vimeo: 'siVimeo',
  }

  const iconName = keyMap[platformKey.toLowerCase()]
  if (iconName && simpleIcons[iconName]) {
    return simpleIcons[iconName]
  }

  return null
}

function renderPlatformIcon(platformKey: string, iconKey?: string | null, size: 'sm' | 'md' = 'md') {
  const icon = getSimpleIcon(platformKey, iconKey)
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  
  if (icon) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={iconSize}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d={icon.path} />
      </svg>
    )
  }

  // Fallback: use generic link icon for website/custom/link-in-bio
  if (platformKey === 'website' || platformKey === 'custom' || platformKey === 'link-in-bio') {
    return <Globe className={iconSize} />
  }

  // Final fallback: generic link icon
  return <Link className={iconSize} />
}

// Prefix mode helpers
const PREFIX_MODE_PLATFORMS: Record<string, string> = {
  instagram: 'instagram.com',
  linkedin: 'linkedin.com',
  tiktok: 'tiktok.com',
  pinterest: 'pinterest.com',
  x: 'x.com',
  twitter: 'x.com', // Treat twitter as x
}

function shouldUsePrefixMode(platformKey: string): boolean {
  return platformKey.toLowerCase() in PREFIX_MODE_PLATFORMS
}

function getPrefixHost(platformKey: string): string | null {
  const key = platformKey.toLowerCase()
  if (key === 'twitter') return PREFIX_MODE_PLATFORMS['x']
  return PREFIX_MODE_PLATFORMS[key] || null
}

function parseUrlForPrefixMode(url: string, expectedHost: string): { suffix: string; usePrefixMode: boolean } {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '')
    
    if (hostname === expectedHost || hostname.endsWith(`.${expectedHost}`)) {
      // Extract pathname (without leading /) + search + hash
      const pathname = urlObj.pathname.replace(/^\//, '')
      const suffix = pathname + urlObj.search + urlObj.hash
      return { suffix, usePrefixMode: true }
    }
  } catch {
    // URL parsing failed, fallback to full URL
  }
  
  return { suffix: '', usePrefixMode: false }
}

export default function EditLinksModal({ isOpen, onClose, currentLinks, profile, onSuccess }: EditLinksModalProps) {
  const { platforms, isLoading: loadingPlatforms } = useSocialPlatforms()
  const [links, setLinks] = useState<LinkEdit[]>([])
  const [newLinkPlatform, setNewLinkPlatform] = useState<string>('')
  const [newLinkUrl, setNewLinkUrl] = useState<string>('')
  const [newLinkLabel, setNewLinkLabel] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<number | string, string>>({})
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  // Initialize links when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialLinks: LinkEdit[] = (currentLinks || []).map(link => ({
        id: link.id,
        platform_key: link.platform_key,
        url: link.url,
        label: link.label,
      }))
      setLinks(initialLinks)
      setNewLinkPlatform('')
      setNewLinkUrl('')
      setNewLinkLabel('')
      setError(null)
      setValidationErrors({})
      setDeletingIndex(null)
      setShowDiscardConfirm(false)
    }
  }, [isOpen, currentLinks])

  const availablePlatforms = useMemo(() => {
    // Dedupe platforms by key, then add 'custom' if it doesn't exist
    const platformMap = new Map<string, typeof platforms[0] & { host_patterns?: string[] | null }>()
    platforms.forEach(p => {
      if (!platformMap.has(p.key)) {
        platformMap.set(p.key, p)
      }
    })
    
    // Add 'custom' only if it doesn't already exist
    if (!platformMap.has('custom')) {
      platformMap.set('custom', { 
        key: 'custom', 
        display_name: 'Custom Link', 
        icon_key: 'link', 
        sort_order: 999, 
        is_active: true, 
        host_patterns: null 
      })
    }
    
    return Array.from(platformMap.values()).sort((a, b) => a.sort_order - b.sort_order)
  }, [platforms])

  // Get existing platform keys (excluding custom and deleted links)
  const existingPlatformKeys = useMemo(() => {
    const visibleLinks = links.filter(l => !l.isDeleted)
    return new Set(visibleLinks.map(l => l.platform_key).filter(key => key !== 'custom'))
  }, [links])

  // Filter platforms for picker (hide existing ones, except custom is always available)
  const availablePlatformsForPicker = useMemo(() => {
    return availablePlatforms.filter(p => p.key === 'custom' || !existingPlatformKeys.has(p.key))
  }, [availablePlatforms, existingPlatformKeys])

  const handleAddLink = () => {
    if (!newLinkPlatform || !newLinkUrl.trim()) {
      setError('Please select a platform and enter a URL')
      return
    }

    const normalizedUrl = normalizeUrl(newLinkUrl.trim())
    if (!normalizedUrl) {
      setError('Please enter a valid URL')
      return
    }

    // Validate platform-specific URL
    const validation = validatePlatformUrl(normalizedUrl, newLinkPlatform)
    if (!validation.valid) {
      setValidationErrors({ new: validation.error || 'Invalid URL for this platform' })
      return
    }

    // Check for duplicate non-custom platforms
    if (newLinkPlatform !== 'custom') {
      const existing = links.find(l => !l.isDeleted && l.platform_key === newLinkPlatform)
      if (existing) {
        const platform = platforms.find(p => p.key === newLinkPlatform)
        setError(`Only one ${platform?.display_name || newLinkPlatform} link is allowed`)
        return
      }
    }

    const newLink: LinkEdit = {
      platform_key: newLinkPlatform,
      url: normalizedUrl,
      label: newLinkPlatform === 'custom' ? (newLinkLabel.trim() || null) : null,
      isNew: true,
    }

    setLinks([...links, newLink])
    setNewLinkPlatform('')
    setNewLinkUrl('')
    setNewLinkLabel('')
    setError(null)
    setValidationErrors({})
  }

  const handleUpdateLink = (index: number, updates: Partial<LinkEdit>) => {
    const updatedLinks = [...links]
    const link = updatedLinks[index]
    
    if (link.isDeleted) return // Don't update deleted links
    
    const updatedLink = { ...link, ...updates }
    const linkKey = link.id || `new-${index}`
    
    // Normalize URL if changed
    if (updates.url !== undefined) {
      const normalized = normalizeUrl(updates.url)
      if (normalized) {
        updatedLink.url = normalized
      } else if (updates.url.trim()) {
        setValidationErrors({ ...validationErrors, [linkKey]: 'Please enter a valid URL' })
        return
      }
    }
    
    // Validate platform-specific URL if URL changed
    if (updates.url !== undefined) {
      const validation = validatePlatformUrl(updatedLink.url, updatedLink.platform_key)
      if (!validation.valid) {
        setValidationErrors({ ...validationErrors, [linkKey]: validation.error || 'Invalid URL for this platform' })
        return
      } else {
        // Clear validation error for this link
        const newErrors = { ...validationErrors }
        delete newErrors[linkKey]
        setValidationErrors(newErrors)
      }
    }
    
    updatedLinks[index] = updatedLink
    setLinks(updatedLinks)
    setError(null)
  }

  const handleDeleteLink = (index: number) => {
    const updatedLinks = [...links]
    const link = updatedLinks[index]
    
    if (link.isNew) {
      // Remove new links entirely
      updatedLinks.splice(index, 1)
    } else {
      // Mark existing links as deleted
      updatedLinks[index] = { ...link, isDeleted: true }
    }
    
    setLinks(updatedLinks)
    setDeletingIndex(null)
  }

  const handleSave = async () => {
    // Validate all links before saving
    const errors: Record<number | string, string> = {}
    visibleLinks.forEach((link, index) => {
      const linkKey = link.id || `new-${index}`
      const validation = validatePlatformUrl(link.url, link.platform_key)
      if (!validation.valid) {
        errors[linkKey] = validation.error || 'Invalid URL for this platform'
      }
    })
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      setError('Please fix validation errors before saving')
      return
    }

      setSaving(true)
      setError(null)

    try {
      const supabase = createClient()

      // Process deletions first
      const toDelete = links.filter(l => l.isDeleted && l.id)
      for (const link of toDelete) {
        const { error: deleteError } = await supabase
          .from('artist_links')
          .delete()
          .eq('id', link.id!)
          .eq('artist_id', profile.id)

        if (deleteError) {
          throw new Error(`Failed to delete link: ${deleteError.message}`)
        }
      }

      // Process updates
      const toUpdate = links.filter(l => !l.isDeleted && !l.isNew && l.id)
      for (const link of toUpdate) {
      const { error: updateError } = await supabase
          .from('artist_links')
        .update({
            platform_key: link.platform_key,
            url: link.url,
            label: link.label,
          })
          .eq('id', link.id!)
          .eq('artist_id', profile.id)

      if (updateError) {
          // Check for uniqueness constraint violation
          if (updateError.code === '23505' || updateError.message.includes('unique')) {
            const platform = platforms.find(p => p.key === link.platform_key)
            throw new Error(`Only one ${platform?.display_name || link.platform_key} link is allowed`)
          }
          throw new Error(`Failed to update link: ${updateError.message}`)
        }
      }

      // Process inserts
      const toInsert = links.filter(l => !l.isDeleted && l.isNew)
      for (const link of toInsert) {
        const { error: insertError } = await supabase
          .from('artist_links')
          .insert({
            artist_id: profile.id,
            platform_key: link.platform_key,
            url: link.url,
            label: link.label,
            sort_order: 0,
            is_public: true,
          })

        if (insertError) {
          // Check for uniqueness constraint violation
          if (insertError.code === '23505' || insertError.message.includes('unique')) {
            const platform = platforms.find(p => p.key === link.platform_key)
            throw new Error(`Only one ${platform?.display_name || link.platform_key} link is allowed`)
          }
          throw new Error(`Failed to add link: ${insertError.message}`)
        }
      }

      // Revalidate cache once after all operations
      if (profile.handle) {
        await revalidateCache({
          handle: profile.handle,
          artistId: profile.id,
          tags: [`artist:${profile.handle}`, `artist-works:${profile.id}`],
        })
      }

      // Success
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err) {
      console.error('Error saving links:', err)
      setError(err instanceof Error ? err.message : 'Failed to save links. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    const initialLinks: LinkEdit[] = (currentLinks || []).map(link => ({
      id: link.id,
      platform_key: link.platform_key,
      url: link.url,
      label: link.label,
    }))
    setLinks(initialLinks)
    setNewLinkPlatform('')
    setNewLinkUrl('')
    setNewLinkLabel('')
    setError(null)
    setDeletingIndex(null)
    setShowDiscardConfirm(false)
    onClose()
  }

  const handleCloseClick = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true)
    } else {
      handleCancel()
    }
  }

  const hasChanges = useMemo(() => {
    const currentLinkMap = new Map((currentLinks || []).map(l => [l.id, l]))
    const editedLinks = links.filter(l => !l.isDeleted)
    
    // Check if counts differ
    if (currentLinkMap.size !== editedLinks.length) return true
    
    // Check if any links changed
    for (const link of editedLinks) {
      if (link.isNew) return true
      const current = currentLinkMap.get(link.id!)
      if (!current) return true
      if (current.platform_key !== link.platform_key) return true
      if (current.url !== link.url) return true
      if (current.label !== link.label) return true
    }
    
    return false
  }, [links, currentLinks])

  // Check if new link is valid
  const isNewLinkValid = useMemo(() => {
    if (!newLinkPlatform || !newLinkUrl.trim()) return false
    const normalized = normalizeUrl(newLinkUrl.trim())
    if (!normalized) return false
    const validation = validatePlatformUrl(normalized, newLinkPlatform)
    return validation.valid
  }, [newLinkPlatform, newLinkUrl])

  if (!isOpen) return null

  const visibleLinks = links.filter(l => !l.isDeleted)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Edit Social Links</h2>
          <button
            onClick={handleCloseClick}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Global Error Message - at top */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {loadingPlatforms ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading platforms...</p>
            </div>
          ) : (
          <div className="space-y-6">
              {/* Existing Links */}
              {visibleLinks.length > 0 && (
            <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Current Links</h3>
                  <div className="space-y-3">
                    {visibleLinks.map((link, index) => {
                      const originalIndex = links.findIndex(l => l === link)
                      const platform = availablePlatforms.find(p => p.key === link.platform_key)
                      const linkKey = String(link.id ?? `new-${originalIndex}`)
                      const validationError = validationErrors[linkKey]
                      const isDeleting = deletingIndex === originalIndex
                      
                      // Check if we should use prefix mode
                      const prefixHost = shouldUsePrefixMode(link.platform_key) ? getPrefixHost(link.platform_key) : null
                      const { suffix: currentSuffix, usePrefixMode } = prefixHost 
                        ? parseUrlForPrefixMode(link.url, prefixHost)
                        : { suffix: '', usePrefixMode: false }
                      
                      return (
                        <div key={linkKey} className="border border-gray-200 rounded-lg p-3">
                          {isDeleting ? (
                            // Delete confirmation
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-700">Delete this link?</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setDeletingIndex(null)}
                                  className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleDeleteLink(originalIndex)}
                                  className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Link row
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                {/* Platform icon + name (locked) */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 text-sunroad-brown-600">
                                    {renderPlatformIcon(link.platform_key, platform?.icon_key, 'sm')}
                                  </div>
                                  <span className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
                                    {platform?.display_name || link.platform_key}
                                  </span>
                                </div>
                                
                                {/* URL input - prefix mode or full */}
                                {usePrefixMode && prefixHost ? (
                                  <div className="flex-1 min-w-0 flex items-center gap-1">
                                    {/* Prefix chip */}
                                    <div className="flex-shrink-0 px-2 py-1.5 bg-gray-100 border border-gray-300 rounded-l-lg text-xs text-gray-600 font-mono">
                                      {prefixHost}/
                                    </div>
                                    {/* Suffix input */}
                                    <input
                                      type="text"
                                      value={currentSuffix}
                                      onChange={(e) => {
                                        const suffix = e.target.value
                                        // Rebuild URL: if suffix is empty, use just the host, otherwise add the suffix
                                        const rebuiltUrl = suffix.trim() 
                                          ? `https://${prefixHost}/${suffix}`
                                          : `https://${prefixHost}/`
                                        handleUpdateLink(originalIndex, { url: rebuiltUrl })
                                        // Clear validation error when user types
                                        if (validationErrors[linkKey]) {
                                          const newErrors = { ...validationErrors }
                                          delete newErrors[linkKey]
                                          setValidationErrors(newErrors)
                                        }
                                      }}
                                      placeholder="username"
                                      className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 border-l-0 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 text-sm"
                                    />
                </div>
                                ) : (
                                  <div className="flex-1 min-w-0">
                <input
                  type="url"
                                      value={link.url}
                                      onChange={(e) => {
                                        handleUpdateLink(originalIndex, { url: e.target.value })
                                        // Clear validation error when user types
                                        if (validationErrors[linkKey]) {
                                          const newErrors = { ...validationErrors }
                                          delete newErrors[linkKey]
                                          setValidationErrors(newErrors)
                                        }
                                      }}
                                      placeholder="https://..."
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 text-sm"
                />
              </div>
                                )}
                                
                                {/* Delete button */}
                                <button
                                  onClick={() => setDeletingIndex(originalIndex)}
                                  className="text-red-600 hover:text-red-800 transition-colors flex-shrink-0"
                                  aria-label="Delete link"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
            </div>

                              {/* Label input for custom links */}
                              {link.platform_key === 'custom' && (
            <div>
                                  <input
                                    type="text"
                                    value={link.label || ''}
                                    onChange={(e) => handleUpdateLink(originalIndex, { label: e.target.value.trim() || null })}
                                    placeholder="Label (optional)"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 text-sm"
                                  />
                                </div>
                              )}
                              
                              {/* Validation error */}
                              {validationError && (
                                <div className="bg-red-50 border border-red-200 rounded p-1.5">
                                  <p className="text-xs text-red-800">{validationError}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Add New Link */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Link</h3>
                
                {!newLinkPlatform ? (
                  // Platform picker (icon grid)
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-3">Select a platform:</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {availablePlatformsForPicker.map(platform => (
                        <button
                          key={platform.key}
                          onClick={() => setNewLinkPlatform(platform.key)}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-200 hover:border-sunroad-amber-300 hover:bg-sunroad-amber-50/40 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 text-sunroad-brown-600">
                            {renderPlatformIcon(platform.key, platform.icon_key, 'sm')}
                          </div>
                          <span className="text-xs text-gray-700 text-center leading-tight">{platform.display_name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // URL input form (after platform selected)
                  <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                    {/* Selected platform display */}
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 text-sunroad-brown-600">
                        {renderPlatformIcon(newLinkPlatform, availablePlatforms.find(p => p.key === newLinkPlatform)?.icon_key, 'sm')}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {availablePlatforms.find(p => p.key === newLinkPlatform)?.display_name || newLinkPlatform}
                      </span>
                      <button
                        onClick={() => {
                          setNewLinkPlatform('')
                          setNewLinkUrl('')
                          setNewLinkLabel('')
                          setValidationErrors({})
                        }}
                        className="ml-auto text-xs text-gray-500 hover:text-gray-700"
                      >
                        Change
                      </button>
                    </div>
                    
                    {/* URL input */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                <input
                  type="url"
                        value={newLinkUrl}
                        onChange={(e) => {
                          setNewLinkUrl(e.target.value)
                          // Clear validation error when user types
                          if (validationErrors.new) {
                            const newErrors = { ...validationErrors }
                            delete newErrors.new
                            setValidationErrors(newErrors)
                          }
                        }}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 text-sm"
                      />
            </div>

                    {/* Label input for custom */}
                    {newLinkPlatform === 'custom' && (
            <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Label (optional)</label>
                <input
                          type="text"
                          value={newLinkLabel}
                          onChange={(e) => setNewLinkLabel(e.target.value)}
                          placeholder="e.g., My Portfolio"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sunroad-amber-500 text-sm"
                        />
                      </div>
                    )}
                    
                    {/* Validation error */}
                    {validationErrors.new && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="text-xs text-red-800">{validationErrors.new}</p>
                      </div>
                    )}
                    
                    {/* Add button */}
                    <button
                      onClick={handleAddLink}
                      disabled={!isNewLinkValid}
                      className="w-full px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      Add Link
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleCloseClick}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving || loadingPlatforms}
            className="px-4 py-2 bg-sunroad-amber-600 text-white rounded-lg hover:bg-sunroad-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Discard Changes Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard changes?"
        message="You have unsaved changes. Are you sure you want to close without saving?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        confirmVariant="danger"
        onConfirm={handleCancel}
        onCancel={() => setShowDiscardConfirm(false)}
        isLoading={saving}
      />
    </div>
  )
}
