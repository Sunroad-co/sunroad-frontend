'use client'

import useSWRImmutable from 'swr/immutable'
import { createClient } from '@/lib/supabase/client'

export interface Category {
  id: number
  name: string
}

export function useCategories() {
  // Immutable cache: categories are effectively static; avoid refetch churn.
  const swrKey = 'categories'

  const fetchCategories = async (): Promise<Category[]> => {
    const supabase = createClient()

    const { data, error: fetchError } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true })

    if (fetchError) {
      throw new Error(fetchError.message || 'Failed to load categories. Please try again.')
    }

    return ((data || []) as Category[]) satisfies Category[]
  }

  const { data, error, mutate } = useSWRImmutable<Category[]>(
    swrKey,
    fetchCategories,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60 * 60 * 1000, // 1 hour
      keepPreviousData: true,
    }
  )

  const categories = data ?? []
  const loading = !error && data === undefined
  const errorMessage = error ? (error.message || 'Failed to load categories. Please try again.') : null

  const retry = () => {
    // Force a refetch even with immutable caching.
    void mutate()
  }

  return {
    categories,
    loading,
    error: errorMessage,
    retry,
  }
}

