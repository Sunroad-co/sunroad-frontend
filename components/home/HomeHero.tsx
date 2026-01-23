import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import ReactiveWallHeroV2 from "./ReactiveWallHeroV2";
import HeroMasonry from "./HeroMasonry";
// Keep imports for reference - these components are not deleted
// import ReactiveWallHero from "./ReactiveWallHero";
// import HeroProduct from "./HeroProduct";
// import HeroMasonry from "./HeroMasonry";

/**
 * Artist data shape for hero section
 * Includes all category IDs and labels for matching
 */
export interface HeroArtist {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  avatar_thumb_url: string | null;
  category_label: string | null; // First label for display
  category_ids: number[];
  category_labels: string[];
}

/** Raw shape from Supabase with nested categories */
interface RawHeroArtist {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  avatar_thumb_url: string | null;
  artist_categories?: Array<{
    category_id: number;
    categories?: {
      name: string;
      id: number;
    } | null;
  }> | null;
}

/**
 * Fisher-Yates shuffle for randomizing array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Cached fetch for hero artists.
 * Fetches a randomized set of 100 Pro artists to keep homepage fresh.
 * Single Supabase query, cached indefinitely until manual revalidate.
 * Includes category label from first artist_category.
 */
const getHeroArtists = unstable_cache(
  async (): Promise<HeroArtist[]> => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
      );

      // Fetch a larger batch (250) to ensure we have enough after filtering
      // Then shuffle and slice to 100 for randomization
      const { data, error } = await supabase
        .from("artists_min")
        .select(`
          id, 
          handle, 
          display_name, 
          avatar_url, 
          avatar_thumb_url,
          artist_categories (
            category_id,
            categories (
              name,
              id
            )
          )
        `)
        .eq("is_listed", true)
        .not("avatar_url", "is", null)
        .limit(50);

      if (error || !data) {
        // Guard logging in production
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch hero artists:", error);
        }
        return [];
      }

      // Flatten to HeroArtist shape with all category_ids and category_labels
      const artists = (data as unknown as RawHeroArtist[]).map((artist) => {
        const allCategories = artist.artist_categories
          ?.map((ac) => ac.categories)
          .filter((cat): cat is { name: string; id: number } => Boolean(cat))
          .sort((a, b) => a.id - b.id) || [];
        
        const category_ids = allCategories.map(cat => cat.id);
        const category_labels = allCategories.map(cat => cat.name);
        const category_label = category_labels[0] || null; // First label for display
        
        return {
          id: artist.id,
          handle: artist.handle,
          display_name: artist.display_name,
          avatar_url: artist.avatar_url,
          avatar_thumb_url: artist.avatar_thumb_url,
          category_label,
          category_ids,
          category_labels,
        };
      });

      // Shuffle and slice to 100 for randomization
      return shuffleArray(artists).slice(0, 100);
    } catch {
      // Silently fail - return empty array
      return [];
    }
  },
  ["home-hero-artists-v2"],
  { revalidate: false }
);

/**
 * HomeHero - Server component that orchestrates the hero section
 * 
 * Single source of truth for hero-related data fetching:
 * - ONE cached Supabase query for 20 artists
 * - Artists passed to ReactiveWallHeroV2 (reactive card wall)
 * - No joins, no extra fetches
 * 
 * Renders:
 * - ReactiveWallHeroV2 (reactive card wall with intent-driven activation)
 * 
 * Note: Previous hero components are kept but no longer rendered here.
 */
export default async function HomeHero() {
  // Single cached fetch for all hero data
  const artists = await getHeroArtists();

  return <> <ReactiveWallHeroV2 artists={artists} /> <HeroMasonry artists={artists} /> </>;
}
