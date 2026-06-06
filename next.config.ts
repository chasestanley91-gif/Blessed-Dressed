import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        // Vercel Blob Storage — allows Next.js <Image> to use blob URLs
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    // Zero stale time for dynamic routes so admin saves are immediately visible
    // when navigating to the consumer page via the Next.js router.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
