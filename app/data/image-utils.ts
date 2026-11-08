export function safeImageUrl(src?: unknown, fallback = "/images/card.jpeg"): string {
  if (typeof src !== "string") return fallback;
  const trimmed = src.trim();
  if (!trimmed) return fallback;

  // Local static paths or local api endpoints
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // Absolute http/https URLs
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      const host = url.hostname.toLowerCase();
      // If image is hosted on Cloudflare R2, route via media proxy to prevent ISP connection reset in Indonesia
      if (host.endsWith(".r2.dev") || host.includes("r2.cloudflarestorage.com")) {
        return `/api/media-proxy?url=${encodeURIComponent(trimmed)}`;
      }
      return url.toString();
    }
    return fallback;
  } catch {
    return fallback;
  }
}

