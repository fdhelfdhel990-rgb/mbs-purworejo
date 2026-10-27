import type { Metadata } from "next";
import NewsBrowser from "../components/news-browser";
import { getPublicNewsArticles } from "../data/public-cms";

export const metadata: Metadata = {
  title: "Berita | MBS Purworejo",
  description: "Berita, cerita, dan kegiatan terbaru Pondok Pesantren Modern MBS Purworejo.",
};

export const instant = false;

export default async function BeritaPage() {
  const articles = await getPublicNewsArticles();
  return (
    <main className="news-page">
      <div className="news-page-inner">
        <NewsBrowser articles={articles} />
      </div>
    </main>
  );
}
