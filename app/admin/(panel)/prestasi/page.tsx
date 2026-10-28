"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseBrowserClient } from "../../../../lib/supabase/browser";
import { safeImageUrl } from "../../../data/image-utils";

type AchievementItem = {
  id: string;
  title: string;
  detail: string;
  image_url: string;
  year: number | null;
  sort_order: number;
  status: string;
};

export default function AdminAchievementsPage() {
  const [items, setItems] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await createSupabaseBrowserClient()
      .from("achievements")
      .select("*")
      .order("sort_order", { ascending: true });

    if (fetchError) {
      setError("Gagal memuat galeri prestasi. Periksa koneksi Supabase.");
    } else {
      setError("");
      setItems((data ?? []) as AchievementItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadAchievements();
  }, [loadAchievements]);

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">PENGELOLAAN KONTEN</span>
          <h1>Galeri Prestasi</h1>
          <p>Kelola 5 poster dan keterangan prestasi santri yang ditampilkan pada korsel beranda utama. Jumlah prestasi ditetapkan tetap (5 item) untuk menjaga keselarasan tampilan korsel 3D.</p>
        </div>
      </div>

      {notice && <p className="admin-success" role="status">{notice}</p>}
      {error && <p className="admin-form-error" role="alert">{error}</p>}

      <section className="admin-collection-list" aria-label="Daftar Prestasi" suppressHydrationWarning>
        {loading ? (
          <div className="admin-panel-card admin-empty-state">Memuat data prestasi…</div>
        ) : items.length === 0 ? (
          <div className="admin-panel-card admin-empty-state">
            <strong>Belum ada data prestasi santri.</strong>
            <span>Pastikan data awal prestasi telah tersinkronisasi.</span>
          </div>
        ) : (
          items.map((item) => (
            <article
              className="admin-panel-card admin-collection-row"
              key={item.id}
              style={{ display: "grid", gridTemplateColumns: "70px minmax(0, 1fr) auto", gap: "16px", alignItems: "center" }}
            >
              <div style={{ position: "relative", width: 70, height: 95, borderRadius: 5, overflow: "hidden", backgroundColor: "#eef2ec" }}>
                <Image
                  src={safeImageUrl(item.image_url, "/images/prestasi1.jpg")}
                  alt=""
                  fill
                  sizes="70px"
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div className="admin-collection-copy">
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                  <span className={`admin-status ${item.status === "published" ? "published" : "draft"}`}>
                    {item.status === "published" ? "Terbit" : "Draft"}
                  </span>
                  {item.year && (
                    <span style={{ fontSize: "10px", background: "#f0f4ee", padding: "2px 8px", borderRadius: "12px", color: "#2d6032", fontWeight: 600 }}>
                      Tahun {item.year}
                    </span>
                  )}
                  <span style={{ fontSize: "10px", color: "#8a948b" }}>
                    Urutan: {item.sort_order}
                  </span>
                </div>
                <h2>{item.title}</h2>
                <p>{item.detail}</p>
              </div>

              <div className="admin-row-actions">
                <Link
                  href={`/admin/prestasi/edit?id=${item.id}`}
                  className="admin-secondary-button"
                  style={{ textDecoration: "none" }}
                >
                  ✏️ Ubah Konten
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
