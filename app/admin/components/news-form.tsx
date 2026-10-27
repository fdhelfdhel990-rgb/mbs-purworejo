"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";
import ImageUploadDropzone from "./image-upload-dropzone";
import FormattedArticleBody from "../../components/formatted-article-body";

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
  const [showPreview, setShowPreview] = useState(false);

  const insertFormat = (format: string) => {
    const textarea = document.getElementById("field-paragraphs") as HTMLTextAreaElement | null;
    const currentVal = form.paragraphs || "";
    if (!textarea) {
      setForm((curr) => ({ ...curr, paragraphs: currentVal ? `${currentVal}\n${format}` : format }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = currentVal.substring(start, end);

    let replacement = "";
    if (format === "bold") replacement = selected ? `**${selected}**` : "**Teks Tebal**";
    else if (format === "italic") replacement = selected ? `*${selected}*` : "*Teks Miring*";
    else if (format === "underline") replacement = selected ? `<u>${selected}</u>` : "<u>Teks Garis Bawah</u>";
    else if (format === "h2") replacement = selected ? `\n## ${selected}\n` : "\n## Subjudul Berita\n";
    else if (format === "h3") replacement = selected ? `\n### ${selected}\n` : "\n### Subjudul Kecil\n";
    else if (format === "list") replacement = selected ? selected.split("\n").map((l) => `- ${l}`).join("\n") : "\n- Poin pertama\n- Poin kedua\n";
    else if (format === "quote") replacement = selected ? `\n> ${selected}\n` : "\n> Kutipan pernyataan\n";
    else if (format === "link") replacement = selected ? `[${selected}](https://contoh.com)` : "[Nama Tautan](https://contoh.com)";

    const nextVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    setForm((curr) => ({ ...curr, paragraphs: nextVal }));

    setTimeout(() => {
      textarea.focus();
      const newPos = start + replacement.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 15);
  };

  const handleSave = async (targetStatus?: "published" | "draft") => {
    if (!form.title.trim()) {
      setError("Judul berita wajib diisi.");
      return;
    }
    if (!form.excerpt.trim()) {
      setError("Ringkasan berita (excerpt) wajib diisi.");
      return;
    }
    if (!form.image_url) {
      setError("Foto utama berita wajib dipilih (klik 'Choose your file').");
      return;
    }
    if (!form.paragraphs.trim()) {
      setError("Isi artikel berita tidak boleh kosong.");
      return;
    }

    setSaving(true);
    setError("");

    const statusToSave = targetStatus || form.status;
    const paragraphsArray = form.paragraphs
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    let id = form.id;
    if (!id) {
      const base = form.title
        .toLocaleLowerCase("id")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      id = `${base || "berita"}-${Date.now().toString(36)}`;
    }

    const payload = {
      id,
      title: form.title.trim(),
      category: form.category.trim() || "Kegiatan",
      excerpt: form.excerpt.trim(),
      image_url: form.image_url,
      image_alt: form.image_alt.trim() || form.title.trim(),
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
          <p>Lengkapi informasi dan isi berita di bawah ini, lalu klik Simpan.</p>
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

          {/* Ringkasan Berita */}
          <label className="is-wide">
            Ringkasan Berita (Excerpt)
            <textarea
              rows={3}
              required
              placeholder="Tuliskan 1-2 kalimat ringkasan yang menarik untuk ditampilkan di kartu berita beranda..."
              value={form.excerpt}
              onChange={(e) => setForm((curr) => ({ ...curr, excerpt: e.target.value }))}
            />
            <small>Ringkasan singkat ini akan muncul pada kartu berita di halaman utama dan daftar berita.</small>
          </label>

          {/* Foto Utama - CHOOSE YOUR FILE (NO URL INPUT) */}
          <ImageUploadDropzone
            value={form.image_url}
            onChange={(url) => setForm((curr) => ({ ...curr, image_url: url }))}
            label="Foto Utama Berita"
            required
            hint="Format yang didukung: JPG, PNG, WebP, AVIF hingga 10MB."
          />

          {/* Deskripsi Foto */}
          <label className="is-wide">
            Deskripsi Foto (Alt Text)
            <input
              type="text"
              placeholder="Deskripsi singkat foto untuk aksesibilitas dan SEO..."
              value={form.image_alt}
              onChange={(e) => setForm((curr) => ({ ...curr, image_alt: e.target.value }))}
            />
          </label>

          {/* Isi Berita Lengkap - WITH RICH TEXT TOOLBAR */}
          <div className="admin-field-group is-wide">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="field-paragraphs">Isi Berita Lengkap</label>
              <button
                type="button"
                className="admin-secondary-button"
                style={{ minHeight: "28px", padding: "0 8px", fontSize: "11px" }}
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? "✏️ Mode Edit Teks" : "👁️ Pratinjau Tampilan Artikel"}
              </button>
            </div>

            {/* Toolbar Pemformatan */}
            <div className="admin-toolbar" role="toolbar" aria-label="Toolbar pemformatan teks">
              <button type="button" className="admin-toolbar-btn" title="Tebal (Bold)" onClick={() => insertFormat("bold")}><b>B</b> Tebal</button>
              <button type="button" className="admin-toolbar-btn" title="Miring (Italic)" onClick={() => insertFormat("italic")}><i>I</i> Miring</button>
              <button type="button" className="admin-toolbar-btn" title="Garis Bawah (Underline)" onClick={() => insertFormat("underline")}><u>U</u> Garis Bawah</button>
              <button type="button" className="admin-toolbar-btn" title="Subjudul H2" onClick={() => insertFormat("h2")}>H2 Judul</button>
              <button type="button" className="admin-toolbar-btn" title="Subjudul H3" onClick={() => insertFormat("h3")}>H3 Subjudul</button>
              <button type="button" className="admin-toolbar-btn" title="Daftar Poin" onClick={() => insertFormat("list")}>• Poin</button>
              <button type="button" className="admin-toolbar-btn" title="Kutipan" onClick={() => insertFormat("quote")}>❝ Kutipan</button>
              <button type="button" className="admin-toolbar-btn" title="Tautan Link" onClick={() => insertFormat("link")}>🔗 Link</button>
            </div>

            {showPreview ? (
              <div className="admin-live-preview">
                <strong style={{ display: "block", marginBottom: 8, fontSize: 12, color: "#2d6032" }}>
                  Simulasi Tampilan Bacaan:
                </strong>
                <FormattedArticleBody
                  paragraphs={form.paragraphs.split("\n").filter(Boolean)}
                />
              </div>
            ) : (
              <textarea
                id="field-paragraphs"
                rows={9}
                required
                placeholder="Tuliskan isi artikel berita secara lengkap. Tekan Enter untuk membuat paragraf baru. Gunakan toolbar di atas untuk menebalkan (**teks**), memiringkan (*teks*), subjudul (##), atau membuat poin."
                value={form.paragraphs}
                onChange={(e) => setForm((curr) => ({ ...curr, paragraphs: e.target.value }))}
              />
            )}
            <small>Pisahkan setiap paragraf dengan menekan tombol Enter.</small>
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

