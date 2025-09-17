import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [new URL('https://sunroad.io/upload/uploads/**'), new URL('https://epicmargin.com/upload/uploads/**')],
  },
};

export default nextConfig;
