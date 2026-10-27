"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

type CmsTable = "news_articles" | "achievements" | "faqs";
type CmsRow = Record<string, unknown> & { id?: string };
type Field = { name: string; label: string; type?: "textarea" | "number" | "date" | "select"; options?: string[]; required?: boolean; hint?: string };

export default function CollectionManager({
  table, title, description, fields, summaryField,
}: { table: CmsTable; title: string; description: string; fields: Field[]; summaryField: string }) {
  const [rows, setRows] = useState<CmsRow[]>([]);
  const [editing, setEditing] = useState<CmsRow | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const { data, error: loadError } = await createSupabaseBrowserClient().from(table).select("*");
    if (loadError) setError("Data belum dapat dimuat. Periksa koneksi database dan kebijakan akses CMS.");
    else {
      setError("");
      setRows(((data ?? []) as unknown as CmsRow[]).sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)));
    }
    setLoading(false);
  }, [table]);

  useEffect(() => {
    let active = true;
    createSupabaseBrowserClient().from(table).select("*").then(({ data, error: loadError }) => {
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
    setForm(Object.fromEntries(fields.map((field) => [field.name, field.name === "status" ? "draft" : field.name === "category" ? "Kegiatan" : field.name === "sort_order" ? "0" : ""])));
    setNotice("");
  };

  const startEdit = (row: CmsRow) => {
    setEditing(row);
    setForm(Object.fromEntries(fields.map((field) => {
      const value = row[field.name];
      return [field.name, Array.isArray(value) ? value.join("\n") : value == null ? "" : String(value)];
    })));
    setNotice("");
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload: Record<string, unknown> = { ...form };
    fields.forEach((field) => {
      if (field.name === "paragraphs") payload.paragraphs = form.paragraphs.split("\n").map((paragraph) => paragraph.trim()).filter(Boolean);
      if (field.type === "number") payload[field.name] = form[field.name] ? Number(form[field.name]) : field.name === "sort_order" ? 0 : null;
    });
    if (table === "news_articles" && !form.published_at) payload.published_at = null;
    if (table === "news_articles" && !editing) {
      const base = form.title.toLocaleLowerCase("id").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      payload.id = `${base || "berita"}-${Date.now().toString(36)}`;
    }
    if (editing?.id) payload.id = editing.id;
    payload.updated_at = new Date().toISOString();
    const query = createSupabaseBrowserClient().from(table);
    const result = editing ? await query.update(payload).eq("id", editing.id) : await query.insert(payload);
    setSaving(false);
    if (result.error) {
      setError("Perubahan belum tersimpan. Pastikan semua kolom wajib terisi dan koneksi CMS tersedia.");
      return;
    }
    const refreshResponse = await fetch("/api/admin/revalidate", { method: "POST" });
    setNotice(editing ? "Perubahan berhasil disimpan." : "Konten berhasil ditambahkan.");
    if (!refreshResponse.ok) setNotice("Konten tersimpan. Halaman publik belum dapat diperbarui otomatis.");
    setEditing(null);
    setForm({});
    await load();
  };

  const remove = async (row: CmsRow) => {
    const objectName = String(row[summaryField] || "konten ini");
    if (!window.confirm(`Hapus “${objectName}”? Tindakan ini tidak dapat dibatalkan.`)) return;
    const { error: deleteError } = await createSupabaseBrowserClient().from(table).delete().eq("id", row.id);
    if (deleteError) setError("Konten belum dapat dihapus. Silakan coba lagi.");
    else {
      const refreshResponse = await fetch("/api/admin/revalidate", { method: "POST" });
      setNotice(refreshResponse.ok ? "Konten berhasil dihapus." : "Konten dihapus. Halaman publik belum dapat diperbarui otomatis.");
      await load();
    }
  };

  return (
    <>
      <div className="admin-page-heading"><div><span className="admin-eyebrow">PENGELOLAAN KONTEN</span><h1>{title}</h1><p>{description}</p></div><button className="admin-primary-button admin-heading-action" type="button" onClick={startNew}>Tambah {title.toLocaleLowerCase("id")} <span aria-hidden="true">＋</span></button></div>
      {notice && <p className="admin-success" role="status">{notice}</p>}{error && <p className="admin-form-error" role="alert">{error}</p>}
      {editing !== null || Object.keys(form).length > 0 ? <section className="admin-panel-card admin-editor-card"><div className="admin-card-heading"><div><h2>{editing ? "Ubah konten" : "Konten baru"}</h2><p>Isi informasi berikut, lalu tentukan status publikasinya.</p></div><button type="button" className="admin-close-editor" onClick={() => { setEditing(null); setForm({}); }}>Tutup</button></div>
        <form className="admin-content-form" onSubmit={save}>{fields.map((field) => <label className={field.type === "textarea" ? "is-wide" : ""} key={field.name}>{field.label}{field.type === "textarea" ? <textarea required={field.required} rows={field.name === "paragraphs" ? 5 : 4} value={form[field.name] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} /> : field.type === "select" ? <select required={field.required} value={form[field.name] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}>{field.options?.map((option) => <option key={option} value={option}>{option === "published" ? "Terbit" : option === "draft" ? "Draft" : option}</option>)}</select> : <input type={field.type ?? "text"} required={field.required} value={form[field.name] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} />}{field.hint && <small>{field.hint}</small>}</label>)}<div className="admin-form-actions"><button className="admin-primary-button" disabled={saving} type="submit">{saving ? "Menyimpan…" : "Simpan perubahan"}</button><button className="admin-secondary-button" type="button" onClick={() => { setEditing(null); setForm({}); }}>Batal</button></div></form>
      </section> : null}
      <section className="admin-collection-list" aria-label={`Daftar ${title}`}>
        {loading ? <div className="admin-panel-card admin-empty-state">Memuat konten…</div> : rows.length === 0 ? <div className="admin-panel-card admin-empty-state"><strong>Belum ada {title.toLocaleLowerCase("id")} tersimpan.</strong><span>Tambahkan konten pertama untuk mulai mengisi website.</span></div> : rows.map((row) => <article className="admin-panel-card admin-collection-row" key={String(row.id)}><div className="admin-collection-copy"><span className={`admin-status ${row.status === "published" ? "published" : "draft"}`}>{row.status === "published" ? "Terbit" : "Draft"}</span><h2>{String(row[summaryField] || "Tanpa judul")}</h2><p>{String(row.title ?? row.answer ?? row.detail ?? "")}</p></div><div className="admin-row-actions"><button type="button" className="admin-secondary-button" onClick={() => startEdit(row)}>Ubah</button><button type="button" className="admin-danger-button" onClick={() => void remove(row)}>Hapus</button></div></article>)}
      </section>
    </>
  );
}
