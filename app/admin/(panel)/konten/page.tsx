"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "../../../../lib/supabase/browser";
import ImageUploadDropzone from "../../components/image-upload-dropzone";
import { safeImageUrl } from "../../../data/image-utils";

type HomepageContent = {
  arabic: string;
  heroKicker: string;
  heroTitle: string;
  heroImage: string;
  profileDescription: string;
  profileVideoUrl: string;
  valuesTitle: string;
  valuesDescription: string;
  valuesImage: string;
};

const initialContent: HomepageContent = {
  arabic: "معهد محمدية التربية الإسلامية الحديثة",
  heroKicker: "Pondok Pesantren Modern",
  heroTitle: "MBS Purworejo",
  heroImage: "/images/card.jpeg",
  profileDescription: "Pondok Pesantren Modern MBS Purworejo menghadirkan pendidikan Islami yang memadukan ilmu, karakter, dan kemandirian.",
  profileVideoUrl: "https://youtu.be/GrEcOhJ4900",
  valuesTitle: "Mendidik dengan Kasih Sayang, Keteladanan & Inspirasi",
  valuesDescription: "Di MBS Purworejo, pendidikan bukan sekadar transfer ilmu. Proses belajar dirancang untuk membangun karakter dan kepedulian.",
  valuesImage: "/images/santri1.jpg",
};

export default function AdminHomepageContent() {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error: loadError } = await createSupabaseBrowserClient()
        .from("site_settings")
        .select("data")
        .eq("key", "homepage")
        .maybeSingle();
      if (!active) return;
      if (data?.data && typeof data.data === "object") {
        setContent({ ...initialContent, ...(data.data as Partial<HomepageContent>) });
      }
      if (loadError) setError("Konten belum termuat. Pastikan migrasi database sudah dijalankan.");
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const handleUpload = async (key: "heroImage" | "valuesImage", file: File) => {
    setUploadingKey(key);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body: formData });
      const data = (await res.json()) as { ok?: boolean; publicUrl?: string; error?: string };
      if (!res.ok || !data.publicUrl) {
        throw new Error(data.error || "Gagal mengunggah foto.");
      }
      setContent((curr) => ({ ...curr, [key]: data.publicUrl! }));
      setMessage("Foto berhasil diunggah!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah foto.");
    } finally {
      setUploadingKey(null);
    }
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    const client = createSupabaseBrowserClient();
    const { data: { user } } = await client.auth.getUser();
    const { error: saveError } = await client
      .from("site_settings")
      .upsert({
        key: "homepage",
        data: content,
        public_visible: true,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      });
    setSaving(false);
    if (saveError) {
      setError("Konten belum tersimpan. Periksa akses admin dan koneksi database.");
    } else {
      const refreshResponse = await fetch("/api/admin/revalidate", { method: "POST" });
      setMessage(refreshResponse.ok ? "Perubahan beranda berhasil disimpan." : "Konten tersimpan. Halaman publik sedang disinkronkan.");
    }
  };

  const imageField = (key: "heroImage" | "valuesImage", label: string, hint?: string) => (
    <ImageUploadDropzone
      key={key}
      value={content[key]}
      onChange={(url) => setContent((curr) => ({ ...curr, [key]: url }))}
      label={label}
      hint={hint}
    />
  );

  const field = (key: keyof HomepageContent, label: string, multiline = false, hint?: string) => (
    <label className={multiline ? "is-wide" : ""} key={key}>
      {label}
      {multiline ? (
        <textarea rows={4} value={content[key]} onChange={(e) => setContent((curr) => ({ ...curr, [key]: e.target.value }))} />
      ) : (
        <input value={content[key]} onChange={(e) => setContent((curr) => ({ ...curr, [key]: e.target.value }))} />
      )}
      {hint && <small>{hint}</small>}
    </label>
  );

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">KONTEN WEBSITE</span>
          <h1>Beranda</h1>
          <p>Perbarui teks pengenalan utama, gambar hero, dan informasi yang tampil di halaman depan.</p>
        </div>
      </div>

      <form className="admin-panel-card admin-settings-form" onSubmit={save}>
        <div className="admin-card-heading">
          <div>
            <h2>Bagian Hero Utama</h2>
            <p>Teks dan foto latar yang pertama kali menyambut pengunjung.</p>
          </div>
        </div>
        <div className="admin-content-form">
          {field("arabic", "Tulisan Arab")}
          {field("heroKicker", "Label Utama (Kicker)")}
          {field("heroTitle", "Judul Hero")}
          {imageField("heroImage", "Foto Latar Hero", "Unggah gambar baru atau gunakan path lokal seperti /images/card.jpeg")}
        </div>

        <div className="admin-card-heading admin-settings-heading">
          <div>
            <h2>Profil Singkat & Video</h2>
            <p>Deskripsi dan video profil YouTube.</p>
          </div>
        </div>
        <div className="admin-content-form">
          {field("profileDescription", "Deskripsi profil", true)}
          {field("profileVideoUrl", "Tautan YouTube Video Profil", false, "Contoh: https://youtu.be/GrEcOhJ4900")}
        </div>

        <div className="admin-card-heading admin-settings-heading">
          <div>
            <h2>Nilai Pendidikan (Banner Hijau)</h2>
            <p>Pesan dan gambar pada banner keunggulan di halaman utama.</p>
          </div>
        </div>
        <div className="admin-content-form">
          {field("valuesTitle", "Judul Banner", true)}
          {field("valuesDescription", "Deskripsi Banner", true)}
          {imageField("valuesImage", "Foto Banner Nilai Pendidikan", "Pilih foto dari komputer Anda.")}
        </div>

        {error && <p className="admin-form-error" role="alert">{error}</p>}
        {message && <p className="admin-success" role="status">{message}</p>}

        <div className="admin-form-actions">
          <button className="admin-primary-button" type="submit" disabled={saving || loading || uploadingKey !== null}>
            {saving ? "Menyimpan…" : loading ? "Memuat…" : "Simpan Perubahan Beranda"}
          </button>
          <a className="admin-secondary-button" href="/" target="_blank">
            Lihat Beranda ↗
          </a>
        </div>
      </form>
    </>
  );
}
