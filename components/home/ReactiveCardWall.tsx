"use client";

import { useMemo, useRef, useEffect, useState, memo } from "react";
import Image from "next/image";
import { getAvatarUrl } from "@/lib/media";
import type { HeroArtist } from "./HomeHero";
import styles from "./ReactiveCardWall.module.css";

interface ReactiveCardWallProps {
  artists: HeroArtist[];
  activeArtistIds: string[];
  activeCategoryIds: number[];
  backfilledIds: Set<string>;
  showChips: boolean;
  chipRevealDelay: number;
}

/** Float animation classes - distributed across cards */
const FLOAT_CLASSES = [styles.float1, styles.float2, styles.float3];

/** Tunable constant: milliseconds between each card reveal */
const REVEAL_STEP_MS = 500;

/**
 * Hook to detect prefers-reduced-motion preference
 * Returns true if user prefers reduced motion
 */
function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}

/**
 * Seeded pseudo-random number generator using sin
 * Returns a function that produces deterministic random values [0, 1)
 */
function createSeededRandom(seedString: string): () => number {
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed += seedString.charCodeAt(i);
  }
  return () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}

/**
 * Fisher-Yates shuffle with seeded random
 */
function seededShuffle<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * ReactiveCardWall - Background grid of profile cards with "Donut" layout (desktop/tablet only)
 * 
 * Features:
 * - Hidden on mobile (sm+ only)
 * - Donut layout: Active cards forced to outer columns (1, 2, 5, 6), inactive to center (3, 4)
 * - Randomized Vertical Distribution: Active cards are assigned random rows (1-4) to prevent clumping at the top.
 * - Sequential reveal: Cards fade in one-by-one in a random order per intent change.
 */
export default function ReactiveCardWall({ artists, activeArtistIds, activeCategoryIds, backfilledIds, showChips, chipRevealDelay }: ReactiveCardWallProps) {
  if (artists.length === 0) return null;

  // Respect reduced motion preference
  const prefersReducedMotion = usePrefersReducedMotion();

  // Track previous active IDs to detect transitions and intent changes
  const prevActiveIdsArrayRef = useRef<string[]>([]);
  const isFirstRenderRef = useRef(true);
  
  // Create a set for O(1) lookup
  const activeSet = new Set(activeArtistIds);
  const activeCategorySet = new Set(activeCategoryIds);

  // Detect intent change: activeArtistIds array changed (not just set membership)
  const intentChanged = useMemo(() => {
    if (isFirstRenderRef.current) {
      return false;
    }
    const prevArray = prevActiveIdsArrayRef.current;
    if (prevArray.length !== activeArtistIds.length) {
      return true;
    }
    return prevArray.some((id, i) => id !== activeArtistIds[i]);
  }, [activeArtistIds]);

  // Compute deterministic shuffled order of activeArtistIds when intent changes
  const shuffledOrder = useMemo(() => {
    if (activeArtistIds.length === 0) return [];
    const seedString = activeArtistIds.join("|");
    const random = createSeededRandom(seedString);
    return seededShuffle([...activeArtistIds], random);
  }, [activeArtistIds.join("|")]);

  // Memoized Map for O(1) lookup of order index by artist ID
  const shuffledOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    shuffledOrder.forEach((id, index) => {
      map.set(id, index);
    });
    return map;
  }, [shuffledOrder]);

  // State: which active cards are currently visible
  const [visibleActiveIds, setVisibleActiveIds] = useState<Set<string>>(() => {
    // On first render or reduced motion, show all immediately
    return prefersReducedMotion ? new Set(activeArtistIds) : new Set();
  });

  // Track cards leaving active set for fade-out
  const fadeOutCards = useMemo(() => {
    if (isFirstRenderRef.current) {
      return new Set<string>();
    }
    const prevSet = new Set(prevActiveIdsArrayRef.current);
    const currentSet = new Set(activeArtistIds);
    const fadeOut = new Set<string>();
    prevSet.forEach(id => {
      if (!currentSet.has(id)) {
        fadeOut.add(id);
      }
    });
    return fadeOut;
  }, [activeArtistIds.join(",")]);

  // Sequential reveal timer: add one card every REVEAL_STEP_MS
  useEffect(() => {
    if (prefersReducedMotion) {
      // Show all immediately for reduced motion
      setVisibleActiveIds(new Set(activeArtistIds));
      return;
    }

    // Reset visible set on intent change
    setVisibleActiveIds(new Set());
    
    if (shuffledOrder.length === 0) {
      return;
    }

    // Start sequential reveal
    let currentIndex = 0;
    const timer = setInterval(() => {
      if (currentIndex < shuffledOrder.length) {
        setVisibleActiveIds(prev => {
          const next = new Set(prev);
          next.add(shuffledOrder[currentIndex]);
          return next;
        });
        currentIndex++;
      } else {
        clearInterval(timer);
      }
    }, REVEAL_STEP_MS);

    return () => clearInterval(timer);
  }, [activeArtistIds.join("|"), shuffledOrder, prefersReducedMotion]);

  // Update refs after processing
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
    }
    prevActiveIdsArrayRef.current = [...activeArtistIds];
  }, [activeArtistIds]);

  // Separate active and inactive artists
  const activeArtists: HeroArtist[] = [];
  const inactiveArtists: HeroArtist[] = [];
  
  artists.forEach(artist => {
    if (activeSet.has(artist.id)) {
      activeArtists.push(artist);
    } else {
      inactiveArtists.push(artist);
    }
  });

  // --- POSITIONING LOGIC ---

  // Desktop (6 columns): columns 1, 2, 5, 6 are safe (outer edges)
  const safeColumnsDesktop = [1, 2, 6]; 
  // We want to distribute cards across 4 rows to cover the screen height
  const safeRows = [1, 2, 3];

  // Generate all possible "Safe Slots" (Col, Row)
  // 4 cols * 4 rows = 16 slots. Plenty for our ~6-8 active cards.
  const safeSlots = useMemo(() => {
    const slots: { col: number; row: number }[] = [];
    safeRows.forEach(row => {
      safeColumnsDesktop.forEach(col => {
        slots.push({ col, row });
      });
    });
    return slots;
  }, []);

  // Shuffle slots deterministically based on the current set of active artists
  // This ensures the layout scrambles freshly for every new intent, but stays stable during the intent.
  // Uses same seed approach as reveal order for consistency
  const shuffledSlots = useMemo(() => {
    const seedString = activeArtistIds.join("|") + "::slots";
    const random = createSeededRandom(seedString);
    return seededShuffle(safeSlots, random);
  }, [activeArtistIds.join("|"), safeSlots]);

  return (
    <div 
      className="hidden sm:block absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Grid container */}
      <div 
        className="absolute inset-0 grid gap-5 lg:gap-6 p-5 lg:p-7
                   grid-cols-3 lg:grid-cols-6"
        style={{
          minHeight: "115%",
          transform: "translateY(-7%)",
          gridAutoRows: "clamp(200px, 24vh, 300px)",
        }}
      >
        {/* Render ACTIVE cards with Explicit Positions */}
        {activeArtists.map((artist, index) => {
          const isBackfilled = backfilledIds.has(artist.id);
          
          // Determine Category Label
          const categoryMap = new Map<number, string>();
          artist.category_ids.forEach((id, idx) => categoryMap.set(id, artist.category_labels[idx]));
          
          let categoryLabel: string;
          if (isBackfilled) {
            categoryLabel = "Creative";
          } else {
            const matchingCategoryId = artist.category_ids.find(id => activeCategorySet.has(id));
            categoryLabel = matchingCategoryId 
              ? categoryMap.get(matchingCategoryId) || artist.category_labels[0] || artist.category_label || "Creative"
              : (artist.category_labels[0] || artist.category_label || "Creative");
          }
          
          // Assign slot based on shuffled order position
          const revealOrder = shuffledOrder.indexOf(artist.id);
          const slotIndex = revealOrder >= 0 ? revealOrder : index;
          const slot = shuffledSlots[slotIndex % shuffledSlots.length];
          
          // Card is visible only if in visibleActiveIds
          const isVisible = visibleActiveIds.has(artist.id);
          
          return (
            <ProfileCard
              key={artist.id}
              artist={artist}
              index={index}
              isActive={true}
              categoryLabel={categoryLabel}
              gridColumnDesktop={slot.col}
              gridRowDesktop={slot.row}
              fadeOut={fadeOutCards.has(artist.id)}
              isVisible={isVisible}
              prefersReducedMotion={prefersReducedMotion}
            />
          );
        })}
        
        {/* Render INACTIVE cards (Filler) */}
        {/* We let these flow naturally into the empty spaces (dense flow) or obscured columns */}
        {inactiveArtists.slice(0, 16).map((artist, index) => {
          // Find fallback label
          const categoryLabel = artist.category_label || "Creative";
          
          // Force inactive cards into center columns (3, 4) to act as background texture behind text
          // Cycling between 3 and 4
          const obscuredCol = (index % 2) === 0 ? 3 : 4;
          
          return (
            <ProfileCard
              key={artist.id}
              artist={artist}
              index={index + activeArtists.length}
              isActive={false}
              categoryLabel={categoryLabel}
              gridColumnDesktop={obscuredCol}
              fadeOut={fadeOutCards.has(artist.id)}
              isVisible={false}
              prefersReducedMotion={prefersReducedMotion}
            />
          );
        })}
      </div>
    </div>
  );
}

interface ProfileCardProps {
  artist: HeroArtist;
  index: number;
  isActive: boolean;
  categoryLabel: string;
  gridColumnDesktop?: number;
  gridRowDesktop?: number;
  fadeOut?: boolean;
  isVisible: boolean;
  prefersReducedMotion: boolean;
}

const ProfileCard = memo(function ProfileCard({ artist, index, isActive, categoryLabel, gridColumnDesktop, gridRowDesktop, fadeOut = false, isVisible, prefersReducedMotion }: ProfileCardProps) {
  // Use full-size avatar for better quality
  const avatarSrc = getAvatarUrl(artist, "full");
  const floatClass = FLOAT_CLASSES[index % 3];
  
  // Determine animation classes
  const animationClass = fadeOut ? styles.fadeOut : "";
  
  // Calculate animation delay for fade-out only
  const animationDelay = fadeOut ? 0 : (isActive ? (index % 6) * 50 : 0);
  
  // Visibility: active cards are visible only if in visibleActiveIds
  // Cards leaving active set fade out immediately
  const shouldShow = isActive && isVisible && !fadeOut;
  const zIndexClass = shouldShow ? "z-10" : "z-0";
  
  return (
    <div
      className={`
        ${styles.card}
        ${isActive && shouldShow ? floatClass : ""}
        ${isActive && shouldShow ? styles.active : ""}
        ${animationClass}
        relative rounded-2xl overflow-hidden
        bg-white border border-gray-200
        transition-all duration-700 ease-out
        w-full h-full
        ${zIndexClass}
        ${shouldShow
          ? "opacity-100" 
          : "opacity-0 pointer-events-none"
        }
      `}
      style={{
        // Animation delay for fade transitions and sequential reveal
        animationDelay: `${animationDelay}ms`,
        // Force grid column position
        ...(gridColumnDesktop !== undefined ? { 
          gridColumn: gridColumnDesktop,
        } : {}),
        // Force grid row position
        ...(gridRowDesktop !== undefined ? { 
          gridRow: gridRowDesktop,
        } : {}),
      }}
    >
      {/* Image - taller aspect ratio (4/5) with contained image and gallery-like frame */}
      <div className="w-full h-full aspect-[4/5] relative bg-gradient-to-b from-white/60 to-white/20 overflow-hidden">
        {avatarSrc ? (
          <Image
            src={avatarSrc}
            alt=""
            fill
            sizes="(max-width: 1024px) 30vw, 18vw"
            className="object-contain p-2"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <span className="text-amber-600 font-bold text-3xl">
              {artist.display_name?.charAt(0) || "?"}
            </span>
          </div>
        )}
        
        {/* Info overlay at bottom */}
        <div 
          className="absolute bottom-0 inset-x-0 p-3
                     bg-gradient-to-t from-black/80 via-black/50 to-transparent"
        >
          <p className="text-white font-semibold text-sm truncate">
            {artist.display_name}
          </p>
          <p className="text-white/80 text-xs truncate">
            @{artist.handle}
          </p>
          
          <span 
            className="inline-block mt-1.5 px-2 py-0.5 
                       text-[10px] font-medium
                       rounded-full
                       bg-amber-500 text-white"
          >
            {categoryLabel}
          </span>
        </div>
      </div>
      
      {/* Active glow ring - only show when visible */}
      {isActive && shouldShow && (
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none
                     ring-2 ring-amber-400/60 shadow-[0_0_30px_rgba(217,119,6,0.2)]"
        />
      )}
    </div>
  );
});