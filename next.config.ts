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
  // The admin image routes reference public/images on disk, which makes
  // Vercel's file tracing bundle the entire 335 MB library into each
  // function and blow the 250 MB limit. Static files are served from the
  // CDN regardless, so exclude them everywhere and re-include only the
  // small site folders the admin picker actually lists.
  outputFileTracingExcludes: {
    "*": ["./public/images/**"],
  },
  outputFileTracingIncludes: {
    "/api/admin/images": [
      "./public/images/builder-heroes/**",
      "./public/images/collections/**",
      "./public/images/products/**",
      "./public/images/uploads/**",
      "./data-store/options/*.json",
    ],
  },
  experimental: {
    // Zero stale time for dynamic routes so admin saves are immediately visible
    // when navigating to the consumer page via the Next.js router.
    staleTimes: {
      dynamic: 0,
    },
  },
  // Saving a review writes JSON under data-store/. If webpack watches that,
  // every Save rebuilds the page, the tab looks frozen, and overlapping
  // reads can parse a half-written file.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/data-store/**",
          "**/public/images/**",
          "**/.craft-pipeline/**",
          "**/factory-screenshots/**",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
