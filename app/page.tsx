import AchievementCarousel from "./components/achievement-carousel";
import HeroBackdrop from "./components/hero-backdrop";
import Image from "next/image";
import Link from "next/link";
import { getPublicHomepageContent, youtubeEmbedUrl } from "./data/public-cms";
import { safeImageUrl } from "./data/image-utils";

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow?: string;
  title: string;
}) {
  return (
    <div className="section-heading">
      {eyebrow && <span>{eyebrow}</span>}
      <h2>{title}</h2>
    </div>
  );
}

export default async function Home() {
  const { settings, articles, achievements, faqs } = await getPublicHomepageContent();
  return (
    <>
      <main>
        <section className="hero" id="home">
          <HeroBackdrop src={safeImageUrl(settings.heroImage)} />
          <div className="hero-clouds" aria-hidden="true">
            <span className="cloud cloud-one" />
            <span className="cloud cloud-two" />
            <span className="cloud cloud-three" />
          </div>
          <div className="hero-content">
            <p className="arabic" lang="ar" dir="rtl">{settings.arabic}</p>
            <p className="hero-kicker">{settings.heroKicker}</p>
            <h1>{settings.heroTitle}</h1>
          </div>
        </section>

        <section className="profile content-width" id="profil">
          <div className="video-wrap">
            <iframe
              src={youtubeEmbedUrl(settings.profileVideoUrl)}
              title="Video profil Pondok Pesantren Modern MBS Purworejo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              allowFullScreen
            />
            <span className="video-caption"><span className="play-mark" aria-hidden="true">&#9654;</span> Profil MBS Purworejo</span>
          </div>
          <div className="profile-copy">
            <h2>Profil Singkat</h2>
            <p>
              {settings.profileDescription}
            </p>
          </div>
        </section>

        <section className="values content-width" id="keunggulan">
          <div className="values-bg" aria-hidden="true"><Image src={safeImageUrl(settings.valuesImage)} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" /></div>
          <div className="values-copy">
            <h2>{settings.valuesTitle}</h2>
            <p>{settings.valuesDescription}</p>
          </div>
          <div className="values-list">
            <article><span className="value-icon material-symbol" aria-hidden="true">menu_book</span><div><strong>Qur&#39;anic</strong><small>Menanamkan kecintaan pada Al-Qur&#39;an dan nilai-nilai kebaikan.</small></div></article>
            <article><span className="value-icon material-symbol" aria-hidden="true">school</span><div><strong>Ilmu &amp; adab</strong><small>Mengembangkan wawasan dan membentuk karakter yang santun.</small></div></article>
            <article><span className="value-icon material-symbol" aria-hidden="true">diversity_3</span><div><strong>Kemandirian</strong><small>Membiasakan santri bertanggung jawab dalam keseharian.</small></div></article>
          </div>        </section>

        <section className="achievements content-width" id="prestasi">
          <div className="achievement-container">
            <SectionHeading title="Galeri Prestasi" />
            <AchievementCarousel items={achievements} />
          </div>
        </section>

        <section className="news-section" id="berita">
          <div className="content-width">
            <SectionHeading title="Kabar Pesantren" />
            <div className="news-grid">
              {articles.slice(0, 6).map((item) => (
                <Link className="news-card" href={`/berita/detail?id=${item.id}`} key={item.id}>
                  <div className="news-image"><Image src={safeImageUrl(item.image)} alt={`Foto: ${item.title}`} fill sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw" /></div>
                  <div className="news-copy">
                    <span className="news-date">{item.date}</span>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                    <span className="home-news-readmore">Baca selengkapnya <span aria-hidden="true">&#8594;</span></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className="faq content-width" id="faq">
          <SectionHeading eyebrow="Seputar Pertanyaan" title="FAQ" />
          <div className="faq-list">
            {faqs.map((faq) => (
              <details className="faq-item" key={faq.id}>
                <summary>{faq.question}<span className="faq-arrow" aria-hidden="true">chevron_right</span></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="admission content-width" id="pendaftaran">
          <div className="admission-copy"><span className="eyebrow">Penerimaan santri baru</span><h2>Ayo gali potensi diri<br />bersama MBS Purworejo!</h2><p>Mulai perjalanan belajar yang penuh makna. Tumbuh dalam lingkungan Islami dan raih cita-cita bersama keluarga besar MBS Purworejo.</p><p className="admission-note">Mari bergabung bersama keluarga besar MBS Purworejo.</p><div className="admission-actions"><a className="button button-green" href="https://wa.me/6281234567890">Daftar sekarang <span aria-hidden="true">↗</span></a><a className="button button-gold" href="#jadwal">Info PSB</a></div></div>
          <div className="schedule" id="jadwal"><span className="schedule-label">Jalur pendaftaran</span><h3>PSB Tahun Ajaran 2026/2027</h3><div className="schedule-row"><strong>Jalur prestasi</strong><span><b>Pendaftaran dibuka</b>Seleksi dan informasi menyusul</span><span className="schedule-status">Daftar</span></div><div className="schedule-row"><strong>Jalur reguler</strong><span><b>Pendaftaran santri baru</b>Informasi jadwal melalui panitia PSB</span><span className="schedule-status">Daftar</span></div></div>
        </section>
      </main>

    </>
  );
}
