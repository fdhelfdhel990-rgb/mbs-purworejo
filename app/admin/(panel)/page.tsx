import Link from "next/link";
import { connection } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export const instant = false;

export default async function AdminDashboardPage() {
  await connection();
  const supabase = await createSupabaseServerClient();
  const [news, achievements, faqs, recent] = await Promise.all([
    supabase.from("news_articles").select("status", { count: "exact" }),
    supabase.from("achievements").select("status", { count: "exact" }),
    supabase.from("faqs").select("status", { count: "exact" }),
    supabase.from("news_articles").select("id,title,status,updated_at").order("updated_at", { ascending: false }).limit(4),
  ]);
  const setupNeeded = [news.error, achievements.error, faqs.error].some(Boolean);
  const published = (rows: { status: string }[] | null) => rows?.filter((row) => row.status === "published").length ?? 0;
  const draft = (rows: { status: string }[] | null) => rows?.filter((row) => row.status === "draft").length ?? 0;

  return (
    <>
      <div className="admin-page-heading"><div><span className="admin-eyebrow">SELAMAT DATANG</span><h1>Ringkasan website</h1><p>Pantau dan perbarui konten MBS dari satu tempat.</p></div><Link className="admin-primary-button admin-heading-action" href="/admin/berita">Tulis berita <span aria-hidden="true">＋</span></Link></div>
      {setupNeeded && <div className="admin-notice"><strong>Data CMS belum siap.</strong><span>Pastikan migrasi database sudah dijalankan dan tabel konten telah dibuat.</span></div>}
      <section className="admin-stat-grid" aria-label="Ringkasan konten">
        <article className="admin-stat-card"><span>Berita terbit</span><strong>{news.error ? "—" : published(news.data)}</strong><small>{news.error ? "Belum terhubung" : `${draft(news.data)} draft menunggu`}</small></article>
        <article className="admin-stat-card"><span>Prestasi tampil</span><strong>{achievements.error ? "—" : published(achievements.data)}</strong><small>{achievements.error ? "Belum terhubung" : `${draft(achievements.data)} draft tersimpan`}</small></article>
        <article className="admin-stat-card"><span>FAQ aktif</span><strong>{faqs.error ? "—" : published(faqs.data)}</strong><small>{faqs.error ? "Belum terhubung" : "Terlihat di halaman utama"}</small></article>
      </section>
      <div className="admin-dashboard-grid">
        <section className="admin-panel-card"><div className="admin-card-heading"><div><h2>Perubahan berita</h2><p>Konten yang terakhir diperbarui.</p></div><Link href="/admin/berita">Kelola berita <span aria-hidden="true">→</span></Link></div>
          {recent.error ? <p className="admin-empty-state">Belum ada data berita dari CMS.</p> : recent.data.length ? <div className="admin-recent-list">{recent.data.map((item) => <div className="admin-recent-row" key={item.id}><span className="admin-news-mark">B</span><span><strong>{item.title}</strong><small>{new Date(item.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</small></span><em className={`admin-status ${item.status}`}>{item.status === "published" ? "Terbit" : "Draft"}</em></div>)}</div> : <p className="admin-empty-state">Belum ada berita. Mulai dengan menambahkan cerita kegiatan MBS.</p>}
        </section>
        <section className="admin-panel-card admin-quick-panel"><div className="admin-card-heading"><div><h2>Akses cepat</h2><p>Bagian yang sering diperbarui.</p></div></div><Link href="/admin/konten"><span>⌂</span><span><strong>Konten beranda</strong><small>Judul, profil, video, dan banner</small></span><b>→</b></Link><Link href="/admin/prestasi"><span>✳</span><span><strong>Galeri prestasi</strong><small>Poster dan keterangan pencapaian</small></span><b>→</b></Link><Link href="/admin/faq"><span>?</span><span><strong>Pertanyaan umum</strong><small>Jawaban untuk pengunjung</small></span><b>→</b></Link></section>
      </div>
    </>
  );
}
