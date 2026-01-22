"use client";

import { useState, useId } from "react";
import { cn } from "@/lib/utils";

export type BillingInterval = "monthly" | "yearly";

interface PricingToggleProps {
  defaultInterval?: BillingInterval;
  onIntervalChange?: (interval: BillingInterval) => void;
  className?: string;
}

/**
 * Accessible billing interval toggle component.
 * Uses a fieldset with radio buttons for proper semantics and keyboard navigation.
 */
export default function PricingToggle({
  defaultInterval = "monthly",
  onIntervalChange,
  className,
}: PricingToggleProps) {
  const [interval, setInterval] = useState<BillingInterval>(defaultInterval);
  const groupId = useId();

  const handleChange = (newInterval: BillingInterval) => {
    setInterval(newInterval);
    onIntervalChange?.(newInterval);
  };

  return (
    <fieldset className={cn("flex flex-col items-center", className)}>
      <legend className="sr-only">Select billing interval</legend>

      <div
        className={cn(
          "relative inline-flex items-center rounded-full p-1",
          "bg-sunroad-brown-100/80 border border-sunroad-brown-200"
        )}
        role="radiogroup"
        aria-label="Billing interval"
      >
        {/* Sliding background indicator */}
        <div
          className={cn(
            "absolute top-1 bottom-1 rounded-full bg-white shadow-sm",
            "transition-transform duration-200 ease-out",
            "motion-reduce:transition-none",
            interval === "monthly"
              ? "translate-x-0 w-[calc(50%-2px)] left-1"
              : "translate-x-full w-[calc(50%-2px)] left-1"
          )}
          aria-hidden="true"
        />

        {/* Monthly option */}
        <label
          className={cn(
            "relative z-10 cursor-pointer select-none rounded-full px-4 py-2",
            "text-sm font-medium transition-colors duration-200",
            "focus-within:ring-2 focus-within:ring-sunroad-amber-500 focus-within:ring-offset-2",
            interval === "monthly"
              ? "text-sunroad-brown-900"
              : "text-sunroad-brown-500 hover:text-sunroad-brown-700"
          )}
        >
          <input
            type="radio"
            name={`billing-interval-${groupId}`}
            value="monthly"
            checked={interval === "monthly"}
            onChange={() => handleChange("monthly")}
            className="sr-only"
            aria-describedby={`monthly-price-${groupId}`}
          />
          Monthly
        </label>

        {/* Yearly option */}
        <label
          className={cn(
            "relative z-10 cursor-pointer select-none rounded-full px-4 py-2",
            "text-sm font-medium transition-colors duration-200",
            "focus-within:ring-2 focus-within:ring-sunroad-amber-500 focus-within:ring-offset-2",
            interval === "yearly"
              ? "text-sunroad-brown-900"
              : "text-sunroad-brown-500 hover:text-sunroad-brown-700"
          )}
        >
          <input
            type="radio"
            name={`billing-interval-${groupId}`}
            value="yearly"
            checked={interval === "yearly"}
            onChange={() => handleChange("yearly")}
            className="sr-only"
            aria-describedby={`yearly-price-${groupId}`}
          />
          Yearly
        </label>
      </div>

      {/* Hidden price descriptions for screen readers */}
      <span id={`monthly-price-${groupId}`} className="sr-only">
        $6.99 per month
      </span>
      <span id={`yearly-price-${groupId}`} className="sr-only">
        $75 per year, save approximately 10%
      </span>
    </fieldset>
  );
}

// Export a hook-friendly version for parent components to control pricing display
export function usePricingToggle(defaultInterval: BillingInterval = "monthly") {
  const [interval, setInterval] = useState<BillingInterval>(defaultInterval);
  return { interval, setInterval };
}
