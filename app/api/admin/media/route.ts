import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/avif", "avif"],
]);
const maxFileSize = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesi admin tidak ditemukan." }, { status: 401 });
  const { data: profile } = await supabase.from("admin_profiles").select("active").eq("id", user.id).maybeSingle();
  if (!profile?.active) return NextResponse.json({ error: "Akses media tidak diizinkan." }, { status: 403 });

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    return NextResponse.json({ error: "Pengaturan Cloudflare R2 belum lengkap." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { fileName?: string; contentType?: string; size?: number } | null;
  if (!body?.contentType || !allowedTypes.has(body.contentType)) return NextResponse.json({ error: "Gunakan gambar JPG, PNG, WebP, atau AVIF." }, { status: 400 });
  if (!body.size || body.size < 1 || body.size > maxFileSize) return NextResponse.json({ error: "Ukuran gambar maksimal 8 MB." }, { status: 400 });

  const ext = allowedTypes.get(body.contentType)!;
  const cleanName = (body.fileName || "gambar").normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "gambar";
  const key = `mbs/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${cleanName.replace(/\.[^.]+$/, "")}.${ext}`;
  try {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: body.contentType, ContentLength: body.size });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
    return NextResponse.json({ uploadUrl, key, publicUrl: `${publicBaseUrl}/${key}`, expiresIn: 300 });
  } catch {
    return NextResponse.json({ error: "Cloudflare R2 belum dapat menyiapkan upload. Periksa akun dan izin token." }, { status: 502 });
  }
}
