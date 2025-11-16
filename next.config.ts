import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
    ],
  },
  reactStrictMode: false,
};

export default nextConfig;
