'use client'

import { useState, useEffect } from 'react'
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
  const [prices, setPrices] = useState<BillingPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchPrices() {
      try {
        setLoading(true)
        setError(null)

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

        setPrices((data as BillingPrice[]) || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch billing prices'))
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()
  }, [])

  const monthlyPrice = prices.find(p => p.interval === 'month') || null
  const yearlyPrice = prices.find(p => p.interval === 'year') || null

  return {
    prices,
    monthlyPrice,
    yearlyPrice,
    loading,
    error,
  }
}

