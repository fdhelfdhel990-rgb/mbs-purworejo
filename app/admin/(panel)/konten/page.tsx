"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../../../lib/supabase/browser";

type HomepageContent = { arabic: string; heroKicker: string; heroTitle: string; heroImage: string; profileDescription: string; profileVideoUrl: string; valuesTitle: string; valuesDescription: string; valuesImage: string };
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error: loadError } = await createSupabaseBrowserClient().from("site_settings").select("data").eq("key", "homepage").maybeSingle();
      if (!active) return;
      if (data?.data && typeof data.data === "object") setContent({ ...initialContent, ...(data.data as Partial<HomepageContent>) });
      if (loadError) setError("Konten belum termuat. Pastikan migrasi database sudah dijalankan.");
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true); setMessage(""); setError("");
    const client = createSupabaseBrowserClient();
    const { data: { user } } = await client.auth.getUser();
    const { error: saveError } = await client.from("site_settings").upsert({ key: "homepage", data: content, public_visible: true, updated_by: user?.id, updated_at: new Date().toISOString() });
    setSaving(false);
    if (saveError) setError("Konten belum tersimpan. Periksa akses admin dan koneksi database.");
    else {
      const refreshResponse = await fetch("/api/admin/revalidate", { method: "POST" });
      setMessage(refreshResponse.ok ? "Perubahan beranda berhasil disimpan." : "Konten tersimpan. Halaman publik belum dapat diperbarui otomatis.");
    }
  };

  const field = (key: keyof HomepageContent, label: string, multiline = false, hint?: string) => <label className={multiline ? "is-wide" : ""} key={key}>{label}{multiline ? <textarea rows={4} value={content[key]} onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))} /> : <input value={content[key]} onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))} />}{hint && <small>{hint}</small>}</label>;

  return <><div className="admin-page-heading"><div><span className="admin-eyebrow">KONTEN WEBSITE</span><h1>Beranda</h1><p>Perbarui pengenalan utama dan informasi yang tampil di halaman depan.</p></div></div>
    <form className="admin-panel-card admin-settings-form" onSubmit={save}><div className="admin-card-heading"><div><h2>Bagian hero</h2><p>Teks dan foto utama yang menyambut pengunjung.</p></div></div><div className="admin-content-form">{field("arabic", "Tulisan Arab")}{field("heroKicker", "Label utama")}{field("heroTitle", "Judul hero")}{field("heroImage", "URL gambar hero", false, "Pilih gambar di Media lalu salin URL-nya. Gambar lokal seperti /images/card.jpeg juga didukung.")}</div>
      <div className="admin-card-heading admin-settings-heading"><div><h2>Profil singkat</h2><p>Deskripsi dan video yang tampil pada bagian profil.</p></div></div><div className="admin-content-form">{field("profileDescription", "Deskripsi profil", true)}{field("profileVideoUrl", "Tautan YouTube", false, "Gunakan URL video YouTube yang dapat di-embed.")}</div>
      <div className="admin-card-heading admin-settings-heading"><div><h2>Nilai pendidikan</h2><p>Pesan dan gambar pada banner hijau di halaman utama.</p></div></div><div className="admin-content-form">{field("valuesTitle", "Judul banner", true)}{field("valuesDescription", "Deskripsi banner", true)}{field("valuesImage", "URL gambar banner", false, "Pilih gambar di Media lalu salin URL-nya.")}</div>
      {error && <p className="admin-form-error" role="alert">{error}</p>}{message && <p className="admin-success" role="status">{message}</p>}<div className="admin-form-actions"><button className="admin-primary-button" type="submit" disabled={saving || loading}>{saving ? "Menyimpan…" : loading ? "Memuat…" : "Simpan perubahan"}</button><a className="admin-secondary-button" href="/" target="_blank">Lihat beranda ↗</a></div>
    </form>
  </>;
}
