export function safeImageUrl(src?: unknown, fallback = "/images/card.jpeg"): string {
  if (typeof src !== "string") return fallback;
  const trimmed = src.trim();
  if (!trimmed) return fallback;

  // Local static paths (e.g. /images/card.jpeg or /uploads/xyz.jpg)
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // Absolute http/https URLs
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
    return fallback;
  } catch {
    return fallback;
  }
}

