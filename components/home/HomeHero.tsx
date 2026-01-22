import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import HeroProduct from "./HeroProduct";
import HeroMasonry from "./HeroMasonry";

/**
 * Artist data shape for hero section
 * Minimal columns only - no joins, no extra data
 */
export interface HeroArtist {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  avatar_thumb_url: string | null;
}

/**
 * Cached fetch for hero artists.
 * Single Supabase query, cached indefinitely until manual revalidate.
 * No joins, no extra fetches.
 */
const getHeroArtists = unstable_cache(
  async (): Promise<HeroArtist[]> => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
      );

      const { data, error } = await supabase
        .from("artists_min")
        .select("id, handle, display_name, avatar_url, avatar_thumb_url")
        .eq("is_listed", true)
        .not("avatar_url", "is", null)
        .limit(20);

      if (error || !data) {
        // Guard logging in production
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch hero artists:", error);
        }
        return [];
      }

      return data as HeroArtist[];
    } catch {
      // Silently fail - return empty array
      return [];
    }
  },
  ["home-hero-artists"],
  { revalidate: false }
);

/**
 * HomeHero - Server component that orchestrates the hero section
 * 
 * Single source of truth for hero-related data fetching:
 * - ONE cached Supabase query for 20 artists
 * - Same artists array passed to both child components
 * - No joins, no extra fetches
 * 
 * Renders:
 * - HeroProduct (the main hero card with headline, CTAs, floating cards)
 * - HeroMasonry (masonry backdrop with centered overlay)
 */
export default async function HomeHero() {
  // Single cached fetch for all hero data
  const artists = await getHeroArtists();

  return (
    <>
      {/* Main hero card - uses artists for floating cards */}
      <HeroProduct artists={artists} />
      
      {/* Masonry backdrop with centered overlay */}
      <HeroMasonry artists={artists} />
    </>
  );
}
