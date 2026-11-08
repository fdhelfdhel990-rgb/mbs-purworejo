import type { Metadata } from "next";
import NewsBrowser from "../components/news-browser";
import { getPublicNewsArticles } from "../data/public-cms";

export const metadata: Metadata = {
  title: "Berita dan Kegiatan",
  description:
    "Kabar terbaru, artikel pendidikan, liputan prestasi, dan agenda kegiatan santri Pondok Pesantren Modern MBS Purworejo.",
  alternates: {
    canonical: "/berita",
  },
  openGraph: {
    title: "Berita dan Kegiatan | MBS Purworejo",
    description:
      "Kabar terbaru, artikel pendidikan, liputan prestasi, dan agenda kegiatan santri Pondok Pesantren Modern MBS Purworejo.",
    url: "https://mbs-purworejo.vercel.app/berita",
    siteName: "Pondok Pesantren Modern MBS Purworejo",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/images/card.jpeg",
        width: 1200,
        height: 630,
        alt: "Berita MBS Purworejo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Berita dan Kegiatan | MBS Purworejo",
    description:
      "Kabar terbaru, artikel pendidikan, liputan prestasi, dan agenda kegiatan santri Pondok Pesantren Modern MBS Purworejo.",
    images: ["/images/card.jpeg"],
  },
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
