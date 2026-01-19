import Link from 'next/link'
import Image from 'next/image'
import * as simpleIcons from 'simple-icons'
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

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t-2 border-sunroad-brown-200 bg-sunroad-cream/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Desktop: 3-column layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 mb-8">
          {/* Left: Branding */}
          <div className="flex flex-col space-y-3">
            <Link href="/" className="flex items-center">
              <Image 
                src="/sunroad_logo.png" 
                alt="Sun Road" 
                width={120} 
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-sunroad-brown-600 font-medium">
              Join a community of local creatives
            </p>
          </div>

          {/* Middle: Navigation Links */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-semibold text-sunroad-brown-900 uppercase tracking-wide mb-2">
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
              <span className="text-sunroad-brown-500 text-sm font-medium cursor-not-allowed">
                Pricing <span className="text-xs">(Coming soon)</span>
              </span>
            </nav>
          </div>

          {/* Right: Social Links */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-sm font-semibold text-sunroad-brown-900 uppercase tracking-wide mb-2">
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
        </div>

        {/* Mobile: Stacked layout */}
        <div className="md:hidden space-y-8">
          {/* Branding */}
          <div className="flex flex-col items-center space-y-3 text-center">
            <Link href="/" className="flex items-center">
              <Image 
                src="/sunroad_logo.png" 
                alt="Sun Road" 
                width={120} 
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-sunroad-brown-600 font-medium">
              Join a community of local creatives
            </p>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col items-center space-y-3">
            <h3 className="text-sm font-semibold text-sunroad-brown-900 uppercase tracking-wide">
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
              <span className="text-sunroad-brown-500 text-sm font-medium cursor-not-allowed">
                Pricing <span className="text-xs">(Coming soon)</span>
              </span>
            </nav>
          </div>

          {/* Social Links */}
          <div className="flex flex-col items-center space-y-3">
            <h3 className="text-sm font-semibold text-sunroad-brown-900 uppercase tracking-wide">
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
