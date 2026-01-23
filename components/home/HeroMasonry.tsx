import Image from "next/image";
import { getAvatarUrl } from "@/lib/media";
import CoLockup from "./CoLockup";

/**
 * Artist data for masonry display
 */
export interface MasonryArtist {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  avatar_thumb_url: string | null;
}

interface HeroMasonryProps {
  artists: MasonryArtist[];
}

/**
 * Split artists array into N columns with even distribution.
 */
function splitIntoColumns<T>(items: T[], numColumns: number): T[][] {
  const columns: T[][] = Array.from({ length: numColumns }, () => []);
  items.forEach((item, index) => {
    columns[index % numColumns].push(item);
  });
  return columns;
}

/**
 * HeroMasonry - Full-height masonry backdrop for the hero section
 * 
 * Features:
 * - Responsive viewport height (55svh mobile → 80svh desktop)
 * - 3 columns desktop, 2 tablet, 2 mobile (col 3 hidden on mobile)
 * - Large avatar cards (96-144px depending on breakpoint)
 * - No edge fades - clean look
 * - CSS-only infinite scroll animations
 * - Respects prefers-reduced-motion
 * - Centered overlay with halo capsule containing tagline, CoLockup, and stats
 * - Negative top margin for seamless flow from HeroProduct
 */
export default function HeroMasonry({ artists }: HeroMasonryProps) {
  // If no artists, render minimal section
  if (artists.length === 0) {
    return (
      <section className="relative min-h-[55svh] sm:min-h-[65svh] lg:min-h-[80svh] -mt-8 sm:-mt-10 lg:-mt-12 flex items-center justify-center">
        <CenteredOverlay />
      </section>
    );
  }

  // Split into 3 columns
  const columns = splitIntoColumns(artists, 3);

  // Animation durations for each column (different speeds for visual interest)
  const columnDurations = ["25s", "32s", "28s"];

  return (
    <section 
      className="relative min-h-[55svh] sm:min-h-[65svh] lg:min-h-[80svh] mt-0 w-full overflow-hidden"
      aria-label="Community showcase"
    >
      {/* Masonry columns container */}
      <div 
        className="absolute inset-0 flex justify-center items-center gap-4 sm:gap-6 lg:gap-8
                   opacity-[0.14] sm:opacity-[0.18] lg:opacity-[0.24]
                   motion-reduce:opacity-[0.10]"
        aria-hidden="true"
      >
        {columns.map((column, colIndex) => (
          <MasonryColumn 
            key={colIndex}
            artists={column}
            duration={columnDurations[colIndex]}
            direction={colIndex % 2 === 0 ? "up" : "down"}
            hideOnMobile={colIndex === 2}
          />
        ))}
      </div>

      {/* Centered overlay content */}
      <CenteredOverlay />
    </section>
  );
}

/**
 * Centered overlay with halo capsule containing tagline, CoLockup, and stats
 */
function CenteredOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
      {/* Halo capsule container */}
      <div className="relative">
        {/* Soft radial glow behind the capsule */}
        <div 
          className="absolute inset-[-40px] sm:inset-[-60px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)"
          }}
          aria-hidden="true"
        />
        
        {/* Capsule with content */}
        <div className="relative rounded-[32px] sm:rounded-[40px] px-6 sm:px-10 lg:px-12 py-6 sm:py-8 lg:py-10
                        bg-white/55 backdrop-blur-md
                        ring-1 ring-black/10
                        shadow-[0_20px_60px_rgba(0,0,0,0.10)]">
          {/* Tagline */}
          <p className="text-center text-sm sm:text-base lg:text-lg font-medium uppercase tracking-[0.2em] sm:tracking-[0.25em] text-gray-700 mb-4 sm:mb-6">
            Local. Creative. Connected.
          </p>
          
          {/* CoLockup */}
          <div className="pointer-events-auto">
            <CoLockup />
          </div>

          {/* Stats line */}
          <p className="text-center text-xs sm:text-sm text-gray-600 mt-4 sm:mt-6">
            500+ creatives • 100+ of categories • Tulsa &amp; beyond
          </p>
        </div>
      </div>
    </div>
  );
}

interface MasonryColumnProps {
  artists: MasonryArtist[];
  duration: string;
  direction: "up" | "down";
  hideOnMobile?: boolean;
}

function MasonryColumn({ 
  artists, 
  duration, 
  direction,
  hideOnMobile = false,
}: MasonryColumnProps) {
  // Duplicate artists for seamless infinite scroll
  const duplicatedArtists = [...artists, ...artists];
  
  // Responsive visibility classes
  const visibilityClasses = hideOnMobile ? "hidden sm:flex" : "flex";

  return (
    <div 
      className={`${visibilityClasses} flex-col w-24 sm:w-28 md:w-32 lg:w-36 flex-shrink-0 overflow-hidden h-full`}
    >
      <div
        className={`flex flex-col gap-4 sm:gap-5 lg:gap-6
                   ${direction === "up" ? "animate-scroll-up" : "animate-scroll-down"}
                   motion-reduce:animate-none`}
        style={{
          animationDuration: duration,
        }}
      >
        {duplicatedArtists.map((artist, index) => (
          <AvatarCard 
            key={`${artist.id}-${index}`} 
            artist={artist} 
          />
        ))}
      </div>
    </div>
  );
}

interface AvatarCardProps {
  artist: MasonryArtist;
}

function AvatarCard({ artist }: AvatarCardProps) {
  const avatarSrc = getAvatarUrl(artist, "small");
  
  return (
    <div 
      className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36
                 rounded-2xl sm:rounded-3xl overflow-hidden 
                 bg-gray-100 flex-shrink-0 shadow-md"
    >
      {avatarSrc ? (
        <Image
          src={avatarSrc}
          alt=""
          width={144}
          height={144}
          sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, (max-width: 1024px) 128px, 144px"
          loading="lazy"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
          <span className="text-amber-600 font-bold text-base sm:text-lg md:text-xl lg:text-2xl">
            {artist.display_name?.charAt(0) || "?"}
          </span>
        </div>
      )}
    </div>
  );
}
