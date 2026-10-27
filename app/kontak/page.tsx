import type { Metadata } from "next";
import ContactForm from "../components/contact-form";

export const metadata: Metadata = {
  title: "Kontak dan Kunjungan | MBS Purworejo",
  description: "Hubungi MBS Purworejo atau jadwalkan kunjungan ke pesantren.",
};

const address = "Jl. Srudutan No. 06, Dukuh Wetan, Pituruh, Kabupaten Purworejo, Jawa Tengah 54263";

export default function KontakPage() {
  const mapQuery = encodeURIComponent(address);

  return (
    <main className="contact-page">
      <div className="contact-page-inner">
        <header className="contact-intro">
          <h1>Jadwalkan kunjungan ke MBS Purworejo!</h1>
          <p>
            Kami sangat senang Anda tertarik untuk mengunjungi pondok kami! Kami membuka
            kesempatan bagi Anda untuk melihat lebih dekat bagaimana kami menyelenggarakan
            pendidikan dan kegiatan sehari-hari di PPM MBS Purworejo.
          </p>
        </header>

        <div className="contact-columns">
          <ContactForm />
          <section className="contact-location" aria-labelledby="location-title">
            <h2 id="location-title">Pondok Pesantren MBS Purworejo</h2>
            <p>{address}</p>
            <iframe
              className="contact-map"
              title="Peta lokasi Pondok Pesantren MBS Purworejo"
              src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a
              className="contact-map-link"
              href="https://maps.app.goo.gl/H7XxfTn3rybz36fX9"
              target="_blank"
              rel="noreferrer"
            >Buka lokasi di Google Maps <span aria-hidden="true">↗</span></a>
          </section>
        </div>
      </div>
    </main>
  );
}
