import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow Google profile images from OAuth authentication
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
        pathname: '/**'
      }
    ],
  },
};

export default nextConfig;
