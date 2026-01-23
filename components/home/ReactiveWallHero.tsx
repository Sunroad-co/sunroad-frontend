import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroMasonry from "./HeroMasonry";
import DiscoveryLoopInline from "./DiscoveryLoopInline";
import type { HeroArtist } from "./HomeHero";

/**
 * ReactiveWallHero - Demand-first homepage hero
 * 
 * A full-viewport hero that emphasizes discovery for searchers/clients.
 * Uses HeroMasonry as visible background with a glass console overlay.
 * 
 * Features:
 * - HeroMasonry as visible ambient background
 * - Subtle vignette to focus attention on center
 * - Centered patch to hide HeroMasonry's built-in overlay text
 * - Glass console with messaging focused on finding creatives
 * - Embedded DiscoveryLoopInline for intent-based browsing
 * - Primary CTA: Browse creatives
 * - Secondary CTA: Claim profile (for creatives)
 * - Fully SSG/ISR-safe (server component, no client hooks)
 */

interface ReactiveWallHeroProps {
  artists: HeroArtist[];
}

export default function ReactiveWallHero({ artists }: ReactiveWallHeroProps) {
  return (
    <section 
      className="relative min-h-[100svh] w-full overflow-hidden"
      aria-label="Find local creatives"
    >
      {/* Background layer: HeroMasonry - fully visible */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        aria-hidden="true"
      >
        <HeroMasonry artists={artists} />
      </div>

      {/* Subtle vignette layer - darkens edges, keeps center clear */}
      {/* Never fully opaque - masonry wall stays visible throughout */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 45%, 
            rgba(250,249,240,0.15) 0%, 
            rgba(250,249,240,0.25) 40%,
            rgba(250,249,240,0.5) 70%,
            rgba(250,249,240,0.65) 100%
          )`
        }}
        aria-hidden="true"
      />

      {/* Center cover patch - hides HeroMasonry's CenteredOverlay capsule */}
      {/* Semi-transparent so masonry columns still peek through */}
      <div 
        className="absolute z-[25] pointer-events-none inset-x-0 top-0"
        style={{
          height: "42%",
          background: `linear-gradient(to bottom,
            rgba(250,249,240,0.85) 0%,
            rgba(250,249,240,0.8) 50%,
            rgba(250,249,240,0.5) 80%,
            transparent 100%
          )`
        }}
        aria-hidden="true"
      />

      {/* Foreground layer: Glass console */}
      <div className="relative z-30 min-h-[100svh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        
        {/* Glass console container */}
        <div className="relative w-full max-w-2xl mx-auto">
          
          {/* Glass console */}
          <div 
            className="relative rounded-3xl sm:rounded-[2rem] 
                       bg-white/80 backdrop-blur-xl
                       ring-1 ring-black/5
                       shadow-[0_25px_80px_rgba(0,0,0,0.1),0_10px_30px_rgba(0,0,0,0.05)]
                       px-5 sm:px-8 lg:px-10 
                       pt-8 sm:pt-10 lg:pt-12
                       pb-6 sm:pb-8 lg:pb-10"
          >
            {/* Small uppercase label */}
            <p className="text-center text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-gray-500 mb-3 sm:mb-4">
              Find local talent
            </p>

            {/* Main headline */}
            <h1 className="text-center text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gray-900 tracking-tight leading-[1.15] mb-6 sm:mb-8">
              Find the right creative
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              for your next idea.
            </h1>

            {/* Embedded DiscoveryLoopInline - no negative margins needed */}
            <div className="mb-6 sm:mb-8">
              <DiscoveryLoopInline />
            </div>

            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
              {/* Primary CTA */}
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2
                         px-6 py-3 sm:px-7 sm:py-3.5
                         text-base font-semibold text-white
                         bg-gray-900 hover:bg-gray-800
                         rounded-full
                         shadow-lg shadow-gray-900/20
                         hover:shadow-xl hover:shadow-gray-900/25
                         hover:-translate-y-0.5
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2
                         transition-all duration-200 ease-out
                         motion-reduce:hover:translate-y-0"
              >
                Browse creatives
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center gap-1.5
                         text-sm font-medium text-gray-500
                         hover:text-gray-900
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
                         transition-colors duration-200"
              >
                <span>Are you a creative?</span>
                <span className="text-amber-600 hover:text-amber-700">Claim your profile</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom hint - scroll indicator */}
        <div 
          className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 
                     text-gray-400 text-xs sm:text-sm font-medium
                     motion-reduce:hidden"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="opacity-60">Scroll to explore</span>
            <div className="w-5 h-8 rounded-full border-2 border-gray-300/50 flex items-start justify-center p-1">
              <div className="w-1 h-2 bg-gray-400/60 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
