"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";
import ImageUploadDropzone from "./image-upload-dropzone";

type AchievementFormData = {
  id?: string;
  title: string;
  detail: string;
  image_url: string;
  image_alt?: string;
  year: number | "";
  sort_order: number;
  status: "published" | "draft";
};

export default function AchievementForm({
  initialData,
  isEdit = false,
}: {
  initialData?: Partial<AchievementFormData>;
  isEdit?: boolean;
}) {
  const router = useRouter();

  const [form, setForm] = useState<AchievementFormData>({
    id: initialData?.id || "",
    title: initialData?.title || "",
    detail: initialData?.detail || "",
    image_url: initialData?.image_url || "",
    year: initialData?.year ?? new Date().getFullYear(),
    sort_order: initialData?.sort_order ?? 0,
    status: (initialData?.status as "published" | "draft") || "published",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        id: initialData.id || "",
        title: initialData.title || "",
        detail: initialData.detail || "",
        image_url: initialData.image_url || "",
        year: initialData.year ?? new Date().getFullYear(),
        sort_order: initialData.sort_order ?? 0,
        status: (initialData.status as "published" | "draft") || "published",
      });
    }
  }, [initialData]);

  const handleSave = async (targetStatus?: "published" | "draft") => {
    if (!form.title.trim()) {
      setError("Judul prestasi wajib diisi.");
      return;
    }
    if (!form.image_url) {
      setError("Foto / poster prestasi wajib dipilih (klik 'Choose your file').");
      return;
    }

    setSaving(true);
    setError("");

    const statusToSave = targetStatus || form.status;
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      detail: form.detail.trim(),
      image_url: form.image_url,
      image_alt: form.title.trim(),
      year: form.year ? Number(form.year) : new Date().getFullYear(),
      sort_order: Number(form.sort_order) || 0,
      status: statusToSave,
      updated_at: new Date().toISOString(),
    };

    if (form.id) {
      payload.id = form.id;
    }

    try {
      const client = createSupabaseBrowserClient();
      const query = client.from("achievements");
      if (isEdit && form.id) {
        const updateRes = await query.update(payload).eq("id", form.id).select();
        if (updateRes.error) {
          throw new Error(updateRes.error.message);
        }
        if (!updateRes.data || updateRes.data.length === 0) {
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

      router.push("/admin/prestasi");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? `Gagal menyimpan: ${saveError.message}` : "Terjadi kesalahan saat menyimpan prestasi.");
      setSaving(false);
    }
  };

  return (
    <div className="admin-editor-page">
      <div className="admin-page-heading">
        <div>
          <Link href="/admin/prestasi" className="admin-breadcrumb-back">
            ← Kembali
          </Link>
          <span className="admin-eyebrow">PENGELOLAAN PRESTASI</span>
          <h1>{isEdit ? "Ubah Prestasi Santri" : "Tambah Prestasi Baru"}</h1>
          <p>Lengkapi informasi capaian santri dan unggah foto/posternya.</p>
        </div>
      </div>

      {error && <p className="admin-form-error" role="alert" style={{ marginBottom: "16px" }}>{error}</p>}

      <section className="admin-panel-card">
        <form className="admin-content-form" onSubmit={(e) => { e.preventDefault(); void handleSave(); }}>
          {/* Judul Prestasi */}
          <label className="is-wide">
            Judul Prestasi
            <input
              type="text"
              required
              placeholder="Contoh: Juara 1 Lomba Pidato Bahasa Arab Tingkat Nasional"
              value={form.title}
              onChange={(e) => setForm((curr) => ({ ...curr, title: e.target.value }))}
            />
          </label>

          {/* Keterangan Singkat */}
          <label className="is-wide">
            Keterangan Singkat
            <textarea
              rows={3}
              placeholder="Contoh: Diraih oleh Ananda Ahmad Fauzi dalam ajang POSPEDA tahun 2026..."
              value={form.detail}
              onChange={(e) => setForm((curr) => ({ ...curr, detail: e.target.value }))}
            />
          </label>

          {/* Foto / Poster Prestasi - CHOOSE YOUR FILE (NO URL INPUT) */}
          <ImageUploadDropzone
            value={form.image_url}
            onChange={(url) => setForm((curr) => ({ ...curr, image_url: url }))}
            label="Foto / Poster Prestasi"
            required
            hint="Pilih foto dokumentasi atau poster piala/piagam dari komputer Anda."
          />

          {/* Tahun */}
          <label>
            Tahun
            <input
              type="number"
              value={form.year}
              placeholder="2026"
              onChange={(e) => setForm((curr) => ({ ...curr, year: e.target.value ? Number(e.target.value) : "" }))}
            />
          </label>

          {/* Urutan Tampil */}
          <label>
            Urutan Tampil
            <input
              type="number"
              value={form.sort_order}
              placeholder="0"
              onChange={(e) => setForm((curr) => ({ ...curr, sort_order: Number(e.target.value) || 0 }))}
            />
            <small>Angka lebih kecil tampil lebih awal pada korsel beranda (0, 1, 2, dst).</small>
          </label>

          {/* Bottom Actions */}
          <div className="admin-form-actions is-wide">
            <button
              type="button"
              className="admin-primary-button"
              disabled={saving}
              onClick={() => void handleSave("published")}
            >
              {saving ? "Menyimpan…" : isEdit ? "Simpan Perubahan Prestasi" : "Terbitkan Prestasi ↗"}
            </button>
            <button
              type="button"
              className="admin-secondary-button"
              disabled={saving}
              onClick={() => void handleSave("draft")}
            >
              Simpan Sebagai Draft
            </button>
            <Link href="/admin/prestasi" className="admin-secondary-button">
              Batal & Kembali
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
