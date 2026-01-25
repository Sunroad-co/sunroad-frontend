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
 * DiscoveryLoopInline - Compact version for embedding inside hero console
 * 
 * Reuses the same INTENTS, CATEGORY_IDS, and CSS animations from DiscoveryLoop,
 * but without the outer section wrapper and large padding.
 * Designed to sit naturally inside a parent container.
 * 
 * Features:
 * - CSS-only animations (reuses DiscoveryLoop.module.css)
 * - Category-specific icons
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

export default function DiscoveryLoopInline() {
  return (
    <div 
      className={`${styles.container} group relative max-w-2xl mx-auto`}
      role="region"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Discover creatives by intent"
    >
      {/* Small label */}
      <p className="text-center text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-gray-500 mb-4 sm:mb-5">
        What are you creating?
      </p>

      {/* Intent stack - all intents positioned absolutely, animated in sequence */}
      <div className="relative w-full max-w-2xl mx-auto h-[160px] sm:h-[140px] md:h-[120px]">
        {INTENTS.map((intent, index) => (
          <IntentSlide 
            key={intent.sentence}
            intent={intent}
            index={index}
          />
        ))}
      </div>
      
      {/* Reassurance line */}
      <p className="text-center text-sm text-gray-400 mt-4">
        Browse freely – contact directly.
      </p>
    </div>
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
      aria-hidden={index !== 0 ? "true" : undefined}
    >
      {/* Intent sentence */}
      <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold text-gray-900 text-center tracking-tight mb-3 sm:mb-4">
        {intent.sentence}
      </h2>
      
      {/* Category chips */}
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-lg mx-auto">
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
  const chipDelay = index * 0.1;
  
  return (
    <Link
      href={href}
      className={`${styles.chip} group/chip inline-flex items-center gap-1.5 
                 px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2
                 text-xs sm:text-sm font-medium text-gray-600
                 bg-white/90 backdrop-blur-sm
                 border border-gray-200 rounded-full
                 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]
                 hover:bg-white hover:border-amber-200/80 
                 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(217,119,6,0.08)]
                 hover:text-gray-900 hover:-translate-y-0.5
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2
                 transition-all duration-200 ease-out
                 motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
      style={{ animationDelay: `${chipDelay}s` }}
    >
      <IconComponent 
        className="w-3 h-3 text-amber-500/70 group-hover/chip:text-amber-500 transition-colors duration-200" 
        strokeWidth={2}
      />
      <span>{category}</span>
      <ArrowRight 
        className={`${styles.chipArrow} w-3 h-3 text-gray-400 group-hover/chip:text-amber-600`}
        strokeWidth={2}
      />
    </Link>
  );
}
