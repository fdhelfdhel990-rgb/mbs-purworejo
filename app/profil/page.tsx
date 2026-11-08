import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import AchievementCarousel from "../components/achievement-carousel";
import { getPublicHomepageContent, youtubeEmbedUrl } from "../data/public-cms";
import { safeImageUrl } from "../data/image-utils";

export const metadata: Metadata = {
  title: "Profil Pesantren",
  description:
    "Profil lengkap Pondok Pesantren Modern MBS Purworejo. Informasi sejarah, visi dan misi pendidikan Islam, keunggulan karakter santri, dan fasilitas asrama.",
  alternates: {
    canonical: "/profil",
  },
  openGraph: {
    title: "Profil Pondok Pesantren Modern MBS Purworejo",
    description:
      "Profil lengkap Pondok Pesantren Modern MBS Purworejo. Informasi sejarah, visi dan misi pendidikan Islam, keunggulan karakter santri, dan fasilitas asrama.",
    url: "https://mbs-purworejo.vercel.app/profil",
    siteName: "Pondok Pesantren Modern MBS Purworejo",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/images/card.jpeg",
        width: 1200,
        height: 630,
        alt: "Profil Pondok Pesantren Modern MBS Purworejo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Profil Pondok Pesantren Modern MBS Purworejo",
    description:
      "Profil lengkap Pondok Pesantren Modern MBS Purworejo. Informasi sejarah, visi dan misi pendidikan Islam, keunggulan karakter santri, dan fasilitas asrama.",
    images: ["/images/card.jpeg"],
  },
};

export const instant = false;

export default async function ProfilPage() {
  const { settings, achievements } = await getPublicHomepageContent();
  const registrationLink = settings.registrationUrl || "https://forms.google.com";

  return (
    <main className="profile-page">
      <div className="content-width" style={{ paddingTop: "2.5rem", paddingBottom: "1rem" }}>
        <nav className="detail-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: "1.5rem" }}>
          <Link href="/">Beranda</Link>
          <span aria-hidden="true">&gt;</span>
          <span aria-current="page">Profil</span>
        </nav>
        <div className="section-heading" style={{ textAlign: "left", marginBottom: "2rem" }}>
          <span>Tentang Kami</span>
          <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 700, color: "var(--color-primary-dark, #0d3b2e)" }}>
            Profil Pondok Pesantren Modern MBS Purworejo
          </h1>
        </div>
      </div>

      <section className="profile content-width" id="profil" style={{ paddingTop: 0 }}>
        <div className="video-wrap">
          <iframe
            src={youtubeEmbedUrl(settings.profileVideoUrl)}
            title="Video profil Pondok Pesantren Modern MBS Purworejo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
            allowFullScreen
          />
          <span className="video-caption">
            <span className="play-mark" aria-hidden="true">&#9654;</span> Video Profil MBS Purworejo
          </span>
        </div>
        <div className="profile-copy">
          <h2>Mengenal MBS Purworejo</h2>
          <p>{settings.profileDescription}</p>
        </div>
      </section>

      <section className="values content-width" id="keunggulan">
        <div className="values-bg" aria-hidden="true">
          <Image src={safeImageUrl(settings.valuesImage)} alt="" fill unoptimized sizes="(max-width: 900px) 100vw, 50vw" />
        </div>
        <div className="values-copy">
          <h2>{settings.valuesTitle}</h2>
          <p>{settings.valuesDescription}</p>
        </div>
        <div className="values-list">
          <article>
            <span className="value-icon material-symbol" aria-hidden="true">menu_book</span>
            <div>
              <strong>Qur&#39;anic</strong>
              <small>Menanamkan kecintaan pada Al-Qur&#39;an dan nilai-nilai kebaikan.</small>
            </div>
          </article>
          <article>
            <span className="value-icon material-symbol" aria-hidden="true">school</span>
            <div>
              <strong>Ilmu &amp; adab</strong>
              <small>Mengembangkan wawasan dan membentuk karakter yang santun.</small>
            </div>
          </article>
          <article>
            <span className="value-icon material-symbol" aria-hidden="true">diversity_3</span>
            <div>
              <strong>Kemandirian</strong>
              <small>Membiasakan santri bertanggung jawab dalam keseharian.</small>
            </div>
          </article>
        </div>
      </section>

      <section className="achievements content-width" id="prestasi">
        <div className="achievement-container">
          <div className="section-heading">
            <span>Pencapaian</span>
            <h2>Galeri Prestasi Santri</h2>
          </div>
          <AchievementCarousel items={achievements.slice(0, 5)} />
        </div>
      </section>

      <section className="content-width" style={{ padding: "3rem 1rem", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Bergabung Bersama Kami</h2>
        <p style={{ maxWidth: "600px", margin: "0 auto 1.5rem", color: "var(--color-text-muted, #555)" }}>
          Buka potensi terbaik putra-putri Anda melalui pendidikan terpadu ilmu agama dan umum di MBS Purworejo.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a className="button button-green" href={registrationLink} target="_blank" rel="noopener noreferrer">
            Daftar PSB Sekarang <span aria-hidden="true">↗</span>
          </a>
          <Link className="button button-gold" href="/kontak">
            Hubungi Kami
          </Link>
        </div>
      </section>
    </main>
  );
}
