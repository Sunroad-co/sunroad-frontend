'use client'

import Image from "next/image"
import { ReactNode } from "react"

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  containerClassName?: string
}

export default function AuthLayout({ children, title, subtitle, containerClassName }: AuthLayoutProps) {
  return (
    <div 
      className="bg-gradient-to-tl from-sunroad-cream-50/20 via-amber-50/30 to-orange-50/20 relative min-h-dvh overflow-hidden"
    >
      {/* Subtle Background Artwork */}
      <div className="absolute left-30 inset-0 opacity-5">
        {/* Static artwork - unoptimized to avoid Vercel Image Optimization quota */}
        <Image
          src="/artwork_sunroad_auth.webp"
          alt="Sun Road Artwork"
          fill
          className="object-contain"
          priority
          unoptimized
        />
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-50/10 to-orange-50/5"></div>

      {/* Main Content - Split Layout */}
      <div className="relative z-10 min-h-dvh flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side - Artwork & Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="w-full flex flex-col justify-center items-center p-8 space-y-6 overflow-y-auto">
            {/* Artwork Section with Tagline Inside */}
            <div className="relative w-full max-w-md">
              <div className="relative bg-white/20 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
                {/* Static artwork - unoptimized to avoid Vercel Image Optimization quota */}
                <Image
                  src="/artwork_sunroad_auth.webp"
                  alt="Connecting you to local creatives"
                  width={600}
                  height={608}
                  className="w-full h-auto object-contain mb-4"
                  priority
                  unoptimized
                />
                {/* Tagline inside the card */}
                <p className="font-display text-lg text-sunroad-brown-700 text-center">
                  Connecting you to local creatives
                </p>
              </div>
              
            </div>

            {/* Social Proof Logos */}
            <div className="w-full max-w-sm">
              <p className="text-center text-sm text-sunroad-brown-600 mb-4 font-body">
                Trusted by leading institutions
              </p>
              <div className="flex justify-center items-center space-x-6 opacity-60">
                <Image src="/Logos_bob_dylan.webp" alt="Bob Dylan Center" width={60} height={40} className="h-8 w-auto filter grayscale" unoptimized />
                <Image src="/logos_cains.webp" alt="Cain's Ballroom" width={60} height={40} className="h-8 w-auto filter grayscale" unoptimized />
                <Image src="/logos_circle_cinema.webp" alt="Circle Cinema" width={60} height={40} className="h-8 w-auto filter grayscale" unoptimized />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-start lg:items-center justify-center lg:justify-start lg:pl-12 xl:pl-16 p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6 md:pt-6 overflow-y-auto lg:overflow-visible">
          <div className={containerClassName || "w-full max-w-md py-2 lg:py-4"}>
            {/* Optional title and subtitle - hidden on mobile, shown on desktop */}
            {title && (
              <div className="hidden lg:block text-center mb-8">
                <h1 className="font-display font-bold text-3xl text-sunroad-brown-800 mb-2">{title}</h1>
                {subtitle && <p className="font-body text-sunroad-brown-600">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
