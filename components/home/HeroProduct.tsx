import Image from "next/image";
import Link from "next/link";
import { getAvatarUrl } from "@/lib/media";
import type { HeroArtist } from "./HomeHero";
import styles from "./HeroProduct.module.css";

interface HeroProductProps {
  artists: HeroArtist[];
}

/**
 * HeroProduct - Premium hero section for the home page
 * 
 * Features:
 * - Left: Strong headline, subtext, dual CTAs, trust line, subtle logo watermark
 * - Right: Enhanced hero image with subtle grain overlay, 3 floating preview cards
 * - Floating cards use real artist data from props (no fetching)
 * - Fully responsive with mobile-first design
 * - Respects prefers-reduced-motion for all animations
 */
export default function HeroProduct({ artists }: HeroProductProps) {
  // Get artists for floating cards (with safe fallbacks)
  const artist1 = artists[0] ?? null;
  const artist2 = artists[1] ?? null;
  const artist3 = artists[2] ?? null;

  // Get avatar URLs
  const avatar1Url = artist1 ? getAvatarUrl(artist1, "small") : null;
  const avatar2Url = artist2 ? getAvatarUrl(artist2, "small") : null;

  // Get initials for fallback
  const getInitials = (name: string | null) => {
    if (!name) return "SR";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <section className="relative max-w-7xl mx-auto mb-0 px-4 sm:px-6 lg:px-8 pt-12 lg:pt-20 ">
      <div className="bg-[#9B6752] border-2 border-gray-900 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch min-h-[480px] lg:min-h-[520px]">
          
          {/* Left Panel - Content */}
          <div className="relative p-8 lg:p-12 xl:p-16 flex flex-col justify-center space-y-6 text-center lg:text-left order-2 lg:order-1">
            {/* Logo - watermark in background, pushed below content */}
            <div 
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 lg:-bottom-4 pointer-events-none select-none z-0"
              aria-hidden="true"
            >
              <Image 
                src="/sunroad_logo.webp" 
                alt="" 
                width={400} 
                height={219}
                className="h-24 sm:h-28 lg:h-32 w-auto opacity-[0.12] grayscale contrast-50"
                unoptimized
              />
            </div>

            {/* Headline */}
            <div className="space-y-4 relative z-10">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-amber-50 leading-tight tracking-tight">
                Your work deserves a home.
              </h1>
              
              {/* Subtext */}
              <p className="text-lg sm:text-xl text-amber-100/90 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Share one link. Showcase your portfolio. Get discovered{" "}
                <span className="text-white font-medium">(Premium)</span> or share directly{" "}
                <span className="text-white font-medium">(Free)</span>.
              </p>
            </div>

            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-2 relative z-10">
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center px-8 py-4 bg-black text-white rounded-full 
                         hover:bg-gray-800 active:bg-gray-900 transition-colors font-semibold text-lg
                         focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#9B6752]"
              >
                Claim your profile
              </Link>
              <Link
                href="/artists"
                className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white 
                         border-2 border-white/40 rounded-full hover:bg-white/10 hover:border-white/60 
                         active:bg-white/20 transition-colors font-semibold text-lg
                         focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#9B6752]"
              >
                Browse creatives
              </Link>
            </div>

            {/* Trust Line */}
            <p className="text-sm text-amber-100/70 pt-2 relative z-10">
              No commissions. Direct contact. Cancel anytime.
            </p>
          </div>
          
          {/* Right Panel - Enhanced Image with Floating Cards */}
          <div className="relative h-72 sm:h-80 lg:h-auto overflow-hidden order-1 lg:order-2">
            {/* Hero Image with clip-path */}
            <div
              className="absolute inset-0 
                [clip-path:ellipse(150%_100%_at_100%_50%)] 
                lg:[clip-path:ellipse(100%_150%_at_100%_50%)]"
            >
              {/* Static hero image - unoptimized to avoid Vercel Image Optimization quota */}
              <Image
                src="/head_guitarist.webp"
                alt="Local creative performing"
                fill
                className="object-cover object-center scale-110"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
              />
              
              {/* Subtle grain overlay - reduced opacity */}
              <div 
                className="absolute inset-0 opacity-[0.12] mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />
              
            </div>

            {/* Floating Card 1 - Profile Preview (Artist 1) */}
            <div 
              className={`absolute bottom-8 left-4 sm:bottom-12 sm:left-8 lg:bottom-16 lg:left-12
                         bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4
                         ${styles.animateFloatSlow} motion-reduce:animate-none
                         transform-gpu`}
              aria-hidden="true"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center flex-shrink-0">
                  {avatar1Url ? (
                    <Image
                      src={avatar1Url}
                      alt=""
                      width={48}
                      height={48}
                      sizes="48px"
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-amber-800 font-bold text-sm sm:text-base">
                      {getInitials(artist1?.display_name ?? null)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    @{artist1?.handle || "creative"}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">Portfolio</p>
                </div>
              </div>
            </div>

            {/* Floating Card 2 - Available for Hire Badge */}
            <div 
              className={`absolute top-8 right-4 sm:top-12 sm:right-8 lg:top-16 lg:right-auto lg:left-4
                         bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4
                         ${styles.animateFloatFast} motion-reduce:animate-none
                         transform-gpu`}
              aria-hidden="true"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="font-medium text-gray-900 text-sm sm:text-base">Available for hire</span>
              </div>
            </div>

            {/* Floating Card 3 - Second Profile Preview OR Community Stats */}
            <div 
              className={`absolute bottom-20 right-4 sm:bottom-28 sm:right-8 lg:bottom-32 lg:right-12
                         bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4
                         ${styles.animateFloatMedium} motion-reduce:animate-none
                         transform-gpu hidden sm:block`}
              aria-hidden="true"
            >
              {artist2 ? (
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center flex-shrink-0">
                    {avatar2Url ? (
                      <Image
                        src={avatar2Url}
                        alt=""
                        width={40}
                        height={40}
                        sizes="40px"
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-amber-800 font-bold text-xs sm:text-sm">
                        {getInitials(artist2.display_name)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                      @{artist2.handle}
                    </p>
                    <p className="text-xs text-gray-500">Portfolio</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-bold text-gray-900 text-lg">500+</p>
                  <p className="text-xs text-gray-500">Creatives</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
