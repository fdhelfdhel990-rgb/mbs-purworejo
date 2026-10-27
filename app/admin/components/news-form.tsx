"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";
import ImageUploadDropzone from "./image-upload-dropzone";
import VisualEditor from "./visual-editor";

function toValidDateInput(dateVal?: string): string {
  if (!dateVal) return new Date().toISOString().slice(0, 10);
  const trimmed = dateVal.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

  const months: Record<string, string> = {
    januari: "01", februari: "02", maret: "03", april: "04", mei: "05", juni: "06",
    juli: "07", agustus: "08", september: "09", oktober: "10", november: "11", desember: "12"
  };
  const parts = trimmed.toLowerCase().split(/[\s,]+/);
  let day = "";
  let month = "";
  let year = "";
  for (const part of parts) {
    if (months[part]) {
      month = months[part];
    } else if (/^\d{4}$/.test(part)) {
      year = part;
    } else if (/^\d{1,2}$/.test(part) && !day) {
      day = part.padStart(2, "0");
    }
  }
  if (year && month && day) {
    return `${year}-${month}-${day}`;
  }

  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function parseContentToParagraphs(htmlContent: string): string[] {
  const trimmed = htmlContent.trim();
  if (!trimmed) return [];

  if (typeof window !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, "text/html");
    const body = doc.body;

    const childNodes = Array.from(body.childNodes);
    const blocks: string[] = [];

    childNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        // Skip empty paragraphs or line breaks
        if (
          (tag === "p" || tag === "div") &&
          !el.textContent?.trim() &&
          !el.querySelector("img")
        ) {
          return;
        }
        blocks.push(el.outerHTML.trim());
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          blocks.push(`<p>${text}</p>`);
        }
      }
    });

    if (blocks.length > 0) {
      return blocks;
    }
  }

  return [trimmed];
}

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
    published_at: toValidDateInput(initialData?.published_at),
    paragraphs: initialData?.paragraphs || "",
    status: (initialData?.status as "published" | "draft") || "published",
  });

  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(() => {
    return Boolean(initialData?.category && !standardCategories.includes(initialData.category));
  });

  // Synchronize when initialData prop changes (e.g. user selects another article)
  useEffect(() => {
    if (initialData) {
      setForm({
        id: initialData.id || "",
        title: initialData.title || "",
        category: initialData.category || "Kegiatan",
        excerpt: initialData.excerpt || "",
        image_url: initialData.image_url || "",
        image_alt: initialData.image_alt || "",
        published_at: toValidDateInput(initialData.published_at),
        paragraphs: initialData.paragraphs || "",
        status: (initialData.status as "published" | "draft") || "published",
      });
      setIsCustomCategory(Boolean(initialData.category && !standardCategories.includes(initialData.category)));
    }
  }, [initialData]);

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
    const paragraphsArray = parseContentToParagraphs(form.paragraphs);

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
      published_at: toValidDateInput(form.published_at),
      paragraphs: paragraphsArray,
      status: statusToSave,
      updated_at: new Date().toISOString(),
    };

    try {
      const client = createSupabaseBrowserClient();
      const query = client.from("news_articles");
      if (isEdit) {
        const updateRes = await query.update(payload).eq("id", id).select();
        if (updateRes.error) {
          throw new Error(updateRes.error.message);
        }
        if (!updateRes.data || updateRes.data.length === 0) {
          // Article was a fallback dummy in memory, insert into DB now
          const insertRes = await query.insert(payload);
          if (insertRes.error) throw new Error(insertRes.error.message);
        }
      } else {
        const insertRes = await query.insert(payload);
        if (insertRes.error) throw new Error(insertRes.error.message);
      }

      try {
        await fetch("/api/admin/revalidate", { method: "POST" });
      } catch (revErr) {
        console.warn("Revalidate notification:", revErr);
      }

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
            ← Kembali
          </Link>
          <span className="admin-eyebrow">PENGELOLAAN BERITA</span>
          <h1>{isEdit ? "Ubah Berita" : "Tambah Berita Baru"}</h1>
          <p>Tulis artikel dengan editor visual langsung. Format teks langsung berubah tanpa perlu mode preview.</p>
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
              💡 Format teks langsung tampil seketika. Shortcut: <code>Ctrl+B</code> (Tebal), <code>Ctrl+I</code> (Miring), <code>Ctrl+U</code> (Garis Bawah), <code>Ctrl+Z</code> (Undo).
            </small>
          </div>

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
