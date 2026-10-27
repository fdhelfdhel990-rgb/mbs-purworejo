"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../../../lib/supabase/browser";
import { defaultFooterSettings, type FooterSettings } from "../../../data/public-cms";

export default function AdminFooterPage() {
  const [content, setContent] = useState<FooterSettings>(defaultFooterSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error: loadError } = await createSupabaseBrowserClient()
        .from("site_settings")
        .select("data")
        .eq("key", "footer")
        .maybeSingle();
      if (!active) return;
      if (data?.data && typeof data.data === "object") {
        setContent({ ...defaultFooterSettings, ...(data.data as Partial<FooterSettings>) });
      }
      if (loadError) setError("Pengaturan footer belum termuat. Pastikan database sudah terhubung.");
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

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
        key: "footer",
        data: content,
        public_visible: true,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      });
    setSaving(false);
    if (saveError) {
      setError(`Gagal menyimpan footer (${saveError.message}).`);
    } else {
      const refreshResponse = await fetch("/api/admin/revalidate", { method: "POST" });
      setMessage(refreshResponse.ok ? "Pengaturan footer berhasil disimpan." : "Footer tersimpan. Halaman sedang disinkronkan.");
    }
  };

  const field = (key: keyof FooterSettings, label: string, multiline = false, hint?: string) => (
    <label className={multiline ? "is-wide" : ""} key={key}>
      {label}
      {multiline ? (
        <textarea rows={3} value={content[key]} onChange={(e) => setContent((curr) => ({ ...curr, [key]: e.target.value }))} />
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
          <span className="admin-eyebrow">PENGATURAN TAMPILAN</span>
          <h1>Footer Website</h1>
          <p>Kelola teks perkenalan, alamat, nomor telepon/WhatsApp, email, dan link media sosial di bagian bawah website.</p>
        </div>
      </div>

      <form className="admin-panel-card admin-settings-form" onSubmit={save}>
        <div className="admin-card-heading">
          <div>
            <h2>Tentang Pesantren di Footer</h2>
            <p>Ringkasan identitas MBS Purworejo yang tampil di kolom kiri footer.</p>
          </div>
        </div>
        <div className="admin-content-form">
          {field("aboutText", "Teks Tentang Kami", true, "Deskripsi singkat tahun berdiri dan tujuan pesantren.")}
          {field("copyright", "Teks Hak Cipta (Copyright)", false, "Contoh: © 2026 MBS Purworejo. All rights reserved.")}
        </div>

        <div className="admin-card-heading admin-settings-heading">
          <div>
            <h2>Tombol WhatsApp Floating & Kontak</h2>
            <p>Atur nomor tujuan tombol chat WhatsApp di pojok kanan bawah website dan kontak resmi pesantren.</p>
          </div>
        </div>
        <div className="admin-content-form">
          {field("whatsappUrl", "Nomor / Link Tombol WhatsApp Floating", false, "Masukkan nomor WA (misal: 081234567890 atau 6281234567890) atau link https://wa.me/...")}
          {field("phoneDisplay", "Teks Tampilan Nomor Telepon", false, "Contoh: 0812 3456 7890")}
          {field("address", "Alamat Lengkap Pesantren", false, "Alamat yang tertera pada footer.")}
          {field("email", "Email Resmi Pesantren", false, "Contoh: info@mbspurworejo.sch.id")}
        </div>

        <div className="admin-card-heading admin-settings-heading">
          <div>
            <h2>Media Sosial</h2>
            <p>Tautan akun resmi media sosial MBS Purworejo.</p>
          </div>
        </div>
        <div className="admin-content-form">
          {field("youtubeUrl", "Tautan YouTube", false, "Contoh: https://youtube.com/@mbspurworejo")}
          {field("instagramUrl", "Tautan Instagram", false, "Contoh: https://instagram.com/mbspurworejo")}
          {field("tiktokUrl", "Tautan TikTok", false, "Contoh: https://tiktok.com/@mbspurworejo")}
          {field("xUrl", "Tautan X (Twitter)", false, "Contoh: https://x.com/mbspurworejo")}
        </div>

        {error && <p className="admin-form-error" role="alert">{error}</p>}
        {message && <p className="admin-success" role="status">{message}</p>}

        <div className="admin-form-actions">
          <button className="admin-primary-button" type="submit" disabled={saving || loading}>
            {saving ? "Menyimpan…" : loading ? "Memuat…" : "Simpan Perubahan Footer"}
          </button>
          <a className="admin-secondary-button" href="/#kontak" target="_blank">
            Lihat Footer Website ↗
          </a>
        </div>
      </form>
    </>
  );
}

