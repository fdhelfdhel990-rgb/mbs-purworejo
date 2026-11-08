import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.redirect(new URL("/images/card.jpeg", request.url), 307);
  }

  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.redirect(new URL("/images/card.jpeg", request.url), 307);
    }

    // Allow R2, Supabase storage, or Cloudflare storage
    const host = parsed.hostname.toLowerCase();
    const isAllowed =
      host.endsWith(".r2.dev") ||
      host.includes("r2.cloudflarestorage.com") ||
      host.includes("supabase.co");

    if (!isAllowed) {
      return NextResponse.redirect(new URL("/images/card.jpeg", request.url), 307);
    }

    // Abort timeout after 8 seconds so requests don't hang
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const upstream = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "MBS-Purworejo-Proxy/1.0",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });

      clearTimeout(timeoutId);

      if (!upstream.ok) {
        return NextResponse.redirect(new URL("/images/card.jpeg", request.url), 307);
      }

      const contentType = upstream.headers.get("content-type") || "image/jpeg";
      const buffer = await upstream.arrayBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      clearTimeout(timeoutId);
      return NextResponse.redirect(new URL("/images/card.jpeg", request.url), 307);
    }
  } catch {
    return NextResponse.redirect(new URL("/images/card.jpeg", request.url), 307);
  }
}
