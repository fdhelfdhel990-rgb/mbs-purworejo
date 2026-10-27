import type { NextConfig } from "next";

const mediaBase = process.env.R2_PUBLIC_BASE_URL;
const mediaUrl = mediaBase ? new URL(mediaBase) : null;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: mediaUrl ? [{ protocol: mediaUrl.protocol.replace(":", "") as "https" | "http", hostname: mediaUrl.hostname, pathname: `${mediaUrl.pathname.replace(/\/$/, "")}/**` }] : [],
  },
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
