import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PricingCards from "./pricing-cards";
import Faq from "@/components/shared/Faq";
import type { FaqItem } from "@/components/shared/Faq";

// Force static generation with no revalidation
export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Pricing | Sun Road Co.",
  description:
    "Join the Sun Road creative directory. Free tier includes 6 portfolio items and a public profile. Premium at $6.99/mo unlocks 12 items, direct contact, search visibility, and featured opportunities.",
  openGraph: {
    title: "Pricing | Sun Road Co.",
    description:
      "Join the Sun Road creative directory. Free tier or Premium at $6.99/mo for enhanced visibility.",
    type: "website",
    siteName: "Sun Road Co.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | Sun Road Co.",
    description:
      "Join the Sun Road creative directory. Free tier or Premium at $6.99/mo for enhanced visibility.",
  },
};

// FAQ data
const faqItems: FaqItem[] = [
  {
    id: "what-is-sunroad",
    question: "What is Sun Road Co.?",
    answer: (
      <p>
        Sun Road Co. is a directory that helps locals discover and connect with
        talented creatives in their area - photographers, musicians, designers,
        artists, and more. We make it easy for creatives to showcase their work
        and for clients to find the right talent.
      </p>
    ),
  },
  {
    id: "who-can-join",
    question: "Who can join as a creative?",
    answer: (
      <p>
        Anyone with a creative skill or service can join! Whether you&apos;re a
        photographer, musician, videographer, graphic designer, illustrator,
        writer, or any other type of creative professional, Sun Road welcomes
        you.
      </p>
    ),
  },
  {
    id: "how-clients-find-me",
    question: "How do clients find me?",
    answer: (
      <>
        <p>
          Premium members appear in our public search results and main directory
          listing. Clients can browse by category, location, and discover your
          portfolio.
        </p>
        <p>
          Free members have a public shareable profile but don&apos;t appear in
          search results - you can still share your profile link directly with
          potential clients.
        </p>
      </>
    ),
  },
  {
    id: "edit-portfolio",
    question: "Can I edit my portfolio and categories later?",
    answer: (
      <p>
        Yes! You can update your portfolio items, categories, bio, and all
        profile information at any time from your dashboard. Changes are
        reflected immediately.
      </p>
    ),
  },
  {
    id: "data-privacy",
    question: "Is my data private and secure?",
    answer: (
      <>
        <p>
          We take your privacy seriously. Your personal information is encrypted
          and never sold to third parties. Only the information you choose to
          display publicly (portfolio, bio, categories) is visible to others.
        </p>
        <p>
          Contact details are only shared when you enable direct contact on your
          profile (Premium feature).
        </p>
      </>
    ),
  },
  {
    id: "how-to-upgrade",
    question: "How do I upgrade to Premium?",
    answer: (
      <>
        <p>To upgrade your account:</p>
        <ol>
          <li>Log in to your account</li>
          <li>Go to Settings → Billing / Membership</li>
          <li>Choose your plan (Monthly or Yearly)</li>
          <li>Complete payment via Stripe</li>
        </ol>
      </>
    ),
  },
  {
    id: "payment-methods",
    question: "What payment methods do you accept?",
    answer: (
      <p>
        We accept all major credit and debit cards through Stripe, including
        Visa, Mastercard, American Express, and Discover.
      </p>
    ),
  },
  {
    id: "refund-policy",
    question: "What is your refund policy?",
    answer: (
      <p>
        We do not offer refunds once a payment has been processed. We encourage
        you to try the free tier first to make sure Sun Road is right for you
        before upgrading.
      </p>
    ),
  },
  {
    id: "cancel-subscription",
    question: "Can I cancel my subscription?",
    answer: (
      <>
        <p>
          Yes, you can cancel anytime from your account settings. When you
          cancel:
        </p>
        <ul>
          <li>You keep Premium access until the end of your billing period</li>
          <li>
            After that, your account downgrades to Free automatically
          </li>
          <li>
            Your portfolio will reduce to the 6 most recent items
          </li>
          <li>Categories will reduce to your first 2 selected</li>
          <li>You can resubscribe anytime to restore full access</li>
        </ul>
      </>
    ),
  },
  {
    id: "delete-account",
    question: "How do I delete my account permanently?",
    answer: (
      <>
        <p>
          To permanently delete your account and all associated data, please
          email us at{" "}
          <a href="mailto:support@sunroad.co">support@sunroad.co</a> with the
          subject line &quot;Account Deletion Request&quot; from the email
          associated with your account.
        </p>
        <p>
          We&apos;ll process your request within 7 business days. Note that this
          action is irreversible.
        </p>
      </>
    ),
  },
  {
    id: "plans-change",
    question: "Will pricing or features change?",
    answer: (
      <p>
        We may update our pricing and features from time to time. Existing
        subscribers will be notified in advance of any changes that affect their
        current plan.
      </p>
    ),
  },
  {
    id: "content-guidelines",
    question: "What are the content guidelines?",
    answer: (
      <>
        <p>Portfolio items must be your own original work. Supported formats:</p>
        <ul>
          <li>Images: JPEG, PNG, WebP</li>
          <li>
            Video embeds: YouTube, Vimeo, Mux, Facebook, Twitch, Streamable,
            Wistia, DailyMotion, Vidyard, Kaltura
          </li>
          <li>Audio embeds: SoundCloud, Spotify</li>
        </ul>
        <p className="text-xs text-sunroad-brown-500 mt-2">
          Content must comply with our terms of service.
        </p>
      </>
    ),
  },
  {
    id: "client-fees",
    question: "Is there a fee to browse or hire creatives?",
    answer: (
      <p>
        No! Browsing the directory is completely free for everyone. We
        don&apos;t take any commission on work you get through Sun Road - any
        arrangements are directly between you and the creative.
      </p>
    ),
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 lg:pt-20 lg:pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-sunroad-brown-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-sunroad-brown-600 leading-relaxed">
            Join our community of local creatives. Start free or upgrade for
            enhanced visibility and direct client connections.
          </p>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
        aria-labelledby="pricing-plans"
      >
        <h2 id="pricing-plans" className="sr-only">
          Pricing plans
        </h2>
        <PricingCards />

        {/* Compare tiers link */}
        <div className="text-center mt-8">
          <a
            href="#compare"
            className="inline-flex items-center gap-2 text-sunroad-amber-600 hover:text-sunroad-amber-700 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-500 focus-visible:ring-offset-2 rounded"
          >
            Compare all features
            <svg
              className="w-4 h-4"
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
          </a>
        </div>
      </section>

      {/* No Hidden Fees Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative bg-gradient-to-br from-sunroad-amber-50 to-sunroad-brown-50 border border-sunroad-amber-200/60 rounded-2xl p-6 sm:p-8 text-center overflow-hidden">
          {/* Watermark logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            <Image
              src="/sunroad_logo.png"
              alt=""
              width={300}
              height={100}
              className="opacity-[0.04] select-none"
              unoptimized
            />
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-sunroad-amber-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-sunroad-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-sunroad-brown-900 mb-2">
              No hidden fees. No commission.
            </h2>
            <p className="text-sunroad-brown-600 max-w-xl mx-auto">
              What you see is what you pay. We never take a cut of the work you
              get through Sun Road - keep 100% of your earnings.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section
        id="compare"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 scroll-mt-24"
        aria-labelledby="compare-title"
      >
        <h2
          id="compare-title"
          className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-sunroad-brown-900 text-center mb-8 lg:mb-12"
        >
          Compare plans
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse">
            <thead>
              <tr className="border-b-2 border-sunroad-brown-200">
                <th className="text-left py-4 px-4 font-display font-semibold text-sunroad-brown-900">
                  Feature
                </th>
                <th className="text-center py-4 px-4 font-display font-semibold text-sunroad-brown-700">
                  Free
                </th>
                <th className="text-center py-4 px-4 font-display font-semibold text-sunroad-amber-700">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sunroad-brown-100">
              <tr className="hover:bg-sunroad-brown-50/50 transition-colors">
                <td className="py-4 px-4 text-sunroad-brown-700">
                  Portfolio items
                </td>
                <td className="py-4 px-4 text-center text-sunroad-brown-600">
                  Up to 6
                </td>
                <td className="py-4 px-4 text-center text-sunroad-brown-900 font-medium">
                  Up to 12
                </td>
              </tr>
              <tr className="hover:bg-sunroad-brown-50/50 transition-colors">
                <td className="py-4 px-4 text-sunroad-brown-700">Categories</td>
                <td className="py-4 px-4 text-center text-sunroad-brown-600">
                  Up to 2
                </td>
                <td className="py-4 px-4 text-center text-sunroad-brown-900 font-medium">
                  Up to 5
                </td>
              </tr>
              <tr className="hover:bg-sunroad-brown-50/50 transition-colors">
                <td className="py-4 px-4 text-sunroad-brown-700">
                  Public shareable profile
                </td>
                <td className="py-4 px-4 text-center">
                  <CheckIcon />
                </td>
                <td className="py-4 px-4 text-center">
                  <CheckIcon />
                </td>
              </tr>
              <tr className="hover:bg-sunroad-brown-50/50 transition-colors">
                <td className="py-4 px-4 text-sunroad-brown-700">
                  Appear in search results
                </td>
                <td className="py-4 px-4 text-center">
                  <CrossIcon />
                </td>
                <td className="py-4 px-4 text-center">
                  <CheckIcon />
                </td>
              </tr>
              <tr className="hover:bg-sunroad-brown-50/50 transition-colors">
                <td className="py-4 px-4 text-sunroad-brown-700">
                  Main directory listing
                </td>
                <td className="py-4 px-4 text-center">
                  <CrossIcon />
                </td>
                <td className="py-4 px-4 text-center">
                  <CheckIcon />
                </td>
              </tr>
              <tr className="hover:bg-sunroad-brown-50/50 transition-colors">
                <td className="py-4 px-4 text-sunroad-brown-700">
                  Direct contact through profile
                </td>
                <td className="py-4 px-4 text-center">
                  <CrossIcon />
                </td>
                <td className="py-4 px-4 text-center">
                  <CheckIcon />
                </td>
              </tr>
              <tr className="hover:bg-sunroad-brown-50/50 transition-colors">
                <td className="py-4 px-4 text-sunroad-brown-700">
                  Opportunity to be featured
                </td>
                <td className="py-4 px-4 text-center">
                  <CrossIcon />
                </td>
                <td className="py-4 px-4 text-center">
                  <CheckIcon />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <Faq items={faqItems} />
      </section>

      {/* Support CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="bg-sunroad-brown-900 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-white mb-4">
            Still have questions?
          </h2>
          <p className="text-sunroad-brown-300 mb-6 max-w-xl mx-auto">
            We&apos;re here to help. Reach out to our team and we&apos;ll get
            back to you as soon as possible.
          </p>
          <a
            href="mailto:support@sunroad.co"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-sunroad-brown-900 rounded-full font-semibold hover:bg-sunroad-cream transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sunroad-brown-900"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Support
          </a>
        </div>
      </section>

      {/* Internal Links Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <nav
          className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm"
          aria-label="Related pages"
        >
          <Link
            href="/artists"
            className="text-sunroad-brown-600 hover:text-sunroad-amber-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-500 focus-visible:rounded"
          >
            Browse Artists
          </Link>
          <Link
            href="/search"
            className="text-sunroad-brown-600 hover:text-sunroad-amber-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-500 focus-visible:rounded"
          >
            Search Directory
          </Link>
          <Link
            href="/blog"
            className="text-sunroad-brown-600 hover:text-sunroad-amber-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-500 focus-visible:rounded"
          >
            Blog
          </Link>
          <a
            href="/privacy"
            className="text-sunroad-brown-600 hover:text-sunroad-amber-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sunroad-amber-500 focus-visible:rounded"
          >
            Privacy Policy
          </a>
        </nav>
      </section>
    </div>
  );
}

// Helper components for table icons
function CheckIcon() {
  return (
    <span className="inline-flex items-center justify-center" aria-label="Included">
      <svg
        className="w-5 h-5 text-green-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </span>
  );
}

function CrossIcon() {
  return (
    <span
      className="inline-flex items-center justify-center"
      aria-label="Not included"
    >
      <svg
        className="w-5 h-5 text-sunroad-brown-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </span>
  );
}
