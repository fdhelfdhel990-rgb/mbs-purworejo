"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseBrowserClient } from "../../../../lib/supabase/browser";
import { safeImageUrl } from "../../../data/image-utils";
import ImageUploadDropzone from "../../components/image-upload-dropzone";

export type SlideItem = {
  image: string;
  hasLink: boolean;
  linkUrl: string;
  openInNewTab: boolean;
};

type HomepageContent = {
  arabic: string;
  heroKicker: string;
  heroTitle: string;
  heroImage: string;
  heroImages?: string[];
  heroSlides: SlideItem[];
  profileDescription: string;
  profileVideoUrl: string;
  valuesTitle: string;
  valuesDescription: string;
  valuesImage: string;
};

const initialContent: HomepageContent = {
  arabic: "معهد محمدية للتربية الإسلامية الحديثة",
  heroKicker: "Pondok Pesantren Modern",
  heroTitle: "MBS Purworejo",
  heroImage: "/images/card.jpeg",
  heroImages: ["/images/card.jpeg"],
  heroSlides: [
    {
      image: "/images/card.jpeg",
      hasLink: false,
      linkUrl: "",
      openInNewTab: true,
    },
  ],
  profileDescription: "Pondok Pesantren Modern MBS Purworejo menghadirkan pendidikan Islami yang memadukan ilmu, karakter, dan kemandirian.",
  profileVideoUrl: "https://youtu.be/GrEcOhJ4900",
  valuesTitle: "Mendidik dengan Kasih Sayang, Keteladanan & Inspirasi",
  valuesDescription: "Di MBS Purworejo, pendidikan bukan sekadar transfer ilmu. Proses belajar dirancang untuk membangun karakter dan kepedulian.",
  valuesImage: "/images/santri1.jpg",
};

export default function AdminHomepageContent() {
  const [content, setContent] = useState<HomepageContent>(initialContent);
  const [savedSnapshot, setSavedSnapshot] = useState<HomepageContent>(initialContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [addingSlide, setAddingSlide] = useState(false);
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

        // Resolve slides
        let parsedSlides: SlideItem[] = [];
        if (Array.isArray(loaded.heroSlides) && loaded.heroSlides.length > 0) {
          parsedSlides = loaded.heroSlides
            .filter((s) => s && typeof s === "object" && typeof s.image === "string" && s.image.trim().length > 0)
            .slice(0, 3)
            .map((s) => ({
              image: s.image,
              hasLink: Boolean(s.hasLink),
              linkUrl: typeof s.linkUrl === "string" ? s.linkUrl : "",
              openInNewTab: s.openInNewTab !== false,
            }));
        } else if (Array.isArray(loaded.heroImages) && loaded.heroImages.length > 0) {
          parsedSlides = loaded.heroImages
            .filter((url) => typeof url === "string" && url.trim().length > 0)
            .slice(0, 3)
            .map((url) => ({
              image: url,
              hasLink: false,
              linkUrl: "",
              openInNewTab: true,
            }));
        }

        if (parsedSlides.length === 0) {
          parsedSlides = [{
            image: baseImg,
            hasLink: false,
            linkUrl: "",
            openInNewTab: true,
          }];
        }

        const loadedData: HomepageContent = {
          ...initialContent,
          ...loaded,
          heroSlides: parsedSlides,
          heroImage: parsedSlides[0]?.image || baseImg,
          heroImages: parsedSlides.map((s) => s.image),
        };

        setContent(loadedData);
        setSavedSnapshot(loadedData);
      }
      if (loadError) setError("Konten belum termuat. Periksa koneksi database.");
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const handleCancel = () => {
    setContent(savedSnapshot);
    setMessage("");
    setError("");
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/media", {
      method: "POST",
      body: formData,
    });
    const data = (await res.json()) as { ok?: boolean; publicUrl?: string; error?: string };
    if (!res.ok || !data.publicUrl) {
      throw new Error(data.error || "Gagal mengunggah foto.");
    }
    return data.publicUrl;
  };

  const handleReplaceSlide = async (index: number, file: File) => {
    setUploadingIndex(index);
    setError("");
    try {
      const publicUrl = await uploadFile(file);
      setContent((curr) => {
        const next = [...curr.heroSlides];
        next[index] = {
          ...next[index],
          image: publicUrl,
        };
        return {
          ...curr,
          heroSlides: next,
          heroImage: next[0]?.image || publicUrl,
          heroImages: next.map((s) => s.image),
        };
      });
      setMessage("✓ Foto slide berhasil diganti.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah foto.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleAddSlide = async (file: File) => {
    if (content.heroSlides.length >= 3) return;
    setAddingSlide(true);
    setError("");
    try {
      const publicUrl = await uploadFile(file);
      setContent((curr) => {
        const next = [
          ...curr.heroSlides,
          {
            image: publicUrl,
            hasLink: false,
            linkUrl: "",
            openInNewTab: true,
          },
        ].slice(0, 3);
        return {
          ...curr,
          heroSlides: next,
          heroImage: next[0]?.image || publicUrl,
          heroImages: next.map((s) => s.image),
        };
      });
      setMessage("✓ Slide banner baru berhasil ditambahkan.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambahkan slide.");
    } finally {
      setAddingSlide(false);
    }
  };

  const handleDeleteSlide = (index: number) => {
    if (content.heroSlides.length <= 1) return;
    setContent((curr) => {
      const next = curr.heroSlides.filter((_, i) => i !== index);
      return {
        ...curr,
        heroSlides: next,
        heroImage: next[0]?.image || "/images/card.jpeg",
        heroImages: next.map((s) => s.image),
      };
    });
  };

  const updateSlide = (index: number, patch: Partial<SlideItem>) => {
    setContent((curr) => {
      const next = [...curr.heroSlides];
      next[index] = { ...next[index], ...patch };
      return { ...curr, heroSlides: next };
    });
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const client = createSupabaseBrowserClient();
      const { data: { user } } = await client.auth.getUser();

      const { data: existingRow } = await client
        .from("site_settings")
        .select("data")
        .eq("key", "homepage")
        .maybeSingle();

      const existingData = existingRow?.data && typeof existingRow.data === "object" ? existingRow.data : {};

      const cleanSlides = content.heroSlides.filter((s) => s.image && s.image.trim().length > 0).slice(0, 3);
      const finalSlides = cleanSlides.length > 0 ? cleanSlides : initialContent.heroSlides;
      const finalImages = finalSlides.map((s) => s.image);

      const mergedData = {
        ...existingData,
        ...content,
        heroSlides: finalSlides,
        heroImages: finalImages,
        heroImage: finalImages[0] || "/images/card.jpeg",
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

      if (saveError) throw new Error(saveError.message);

      await fetch("/api/admin/revalidate", { method: "POST" });
      setSavedSnapshot({
        ...content,
        heroSlides: finalSlides,
        heroImages: finalImages,
        heroImage: finalImages[0],
      });
      setMessage("✓ Perubahan konten beranda berhasil disimpan!");
    } catch (err) {
      setError(err instanceof Error ? `Gagal menyimpan: ${err.message}` : "Gagal menyimpan konten.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">MANAJEMEN KONTEN</span>
          <h1>Konten Beranda</h1>
          <p>Kelola banner beranda, judul sambutan, video profil, dan pesan keunggulan.</p>
        </div>
      </div>

      <form onSubmit={save}>
        {/* KATEGORI 1: FOTO BANNER (CAROUSEL) */}
        <section className="admin-card-section">
          <div className="admin-card-section-header">
            <h2>1. Foto Banner (Carousel)</h2>
            <p>
              Banner utama halaman depan. <strong>Ukuran desain yang direkomendasikan: 1400 × 500 piksel (Rasio 2.8 : 1)</strong> agar tampil penuh, jernih, dan tidak terpotong di semua ukuran layar desktop maupun ponsel.
            </p>
          </div>

          <div className="admin-slides-stack">
            {content.heroSlides.map((slide, idx) => (
              <div key={idx} className="admin-slide-card">
                <div className="admin-slide-card-header">
                  <div className="admin-slide-header-left">
                    <span className="admin-slide-badge-num">{idx + 1}</span>
                    <strong>{idx === 0 ? "Banner Utama" : `Banner Slide ${idx + 1}`}</strong>
                  </div>
                  {content.heroSlides.length > 1 && (
                    <button
                      type="button"
                      className="admin-slide-btn-del"
                      onClick={() => handleDeleteSlide(idx)}
                      title="Hapus slide ini"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                <div className="admin-slide-content-row">
                  <div className="admin-slide-thumb-wrap">
                    <Image
                      src={safeImageUrl(slide.image)}
                      alt={`Slide ${idx + 1}`}
                      fill
                      sizes="220px"
                      unoptimized
                      style={{ objectFit: "cover" }}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.srcset = "";
                        target.src = "/images/card.jpeg";
                      }}
                    />
                  </div>

                  <div className="admin-slide-settings">
                    <label className={`admin-btn-outline admin-slide-upload-btn ${uploadingIndex === idx ? "is-disabled" : ""}`}>
                      {uploadingIndex === idx ? "Mengunggah…" : "Ganti Foto"}
                      <input
                        type="file"
                        hidden
                        disabled={uploadingIndex !== null}
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleReplaceSlide(idx, file);
                        }}
                      />
                    </label>

                    {/* Pengaturan Link Banner (Enable / Disable) */}
                    <div className="admin-slide-link-box">
                      <label className="admin-checkbox-label">
                        <input
                          type="checkbox"
                          checked={slide.hasLink}
                          onChange={(e) => updateSlide(idx, { hasLink: e.target.checked })}
                        />
                        <span>Aktifkan tautan (link) saat banner diklik</span>
                      </label>

                      {slide.hasLink && (
                        <div className="admin-slide-url-fields">
                          <input
                            type="text"
                            className="admin-input-field"
                            placeholder="Alamat URL tujuan (misal: https://... atau /berita)"
                            value={slide.linkUrl}
                            onChange={(e) => updateSlide(idx, { linkUrl: e.target.value })}
                          />
                          <label className="admin-checkbox-sub">
                            <input
                              type="checkbox"
                              checked={slide.openInNewTab}
                              onChange={(e) => updateSlide(idx, { openInNewTab: e.target.checked })}
                            />
                            <span>Buka di tab baru</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {content.heroSlides.length < 3 && (
              <label className={`admin-add-banner-btn ${addingSlide ? "is-disabled" : ""}`}>
                <span>{addingSlide ? "Mengunggah Slide Baru…" : `＋ Tambah Banner (${content.heroSlides.length}/3)`}</span>
                <input
                  type="file"
                  hidden
                  disabled={addingSlide || uploadingIndex !== null}
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleAddSlide(file);
                  }}
                />
              </label>
            )}
          </div>
        </section>

        {/* KATEGORI 2: TEKS SAMBUTAN BANNER */}
        <section className="admin-card-section">
          <div className="admin-card-section-header">
            <h2>2. Teks Sambutan Banner</h2>
          </div>

          <div className="admin-form-grid-2">
            <label className="admin-input-group">
              <span className="admin-label-text">Judul Besar</span>
              <input
                className="admin-input-field"
                type="text"
                placeholder="MBS Purworejo"
                value={content.heroTitle}
                onChange={(e) => setContent((curr) => ({ ...curr, heroTitle: e.target.value }))}
              />
            </label>

            <label className="admin-input-group">
              <span className="admin-label-text">Label Kicker</span>
              <input
                className="admin-input-field"
                type="text"
                placeholder="Pondok Pesantren Modern"
                value={content.heroKicker}
                onChange={(e) => setContent((curr) => ({ ...curr, heroKicker: e.target.value }))}
              />
            </label>

            <label className="admin-input-group is-fullwidth">
              <span className="admin-label-text">Teks Arab (Kaligrafi)</span>
              <input
                className="admin-input-field"
                type="text"
                dir="rtl"
                placeholder="معهد محمدية للتربية الإسلامية الحديثة"
                value={content.arabic}
                onChange={(e) => setContent((curr) => ({ ...curr, arabic: e.target.value }))}
              />
            </label>
          </div>
        </section>

        {/* KATEGORI 3: PROFIL PESANTREN & VIDEO */}
        <section className="admin-card-section">
          <div className="admin-card-section-header">
            <h2>3. Profil Singkat & Video YouTube</h2>
          </div>

          <div className="admin-form-grid-1">
            <label className="admin-input-group">
              <span className="admin-label-text">Link Video YouTube</span>
              <input
                className="admin-input-field"
                type="url"
                placeholder="https://youtu.be/..."
                value={content.profileVideoUrl}
                onChange={(e) => setContent((curr) => ({ ...curr, profileVideoUrl: e.target.value }))}
              />
            </label>

            <label className="admin-input-group">
              <span className="admin-label-text">Deskripsi Singkat Profil</span>
              <textarea
                className="admin-textarea-field"
                rows={4}
                value={content.profileDescription}
                onChange={(e) => setContent((curr) => ({ ...curr, profileDescription: e.target.value }))}
              />
            </label>
          </div>
        </section>

        {/* KATEGORI 4: NILAI PENDIDIKAN */}
        <section className="admin-card-section">
          <div className="admin-card-section-header">
            <h2>4. Nilai Pendidikan (Banner Hijau)</h2>
          </div>

          <div className="admin-form-grid-1">
            <label className="admin-input-group">
              <span className="admin-label-text">Judul Keunggulan</span>
              <input
                className="admin-input-field"
                type="text"
                value={content.valuesTitle}
                onChange={(e) => setContent((curr) => ({ ...curr, valuesTitle: e.target.value }))}
              />
            </label>

            <label className="admin-input-group">
              <span className="admin-label-text">Penjelasan Keunggulan</span>
              <textarea
                className="admin-textarea-field"
                rows={3}
                value={content.valuesDescription}
                onChange={(e) => setContent((curr) => ({ ...curr, valuesDescription: e.target.value }))}
              />
            </label>

            <div className="admin-input-group">
              <ImageUploadDropzone
                value={content.valuesImage}
                label="Foto Latar Nilai Pendidikan"
                placeholderTitle="Unggah Foto Latar"
                onChange={(url) => setContent((curr) => ({ ...curr, valuesImage: url }))}
              />
            </div>
          </div>
        </section>

        {/* KATEGORI 5: PSB */}
        <section className="admin-card-section">
          <div className="admin-card-section-header">
            <h2>5. Pendaftaran Santri Baru (PSB)</h2>
          </div>

          <div className="admin-shortcut-card">
            <div className="admin-shortcut-info">
              <strong>Pusat Pengaturan PSB</strong>
              <p>Kelola formulir, tahun ajaran, dan status jalur pendaftaran.</p>
            </div>
            <Link href="/admin/pendaftaran" className="admin-btn-shortcut">
              Buka Pengaturan PSB 📝
            </Link>
          </div>
        </section>

        {/* FEEDBACK STATUS */}
        {error && <p className="admin-form-error" role="alert">{error}</p>}
        {message && <p className="admin-success" role="status">{message}</p>}

        {/* TOMBOL AKSI BAWAH */}
        <div className="admin-bottom-actions">
          <button
            type="button"
            className="admin-btn-cancel"
            onClick={handleCancel}
            disabled={saving || loading || addingSlide || uploadingIndex !== null}
          >
            Batal
          </button>

          <button
            type="submit"
            className="admin-btn-save"
            disabled={saving || loading || addingSlide || uploadingIndex !== null}
          >
            {saving ? "Menyimpan…" : loading ? "Memuat…" : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </>
  );
}
