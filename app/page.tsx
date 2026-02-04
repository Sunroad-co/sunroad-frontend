import Link from "next/link";
import FeaturedArtists from "@/components/featured-artists";
import FeaturedBlog from "@/components/featured-blog";
import PopularCategories from "@/components/popular-categories";
import SocialProof from "@/components/social-proof";
import HomeHero from "@/components/home/HomeHero";
import HowItWorks from "@/components/home/HowItWorks";
import BrandManifesto from "@/components/BrandManifesto";
// DiscoveryLoop is now embedded in ReactiveWallHero, no separate import needed
// import DiscoveryLoop from "@/components/home/DiscoveryLoop";
import Faq from "@/components/shared/Faq";
import type { FaqItem } from "@/components/shared/Faq";
import { fetchFeaturedPosts } from "@/lib/sanity/queries";

// Cache indefinitely - revalidate only via manual trigger or webhook
export const revalidate = false;

// FAQ items for the home page (curated subset)
const homeFaqItems: FaqItem[] = [
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
    id: "pricing",
    question: "How much does it cost?",
    answer: (
      <>
        <p>
          Sun Road offers a free tier with basic features, and a Premium plan. Premium unlocks more portfolio
          items, categories, direct contact, and search visibility.
        </p>
        <p>
          <a href="/pricing">View full pricing details →</a>
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

export default async function Home() {
  // Fetch featured posts server-side (cached indefinitely, revalidated via webhook)
  const featuredPosts = await fetchFeaturedPosts(3);

  return (
    <div className="min-h-screen">
      {/* Hero Section - ReactiveWallHero with embedded DiscoveryLoop */}
      <HomeHero />
      {/* Brand Manifesto Section */}
        {/* Social Proof Section */}
     
    
     

    

      {/* Featured Artists Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-gray-900">Featured Creatives</h2>
          <Link href="/artists" className="text-amber-600 hover:text-amber-700 font-medium">
            See More...
          </Link>
        </div>
        <FeaturedArtists />
      </section>
 {/* How It Works Section */}
 <HowItWorks />
      {/* Community Stories Section - Only render if we have posts */}
      {featuredPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-sunroad-brown-900">
              Community Stories
            </h2>
            <Link 
              href="/blog" 
              className="text-sunroad-amber-600 hover:text-sunroad-amber-700 font-medium text-sm sm:text-base"
            >
              Explore all stories →
            </Link>
          </div>
          <FeaturedBlog posts={featuredPosts} />
        </section>
      )}

      {/* Popular Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-gray-900">Popular Categories</h2>
          <Link href="/categories" className="text-amber-600 hover:text-amber-700 font-medium">
            See More...
          </Link>
        </div>
        <PopularCategories />
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <Faq items={homeFaqItems} />
      </section>
    </div>
  );
}
