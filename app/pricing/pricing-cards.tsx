"use client";

import { useState } from "react";
import Link from "next/link";
import PricingToggle, {
  type BillingInterval,
} from "@/components/pricing/PricingToggle";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  "Up to 6 portfolio items (photos/videos/sound embeds)",
  "Up to 2 categories",
  "Public shareable profile",
];

const PREMIUM_FEATURES = [
  "Up to 12 portfolio items",
  "Up to 5 categories",
  "Enable direct contact through profile",
  "Appear in search results + main directory listing",
  "Opportunity to be featured (home + blogs)",
];

export default function PricingCards() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  const monthlyPrice = "$6.99";
  const yearlyPrice = "$75";
  const yearlySavings = "~10%";

  return (
    <div className="space-y-8">
      {/* Toggle */}
      <div className="flex justify-center">
        <PricingToggle
          defaultInterval="monthly"
          onIntervalChange={setInterval}
        />
      </div>

      {/* Cards Grid */}
      <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
        {/* Free Tier Card */}
        <div
          className={cn(
            "relative rounded-2xl border bg-white p-6 sm:p-8",
            "border-sunroad-brown-200",
            "flex flex-col"
          )}
        >
          <div className="mb-6">
            <h3 className="text-xl font-display font-semibold text-sunroad-brown-900">
              Free
            </h3>
            <p className="mt-1 text-sm text-sunroad-brown-500">
              Perfect for getting started
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-display font-bold text-sunroad-brown-900">
                $0
              </span>
              <span className="text-sunroad-brown-500">/forever</span>
            </div>
          </div>

          <ul className="space-y-3 mb-8 flex-1" role="list">
            {FREE_FEATURES.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5">
                  <svg
                    className="w-5 h-5 text-sunroad-brown-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span className="text-sm text-sunroad-brown-600">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/auth/sign-up"
            className={cn(
              "block w-full text-center py-3 px-4 rounded-full font-semibold",
              "bg-sunroad-brown-100 text-sunroad-brown-900",
              "hover:bg-sunroad-brown-200 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-500 focus-visible:ring-offset-2"
            )}
          >
            Get Started Free
          </Link>
        </div>

        {/* Premium Tier Card */}
        <div
          className={cn(
            "relative rounded-2xl border-2 bg-white p-6 sm:p-8",
            "border-sunroad-amber-400",
            "shadow-lg shadow-sunroad-amber-100/50",
            "flex flex-col",
            // Subtle glow effect
            "ring-1 ring-sunroad-amber-200/50"
          )}
        >
          {/* Most Popular Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sunroad-amber-500 text-white shadow-sm">
              Most Popular
            </span>
          </div>

          <div className="mb-6 mt-2">
            <h3 className="text-xl font-display font-semibold text-sunroad-brown-900">
              Premium
            </h3>
            <p className="mt-1 text-sm text-sunroad-brown-500">
              Maximum visibility & features
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-display font-bold text-sunroad-brown-900">
                {interval === "monthly" ? monthlyPrice : yearlyPrice}
              </span>
              <span className="text-sunroad-brown-500">
                /{interval === "monthly" ? "mo" : "yr"}
              </span>
            </div>
            {/* Savings badge for yearly */}
            <div
              className={cn(
                "mt-2 transition-opacity duration-200",
                "motion-reduce:transition-none",
                interval === "yearly" ? "opacity-100" : "opacity-0 h-0"
              )}
              aria-hidden={interval !== "yearly"}
            >
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Save {yearlySavings}
              </span>
            </div>
          </div>

          <ul className="space-y-3 mb-8 flex-1" role="list">
            {PREMIUM_FEATURES.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5">
                  <svg
                    className="w-5 h-5 text-sunroad-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span className="text-sm text-sunroad-brown-700">{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/auth/sign-up"
            className={cn(
              "block w-full text-center py-3 px-4 rounded-full font-semibold",
              "bg-sunroad-amber-500 text-white",
              "hover:bg-sunroad-amber-600 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-500 focus-visible:ring-offset-2"
            )}
          >
            Get Premium
          </Link>
        </div>
      </div>

      {/* Billing note */}
      <p className="text-center text-sm text-sunroad-brown-500">
        {interval === "monthly" ? (
          <>
            Billed monthly. Cancel anytime.{" "}
            <button
              type="button"
              onClick={() => setInterval("yearly")}
              className="text-sunroad-amber-600 hover:text-sunroad-amber-700 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-500 rounded"
            >
              Save with yearly billing
            </button>
          </>
        ) : (
          <>
            Billed annually ({yearlyPrice}/year). That&apos;s just $6.25/month.
          </>
        )}
      </p>
    </div>
  );
}
