import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import NewsShare from "../../components/news-share";
import FormattedArticleBody from "../../components/formatted-article-body";
import { getPublicNewsArticles } from "../../data/public-cms";
import { safeImageUrl } from "../../data/image-utils";

export const metadata: Metadata = {
  title: "Semangat 20 Relawan Membina Perpustakaan Desa | MBS Purworejo",
  description: "Cerita kegiatan literasi relawan di wilayah Tambun Selatan.",
};

export const instant = false;

export default async function BeritaDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const articles = await getPublicNewsArticles();
  const article = id ? articles.find((item) => item.id === id) : articles[0];

  const recentNews = article ? articles.filter((item) => item.id !== article.id).slice(0, 4) : [];

  if (!article) notFound();

  return (
    <main className="news-detail-page">
      <div className="news-detail-inner">
        <nav className="detail-breadcrumb" aria-label="Breadcrumb">
          <Link href="/berita">Berita</Link><span aria-hidden="true">&gt;</span><span aria-current="page">Detail</span>
        </nav>

        <div className="news-detail-layout">
          <article className="news-article">
            <div className="detail-hero-image"><Image src={safeImageUrl(article.image)} alt={`Foto: ${article.title}`} fill priority sizes="(max-width: 900px) 100vw, 66vw" /></div>
            <div className="detail-share-row"><span>Bagikan:</span><NewsShare title={article.title} /></div>
            <h1>{article.title}</h1>
            <p className="detail-date"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M7 3v4m10-4v4M3 10h18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>{article.date}</p>
            <FormattedArticleBody paragraphs={article.paragraphs} />
          </article>

          <aside className="detail-sidebar">
            <form className="detail-search" action="/berita" role="search">
              <label htmlFor="detail-search">Pencarian</label>
              <div><input id="detail-search" name="q" placeholder="Kata Kunci..." /><button type="submit" aria-label="Cari berita"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m16 16 4.2 4.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></button></div>
            </form>
            <section className="latest-news">
              <h2>Berita Terbaru</h2>
              <div className="latest-news-list">
                {recentNews.map((item) => (
                  <Link className="latest-news-item" href={`/berita/detail?id=${item.id}`} key={item.id}>
                    <span className="latest-news-image"><Image src={safeImageUrl(item.image)} alt="" fill sizes="56px" /></span>
                    <span className="latest-news-copy"><strong>{item.title}</strong><small>{item.date}</small></span>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
