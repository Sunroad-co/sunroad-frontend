'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

/**
 * BrandManifesto - Simple 3-item row with natural-sized images
 * 
 * Features:
 * - 3-item row: [Left Illustration] [Auth Brand Card] [Right Illustration]
 * - Elements touch edge-to-edge with no gaps
 * - No padding for seamless flow to HeroMasonry below
 * - Desktop: All elements match 600px height (images and center card)
 * - Animation sequencing (triggered when user scrolls ~30% into section):
 *   - After 150ms: BW overlays fade in (0->1 over ~1400ms)
 *   - After 600ms: Center card fades in
 *   - After 1100ms (500ms after card appears): BW→color crossfade starts with light bloom effect:
 *     * Color images: perceptible from start (opacity 0.08), gradually appear on top
 *       - Initial: opacity 0.08, blur 0.5px, saturate 90%, contrast 95%
 *       - Final: opacity 100%, blur 0px, saturate 100%, contrast 100%
 *       - Duration: 11000ms with cinematic easing (cubic-bezier 0.22,1,0.36,1)
 *     * BW images: hold briefly, then fade out
 *       - Stay at opacity 100% while color begins appearing
 *       - Fade out with 750ms delay, duration 8000ms (slightly shorter than color)
 * - Center card matches auth-layout styling (max-width 360px), fills full height
 * - Mobile: flex-row for images with circular badge overlay positioned lower (60%)
 */
export default function BrandManifesto() {
  const [isInView, setIsInView] = useState(false)
  const [showBW, setShowBW] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [revealColor, setRevealColor] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const hasTriggeredRef = useRef(false)

  // Detect reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // IntersectionObserver to trigger animation sequencing
  useEffect(() => {
    if (prefersReducedMotion) {
      // Show everything immediately for reduced motion
      setShowBW(true)
      setShowCard(true)
      setRevealColor(true)
      return
    }

    if (!sectionRef.current || hasTriggeredRef.current) return

    const observerOptions: IntersectionObserverInit = {
      root: null,
      // Use negative top margin to delay trigger until user has scrolled ~30% into the section
      // This ensures the animation starts when the section is well into view and user won't miss it
      // -30% top margin means intersection area starts 30% down from top of section
      rootMargin: '-30% 0px -20% 0px',
      threshold: 0.3,
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true
          setIsInView(true)
          
          // Animation sequencing:
          // After 150ms: BW overlays fade in (0->1 over ~1400ms)
          setTimeout(() => {
            setShowBW(true)
          }, 150)
          
          // After 600ms: fade in center card
          setTimeout(() => {
            setShowCard(true)
          }, 600)
          
          // After 1100ms (500ms after card appears): start BW->color crossfade
          setTimeout(() => {
            setRevealColor(true)
          }, 1100)
          
          observer.unobserve(entry.target)
        }
      })
    }, observerOptions)

    observer.observe(sectionRef.current)

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current)
    }
  }, [prefersReducedMotion])

  return (
    <section 
      ref={sectionRef}
      className="relative w-full mt-10 flex flex-col items-center justify-center"
    >
      {/* Desktop Layout: flex-row with no gaps - elements touch edge-to-edge */}
      <div className="hidden md:flex items-center justify-center w-full max-w-[1600px] mx-auto h-[600px]" style={{ gap: 0 }}>
        {/* Left Image - Man illustration, natural size */}
        <div className="relative flex-shrink-0 inline-block h-[600px]">
          {/* BW image (base layer for sizing) */}
          <Image
            src="/heroart/man_bw.png"
            alt=""
            width={400}
            height={600}
            className={`w-auto h-full max-w-full scale-x-[-1] block transition-opacity duration-[8000ms] delay-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              showBW && !revealColor ? 'opacity-100' : revealColor ? 'opacity-0' : 'opacity-0'
            } motion-reduce:opacity-0`}
            unoptimized
          />
          {/* Color image (overlay, crossfade in with light bloom) */}
          <Image
            src="/heroart/man_color.png"
            alt=""
            width={400}
            height={600}
            className={`absolute inset-0 w-auto h-full max-w-full scale-x-[-1] transition-all duration-[11000ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              revealColor ? 'opacity-100' : 'opacity-[0.02]'
            } motion-reduce:opacity-100`}
            style={{
              filter: revealColor 
                ? 'blur(0px) saturate(100%) contrast(100%)' 
                : 'blur(0.5px) saturate(90%) contrast(95%)',
              transition: 'opacity 11000ms cubic-bezier(0.22, 1, 0.36, 1), filter 11000ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            unoptimized
          />
        </div>

        {/* Center Brand Card - Auth-layout card component matching image height */}
        <div className={`relative flex-shrink-0 w-auto max-w-[360px] h-[600px] flex flex-col justify-center transition-opacity duration-700 ease-in-out ${
          showCard ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } motion-reduce:opacity-100 motion-reduce:pointer-events-auto`}>
          <div className="relative bg-white/10 backdrop-blur-sm rounded-t-3xl p-6 shadow-2xl h-full flex flex-col justify-center">
            <Image
              src="/sunroad_artwork.png"
              alt="Connecting you to local creatives"
              width={400}
              height={300}
              className="w-full h-auto max-h-[420px] object-contain mb-4"
              unoptimized
            />
            <p className="font-display text-lg text-sunroad-brown-700 text-center">
              Connecting you to local creatives
            </p>
          </div>
        </div>

        {/* Right Image - Woman illustration, natural size */}
        <div className="relative flex-shrink-0 inline-block h-[600px]">
          {/* BW image (base layer for sizing) */}
          <Image
            src="/heroart/woman_bw.png"
            alt=""
            width={400}
            height={600}
            className={`w-auto h-full max-w-full scale-x-[-1] block transition-opacity duration-[8000ms] delay-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              showBW && !revealColor ? 'opacity-100' : revealColor ? 'opacity-0' : 'opacity-0'
            } motion-reduce:opacity-0`}
            unoptimized
          />
          {/* Color image (overlay, crossfade in with light bloom) */}
          <Image
            src="/heroart/woman_color.png"
            alt=""
            width={400}
            height={600}
            className={`absolute inset-0 w-auto h-full max-w-full scale-x-[-1] transition-all duration-[11000ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              revealColor ? 'opacity-100' : 'opacity-[0.02]'
            } motion-reduce:opacity-100`}
            style={{
              filter: revealColor 
                ? 'blur(0px) saturate(100%) contrast(100%)' 
                : 'blur(0.5px) saturate(90%) contrast(95%)',
              transition: 'opacity 11000ms cubic-bezier(0.22, 1, 0.36, 1), filter 11000ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            unoptimized
          />
        </div>
      </div>

      {/* Mobile Layout: One row for images with centered badge overlay */}
      <div className="md:hidden w-full max-w-2xl mx-auto flex flex-row items-center justify-center relative" style={{ gap: 0 }}>
        {/* Left Image - Man illustration */}
        <div className="relative inline-block">
          {/* BW image (base layer for sizing) */}
          <Image
            src="/heroart/man_bw.png"
            alt=""
            width={400}
            height={600}
            className={`w-auto h-auto max-w-full scale-x-[-1] block transition-opacity duration-[8000ms] delay-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              showBW && !revealColor ? 'opacity-100' : revealColor ? 'opacity-0' : 'opacity-0'
            } motion-reduce:opacity-0`}
            unoptimized
          />
          {/* Color image (overlay, crossfade in with light bloom) */}
          <Image
            src="/heroart/man_color.png"
            alt=""
            width={400}
            height={600}
            className={`absolute inset-0 w-auto h-auto max-w-full scale-x-[-1] transition-all duration-[11000ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              revealColor ? 'opacity-100' : 'opacity-[0.02]'
            } motion-reduce:opacity-100`}
            style={{
              filter: revealColor 
                ? 'blur(0px) saturate(100%) contrast(100%)' 
                : 'blur(0.5px) saturate(90%) contrast(95%)',
              transition: 'opacity 11000ms cubic-bezier(0.22, 1, 0.36, 1), filter 11000ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            unoptimized
          />
        </div>

        {/* Right Image - Woman illustration */}
        <div className="relative inline-block">
          {/* BW image (base layer for sizing) */}
          <Image
            src="/heroart/woman_bw.png"
            alt=""
            width={400}
            height={600}
            className={`w-auto h-auto max-w-full scale-x-[-1] block transition-opacity duration-[8000ms] delay-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              showBW && !revealColor ? 'opacity-100' : revealColor ? 'opacity-0' : 'opacity-0'
            } motion-reduce:opacity-0`}
            unoptimized
          />
          {/* Color image (overlay, crossfade in with light bloom) */}
          <Image
            src="/heroart/woman_color.png"
            alt=""
            width={400}
            height={600}
            className={`absolute inset-0 w-auto h-auto max-w-full scale-x-[-1] transition-all duration-[11000ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              revealColor ? 'opacity-100' : 'opacity-[0.02]'
            } motion-reduce:opacity-100`}
            style={{
              filter: revealColor 
                ? 'blur(0px) saturate(100%) contrast(100%)' 
                : 'blur(0.5px) saturate(90%) contrast(95%)',
              transition: 'opacity 11000ms cubic-bezier(0.22, 1, 0.36, 1), filter 11000ms cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            unoptimized
          />
        </div>

        {/* Mobile Center Badge Overlay - Circular badge positioned lower than center */}
        <div className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative bg-white/80 backdrop-blur-sm rounded-full shadow-2xl p-3">
            <div className="relative w-[90px] h-[90px]">
              <Image
                src="/sunroad_logo.png"
                alt="Sun Road"
                fill
                sizes="90px"
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
