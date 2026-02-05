"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  Camera, 
  Music, 
  Building2, 
  Palette, 
  Type, 
  Film, 
  Scissors, 
  Brush,
  PenTool,
  Mic,
  Warehouse,
  Search
} from "lucide-react";
import ReactiveCardWall from "./ReactiveCardWall";
import type { HeroArtist } from "./HomeHero";

/**
 * ReactiveWallHeroV2 - TRUE Reactive Wall Hero
 * 
 * A full-viewport hero with a background of profile cards that react
 * to the rotating intent loop. Active cards appear while inactive
 * cards remain hidden (but preserve layout space).
 * 
 * Features:
 * - Background grid of profile cards (ReactiveCardWall) - desktop only
 * - React state-driven intent loop (7s interval)
 * - Category-specific icons in chips
 * - Frosted glass panel for readability
 * - Respects prefers-reduced-motion
 */

/** Category mapping: display name -> numeric ID */
const CATEGORY_IDS: Record<string, number> = {
  "Photographers": 6,
  "Music Venues": 57,
  "Performance Arts": 5,
  "Art Galleries": 34,
  "Brand Design": 26,
  "Graphic Artists": 48,
  "Creative Agencies": 16,
  "Video": 12,
  "Interior Designers": 15,
  "Fine Artists": 64,
  "Muralists": 31,
  "Pottery": 42,
  "Glass Work": 7,
  "Art Classes": 60,
  "Music Lessons": 28,
  "Acting Classes": 17,
  "Dance Schools": 39,
  "Museums": 45,
  "Theaters": 51,
  "Art Centers": 24,
  "Music": 4,
  "Music Studios": 56,
  "Producers": 62,
  "Audio Engineers": 53,
  "Composers": 54,
  "Illustrators": 44,
  "Photography Studios": 9,
  "Art Studios": 47,
  "Woodworkers": 3,
  "Textile": 40,
  "Jewelry": 55,
};

/** Category to icon mapping */
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "Photographers": Camera,
  "Music Venues": Building2,
  "Performance Arts": Music,
  "Art Galleries": Building2,
  "Brand Design": Palette,
  "Graphic Artists": Palette,
  "Creative Agencies": Building2,
  "Video": Film,
  "Interior Designers": Building2,
  "Fine Artists": Brush,
  "Muralists": Brush,
  "Pottery": Brush,
  "Glass Work": Brush,
  "Art Classes": Brush,
  "Music Lessons": Music,
  "Acting Classes": Music,
  "Dance Schools": Music,
  "Museums": Building2,
  "Theaters": Building2,
  "Art Centers": Building2,
  "Music": Music,
  "Music Studios": Warehouse,
  "Producers": Mic,
  "Audio Engineers": Mic,
  "Composers": Music,
  "Illustrators": PenTool,
  "Photography Studios": Camera,
  "Art Studios": Warehouse,
  "Woodworkers": PenTool,
  "Textile": Brush,
  "Jewelry": Brush,
};

/** Intent data structure */
interface Intent {
  key: string;
  label: string;
  categoryIds: number[];
}

/** All intents to cycle through - using safe supply categories (≥5 artists) */
export const INTENTS: Intent[] = [
  {
    key: "explore-art",
    label: "I want to explore local art.",
    // Fine Artists, Art Galleries, Art Classes, Museums, Pottery, Glass Work
    categoryIds: [64, 34, 60, 45, 42, 7],
  },
  {
    key: "learn-skill",
    label: "I want to learn a creative skill.",
    // Art Classes, Pottery, Music Lessons, Music Studios, Art Studios
    categoryIds: [60, 42, 28, 56, 47],
  },
  {
    key: "need-visuals",
    label: "I need visuals for a project.",
    // Photographers, Video, Graphic Artists, Illustrators, Photography Studios
    categoryIds: [6, 12, 48, 44, 9],
  },
  {
    key: "night-out",
    label: "I'm planning a night out.",
    // Theaters, Music Venues, Music, Art Galleries, Museums
    categoryIds: [51, 57, 4, 34, 45],
  },
  {
    key: "design-space",
    label: "I'm designing a space.",
    // Interior Designers, Woodworkers, Textile, Jewelry, Pottery
    categoryIds: [15, 3, 40, 55, 42],
  },
];

const INTENT_INTERVAL = 7000; // 7 seconds per intent (allows full sequential reveal: 650ms * 6 + 1500ms buffer)
const ACTIVE_CARD_COUNT_DESKTOP = 6;

/**
 * Generate active cards with Smart Backfilling.
 * Returns matching artist IDs, and backfills with random artists if needed.
 * Uses stable seeded shuffle for deterministic rotation.
 */
function generateActiveCards(
  idx: number, 
  artists: HeroArtist[], 
  categoryIds: number[], 
  count: number
): { activeIds: string[]; backfilledIds: Set<string> } {
  if (artists.length === 0) return { activeIds: [], backfilledIds: new Set() };
  
  const intentCategorySet = new Set(categoryIds);
  
  // Build list of all matching artists
  const matchingArtists: HeroArtist[] = [];
  const nonMatchingArtists: HeroArtist[] = [];
  
  for (const artist of artists) {
    // Check if artist has ANY category that matches intent categories
    const hasMatch = artist.category_ids.some(catId => intentCategorySet.has(catId));
    if (hasMatch) {
      matchingArtists.push(artist);
    } else {
      nonMatchingArtists.push(artist);
    }
  }
  
  // Stable seeded shuffle for deterministic rotation
  const seed = idx * 7919;
  const shuffledMatching = [...matchingArtists];
  
  // Fisher-Yates shuffle with seed for matching artists
  for (let i = shuffledMatching.length - 1; i > 0; i--) {
    const j = (seed + i * 3571) % (i + 1);
    [shuffledMatching[i], shuffledMatching[j]] = [shuffledMatching[j], shuffledMatching[i]];
  }
  
  // Take up to `count` matching artists
  const selectedMatching = shuffledMatching.slice(0, Math.min(count, shuffledMatching.length));
  const selectedIds = selectedMatching.map(a => a.id);
  const backfilledIds = new Set<string>();
  
  // Smart Backfilling: If we have fewer than `count` matches, fill with random artists
  if (selectedIds.length < count && nonMatchingArtists.length > 0) {
    const needed = count - selectedIds.length;
    
    // Shuffle non-matching artists with a different seed
    const shuffledNonMatching = [...nonMatchingArtists];
    const backfillSeed = idx * 7919 + 10000; // Different seed for backfill
    
    for (let i = shuffledNonMatching.length - 1; i > 0; i--) {
      const j = (backfillSeed + i * 3571) % (i + 1);
      [shuffledNonMatching[i], shuffledNonMatching[j]] = [shuffledNonMatching[j], shuffledNonMatching[i]];
    }
    
    // Take needed backfill artists
    const backfillArtists = shuffledNonMatching.slice(0, Math.min(needed, shuffledNonMatching.length));
    const backfillIds = backfillArtists.map(a => a.id);
    
    // Add to selected and mark as backfilled
    selectedIds.push(...backfillIds);
    backfillIds.forEach(id => backfilledIds.add(id));
  }
  
  return { activeIds: selectedIds, backfilledIds };
}

interface ReactiveWallHeroV2Props {
  artists: HeroArtist[];
}

const CHIP_REVEAL_DELAY = 1000; // ms delay before chips appear

export default function ReactiveWallHeroV2({ artists }: ReactiveWallHeroV2Props) {
  const [intentIndex, setIntentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showChips, setShowChips] = useState(true); // Start true for SSR - no delayed render for LCP
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  // Desktop only - cards hidden on mobile
  const activeCardCount = ACTIVE_CARD_COUNT_DESKTOP;
  const chipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRenderRef = useRef(true);

  const currentIntent = INTENTS[intentIndex];
  
  // Compute active cards synchronously to avoid hydration mismatch
  // This runs on both server and client with the same result
  const { activeIds: activeArtistIds, backfilledIds } = generateActiveCards(
    intentIndex, 
    artists, 
    currentIntent.categoryIds, 
    activeCardCount
  );
  const activeCategoryIds = currentIntent.categoryIds;

  // Detect reduced motion preference on mount
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);


  // Staged reveal: hide chips on intent change, reveal after delay
  // Skip delay on first render to avoid LCP delay
  useEffect(() => {
    // Clear any pending timeout
    if (chipTimeoutRef.current) {
      clearTimeout(chipTimeoutRef.current);
    }

    // If reduced motion or first render, show chips instantly (no LCP delay)
    if (prefersReducedMotion || isFirstRenderRef.current) {
      setShowChips(true);
      isFirstRenderRef.current = false;
      return;
    }

    // Hide chips, then reveal after delay (only on subsequent intent changes)
    setShowChips(false);
    chipTimeoutRef.current = setTimeout(() => {
      setShowChips(true);
    }, CHIP_REVEAL_DELAY);

    return () => {
      if (chipTimeoutRef.current) {
        clearTimeout(chipTimeoutRef.current);
      }
    };
  }, [intentIndex, prefersReducedMotion]);

  // Ref-based interval controller for intent rotation
  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Track mouse position to handle edge cases
  const mouseOverRef = useRef(false);

  // Handle document visibility (tab switch) to prevent "hang"
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden: pause interval
        stopInterval();
        setIsPaused(true);
      } else {
        // Tab visible: reset mouse tracking state
        // When tab becomes visible after being hidden, we can't reliably know
        // if the mouse is still over the section, so we reset and let mouse events handle it
        // This prevents the animation from being stuck paused
        mouseOverRef.current = false;
        setIsPaused(false);
        // The mouse events will fire if the mouse is actually over the section
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopInterval();
    };
  }, [stopInterval]);

  // Intent rotation interval - single source of truth, controlled by isPaused state
  useEffect(() => {
    // Always clear any existing interval first to prevent duplicates
    stopInterval();
    
    // Only start interval if not paused
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setIntentIndex((prev) => (prev + 1) % INTENTS.length);
      }, INTENT_INTERVAL);
    }

    // Cleanup on unmount or when isPaused changes
    return () => {
      stopInterval();
    };
  }, [isPaused, stopInterval]);

  return (
      <section 
        className="relative min-h-0 sm:min-h-[100svh] w-full overflow-hidden bg-transparent"
        aria-label="Find local creatives"
        role="region"
      >
      {/* Background: Reactive Card Wall - sm+ only */}
      <ReactiveCardWall 
        artists={artists} 
        activeArtistIds={activeArtistIds}
        activeCategoryIds={activeCategoryIds}
        backfilledIds={backfilledIds}
        showChips={showChips}
        chipRevealDelay={CHIP_REVEAL_DELAY}
      />

      {/* Foreground Content */}
      <div className="relative z-20 min-h-0 sm:min-h-[100svh] flex flex-col items-center justify-start sm:justify-center px-4 sm:px-6 lg:px-8 pt-4 sm:pt-24 pb-0 sm:pb-32">
        
        {/* Glass Panel for readability */}
        <div className="w-full max-w-2xl mx-auto
                       bg-white/80 backdrop-blur-xl
                       rounded-2xl sm:rounded-3xl
                       ring-1 ring-black/5
                       shadow-[0_8px_40px_rgba(0,0,0,0.08)]
                       px-5 py-8 sm:px-2 sm:py-8">
          
          {/* Main headline - reduced prominence */}
          <h1 className="text-center text-xl sm:text-2xl lg:text-3xl font-display font-medium text-gray-700 tracking-tight leading-[1.2] mb-5 sm:mb-6">
            Find the right creative
            <br />
            for your next idea.
          </h1>

          {/* Search bar affordance */}
          <Link
            href="/search"
            className="group flex items-center gap-3 w-full max-w-md mx-auto mb-8 sm:mb-10
                     px-4 py-3 sm:px-5 sm:py-3.5
                     bg-white/60 hover:bg-white
                     border border-gray-200/80 hover:border-gray-300
                     rounded-full
                     shadow-sm hover:shadow-md
                     transition-all duration-200 ease-out
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-500 transition-colors" strokeWidth={2} />
            <span className="flex-1 text-sm sm:text-base text-gray-400 group-hover:text-gray-500 transition-colors">
               Discover Local Creatives...
            </span>
            <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" strokeWidth={2} />
          </Link>

          {/* Intent loop section */}
          <div 
            role="region"
            aria-live="polite"
            aria-atomic="true"
          >
            {/* Intent label */}
            <p className="text-center text-[10px] sm:text-xs font-medium uppercase tracking-[0.15em] text-gray-400 mb-2">
              What are you creating?
            </p>

            {/* Animated intent sentence - hero moment, larger & bolder */}
            <p 
              key={intentIndex}
              className="text-center text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-5 sm:mb-6
                        animate-[fadeInUp_0.5s_ease-out] motion-reduce:animate-none"
            >
              {currentIntent.label}
            </p>

            {/* Category chips with staged reveal - pause on hover for interaction */}
            <div 
              className={`flex flex-wrap justify-center gap-1.5 sm:gap-2 transition-all duration-500 ease-out
                         ${showChips 
                           ? "opacity-100 translate-y-0" 
                           : "opacity-0 translate-y-2"
                         }
                         motion-reduce:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none`}
              onMouseEnter={() => {
                mouseOverRef.current = true;
                setIsPaused(true);
              }}
              onMouseLeave={() => {
                mouseOverRef.current = false;
                setIsPaused(false);
              }}
            >
              {currentIntent.categoryIds.map((categoryId, idx) => {
                // Find category name from ID (reverse lookup)
                const categoryName = Object.entries(CATEGORY_IDS).find(([_, id]) => id === categoryId)?.[0] || "Creative";
                const IconComponent = CATEGORY_ICONS[categoryName] || Camera;
                return (
                  <Link
                    key={categoryId}
                    href={`/search?categories=${categoryId}`}
                    className="inline-flex items-center gap-1 sm:gap-1.5
                             px-2.5 py-1 sm:px-3.5 sm:py-1.5
                             text-xs sm:text-sm font-medium text-gray-600
                             bg-gray-100/80 hover:bg-amber-50
                             border border-gray-200/60 rounded-full
                             hover:border-amber-300 hover:text-gray-900
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
                             transition-all duration-200 ease-out"
                    style={{
                      transitionDelay: showChips ? `${idx * 80}ms` : "0ms",
                    }}
                  >
                    <IconComponent className="w-3 h-3 text-amber-500" strokeWidth={2} />
                    <span>{categoryName}</span>
                  </Link>
                );
              })}
            </div>

            {/* Watermark - below chips with backing pill */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5
                            bg-white/40 backdrop-blur-sm
                            rounded-full
                            opacity-[0.18]">
                <span className="text-xs text-gray-900 font-medium">Explore on</span>
                {/* Static SVG logo - unoptimized to avoid Vercel Image Optimization quota */}
                <Image 
                  src="/sunroad_logo_tiny.webp" 
                  alt="Sunroad" 
                  width={96} 
                  height={53}
                  className="grayscale"
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* CTAs - inside panel on mobile */}
          <div className="flex flex-col sm:hidden gap-3 mt-6">
            {/* Primary CTA */}
            <Link
              href="/search"
              className="w-full inline-flex items-center justify-center gap-2
                       px-5 py-3
                       text-base font-semibold text-white
                       bg-gray-900 hover:bg-gray-800
                       rounded-full
                       shadow-lg shadow-gray-900/20
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2
                       transition-colors"
            >
              Browse creatives
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>

            {/* Secondary CTA */}
            <Link
              href="/auth/sign-up"
              className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-900
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
                       transition-colors py-2"
            >
              Are you a creative? <span className="text-amber-600 hover:text-amber-700">Claim your  profile</span>
            </Link>
          </div>

          {/* Tagline - visible on mobile inside panel */}
          <p className="sm:hidden text-center text-xs text-gray-400 mt-4">
            Browse freely. Contact directly. No commissions.
          </p>
        </div>

      </div>

      {/* Frosted Console Bar - hidden on mobile, visible sm+ - pause on hover for interaction */}
      <div 
        className="hidden sm:block absolute bottom-0 inset-x-0 z-30 
                   bg-white/70 backdrop-blur-xl
                   border-t border-gray-200/50
                   shadow-[0_-8px_30px_rgba(0,0,0,0.04)]"
        onMouseEnter={() => {
          mouseOverRef.current = true;
          setIsPaused(true);
        }}
        onMouseLeave={() => {
          mouseOverRef.current = false;
          setIsPaused(false);
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-5
                       flex items-center justify-between gap-4">
          {/* Left side - tagline */}
          <p className="text-sm text-gray-600">
            Browse freely. Contact directly. <span className="text-gray-400">No commissions.</span>
          </p>

          {/* Right side - CTAs */}
          <div className="flex items-center gap-5">
            {/* Secondary CTA */}
            <Link
              href="/auth/sign-up"
              className="text-sm font-medium text-gray-500 hover:text-gray-900
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
                       transition-colors"
            >
              Are you a creative? <span className="text-amber-600 hover:text-amber-700">Claim your profile</span>
            </Link>

            {/* Primary CTA */}
            <Link
              href="/search"
              className="inline-flex items-center gap-2
                       px-6 py-2.5
                       text-sm font-semibold text-white
                       bg-gray-900 hover:bg-gray-800
                       rounded-full
                       shadow-md shadow-gray-900/15
                       hover:shadow-lg
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2
                       transition-all duration-200 ease-out"
            >
              Browse creatives
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator - desktop only */}
      <div 
        className="hidden sm:flex absolute bottom-24 left-1/2 -translate-x-1/2 z-20
                   text-gray-400 text-xs font-medium
                   motion-reduce:hidden"
        aria-hidden="true"
      >
        <div className="flex flex-col items-center gap-2 opacity-50">
          <span>Scroll</span>
          <div className="w-4 h-6 rounded-full border border-gray-300 flex items-start justify-center p-1">
            <div className="w-0.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
