'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Category {
  id: number
  name: string
}

// Module-level cache to persist across component mounts
let categoriesCache: Category[] | null = null
let cachePromise: Promise<Category[]> | null = null

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(categoriesCache || [])
  const [loading, setLoading] = useState(!categoriesCache)
  const [error, setError] = useState<string | null>(null)
  const hasFetchedRef = useRef(false)

  const fetchCategories = async () => {
    // If we already have a pending fetch, wait for it
    if (cachePromise) {
      try {
        const data = await cachePromise
        setCategories(data)
        setLoading(false)
        return
      } catch (err) {
        // If the cached promise failed, continue to fetch again
        cachePromise = null
      }
    }

    // If we already have cached data, use it
    if (categoriesCache) {
      setCategories(categoriesCache)
      setLoading(false)
      return
    }

    // Create a new fetch promise
    cachePromise = (async () => {
      try {
        setLoading(true)
        setError(null)
        const supabase = createClient()

        const { data, error: fetchError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name', { ascending: true })

        if (fetchError) {
          throw new Error(fetchError.message)
        }

        const fetchedCategories = (data || []) as Category[]
        categoriesCache = fetchedCategories
        setCategories(fetchedCategories)
        setLoading(false)
        cachePromise = null
        return fetchedCategories
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load categories. Please try again.'
        setError(errorMessage)
        setLoading(false)
        cachePromise = null
        throw err
      }
    })()

    try {
      await cachePromise
    } catch {
      // Error already handled in the promise
    }
  }

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchCategories()
    }
  }, [])

  const retry = () => {
    categoriesCache = null // Clear cache on retry
    cachePromise = null
    hasFetchedRef.current = false
    fetchCategories()
  }

  return {
    categories,
    loading,
    error,
    retry
  }
}

