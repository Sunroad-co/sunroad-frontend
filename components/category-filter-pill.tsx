'use client'

import { useState, useRef, useEffect } from 'react'
import { useCategories } from '@/hooks/use-categories'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface CategoryFilterPillProps {
  selectedIds: number[]
  onChange: (ids: number[]) => void
  embedded?: boolean
  onActiveChange?: (isActive: boolean) => void
  isActive?: boolean
  showLabel?: boolean
  subtitle?: string
}

export default function CategoryFilterPill({
  selectedIds,
  onChange,
  embedded = false,
  onActiveChange,
  isActive = true,
  showLabel = true,
  subtitle = "Category filter"
}: CategoryFilterPillProps) {
  const { categories, loading, error, retry } = useCategories()
  const [isOpen, setIsOpen] = useState(false)
  const [categoryQuery, setCategoryQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when segment becomes inactive (for embedded mode)
  useEffect(() => {
    if (embedded && !isActive && isOpen) {
      setIsOpen(false)
      onActiveChange?.(false)
      setCategoryQuery('')
    }
  }, [embedded, isActive, isOpen, onActiveChange])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setIsOpen(false)
        onActiveChange?.(false)
        setCategoryQuery('') // Reset search when closing
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onActiveChange])

  const handleToggle = (categoryId: number) => {
    const newIds = selectedIds.includes(categoryId)
      ? selectedIds.filter(id => id !== categoryId)
      : [...selectedIds, categoryId]
    onChange(newIds)
    // Keep dropdown open after selection (don't auto-close)
  }

  const getButtonLabel = () => {
    if (selectedIds.length === 0) {
      return showLabel ? 'Category' : subtitle
    }

    if (selectedIds.length === 1 && categories.length > 0) {
      const category = categories.find(c => c.id === selectedIds[0])
      return category?.name || (showLabel ? 'Category' : subtitle)
    }

    if (selectedIds.length > 1 && categories.length > 0) {
      const firstCategory = categories.find(c => c.id === selectedIds[0])
      const count = selectedIds.length - 1
      return (
        <span>
          {firstCategory?.name || (showLabel ? 'Category' : subtitle)} <span className="text-gray-500 font-normal">+{count}</span>
        </span>
      )
    }

    return showLabel ? 'Category' : subtitle
  }

  const getSubtitle = () => {
    if (selectedIds.length === 0) {
      return subtitle
    }
    if (selectedIds.length === 1 && categories.length > 0) {
      const category = categories.find(c => c.id === selectedIds[0])
      return category?.name || subtitle
    }
    if (selectedIds.length > 1 && categories.length > 0) {
      const firstCategory = categories.find(c => c.id === selectedIds[0])
      const count = selectedIds.length - 1
      return `${firstCategory?.name || ''} +${count}`
    }
    return subtitle
  }

  // Filter categories based on search query
  const filteredCategories = categoryQuery.trim()
    ? categories.filter(cat =>
        cat.name.toLowerCase().includes(categoryQuery.toLowerCase())
      )
    : categories

  const handleButtonClick = () => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)
    onActiveChange?.(newIsOpen)
    if (newIsOpen) {
      setCategoryQuery('') // Reset search when opening
      // Focus the input after a short delay to allow dropdown to render
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }

  const handleDropdownMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  return (
    <div className={`${embedded ? '' : 'relative'} w-full`}>
      {!showLabel && embedded ? (
        // When showLabel is false, render as clickable subtitle text
        <button
          ref={buttonRef}
          type="button"
          onClick={handleButtonClick}
          className="w-full text-left text-sm text-gray-500 hover:text-gray-700 transition-colors min-w-0"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={cn(
            "block min-w-0",
            selectedIds.length > 0 && "text-amber-800 font-medium"
          )}>
            {getSubtitle()}
          </span>
        </button>
      ) : (
        <button
          ref={buttonRef}
          type="button"
          onClick={handleButtonClick}
          className={cn(
            'inline-flex items-center gap-1 text-sm transition-colors w-full min-w-0',
            embedded
              ? 'h-full rounded-none border-0 bg-transparent px-4 py-3 text-left'
              : 'rounded-full border bg-white min-w-[100px] px-3 py-2 justify-center',
            selectedIds.length > 0
              ? embedded
                ? 'text-amber-800 font-medium'
                : 'border-amber-300 bg-amber-50 text-amber-800 font-medium'
              : embedded
              ? 'text-gray-700'
              : 'border-gray-200 text-gray-700 hover:border-gray-300'
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="flex-1 min-w-0 truncate text-left overflow-hidden">{getButtonLabel()}</span>
          <svg
            className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          onMouseDown={handleDropdownMouseDown}
          className={cn(
            'absolute top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[60] max-h-96 overflow-hidden flex flex-col',
            'transition-all duration-200 ease-out',
            embedded 
              ? 'left-0 right-0 w-full md:left-0 md:right-auto md:w-[480px] md:min-w-[480px]' 
              : 'left-1/2 -translate-x-1/2 w-[calc(100vw-1rem)] max-w-64',
            'opacity-100 translate-y-0'
          )}
          role="listbox"
        >
          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 mb-2">{error}</p>
                <button
                  onClick={retry}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No categories available
            </div>
          ) : (
            <>
              {/* Search Input */}
              <div className="p-3 border-b border-gray-200">
                <input
                  ref={inputRef}
                  type="text"
                  value={categoryQuery}
                  onChange={(e) => {
                    e.stopPropagation()
                    setCategoryQuery(e.target.value)
                  }}
                  onKeyDown={(e) => {
                    e.stopPropagation()
                    if (e.key === 'Escape') {
                      setIsOpen(false)
                      onActiveChange?.(false)
                      buttonRef.current?.focus()
                    }
                  }}
                  placeholder="Search categories..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>

              {/* Category Chips */}
              <div className="flex-1 overflow-y-auto p-3">
                {filteredCategories.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-4">
                    No categories match &quot;{categoryQuery}&quot;
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredCategories.map((category) => {
                      const isSelected = selectedIds.includes(category.id)
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleToggle(category.id)}
                          role="option"
                          aria-selected={isSelected}
                          className={cn(
                            'px-3 py-1 text-sm rounded-full border transition-colors',
                            isSelected
                              ? 'bg-amber-100 border-amber-500 text-amber-800'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          {category.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

