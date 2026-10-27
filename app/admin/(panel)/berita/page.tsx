"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseBrowserClient } from "../../../../lib/supabase/browser";
import { safeImageUrl } from "../../../data/image-utils";

type NewsItem = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  image_url: string;
  published_at: string | null;
  status: string;
  updated_at: string;
};

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const loadArticles = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await createSupabaseBrowserClient()
      .from("news_articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("Gagal memuat artikel berita. Periksa koneksi Supabase.");
    } else {
      setError("");
      setArticles((data ?? []) as NewsItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadArticles();
  }, [loadArticles]);

  const handleDelete = async (article: NewsItem) => {
    if (!window.confirm(`Yakin ingin menghapus berita “${article.title}”? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    const { error: deleteError } = await createSupabaseBrowserClient()
      .from("news_articles")
      .delete()
      .eq("id", article.id);

    if (deleteError) {
      setError("Gagal menghapus berita: " + deleteError.message);
    } else {
      setNotice(`Berita “${article.title}” berhasil dihapus.`);
      await fetch("/api/admin/revalidate", { method: "POST" });
      await loadArticles();
    }
  };

  const filtered = articles.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return item.title.toLowerCase().includes(q) || (item.category && item.category.toLowerCase().includes(q));
  });

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">PENGELOLAAN KONTEN</span>
          <h1>Daftar Berita</h1>
          <p>Tulis, perbarui, dan kelola seluruh publikasi berita kegiatan & prestasi MBS Purworejo.</p>
        </div>
        <Link href="/admin/berita/tambah" className="admin-primary-button admin-heading-action">
          Tambah Berita Baru ＋
        </Link>
      </div>

      {notice && <p className="admin-success" role="status">{notice}</p>}
      {error && <p className="admin-form-error" role="alert">{error}</p>}

      <div style={{ marginBottom: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Cari judul atau kategori berita..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "340px", padding: "8px 12px", borderRadius: "5px", border: "1px solid #d9e0d8", fontSize: "12px" }}
        />
        <span style={{ fontSize: "12px", color: "#6e7a70" }}>
          Total: <strong>{filtered.length}</strong> artikel
        </span>
      </div>

      <section className="admin-collection-list" aria-label="Daftar Berita" suppressHydrationWarning>
        {loading ? (
          <div className="admin-panel-card admin-empty-state">Memuat data berita…</div>
        ) : filtered.length === 0 ? (
          <div className="admin-panel-card admin-empty-state">
            <strong>{search ? "Tidak ada berita yang cocok dengan pencarian." : "Belum ada berita tersimpan."}</strong>
            <span>Klik tombol <strong>"Tambah Berita Baru ＋"</strong> di kanan atas untuk membuat artikel pertama Anda.</span>
          </div>
        ) : (
          filtered.map((item) => (
            <article className="admin-panel-card admin-collection-row" key={item.id} style={{ display: "grid", gridTemplateColumns: "80px minmax(0, 1fr) auto", gap: "16px", alignItems: "center" }}>
              <div style={{ position: "relative", width: 80, height: 56, borderRadius: 5, overflow: "hidden", backgroundColor: "#eef2ec" }}>
                <Image
                  src={safeImageUrl(item.image_url)}
                  alt=""
                  fill
                  sizes="80px"
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div className="admin-collection-copy">
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                  <span className={`admin-status ${item.status === "published" ? "published" : "draft"}`}>
                    {item.status === "published" ? "Terbit" : "Draft"}
                  </span>
                  <span style={{ fontSize: "10px", background: "#f0f4ee", padding: "2px 8px", borderRadius: "12px", color: "#2d6032", fontWeight: 600 }}>
                    {item.category || "Kegiatan"}
                  </span>
                  {item.published_at && (
                    <span style={{ fontSize: "10px", color: "#8a948b" }}>
                      {item.published_at}
                    </span>
                  )}
                </div>
                <h2>{item.title}</h2>
                <p>{item.excerpt}</p>
              </div>

              <div className="admin-row-actions">
                <Link
                  href={`/admin/berita/edit?id=${item.id}`}
                  className="admin-secondary-button"
                  style={{ textDecoration: "none" }}
                >
                  ✏️ Ubah
                </Link>
                <Link
                  href={`/berita/detail?id=${item.id}`}
                  target="_blank"
                  className="admin-secondary-button"
                  style={{ textDecoration: "none" }}
                  title="Lihat tampilan di website"
                >
                  ↗
                </Link>
                <button
                  type="button"
                  className="admin-danger-button"
                  onClick={() => void handleDelete(item)}
                >
                  Hapus
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </>
  );
}
