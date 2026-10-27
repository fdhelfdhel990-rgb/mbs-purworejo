"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

type MediaAsset = { id: string; public_url: string; file_name: string; content_type: string; size_bytes: number; alt_text: string; created_at: string };

export default function MediaLibrary() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    const { data, error: loadError } = await createSupabaseBrowserClient().from("media_assets").select("*").order("created_at", { ascending: false });
    if (loadError) setError("Media belum dapat dimuat. Pastikan database dan Cloudflare R2 sudah dikonfigurasi.");
    else setAssets((data ?? []) as MediaAsset[]);
    setLoading(false);
  }, []);
  useEffect(() => {
    let active = true;
    createSupabaseBrowserClient().from("media_assets").select("*").order("created_at", { ascending: false }).then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) setError("Media belum dapat dimuat. Pastikan database dan Cloudflare R2 sudah dikonfigurasi.");
      else setAssets((data ?? []) as MediaAsset[]);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setUploading(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }) });
      const signed = await response.json() as { uploadUrl?: string; key?: string; publicUrl?: string; error?: string };
      if (!response.ok || !signed.uploadUrl || !signed.key || !signed.publicUrl) throw new Error(signed.error || "Tautan upload tidak tersedia.");
      const uploadResponse = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!uploadResponse.ok) throw new Error("Upload ke Cloudflare R2 gagal. Periksa pengaturan CORS bucket.");
      const client = createSupabaseBrowserClient();
      const { data: { user } } = await client.auth.getUser();
      const { error: saveError } = await client.from("media_assets").insert({ object_key: signed.key, public_url: signed.publicUrl, file_name: file.name, content_type: file.type, size_bytes: file.size, created_by: user?.id });
      if (saveError) throw new Error("Gambar terunggah, tetapi metadata gagal disimpan. Periksa koneksi database.");
      setNotice("Gambar berhasil diunggah dan siap digunakan.");
      await load();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload gagal. Coba lagi.");
    } finally { setUploading(false); }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setNotice("URL media disalin.");
  };

  return <><div className="admin-page-heading"><div><span className="admin-eyebrow">ASET WEBSITE</span><h1>Media library</h1><p>Simpan gambar yang akan digunakan pada berita, prestasi, dan konten halaman.</p></div><label className={`admin-primary-button admin-heading-action ${uploading ? "is-disabled" : ""}`}>{uploading ? "Mengunggah…" : "Unggah gambar ＋"}<input hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => void upload(event)} /></label></div>
    <div className="admin-media-guidance">JPG, PNG, WebP, atau AVIF · Maksimal 8 MB per file. File tersimpan di Cloudflare R2.</div>
    {error && <p className="admin-form-error" role="alert">{error}</p>}{notice && <p className="admin-success" role="status">{notice}</p>}
    {loading ? <div className="admin-panel-card admin-empty-state">Memuat media…</div> : assets.length ? <div className="admin-media-grid">{assets.map((asset) => <article className="admin-panel-card admin-media-card" key={asset.id}><div className="admin-media-preview" style={{ backgroundImage: `url("${asset.public_url}")` }} /><div className="admin-media-copy"><strong title={asset.file_name}>{asset.file_name}</strong><small>{(asset.size_bytes / 1024).toFixed(0)} KB · {new Date(asset.created_at).toLocaleDateString("id-ID")}</small></div><button className="admin-secondary-button" type="button" onClick={() => void copyUrl(asset.public_url)}>Salin URL</button></article>)}</div> : <div className="admin-panel-card admin-empty-state"><strong>Belum ada media tersimpan.</strong><span>Unggah gambar untuk mulai menambah koleksi media.</span></div>}
  </>;
}
