import Image from "next/image";
import Link from "next/link";
import FeaturedArtists from "@/components/featured-artists";
import FeaturedBlog from "@/components/featured-blog";
import PopularCategories from "@/components/popular-categories";
import SocialProof from "@/components/social-proof";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
     {/* Hero Section */}
{/* Hero Section */}
<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
  <div className="bg-[#9B6752] border-2 border-gray-900 rounded-3xl overflow-hidden">
    <div className=" bg-[#9B6752] grid grid-cols-1 lg:grid-cols-2 items-stretch">
      
      {/* Left Panel */}
      <div className="p-8 lg:p-12 flex flex-col justify-center space-y-6 text-center lg:text-left">
        {/* Logo */}
        <div className=" flex justify-center lg:justify-start">
          <Image 
            src="/sunroad_logo.png" 
            alt="Sun Road" 
            width={150} 
            height={50}
            className="h-12 w-auto brightness-0 invert"
          />
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-100 leading-tight">
            Join a community of local creatives for just{" "}
            <span className="text-white">5 dollars a month</span>. Let locals and opportunities find you.
          </h1>

          {/* CTA Button */}
          <div className="flex justify-center lg:justify-start">
            <Link
              href="/auth/sign-up"
              className="inline-block px-8 py-4 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-semibold text-lg"
            >
              Join the Community
            </Link>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Image with Inward Curve */}
      <div
  className="relative h-80 lg:h-auto overflow-hidden 
  [clip-path:ellipse(150%_100%_at_100%_50%)] 
  lg:[clip-path:ellipse(100%_150%_at_100%_50%)]"
>
  <Image
    src="/head_guitarist.jpg"
    alt="Local creative performing"
    fill
    className="object-cover object-center scale-110"
    priority
  />
</div>


    </div>
  </div>
</section>

      {/* Social Proof Section */}
      <SocialProof />

      {/* Featured Artists Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Artists</h2>
          <Link href="/artists" className="text-amber-600 hover:text-amber-700 font-medium">
            See More...
          </Link>
        </div>
        <FeaturedArtists />
      </section>

      {/* Featured Blog Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Blog</h2>
          <Link href="/blog" className="text-amber-600 hover:text-amber-700 font-medium">
            See More...
          </Link>
        </div>
        <FeaturedBlog />
      </section>

      {/* Popular Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Popular Categories</h2>
          <Link href="/categories" className="text-amber-600 hover:text-amber-700 font-medium">
            See More...
          </Link>
        </div>
        <PopularCategories />
      </section>
    </div>
  );
}