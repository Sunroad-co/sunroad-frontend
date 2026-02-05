import Link from 'next/link'
import Image from 'next/image'
import { simpleIcons } from '@/lib/simpleIcons'
import LinkedInIcon from './social-icons/linkedin-icon'

// YouTube icon from simple-icons
function YouTubeIcon({ className }: { className?: string }) {
  const icon = simpleIcons.siYoutube
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d={icon.path} />
    </svg>
  )
}

// Instagram icon from simple-icons
function InstagramIcon({ className }: { className?: string }) {
  const icon = simpleIcons.siInstagram
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d={icon.path} />
    </svg>
  )
}

// Facebook icon from simple-icons
function FacebookIcon({ className }: { className?: string }) {
  const icon = simpleIcons.siFacebook
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d={icon.path} />
    </svg>
  )
}

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-sunroad-cream/50 mt-auto">
      {/* Building illustration separator */}
      <div className="w-full bg-sunroad-cream/50 relative">
        <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6">
          <div className="relative w-full" style={{ aspectRatio: '1600/400', minHeight: '250px', maxHeight: '450px' }}>
            <Image
              src="/sunroad-building-art.webp"
              alt="Sun Road Building Art"
              fill
             unoptimized={true}
              // sizes="(max-width: 640px) 100vw, (max-width: 1024px) 95vw, 1600px"
              className="object-contain object-bottom"
              style={{ objectPosition: 'center bottom' }}
            />
            
            {/* Horizontal separator lines at bottom - left side (sword cut style) */}
            <div className="absolute left-0 bottom-8 sm:bottom-12 md:bottom-16 z-10">
              <div 
                className="h-0.5 w-24 sm:w-32 md:w-40 lg:w-48"
                style={{
                  background: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                }}
              />
            </div>
            
            {/* Horizontal separator lines at bottom - right side (sword cut style) */}
            <div className="absolute right-0 bottom-8 sm:bottom-12 md:bottom-16 z-10">
              <div 
                className="h-0.5 w-24 sm:w-32 md:w-40 lg:w-48"
                style={{
                  background: 'linear-gradient(to left, transparent 0%, black 15%, black 85%, transparent 100%)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Desktop: 4-column layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-8 mb-8">
          {/* Left: Branding */}
          <div className="flex flex-col space-y-3">
            <Link href="/" className="flex items-center">
              <Image 
                src="/Sun-Road-Logo-svg.svg" 
                alt="Sun Road Logo" 
                width={954} 
                height={522}
                className="h-10 w-auto"
                unoptimized
              />
            </Link>
            <p className="text-sm text-sunroad-brown-600 font-medium">
              Join a community of local creatives
            </p>
          </div>

          {/* Middle: Navigation Links */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-display font-semibold text-sunroad-brown-900 uppercase tracking-wide mb-2">
              Navigation
            </h3>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/search"
                className="text-sunroad-brown-700 hover:text-sunroad-amber-600 transition-colors text-sm font-medium"
              >
                Search
              </Link>
              <Link
                href="/artists"
                className="text-sunroad-brown-700 hover:text-sunroad-amber-600 transition-colors text-sm font-medium"
              >
                Artists
              </Link>
              <Link
                href="/blog"
                className="text-sunroad-brown-700 hover:text-sunroad-amber-600 transition-colors text-sm font-medium"
              >
                Blog
              </Link>
              <Link
                href="/pricing"
                className="text-sunroad-brown-700 hover:text-sunroad-amber-600 transition-colors text-sm font-medium"
              >
                Pricing
              </Link>
            </nav>
          </div>

          {/* Right: Social Links */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-display font-semibold text-sunroad-brown-900 uppercase tracking-wide mb-2">
              Connect
            </h3>
            <div className="flex space-x-4">
              <a
                href="https://www.youtube.com/@sunroadco"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 text-sunroad-brown-600 hover:bg-sunroad-amber-100/80 hover:border-sunroad-amber-300/80 hover:text-sunroad-brown-700 transition-all duration-200"
              >
                <YouTubeIcon className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/sunroadco/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 text-sunroad-brown-600 hover:bg-sunroad-amber-100/80 hover:border-sunroad-amber-300/80 hover:text-sunroad-brown-700 transition-all duration-200"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/sunroadapp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 text-sunroad-brown-600 hover:bg-sunroad-amber-100/80 hover:border-sunroad-amber-300/80 hover:text-sunroad-brown-700 transition-all duration-200"
              >
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/sunroadco/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 text-sunroad-brown-600 hover:bg-sunroad-amber-100/80 hover:border-sunroad-amber-300/80 hover:text-sunroad-brown-700 transition-all duration-200"
              >
                <LinkedInIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-display font-semibold text-sunroad-brown-900 uppercase tracking-wide mb-2">
              Legal
            </h3>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/privacy"
                className="text-sunroad-brown-700 hover:text-sunroad-amber-600 transition-colors text-sm font-medium"
              >
                Privacy Policy
              </Link>
            </nav>
          </div>
        </div>

        {/* Mobile: Stacked layout */}
        <div className="md:hidden space-y-8">
          {/* Branding */}
          <div className="flex flex-col items-center space-y-3 text-center">
            <Link href="/" className="flex items-center">
              <Image 
                src="/Sun-Road-Logo-svg.svg" 
                alt="Sun Road Logo" 
                width={954} 
                height={522}
                className="h-10 w-auto"
                unoptimized
              />
            </Link>
            <p className="text-sm text-sunroad-brown-600 font-medium">
              Join a community of local creatives
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col items-center space-y-3">
            <h3 className="text-sm font-display font-semibold text-sunroad-brown-900 uppercase tracking-wide">
              Navigation
            </h3>
            <nav className="flex flex-col items-center space-y-2">
              <Link
                href="/search"
                className="text-sunroad-brown-700 hover:text-sunroad-amber-600 transition-colors text-sm font-medium"
              >
                Search
              </Link>
              <Link
                href="/artists"
                className="text-sunroad-brown-700 hover:text-sunroad-amber-600 transition-colors text-sm font-medium"
              >
                Artists
              </Link>
              <Link
                href="/blog"
                className="text-sunroad-brown-700 hover:text-sunroad-amber-600 transition-colors text-sm font-medium"
              >
                Blog
              </Link>
              <Link
                href="/pricing"
                className="text-sunroad-brown-700 hover:text-sunroad-amber-600 transition-colors text-sm font-medium"
              >
                Pricing
              </Link>
            </nav>
          </div>

          {/* Social Links */}
          <div className="flex flex-col items-center space-y-3">
            <h3 className="text-sm font-display font-semibold text-sunroad-brown-900 uppercase tracking-wide">
              Connect
            </h3>
            <div className="flex space-x-4">
              <a
                href="https://www.youtube.com/@sunroadco"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 text-sunroad-brown-600 hover:bg-sunroad-amber-100/80 hover:border-sunroad-amber-300/80 hover:text-sunroad-brown-700 transition-all duration-200"
              >
                <YouTubeIcon className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/sunroadco/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 text-sunroad-brown-600 hover:bg-sunroad-amber-100/80 hover:border-sunroad-amber-300/80 hover:text-sunroad-brown-700 transition-all duration-200"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/sunroadapp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 text-sunroad-brown-600 hover:bg-sunroad-amber-100/80 hover:border-sunroad-amber-300/80 hover:text-sunroad-brown-700 transition-all duration-200"
              >
                <FacebookIcon className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/sunroadco/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-sunroad-amber-50/60 border border-sunroad-amber-200/60 text-sunroad-brown-600 hover:bg-sunroad-amber-100/80 hover:border-sunroad-amber-300/80 hover:text-sunroad-brown-700 transition-all duration-200"
              >
                <LinkedInIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col items-center space-y-3">
            <h3 className="text-sm font-display font-semibold text-sunroad-brown-900 uppercase tracking-wide">
              Legal
            </h3>
            <nav className="flex flex-col items-center space-y-2">
              <Link
                href="/privacy"
                className="text-sunroad-brown-700 hover:text-sunroad-amber-600 transition-colors text-sm font-medium"
              >
                Privacy Policy
              </Link>
            </nav>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-sunroad-brown-200 pt-6 mt-8">
          <p className="text-center text-xs text-sunroad-brown-500">
            © {currentYear} Sun Road Co.
          </p>
        </div>
      </div>
    </footer>
  )
}
