import Link from "next/link";
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
  Warehouse
} from "lucide-react";
import styles from "./DiscoveryLoop.module.css";

/**
 * Intent-based Discovery Section for Sunroad Homepage
 * 
 * A calm, looping section that cycles through human creative intents,
 * showing how Sunroad helps people discover local creatives.
 * 
 * Features:
 * - CSS-only animations (no Framer Motion, no useEffect)
 * - 8s loop cycle with fade + blur transitions
 * - Premium tag chips with category-specific icons + hover arrow
 * - Pauses on hover
 * - Respects prefers-reduced-motion
 * - Fully static / SSG-safe
 */

/** Category mapping for search links */
const CATEGORY_IDS: Record<string, string> = {
  "Photographers": "photographer",
  "Musicians": "musician",
  "Venues": "venue",
  "Designers": "designer",
  "Copywriters": "copywriter",
  "Brand Photography": "brand-photographer",
  "Muralists": "muralist",
  "Painters": "painter",
  "Sculptors": "sculptor",
  "Videographers": "videographer",
  "Illustrators": "illustrator",
  "Editors": "editor",
  "Producers": "producer",
  "Session Musicians": "session-musician",
  "Studios": "studio",
};

/** Category to icon mapping */
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "Photographers": Camera,
  "Musicians": Music,
  "Venues": Building2,
  "Designers": Palette,
  "Copywriters": Type,
  "Brand Photography": Camera,
  "Muralists": Brush,
  "Painters": Brush,
  "Sculptors": PenTool,
  "Videographers": Film,
  "Illustrators": PenTool,
  "Editors": Scissors,
  "Producers": Mic,
  "Session Musicians": Music,
  "Studios": Warehouse,
};

/** Intent data structure */
interface Intent {
  sentence: string;
  categories: string[];
}

/** All intents to cycle through */
const INTENTS: Intent[] = [
  {
    sentence: "I'm planning an event.",
    categories: ["Photographers", "Musicians", "Venues"],
  },
  {
    sentence: "I'm building a brand.",
    categories: ["Designers", "Copywriters", "Brand Photography"],
  },
  {
    sentence: "I'm transforming a space.",
    categories: ["Muralists", "Painters", "Sculptors"],
  },
  {
    sentence: "I need visuals for a project.",
    categories: ["Videographers", "Illustrators", "Editors"],
  },
  {
    sentence: "I'm producing music.",
    categories: ["Producers", "Session Musicians", "Studios"],
  },
];

/** Map intent index to CSS module class */
const INTENT_CLASSES = [
  styles.intent0,
  styles.intent1,
  styles.intent2,
  styles.intent3,
  styles.intent4,
];

export default function DiscoveryLoop() {
  return (
    <section 
      className="relative py-20 sm:py-28 lg:py-36 overflow-hidden"
      aria-label="Discover creatives by intent"
    >
      {/* Container - narrower than hero for editorial feel */}
      <div className="max-w-2xl mx-auto px-6 sm:px-8">
        
        {/* Small label */}
        <p className="text-center text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-gray-500 mb-6 sm:mb-8">
          What are you creating?
        </p>
        
        {/* Animated intent container - pauses on hover */}
        <div 
          className={`${styles.container} group relative min-h-[180px] sm:min-h-[200px] flex flex-col items-center`}
          role="region"
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Intent stack - all intents positioned absolutely, animated in sequence */}
          <div className="relative w-full h-[100px] sm:h-[120px]">
            {INTENTS.map((intent, index) => (
              <IntentSlide 
                key={intent.sentence}
                intent={intent}
                index={index}
              />
            ))}
          </div>
          
          {/* Reassurance line */}
          <p className="text-center text-sm sm:text-base text-gray-400 mt-8 sm:mt-10">
            Browse freely – contact directly.
          </p>
        </div>
        
      </div>
    </section>
  );
}

interface IntentSlideProps {
  intent: Intent;
  index: number;
}

function IntentSlide({ intent, index }: IntentSlideProps) {
  const intentClass = INTENT_CLASSES[index] || styles.intent;
  
  return (
    <div 
      className={`absolute inset-0 flex flex-col items-center ${intentClass}`}
      // For reduced motion: only first intent is visible (handled in CSS)
      aria-hidden={index !== 0 ? "true" : undefined}
    >
      {/* Intent sentence */}
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold text-gray-900 text-center tracking-tight mb-5 sm:mb-6">
        {intent.sentence}
      </h2>
      
      {/* Category chips */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {intent.categories.map((category, catIndex) => (
          <CategoryChip 
            key={category}
            category={category}
            index={catIndex}
          />
        ))}
      </div>
    </div>
  );
}

interface CategoryChipProps {
  category: string;
  index: number;
}

function CategoryChip({ category, index }: CategoryChipProps) {
  const categoryId = CATEGORY_IDS[category] || category.toLowerCase().replace(/\s+/g, "-");
  const href = `/search?categories=${categoryId}`;
  const IconComponent = CATEGORY_ICONS[category] || Camera;
  
  // Stagger delay for chips (100ms each)
  const chipDelay = index * 0.1;
  
  return (
    <Link
      href={href}
      className={`${styles.chip} group/chip inline-flex items-center gap-2 
                 px-4 py-2 sm:px-5 sm:py-2.5
                 text-sm sm:text-base font-medium text-gray-600
                 bg-white/90 backdrop-blur-sm
                 border border-gray-200 rounded-full
                 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]
                 hover:bg-white hover:border-amber-200/80 
                 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(217,119,6,0.08)]
                 hover:text-gray-900 hover:-translate-y-0.5
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
                 transition-all duration-200 ease-out
                 motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
      style={{
        animationDelay: `${chipDelay}s`,
      }}
    >
      {/* Category-specific icon */}
      <IconComponent 
        className="w-3.5 h-3.5 text-amber-500/70 group-hover/chip:text-amber-500 transition-colors duration-200" 
        strokeWidth={2}
      />
      
      {/* Category name */}
      <span>{category}</span>
      
      {/* Hover arrow */}
      <ArrowRight 
        className={`${styles.chipArrow} w-3.5 h-3.5 text-gray-400 group-hover/chip:text-amber-600`}
        strokeWidth={2}
      />
    </Link>
  );
}
