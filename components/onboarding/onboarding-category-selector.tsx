'use client'

import { useState, useRef } from 'react'
import { useCategories } from '@/hooks/use-categories'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Loader2, X } from 'lucide-react'
import { useClickOutside } from '@/hooks/use-click-outside'

interface OnboardingCategorySelectorProps {
  selectedIds: number[]
  onSelect: (categoryId: number) => void
  onRemove: (categoryId: number) => void
  maxSelection: number
  error?: string | null
  disabled?: boolean
}

export default function OnboardingCategorySelector({
  selectedIds,
  onSelect,
  onRemove,
  maxSelection,
  error,
  disabled = false,
}: OnboardingCategorySelectorProps) {
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories()
  const [categorySearchQuery, setCategorySearchQuery] = useState('')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const categoryRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close category dropdown when clicking outside
  useClickOutside([categoryRef], () => {
    setShowCategoryDropdown(false)
  })

  // Filter categories based on search query
  const filteredCategories = categorySearchQuery.trim()
    ? categories.filter(cat =>
        cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
      )
    : categories

  const handleCategoryToggle = (categoryId: number) => {
    if (selectedIds.includes(categoryId)) {
      onRemove(categoryId)
    } else {
      if (selectedIds.length < maxSelection) {
        onSelect(categoryId)
        // Auto-close dropdown when maxSelection is reached
        if (selectedIds.length + 1 >= maxSelection) {
          setShowCategoryDropdown(false)
          setCategorySearchQuery('')
        }
      }
    }
  }

  // Handle backspace to remove last category when input is empty
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && categorySearchQuery === '' && selectedIds.length > 0) {
      e.preventDefault()
      onRemove(selectedIds[selectedIds.length - 1])
    }
  }

  // Focus input when container is clicked
  const handleContainerClick = () => {
    if (!disabled && !categoriesLoading && !categoriesError) {
      inputRef.current?.focus()
    }
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor="categories" className="font-body">
        Categories <span className="text-red-500">*</span>
      </Label>
      
      {/* Tag Input Container */}
      <div className="relative" ref={categoryRef}>
        {/* Container that mimics Input styling */}
        <div
          onClick={handleContainerClick}
          className={cn(
            "flex h-12 max-h-12 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 py-0 text-base shadow-sm transition-colors overflow-hidden",
            "focus-within:outline-none focus-within:ring-1 focus-within:ring-ring",
            error && "border-red-500 focus-within:ring-red-500",
            disabled && "cursor-not-allowed opacity-50",
            categoriesLoading && "opacity-60"
          )}
        >
          {/* Selected Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 h-full">
            {selectedIds.map((categoryId) => {
              const category = categories.find(c => c.id === categoryId)
              return (
                <div
                  key={categoryId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-sunroad-amber-100 border border-sunroad-amber-300 text-sunroad-amber-800 rounded-full text-xs font-medium flex-shrink-0"
                >
                  <span className="whitespace-nowrap">{category?.name || `Category ${categoryId}`}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(categoryId)
                    }}
                    disabled={disabled}
                    className="ml-0.5 hover:bg-sunroad-amber-200 rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-600 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Remove ${category?.name || 'category'}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
            
            {/* Search Input */}
            <input
              ref={inputRef}
              id="categories"
              type="text"
              placeholder={selectedIds.length === 0 ? "Search categories..." : ""}
              value={categorySearchQuery}
              onChange={(e) => {
                setCategorySearchQuery(e.target.value)
                setShowCategoryDropdown(true)
              }}
              onFocus={() => {
                if (!categoriesLoading && !categoriesError) {
                  setShowCategoryDropdown(true)
                }
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled || categoriesLoading || !!categoriesError || selectedIds.length >= maxSelection}
              className={cn(
                "flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm md:text-base font-body",
                "placeholder:text-muted-foreground",
                "disabled:cursor-not-allowed"
              )}
            />
          </div>
          
          {/* Loading Spinner */}
          {categoriesLoading && (
            <div className="flex-shrink-0">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Category Dropdown */}
        {showCategoryDropdown && !categoriesLoading && !categoriesError && (
          <div className="absolute z-10 w-full mt-2 border border-sunroad-amber-200 rounded-md bg-white shadow-lg overflow-hidden">
            <div className="max-h-60 overflow-y-auto p-3">
              {filteredCategories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {filteredCategories.map((category) => {
                    const isSelected = selectedIds.includes(category.id)
                    const isDisabled = !isSelected && selectedIds.length >= maxSelection
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryToggle(category.id)}
                        disabled={isDisabled || disabled}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-full border transition-colors font-medium",
                          isSelected
                            ? "bg-sunroad-amber-100 border-sunroad-amber-500 text-sunroad-amber-800"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
                          isDisabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {category.name}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm py-4">
                  No categories match &quot;{categorySearchQuery}&quot;
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {categoriesError && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800 mb-2">{categoriesError}</p>
            <p className="text-xs text-red-600">
              Unable to load categories. Please refresh the page or contact support.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 font-body">{error}</p>
      )}
      
      {!error && (
        <p className="text-xs text-muted-foreground font-body">
          Select up to {maxSelection} categories that best describe your creative work
        </p>
      )}
    </div>
  )
}

