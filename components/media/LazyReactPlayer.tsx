'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

/**
 * Lazy-loaded ReactPlayer component
 * 
 * Only loads react-player when component is actually rendered.
 * Reduces initial bundle size by ~150KB.
 */
const LazyReactPlayer = dynamic(
  () => import('react-player'),
  {
    ssr: false,
    loading: () => null, // No loading indicator - parent handles skeleton
  }
) as ComponentType<any>

export default LazyReactPlayer
