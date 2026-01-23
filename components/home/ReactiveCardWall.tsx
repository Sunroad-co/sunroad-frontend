"use client";

import { useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { getAvatarUrl } from "@/lib/media";
import type { HeroArtist } from "./HomeHero";
import styles from "./ReactiveCardWall.module.css";

interface ReactiveCardWallProps {
  artists: HeroArtist[];
  activeArtistIds: string[];
  activeCategoryIds: number[];
  backfilledIds: Set<string>;
}

/** Float animation classes - distributed across cards */
const FLOAT_CLASSES = [styles.float1, styles.float2, styles.float3];

/**
 * ReactiveCardWall - Background grid of profile cards with "Donut" layout (desktop/tablet only)
 * * Features:
 * - Hidden on mobile (sm+ only)
 * - Donut layout: Active cards forced to outer columns (1, 2, 5, 6), inactive to center (3, 4)
 * - Randomized Vertical Distribution: Active cards are assigned random rows (1-4) to prevent clumping at the top.
 */
export default function ReactiveCardWall({ artists, activeArtistIds, activeCategoryIds, backfilledIds }: ReactiveCardWallProps) {
  if (artists.length === 0) return null;

  // Track previous active IDs to detect transitions
  const prevActiveIdsRef = useRef<Set<string>>(new Set());
  const isFirstRenderRef = useRef(true);
  
  // Create a set for O(1) lookup
  const activeSet = new Set(activeArtistIds);
  const activeCategorySet = new Set(activeCategoryIds);

  // Track which cards are transitioning (becoming active/inactive)
  const transitioningCards = useMemo(() => {
    const prevSet = prevActiveIdsRef.current;
    const currentSet = activeSet;
    const transitioning = new Set<string>();
    
    // Skip transitions on first render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevActiveIdsRef.current = new Set(currentSet);
      return transitioning;
    }
    
    // Cards becoming active (were inactive, now active)
    currentSet.forEach(id => {
      if (!prevSet.has(id)) {
        transitioning.add(id);
      }
    });
    
    // Cards becoming inactive (were active, now inactive)
    prevSet.forEach(id => {
      if (!currentSet.has(id)) {
        transitioning.add(id);
      }
    });
    
    // Update ref for next render
    prevActiveIdsRef.current = new Set(currentSet);
    
    return transitioning;
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
  const safeColumnsDesktop = [1, 2, 5, 6]; 
  // We want to distribute cards across 4 rows to cover the screen height
  const safeRows = [1, 2, 3, 4];

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
  const shuffledSlots = useMemo(() => {
    const slots = [...safeSlots];
    // Simple seed from the first active artist ID
    const seedString = activeArtists.length > 0 ? activeArtists[0].id : "seed";
    let seed = 0;
    for (let i = 0; i < seedString.length; i++) seed += seedString.charCodeAt(i);

    // Fisher-Yates shuffle with seeded random
    for (let i = slots.length - 1; i > 0; i--) {
      const x = Math.sin(seed++) * 10000;
      const rand = x - Math.floor(x);
      const j = Math.floor(rand * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    return slots;
  }, [activeArtists, safeSlots]);

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
          
          // Assign random safe slot
          const slot = shuffledSlots[index % shuffledSlots.length];
          
          return (
            <ProfileCard
              key={artist.id}
              artist={artist}
              index={index}
              isActive={true}
              categoryLabel={categoryLabel}
              gridColumnDesktop={slot.col}
              gridRowDesktop={slot.row}
              isTransitioning={transitioningCards.has(artist.id)}
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
              isTransitioning={transitioningCards.has(artist.id)}
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
  isTransitioning?: boolean;
}

function ProfileCard({ artist, index, isActive, categoryLabel, gridColumnDesktop, gridRowDesktop, isTransitioning = false }: ProfileCardProps) {
  // Use full-size avatar for better quality
  const avatarSrc = getAvatarUrl(artist, "full");
  const floatClass = FLOAT_CLASSES[index % 3];
  
  return (
    <div
      className={`
        ${styles.card}
        ${isActive ? floatClass : ""}
        ${isActive ? styles.active : ""}
        ${isTransitioning && isActive ? styles.fadeIn : ""}
        ${isTransitioning && !isActive ? styles.fadeOut : ""}
        relative rounded-2xl overflow-hidden
        bg-white border border-gray-200
        transition-all duration-700 ease-out
        w-full h-full
        ${isActive 
          ? "opacity-100 z-10" 
          : "opacity-0 pointer-events-none z-0"
        }
      `}
      style={{
        // Stagger animation start for active cards
        animationDelay: isActive ? `${(index % 6) * 0.15}s` : "0s",
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
      
      {/* Active glow ring */}
      {isActive && (
        <div 
          className="absolute inset-0 rounded-2xl pointer-events-none
                     ring-2 ring-amber-400/60 shadow-[0_0_30px_rgba(217,119,6,0.2)]"
        />
      )}
    </div>
  );
}