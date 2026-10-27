"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

type MediaAsset = {
  id: string;
  public_url: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  alt_text: string;
  created_at: string;
};

export default function MediaLibrary() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const { data, error: loadError } = await createSupabaseBrowserClient()
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false });
    if (loadError) {
      setError("Media belum dapat dimuat. Pastikan database sudah terhubung.");
    } else {
      setAssets((data ?? []) as MediaAsset[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    createSupabaseBrowserClient()
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) setError("Media belum dapat dimuat. Pastikan database sudah terhubung.");
        else setAssets((data ?? []) as MediaAsset[]);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setUploading(true);
    setError("");
    setNotice("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { ok?: boolean; publicUrl?: string; error?: string };
      if (!response.ok || !data.publicUrl) {
        throw new Error(data.error || "Upload gagal.");
      }
      setNotice("Gambar berhasil diunggah dan siap digunakan.");
      await load();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload gagal. Coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setNotice("URL media berhasil disalin ke clipboard.");
    setTimeout(() => setNotice(""), 3000);
  };

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">ASET WEBSITE</span>
          <h1>Media Library</h1>
          <p>Unggah dan kelola gambar untuk berita, prestasi, banner hero, dan konten lainnya.</p>
        </div>
        <label className={`admin-primary-button admin-heading-action ${uploading ? "is-disabled" : ""}`}>
          {uploading ? "Mengunggah…" : "Unggah Gambar ＋"}
          <input
            hidden
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            disabled={uploading}
            onChange={(event) => void upload(event)}
          />
        </label>
      </div>

      <div className="admin-media-guidance">
        Format: JPG, PNG, WebP, AVIF, atau GIF · Maksimal 10 MB per file.
      </div>

      {error && <p className="admin-form-error" role="alert">{error}</p>}
      {notice && <p className="admin-success" role="status">{notice}</p>}

      {loading ? (
        <div className="admin-panel-card admin-empty-state">Memuat media…</div>
      ) : assets.length ? (
        <div className="admin-media-grid">
          {assets.map((asset) => (
            <article className="admin-panel-card admin-media-card" key={asset.id}>
              <div
                className="admin-media-preview"
                style={{ backgroundImage: `url("${asset.public_url}")` }}
              />
              <div className="admin-media-copy">
                <strong title={asset.file_name}>{asset.file_name}</strong>
                <small>
                  {(asset.size_bytes / 1024).toFixed(0)} KB ·{" "}
                  {new Date(asset.created_at).toLocaleDateString("id-ID")}
                </small>
              </div>
              <button
                className="admin-secondary-button"
                type="button"
                onClick={() => void copyUrl(asset.public_url)}
              >
                Salin URL
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-panel-card admin-empty-state">
          <strong>Belum ada media tersimpan.</strong>
          <span>Klik tombol "Unggah Gambar ＋" di atas untuk menambahkan gambar pertama Anda.</span>
        </div>
      )}
    </>
  );
}
