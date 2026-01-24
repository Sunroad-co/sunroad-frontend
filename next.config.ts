import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: "/artists/:handle",
        destination: "/@:handle",
        permanent: true,
      },
      {
        source: "/artists/:handle/:path*",
        destination: "/@:handle/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/@:handle",
        destination: "/u/:handle",
      },
      {
        source: "/@:handle/:path*",
        destination: "/u/:handle/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qotblmfwurnyumgrlfep.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'sunroad.io',
        pathname: '/upload/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'epicmargin.com',
        pathname: '/upload/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.sunroad.io',
        pathname: '/upload/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
    ],
    minimumCacheTTL: 2678400, // 31 days
    deviceSizes: [640, 1200], // Mobile + desktop widths only
    imageSizes: [64, 96, 128, 256, 384], // Small set of sizes
  },
  reactStrictMode: false,
};

export default nextConfig;
