import { cn } from "@/lib/utils";

export interface FaqItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

interface FaqProps {
  title?: string;
  items: FaqItem[];
  compact?: boolean;
  className?: string;
}

/**
 * Accessible FAQ accordion component using native <details>/<summary> elements.
 * Works without JavaScript and provides full keyboard navigation.
 */
export default function Faq({
  title = "Frequently asked questions",
  items,
  compact = false,
  className,
}: FaqProps) {
  return (
    <section className={cn("w-full", className)} aria-labelledby="faq-title">
      <h2
        id="faq-title"
        className={cn(
          "font-display font-semibold tracking-tight text-sunroad-brown-900",
          compact ? "text-xl mb-4" : "text-2xl sm:text-3xl mb-8"
        )}
      >
        {title}
      </h2>

      <div
        className={cn(
          "divide-y divide-sunroad-brown-200 border-y border-sunroad-brown-200",
          compact ? "space-y-0" : "space-y-0"
        )}
      >
        {items.map((item) => (
          <details
            key={item.id}
            className={cn(
              "group",
              compact ? "[&_summary]:py-3" : "[&_summary]:py-4 sm:[&_summary]:py-5"
            )}
          >
            <summary
              className={cn(
                "flex cursor-pointer list-none items-center justify-between gap-4",
                "text-left font-medium text-sunroad-brown-900",
                "transition-colors duration-200",
                "hover:text-sunroad-amber-700",
                // Focus styles for accessibility
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-500 focus-visible:ring-offset-2 rounded-sm",
                // Remove default marker
                "[&::-webkit-details-marker]:hidden",
                compact ? "text-sm" : "text-base sm:text-lg"
              )}
            >
              <span>{item.question}</span>
              {/* Chevron icon that rotates when open */}
              <span
                className={cn(
                  "shrink-0 transition-transform duration-200",
                  "group-open:rotate-180",
                  // Respect reduced motion preference
                  "motion-reduce:transition-none"
                )}
                aria-hidden="true"
              >
                <svg
                  className={cn(
                    "text-sunroad-brown-500 group-hover:text-sunroad-amber-600",
                    compact ? "h-4 w-4" : "h-5 w-5"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </summary>
            <div
              className={cn(
                "text-sunroad-brown-600 leading-relaxed",
                compact ? "pb-3 text-sm" : "pb-4 sm:pb-5 text-sm sm:text-base",
                // Prose styling for rich content
                "[&_a]:text-sunroad-amber-600 [&_a]:underline [&_a]:underline-offset-2",
                "[&_a:hover]:text-sunroad-amber-700",
                "[&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-sunroad-amber-500 [&_a:focus-visible]:rounded-sm",
                "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_ul]:space-y-1",
                "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mt-2 [&_ol]:space-y-1",
                "[&_p]:mt-2 [&_p:first-child]:mt-0"
              )}
            >
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
