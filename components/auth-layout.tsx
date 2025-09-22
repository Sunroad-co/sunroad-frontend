'use client'

import Image from "next/image"
import { ReactNode } from "react"

interface AuthLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div 
      className="bg-gradient-to-tl from-sunroad-cream-50/20 via-amber-50/30 to-orange-50/20 relative"
      style={{ 
        height: '100dvh', 
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Subtle Background Artwork */}
      <div className="absolute left-30 inset-0 opacity-5">
        <Image
          src="/sunroad_artwork.png"
          alt="Sun Road Artwork"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-50/10 to-orange-50/5"></div>

      {/* Main Content - Split Layout */}
      <div className="relative z-10 h-screen flex">
        {/* Left Side - Artwork & Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <div className="w-full flex flex-col justify-center items-center p-8 space-y-6">
            {/* Artwork Section with Tagline Inside */}
            <div className="relative w-full max-w-md">
              <div className="relative bg-white/20 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
                <Image
                  src="/sunroad_artwork.png"
                  alt="Connecting you to local creatives"
                  width={400}
                  height={300}
                  className="w-full h-auto object-contain mb-4"
                  priority
                />
                {/* Tagline inside the card */}
                <p className="font-artistic text-lg text-sunroad-brown-700 text-center">
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
                <Image src="/Logos_bob_dylan.png" alt="Bob Dylan Center" width={60} height={40} className="h-8 w-auto filter grayscale" />
                <Image src="/logos_cains.png" alt="Cain's Ballroom" width={60} height={40} className="h-8 w-auto filter grayscale" />
                <Image src="/logos_circle_cinema.png" alt="Circle Cinema" width={60} height={40} className="h-8 w-auto filter grayscale" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8 pt-40 md:pt-6">
          <div className="w-full max-w-md">
            {/* Optional title and subtitle */}
            {title && (
              <div className="text-center mb-8">
                <h1 className="font-bold text-3xl text-sunroad-brown-800 mb-2">{title}</h1>
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
