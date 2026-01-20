'use client'

import useSWRImmutable from 'swr/immutable'
import { createClient } from '@/lib/supabase/client'

interface BillingPrice {
  id: string
  stripe_price_id: string
  tier: string
  interval: 'month' | 'year'
  unit_amount: number | null
  currency: string | null
  is_active: boolean
}

interface UseBillingPricesReturn {
  prices: BillingPrice[]
  monthlyPrice: BillingPrice | null
  yearlyPrice: BillingPrice | null
  loading: boolean
  error: Error | null
}

/**
 * Hook to fetch active Pro billing prices
 */
export function useBillingPrices(): UseBillingPricesReturn {
  // Immutable cache: prices rarely change and should not refetch aggressively.
  const swrKey = 'billing_prices'

  const fetchPrices = async (): Promise<BillingPrice[]> => {
    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('billing_prices')
      .select('*')
      .eq('is_active', true)
      .eq('tier', 'pro')
      .order('interval', { ascending: true })

    if (fetchError) {
      throw new Error(fetchError.message || 'Failed to fetch billing prices')
    }

    return ((data as BillingPrice[]) || []) satisfies BillingPrice[]
  }

  const { data, error } = useSWRImmutable<BillingPrice[]>(
    swrKey,
    fetchPrices,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60 * 60 * 1000, // 1 hour
      keepPreviousData: true,
    }
  )

  const prices = data ?? []
  const loading = !error && data === undefined

  const monthlyPrice = prices.find(p => p.interval === 'month') || null
  const yearlyPrice = prices.find(p => p.interval === 'year') || null

  return {
    prices,
    monthlyPrice,
    yearlyPrice,
    loading,
    error: error ?? null,
  }
}

