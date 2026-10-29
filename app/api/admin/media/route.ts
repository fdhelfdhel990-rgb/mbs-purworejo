import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { describeR2Error, getR2Config } from "../../../../lib/r2/config";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
]);
const maxFileSize = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesi admin tidak ditemukan. Silakan login kembali." }, { status: 401 });
  const { data: profile } = await supabase.from("admin_profiles").select("active").eq("id", user.id).maybeSingle();
  if (!profile?.active) return NextResponse.json({ error: "Akses admin media tidak diizinkan." }, { status: 403 });

  const contentTypeHeader = request.headers.get("content-type") || "";

  // 1. Direct File Upload via FormData
  if (contentTypeHeader.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "File gambar tidak ditemukan dalam formulir." }, { status: 400 });
      }

      const fileType = file.type || "image/jpeg";
      if (!allowedTypes.has(fileType)) {
        return NextResponse.json({ error: "Format tidak didukung. Gunakan file JPG, PNG, WebP, AVIF, atau GIF." }, { status: 400 });
      }

      if (file.size > maxFileSize) {
        return NextResponse.json({ error: "Ukuran gambar terlalu besar. Maksimal 10 MB." }, { status: 400 });
      }

      const ext = allowedTypes.get(fileType)!;
      const cleanName = (file.name || "gambar")
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "gambar";
      const uniqueId = randomUUID().slice(0, 8);
      const safeKey = `mbs/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${uniqueId}-${cleanName.replace(/\.[^.]+$/, "")}.${ext}`;

      const { config: r2, missing } = getR2Config();
      if (!r2) {
        return NextResponse.json({ error: `Pengaturan Cloudflare R2 belum lengkap/valid: ${missing.join(", ")}.` }, { status: 503 });
      }

      try {
        await r2.client.send(
          new PutObjectCommand({
            Bucket: r2.bucket,
            Key: safeKey,
            Body: Buffer.from(await file.arrayBuffer()),
            ContentType: fileType,
            CacheControl: "public, max-age=31536000, immutable",
          })
        );
      } catch (r2Error) {
        console.error("R2 upload error:", r2Error);
        return NextResponse.json({ error: describeR2Error(r2Error) }, { status: 502 });
      }
      const publicUrl = `${r2.publicBaseUrl}/${safeKey}`;

      // Save metadata to media_assets in Supabase
      {
        const { error: dbError } = await supabase.from("media_assets").insert({
          object_key: safeKey,
          public_url: publicUrl,
          file_name: file.name,
          content_type: fileType,
          size_bytes: file.size,
          created_by: user.id,
        });
        if (dbError) console.warn("Failed saving media metadata to DB:", dbError.message);
      }

      return NextResponse.json({
        ok: true,
        publicUrl,
        fileName: file.name,
        key: safeKey,
      });
    } catch (uploadError) {
      return NextResponse.json({
        error: uploadError instanceof Error ? uploadError.message : "Terjadi kesalahan saat memproses gambar.",
      }, { status: 500 });
    }
  }

  // 2. Legacy JSON Presigned URL Request (if needed)
  const { config: r2, missing } = getR2Config();
  if (!r2) {
    return NextResponse.json({ error: `Pengaturan Cloudflare R2 belum lengkap/valid: ${missing.join(", ")}.` }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { fileName?: string; contentType?: string; size?: number } | null;
  if (!body?.contentType || !allowedTypes.has(body.contentType)) {
    return NextResponse.json({ error: "Gunakan gambar JPG, PNG, WebP, AVIF, atau GIF." }, { status: 400 });
  }
  if (!body.size || body.size < 1 || body.size > maxFileSize) {
    return NextResponse.json({ error: "Ukuran gambar maksimal 10 MB." }, { status: 400 });
  }

  const ext = allowedTypes.get(body.contentType)!;
  const cleanName = (body.fileName || "gambar").normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "gambar";
  const key = `mbs/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${cleanName.replace(/\.[^.]+$/, "")}.${ext}`;
  try {
    const command = new PutObjectCommand({ Bucket: r2.bucket, Key: key, ContentType: body.contentType, ContentLength: body.size });
    const uploadUrl = await getSignedUrl(r2.client, command, { expiresIn: 300 });
    return NextResponse.json({ uploadUrl, key, publicUrl: `${r2.publicBaseUrl}/${key}`, expiresIn: 300 });
  } catch {
    return NextResponse.json({ error: "Cloudflare R2 belum dapat menyiapkan upload. Periksa akun dan izin token." }, { status: 502 });
  }
}
