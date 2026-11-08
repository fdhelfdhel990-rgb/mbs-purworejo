"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../../../lib/supabase/browser";
import ImageUploadDropzone from "../../components/image-upload-dropzone";

type HomepageContent = {
  arabic: string;
  heroKicker: string;
  heroTitle: string;
  heroImage: string;
  heroImages?: string[];
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
  heroImages: [
    "/images/card.jpeg",
    "/images/card.jpeg",
    "/images/card.jpeg",
  ],
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
      const { data, error: loadError } = await createSupabaseBrowserClient()
        .from("site_settings")
        .select("data")
        .eq("key", "homepage")
        .maybeSingle();

      if (!active) return;
      if (data?.data && typeof data.data === "object") {
        const loaded = data.data as Partial<HomepageContent>;
        const baseImg = loaded.heroImage || initialContent.heroImage;
        let loadedHeroImages = Array.isArray(loaded.heroImages) && loaded.heroImages.length > 0
          ? loaded.heroImages.filter(Boolean)
          : [baseImg, baseImg, baseImg];

        while (loadedHeroImages.length < 3) {
          loadedHeroImages.push(loadedHeroImages[0] || baseImg);
        }
        loadedHeroImages = loadedHeroImages.slice(0, 3);

        setContent({
          ...initialContent,
          ...loaded,
          heroImage: loadedHeroImages[0] || baseImg,
          heroImages: loadedHeroImages,
        });
      }
      if (loadError) setError("Konten belum termuat. Pastikan migrasi database sudah dijalankan.");
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const client = createSupabaseBrowserClient();
      const { data: { user } } = await client.auth.getUser();

      // Pertahankan data pendaftaran yang tersimpan di homepage
      const { data: existingRow } = await client
        .from("site_settings")
        .select("data")
        .eq("key", "homepage")
        .maybeSingle();

      const existingData = existingRow?.data && typeof existingRow.data === "object" ? existingRow.data : {};

      const cleanedHeroImages = (content.heroImages || [])
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean)
        .slice(0, 3);

      const finalHeroImages = cleanedHeroImages.length > 0
        ? cleanedHeroImages
        : [content.heroImage || "/images/card.jpeg"];

      const mergedData = {
        ...existingData,
        ...content,
        heroImages: finalHeroImages,
        heroImage: finalHeroImages[0] || "/images/card.jpeg",
      };

      const { error: saveError } = await client
        .from("site_settings")
        .upsert({
          key: "homepage",
          data: mergedData,
          public_visible: true,
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        });

      if (saveError) {
        throw new Error(saveError.message);
      }

      await fetch("/api/admin/revalidate", { method: "POST" });
      setMessage("Perubahan konten beranda berhasil disimpan.");
    } catch (err) {
      setError(err instanceof Error ? `Gagal menyimpan: ${err.message}` : "Konten belum tersimpan. Periksa akses admin.");
    } finally {
      setSaving(false);
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

  const field = (
    key: keyof HomepageContent,
    label: string,
    multiline = false,
    hint?: string
  ) => {
    const val = typeof content[key] === "string" ? content[key] : "";
    return (
      <label className={multiline ? "is-wide" : ""} key={key}>
        {label}
        {multiline ? (
          <textarea
            rows={4}
            value={val}
            onChange={(e) => setContent((curr) => ({ ...curr, [key]: e.target.value }))}
          />
        ) : (
          <input
            value={val}
            onChange={(e) => setContent((curr) => ({ ...curr, [key]: e.target.value }))}
          />
        )}
        {hint && <small>{hint}</small>}
      </label>
    );
  };

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">KONTEN WEBSITE</span>
          <h1>Beranda</h1>
          <p>Perbarui teks pengenalan utama, gambar hero, video profil, dan banner nilai pendidikan di halaman depan.</p>
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
        </div>

        <div className="admin-card-heading admin-settings-heading">
          <div>
            <h2>Foto Banner Carousel (Maksimal 3 Gambar)</h2>
            <p>
              Banner beranda berganti otomatis secara berkala. Anda dapat mengatur hingga 3 gambar slide latar.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", padding: "0 24px 20px" }}>
          {[0, 1, 2].map((idx) => {
            const currentImg = content.heroImages?.[idx] || (idx === 0 ? content.heroImage : "");
            return (
              <div
                key={idx}
                style={{
                  background: "#fbfcfb",
                  border: "1px solid #dce4dc",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "13px", color: "#1b4d24" }}>
                    Banner {idx + 1} {idx === 0 ? "(Slide Utama)" : `(Slide ${idx + 1})`}
                  </strong>
                  <span
                    style={{
                      fontSize: "11px",
                      color: idx === 0 ? "#1b4d24" : "#687a6b",
                      background: idx === 0 ? "#e7f3e5" : "#eef3ed",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {idx === 0 ? "Utama" : `Slide ${idx + 1}`}
                  </span>
                </div>
                <ImageUploadDropzone
                  value={currentImg}
                  onChange={(url) => {
                    setContent((curr) => {
                      const nextImages = [...(curr.heroImages || ["", "", ""])];
                      nextImages[idx] = url;
                      return {
                        ...curr,
                        heroImages: nextImages,
                        heroImage: idx === 0 ? url : (nextImages[0] || curr.heroImage),
                      };
                    });
                  }}
                  label={`Foto Banner ${idx + 1}`}
                  hint={
                    idx === 0
                      ? "Gambar utama yang pertama kali tampil saat website dibuka."
                      : `Gambar carousel slide ke-${idx + 1}. Unggah foto baru atau gunakan gambar yang ada.`
                  }
                />
              </div>
            );
          })}
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

        {/* Akses Cepat Pendaftaran PSB */}
        <div className="admin-card-heading admin-settings-heading">
          <div>
            <h2>Penerimaan Santri Baru (PSB)</h2>
            <p>Pengaturan formulir dan jalur pendaftaran telah dipisahkan ke menu khusus.</p>
          </div>
        </div>
        <div style={{ padding: "0 24px 20px" }}>
          <div style={{ padding: "16px 18px", background: "#f2f7f2", border: "1px solid #d2e4d3", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <strong style={{ fontSize: "14px", color: "#1b4d24", display: "block", marginBottom: "4px" }}>
                Pengaturan Pendaftaran PSB
              </strong>
              <span style={{ fontSize: "12px", color: "#4f6552" }}>
                Kelola tautan Google Form utama, tahun ajaran, dan tambah/ubah jalur pendaftaran (Prestasi, Reguler, Tahfidz, dsb) di menu khusus.
              </span>
            </div>
            <Link href="/admin/pendaftaran" className="admin-primary-button" style={{ textDecoration: "none", fontSize: "12px", padding: "8px 16px" }}>
              Buka Pengaturan Pendaftaran 📝
            </Link>
          </div>
        </div>

        {error && <p className="admin-form-error" role="alert">{error}</p>}
        {message && <p className="admin-success" role="status">{message}</p>}

        <div className="admin-form-actions">
          <button className="admin-primary-button" type="submit" disabled={saving || loading}>
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
