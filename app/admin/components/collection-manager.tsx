"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";
import FormattedArticleBody from "../../components/formatted-article-body";
import ImageUploadDropzone from "./image-upload-dropzone";
import { safeImageUrl } from "../../data/image-utils";

type CmsTable = "news_articles" | "achievements" | "faqs";
type CmsRow = Record<string, unknown> & { id?: string };
export type Field = {
  name: string;
  label: string;
  type?: "textarea" | "number" | "date" | "select" | "image" | "richtext" | "category";
  options?: string[];
  required?: boolean;
  hint?: string;
};

const standardCategories = ["Kegiatan", "Pendidikan", "Prestasi", "Pengumuman", "Kajian", "Opini", "Santri"];

export default function CollectionManager({
  table,
  title,
  description,
  fields,
  summaryField,
  allowAdd = true,
  allowDelete = true,
}: {
  table: CmsTable;
  title: string;
  description: string;
  fields: Field[];
  summaryField: string;
  allowAdd?: boolean;
  allowDelete?: boolean;
}) {
  const [rows, setRows] = useState<CmsRow[]>([]);
  const [editing, setEditing] = useState<CmsRow | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const load = useCallback(async () => {
    const { data, error: loadError } = await createSupabaseBrowserClient().from(table).select("*");
    if (loadError) {
      setError("Data belum dapat dimuat. Periksa koneksi database dan kebijakan akses CMS.");
    } else {
      setError("");
      setRows(((data ?? []) as unknown as CmsRow[]).sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)));
    }
    setLoading(false);
  }, [table]);

  useEffect(() => {
    let active = true;
    createSupabaseBrowserClient()
      .from(table)
      .select("*")
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) setError("Data belum dapat dimuat. Periksa koneksi database dan kebijakan akses CMS.");
        else {
          setError("");
          setRows(((data ?? []) as unknown as CmsRow[]).sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)));
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, [table]);

  const startNew = () => {
    setEditing(null);
    setIsCustomCategory(false);
    setShowPreview(false);
    setForm(
      Object.fromEntries(
        fields.map((field) => [
          field.name,
          field.name === "status" ? "published" : field.name === "category" ? "Kegiatan" : field.name === "sort_order" ? "0" : "",
        ])
      )
    );
    setNotice("");
  };

  const startEdit = (row: CmsRow) => {
    setEditing(row);
    setShowPreview(false);
    const cat = String(row.category || "");
    setIsCustomCategory(Boolean(cat && !standardCategories.includes(cat)));

    setForm(
      Object.fromEntries(
        fields.map((field) => {
          const value = row[field.name];
          return [field.name, Array.isArray(value) ? value.join("\n") : value == null ? "" : String(value)];
        })
      )
    );
    setNotice("");
  };

  const handleFileUpload = async (fieldName: string, file: File) => {
    setUploadingField(fieldName);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body: formData });
      const data = (await res.json()) as { ok?: boolean; publicUrl?: string; error?: string };
      if (!res.ok || !data.publicUrl) {
        throw new Error(data.error || "Gagal mengunggah gambar.");
      }
      setForm((current) => ({ ...current, [fieldName]: data.publicUrl! }));
      setNotice("Gambar berhasil diunggah dan terpasang!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
    } finally {
      setUploadingField(null);
    }
  };

  const insertFormat = (fieldName: string, format: string) => {
    const textarea = document.getElementById(`field-${fieldName}`) as HTMLTextAreaElement | null;
    const currentVal = form[fieldName] || "";
    if (!textarea) {
      setForm((curr) => ({ ...curr, [fieldName]: currentVal ? `${currentVal}\n${format}` : format }));
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
    else if (format === "quote") replacement = selected ? `\n> ${selected}\n` : "\n> Kutipan penting\n";
    else if (format === "link") replacement = selected ? `[${selected}](https://contoh.com)` : "[Teks Tautan](https://contoh.com)";

    const nextVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    setForm((curr) => ({ ...curr, [fieldName]: nextVal }));

    setTimeout(() => {
      textarea.focus();
      const newPos = start + replacement.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 15);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload: Record<string, unknown> = { ...form };
    fields.forEach((field) => {
      if (field.name === "paragraphs" || field.type === "richtext") {
        payload[field.name] = (form[field.name] || "").split("\n").map((p) => p.trim()).filter(Boolean);
      }
      if (field.type === "number") {
        payload[field.name] = form[field.name] ? Number(form[field.name]) : field.name === "sort_order" ? 0 : null;
      }
    });

    if (table === "news_articles" && !form.published_at) {
      payload.published_at = new Date().toISOString().slice(0, 10);
    }
    if (table === "news_articles" && !editing) {
      const base = form.title.toLocaleLowerCase("id").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      payload.id = `${base || "berita"}-${Date.now().toString(36)}`;
    }
    if (editing?.id) payload.id = editing.id;
    payload.updated_at = new Date().toISOString();

    const client = createSupabaseBrowserClient();
    const query = client.from(table);
    const result = editing ? await query.update(payload).eq("id", editing.id) : await query.insert(payload);
    setSaving(false);
    if (result.error) {
      setError(`Perubahan belum tersimpan (${result.error.message}). Pastikan semua kolom wajib terisi.`);
      return;
    }
    const refreshResponse = await fetch("/api/admin/revalidate", { method: "POST" });
    setNotice(editing ? "Perubahan berhasil disimpan." : "Konten baru berhasil ditambahkan.");
    if (!refreshResponse.ok) setNotice("Konten tersimpan. Halaman publik sedang disinkronkan.");
    setEditing(null);
    setForm({});
    await load();
  };

  const remove = async (row: CmsRow) => {
    const objectName = String(row[summaryField] || "konten ini");
    if (!window.confirm(`Hapus “${objectName}”? Tindakan ini tidak dapat dibatalkan.`)) return;
    const { error: deleteError } = await createSupabaseBrowserClient().from(table).delete().eq("id", row.id);
    if (deleteError) {
      setError("Konten belum dapat dihapus. Silakan coba lagi.");
    } else {
      await fetch("/api/admin/revalidate", { method: "POST" });
      setNotice("Konten berhasil dihapus.");
      await load();
    }
  };

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">PENGELOLAAN KONTEN</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {allowAdd && (
          <button className="admin-primary-button admin-heading-action" type="button" onClick={startNew}>
            Tambah {title.toLocaleLowerCase("id")} <span aria-hidden="true">＋</span>
          </button>
        )}
      </div>

      {notice && <p className="admin-success" role="status">{notice}</p>}
      {error && <p className="admin-form-error" role="alert">{error}</p>}

      {(editing !== null || Object.keys(form).length > 0) && (
        <section className="admin-panel-card admin-editor-card">
          <div className="admin-card-heading">
            <div>
              <h2>{editing ? `Ubah ${title}` : `${title} baru`}</h2>
              <p>Lengkapi informasi berikut, unggah foto bila diperlukan, lalu tentukan status publikasinya.</p>
            </div>
            <button
              type="button"
              className="admin-close-editor"
              onClick={() => { setEditing(null); setForm({}); }}
            >
              ✕ Tutup
            </button>
          </div>

          <form className="admin-content-form" onSubmit={save}>
            {fields.map((field) => {
              const isWide = field.type === "textarea" || field.type === "richtext" || field.name === "paragraphs" || field.name === "title" || field.name === "excerpt";

              // 1. Category Field (Custom + Select)
              if (field.type === "category" || field.name === "category") {
                return (
                  <div className="admin-field-group" key={field.name}>
                    <label>
                      {field.label}
                      <select
                        value={isCustomCategory ? "__custom__" : (form[field.name] || "Kegiatan")}
                        onChange={(e) => {
                          if (e.target.value === "__custom__") {
                            setIsCustomCategory(true);
                            setForm((curr) => ({ ...curr, [field.name]: "" }));
                          } else {
                            setIsCustomCategory(false);
                            setForm((curr) => ({ ...curr, [field.name]: e.target.value }));
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
                        value={form[field.name] ?? ""}
                        onChange={(e) => setForm((curr) => ({ ...curr, [field.name]: e.target.value }))}
                        style={{ marginTop: "6px" }}
                      />
                    )}
                    {field.hint && <small>{field.hint}</small>}
                  </div>
                );
              }

              // 2. Image Field with Direct Upload (No URL input)
              if (field.type === "image" || field.name === "image_url") {
                return (
                  <ImageUploadDropzone
                    key={field.name}
                    value={form[field.name]}
                    onChange={(url) => setForm((curr) => ({ ...curr, [field.name]: url }))}
                    label={field.label}
                    hint={field.hint}
                    required={field.required}
                  />
                );
              }

              // 3. Rich Text / Formatted Description Field
              if (field.type === "richtext" || field.name === "paragraphs") {
                const paragraphsList = (form[field.name] || "").split("\n").filter(Boolean);
                return (
                  <div className={`admin-field-group ${isWide ? "is-wide" : ""}`} key={field.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label htmlFor={`field-${field.name}`}>{field.label}</label>
                      <button
                        type="button"
                        className="admin-secondary-button"
                        style={{ minHeight: "28px", padding: "0 8px", fontSize: "11px" }}
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        {showPreview ? "✏️ Mode Edit" : "👁️ Pratinjau Tampilan"}
                      </button>
                    </div>

                    {/* Toolbar */}
                    <div className="admin-toolbar" role="toolbar" aria-label="Format teks">
                      <button type="button" className="admin-toolbar-btn" title="Tebal (Bold)" onClick={() => insertFormat(field.name, "bold")}><b>B</b> Tebal</button>
                      <button type="button" className="admin-toolbar-btn" title="Miring (Italic)" onClick={() => insertFormat(field.name, "italic")}><i>I</i> Miring</button>
                      <button type="button" className="admin-toolbar-btn" title="Garis Bawah (Underline)" onClick={() => insertFormat(field.name, "underline")}><u>U</u> Garis Bawah</button>
                      <button type="button" className="admin-toolbar-btn" title="Subjudul H2" onClick={() => insertFormat(field.name, "h2")}>H2 Judul</button>
                      <button type="button" className="admin-toolbar-btn" title="Subjudul H3" onClick={() => insertFormat(field.name, "h3")}>H3 Subjudul</button>
                      <button type="button" className="admin-toolbar-btn" title="Daftar Poin" onClick={() => insertFormat(field.name, "list")}>• Poin</button>
                      <button type="button" className="admin-toolbar-btn" title="Kutipan" onClick={() => insertFormat(field.name, "quote")}>❝ Kutipan</button>
                      <button type="button" className="admin-toolbar-btn" title="Tautan Link" onClick={() => insertFormat(field.name, "link")}>🔗 Link</button>
                    </div>

                    {showPreview ? (
                      <div className="admin-live-preview">
                        <strong style={{ display: "block", marginBottom: 8, fontSize: 12, color: "#2d6032" }}>
                          Pratinjau Format Bacaan:
                        </strong>
                        <FormattedArticleBody paragraphs={paragraphsList} />
                      </div>
                    ) : (
                      <textarea
                        id={`field-${field.name}`}
                        rows={7}
                        required={field.required}
                        value={form[field.name] ?? ""}
                        placeholder="Tulis paragraf di sini. Pisahkan antar paragraf dengan Enter. Gunakan toolbar di atas untuk menebalkan (**teks**), memiringkan (*teks*), atau membuat subjudul (##)."
                        onChange={(e) => setForm((curr) => ({ ...curr, [field.name]: e.target.value }))}
                      />
                    )}
                    {field.hint && <small>{field.hint}</small>}
                  </div>
                );
              }

              // 4. Default Select or Input
              return (
                <label className={isWide ? "is-wide" : ""} key={field.name}>
                  {field.label}
                  {field.type === "textarea" ? (
                    <textarea
                      rows={4}
                      required={field.required}
                      value={form[field.name] ?? ""}
                      onChange={(e) => setForm((curr) => ({ ...curr, [field.name]: e.target.value }))}
                    />
                  ) : field.type === "select" ? (
                    <select
                      required={field.required}
                      value={form[field.name] ?? ""}
                      onChange={(e) => setForm((curr) => ({ ...curr, [field.name]: e.target.value }))}
                    >
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option === "published" ? "Terbit (Aktif)" : option === "draft" ? "Draft (Sembunyikan)" : option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type ?? "text"}
                      required={field.required}
                      value={form[field.name] ?? ""}
                      onChange={(e) => setForm((curr) => ({ ...curr, [field.name]: e.target.value }))}
                    />
                  )}
                  {field.hint && <small>{field.hint}</small>}
                </label>
              );
            })}

            <div className="admin-form-actions">
              <button className="admin-primary-button" disabled={saving || uploadingField !== null} type="submit">
                {saving ? "Menyimpan…" : "Simpan Perubahan"}
              </button>
              <button
                className="admin-secondary-button"
                type="button"
                onClick={() => { setEditing(null); setForm({}); }}
              >
                Batal
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-collection-list" aria-label={`Daftar ${title}`}>
        {loading ? (
          <div className="admin-panel-card admin-empty-state">Memuat data {title.toLocaleLowerCase("id")}…</div>
        ) : rows.length === 0 ? (
          <div className="admin-panel-card admin-empty-state">
            <strong>Belum ada {title.toLocaleLowerCase("id")} tersimpan.</strong>
            <span>Klik "Tambah {title.toLocaleLowerCase("id")}" untuk mulai mengisi konten.</span>
          </div>
        ) : (
          rows.map((row) => (
            <article className="admin-panel-card admin-collection-row" key={String(row.id)}>
              <div className="admin-collection-copy">
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                  <span className={`admin-status ${row.status === "published" ? "published" : "draft"}`}>
                    {row.status === "published" ? "Terbit" : "Draft"}
                  </span>
                  {Boolean(row.category) && (
                    <span style={{ fontSize: "10px", background: "#f0f4ee", padding: "2px 8px", borderRadius: "12px", color: "#2d6032", fontWeight: 600 }}>
                      {String(row.category)}
                    </span>
                  )}
                </div>
                <h2>{String(row[summaryField] || "Tanpa judul")}</h2>
                <p>{String(row.title ?? row.answer ?? row.detail ?? "")}</p>
              </div>
              <div className="admin-row-actions">
                <button type="button" className="admin-secondary-button" onClick={() => startEdit(row)}>
                  ✏️ Ubah
                </button>
                {allowDelete && (
                  <button type="button" className="admin-danger-button" onClick={() => void remove(row)}>
                    Hapus
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
