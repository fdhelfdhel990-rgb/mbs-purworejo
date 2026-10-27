"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";
import ImageUploadDropzone from "./image-upload-dropzone";
import VisualEditor from "./visual-editor";

type NewsFormData = {
  id?: string;
  title: string;
  category: string;
  excerpt: string;
  image_url: string;
  image_alt: string;
  published_at: string;
  paragraphs: string;
  status: "published" | "draft";
};

const standardCategories = ["Kegiatan", "Pendidikan", "Prestasi", "Pengumuman", "Kajian", "Opini", "Santri"];

export default function NewsForm({
  initialData,
  isEdit = false,
}: {
  initialData?: Partial<NewsFormData>;
  isEdit?: boolean;
}) {
  const router = useRouter();

  const [form, setForm] = useState<NewsFormData>({
    id: initialData?.id || "",
    title: initialData?.title || "",
    category: initialData?.category || "Kegiatan",
    excerpt: initialData?.excerpt || "",
    image_url: initialData?.image_url || "",
    image_alt: initialData?.image_alt || "",
    published_at: initialData?.published_at || new Date().toISOString().slice(0, 10),
    paragraphs: initialData?.paragraphs || "",
    status: (initialData?.status as "published" | "draft") || "published",
  });

  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(() => {
    return Boolean(initialData?.category && !standardCategories.includes(initialData.category));
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (targetStatus?: "published" | "draft") => {
    const titleClean = form.title.trim();
    if (!titleClean) {
      setError("Judul berita wajib diisi.");
      return;
    }
    if (!form.image_url) {
      setError("Foto utama berita wajib dipilih (klik 'Choose your file').");
      return;
    }

    const strippedText = form.paragraphs.replace(/<[^>]+>/g, "").trim();
    if (!strippedText && !form.paragraphs.includes("<img")) {
      setError("Isi artikel berita tidak boleh kosong.");
      return;
    }

    setSaving(true);
    setError("");

    // Gunakan judul berita sebagai ringkasan otomatis (dipotong ... jika panjang)
    const autoExcerpt = form.excerpt.trim() || (titleClean.length > 90 ? `${titleClean.slice(0, 87)}...` : titleClean);
    const autoAlt = form.image_alt.trim() || titleClean;

    const statusToSave = targetStatus || form.status;

    let paragraphsArray: string[] = [];
    if (/<(p|div|h[1-6]|ul|ol|blockquote)[\s>]/i.test(form.paragraphs)) {
      const matches = form.paragraphs.match(/<(p|div|h[1-6]|ul|ol|blockquote)[^>]*>[\s\S]*?<\/\1>/gi);
      if (matches && matches.length > 0) {
        paragraphsArray = matches.map((m) => m.trim()).filter((m) => m !== "<p><br></p>" && m !== "<p></p>");
      } else {
        paragraphsArray = [form.paragraphs.trim()];
      }
    } else {
      paragraphsArray = form.paragraphs.split("\n").map((p) => p.trim()).filter(Boolean);
    }

    if (paragraphsArray.length === 0) {
      paragraphsArray = [form.paragraphs.trim()];
    }

    let id = form.id;
    if (!id) {
      const base = titleClean
        .toLocaleLowerCase("id")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      id = `${base || "berita"}-${Date.now().toString(36)}`;
    }

    const payload = {
      id,
      title: titleClean,
      category: form.category.trim() || "Kegiatan",
      excerpt: autoExcerpt,
      image_url: form.image_url,
      image_alt: autoAlt,
      published_at: form.published_at || new Date().toISOString().slice(0, 10),
      paragraphs: paragraphsArray,
      status: statusToSave,
      updated_at: new Date().toISOString(),
    };

    try {
      const client = createSupabaseBrowserClient();
      const query = client.from("news_articles");
      const result = isEdit
        ? await query.update(payload).eq("id", id)
        : await query.upsert(payload);

      if (result.error) {
        throw new Error(result.error.message);
      }

      await fetch("/api/admin/revalidate", { method: "POST" });
      router.push("/admin/berita");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? `Gagal menyimpan: ${saveError.message}` : "Terjadi kesalahan saat menyimpan berita.");
      setSaving(false);
    }
  };

  return (
    <div className="admin-editor-page">
      <div className="admin-page-heading">
        <div>
          <Link href="/admin/berita" className="admin-breadcrumb-back">
            ← Kembali ke Daftar Berita
          </Link>
          <span className="admin-eyebrow">PENGELOLAAN BERITA</span>
          <h1>{isEdit ? "Ubah Berita" : "Tambah Berita Baru"}</h1>
          <p>Tulis artikel dengan editor visual langsung. Format teks langsung berubah tanpa perlu mode preview.</p>
        </div>
        <div className="admin-page-actions">
          <Link href="/admin/berita" className="admin-secondary-button">
            Batal
          </Link>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={saving}
            onClick={() => void handleSave("draft")}
          >
            {saving ? "Menyimpan…" : "Simpan Draft"}
          </button>
          <button
            type="button"
            className="admin-primary-button"
            disabled={saving}
            onClick={() => void handleSave("published")}
          >
            {saving ? "Menyimpan…" : "Terbitkan Berita ↗"}
          </button>
        </div>
      </div>

      {error && <p className="admin-form-error" role="alert" style={{ marginBottom: "16px" }}>{error}</p>}

      <section className="admin-panel-card">
        <form className="admin-content-form" onSubmit={(e) => { e.preventDefault(); void handleSave(); }}>
          {/* Judul Berita */}
          <label className="is-wide">
            Judul Berita
            <input
              type="text"
              required
              placeholder="Contoh: Santri MBS Purworejo Raih Prestasi di Ajang Tingkat Provinsi"
              value={form.title}
              onChange={(e) => setForm((curr) => ({ ...curr, title: e.target.value }))}
            />
          </label>

          {/* Kategori */}
          <div className="admin-field-group">
            <label>
              Kategori Publikasi
              <select
                value={isCustomCategory ? "__custom__" : form.category}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setIsCustomCategory(true);
                    setForm((curr) => ({ ...curr, category: "" }));
                  } else {
                    setIsCustomCategory(false);
                    setForm((curr) => ({ ...curr, category: e.target.value }));
                  }
                }}
              >
                {standardCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__custom__">＋ Tulis Kategori Kustom...</option>
              </select>
            </label>
            {isCustomCategory && (
              <input
                type="text"
                placeholder="Ketik nama kategori baru..."
                required
                value={form.category}
                onChange={(e) => setForm((curr) => ({ ...curr, category: e.target.value }))}
                style={{ marginTop: "6px" }}
              />
            )}
          </div>

          {/* Tanggal Publikasi */}
          <label>
            Tanggal Publikasi
            <input
              type="date"
              required
              value={form.published_at}
              onChange={(e) => setForm((curr) => ({ ...curr, published_at: e.target.value }))}
            />
          </label>

          {/* Foto Utama - CHOOSE YOUR FILE (NO URL INPUT) */}
          <ImageUploadDropzone
            value={form.image_url}
            onChange={(url) => setForm((curr) => ({ ...curr, image_url: url }))}
            label="Foto Utama Berita"
            required
            hint="Format yang didukung: JPG, PNG, WebP, AVIF hingga 10MB."
          />

          {/* Isi Berita Lengkap - VISUAL WYSIWYG EDITOR */}
          <div className="admin-field-group is-wide">
            <label>Isi Berita Lengkap (Editor Visual Langsung)</label>
            <VisualEditor
              value={form.paragraphs}
              onChange={(html) => setForm((curr) => ({ ...curr, paragraphs: html }))}
              placeholder="Ketik artikel berita Anda di sini... Gunakan shortcut Ctrl+B untuk tebal, Ctrl+I untuk miring, Ctrl+U untuk garis bawah, dan Ctrl+Z untuk membatalkan (Undo)."
            />
            <small>
              💡 <strong>Toolbar:</strong> Link, Poin, Nomor, dan Kutipan. <strong>Shortcut keyboard:</strong> <code>Ctrl+Z</code> (Undo), <code>Ctrl+Y</code> (Redo), <code>Ctrl+B</code> (Tebal), <code>Ctrl+I</code> (Miring), <code>Ctrl+U</code> (Garis Bawah).
            </small>
          </div>

          {/* Status */}
          <label>
            Status Publikasi
            <select
              value={form.status}
              onChange={(e) => setForm((curr) => ({ ...curr, status: e.target.value as "published" | "draft" }))}
            >
              <option value="published">Terbit (Ditampilkan ke publik)</option>
              <option value="draft">Draft (Disimpan sementara)</option>
            </select>
          </label>

          {/* Bottom Actions */}
          <div className="admin-form-actions is-wide">
            <button
              type="button"
              className="admin-primary-button"
              disabled={saving}
              onClick={() => void handleSave("published")}
            >
              {saving ? "Menyimpan…" : isEdit ? "Simpan Perubahan Berita" : "Terbitkan Berita ↗"}
            </button>
            <button
              type="button"
              className="admin-secondary-button"
              disabled={saving}
              onClick={() => void handleSave("draft")}
            >
              Simpan Sebagai Draft
            </button>
            <Link href="/admin/berita" className="admin-secondary-button">
              Batal & Kembali
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
