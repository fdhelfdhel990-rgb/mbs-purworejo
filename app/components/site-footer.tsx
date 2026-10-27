import Link from "next/link";
import Image from "next/image";
import { getPublicFooterContent } from "../data/public-cms";

function SocialIcon({ name }: { name: "x" | "instagram" | "youtube" | "email" | "tiktok" }) {
  if (name === "youtube") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" /></svg>;
  if (name === "instagram") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2.2" /><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="2.2" /><circle cx="17.7" cy="6.6" r="1.35" fill="currentColor" /></svg>;
  if (name === "tiktok") return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.6 7.4a6.9 6.9 0 0 1-4.2-1.4v8.2a6.2 6.2 0 1 1-5.4-6.1v3.3a2.9 2.9 0 1 0 2.1 2.8V2h3.3c.2 2 1.8 3.8 4.2 4.1v1.3Z" /></svg>;
  if (name === "email") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m3.5 6 8.5 7 8.5-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.8 5.7 22H2.5l7.3-8.4L1.8 2h6.5l4.5 6.7L18.9 2Zm-1.1 17.8h1.7L7.3 4.1H5.5l12.3 15.7Z" /></svg>;
}

function ContactIcon({ name }: { name: "phone" | "location" | "email" }) {
  if (name === "phone") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.1 3.5 9.8 7a1.6 1.6 0 0 1-.1 2.1l-1.4 1.4a14.7 14.7 0 0 0 5.2 5.2l1.4-1.4a1.6 1.6 0 0 1 2.1-.1l3.5 2.7a1.6 1.6 0 0 1 .4 2.1l-.8 1.3a2.8 2.8 0 0 1-3 1.3A19.7 19.7 0 0 1 2.4 7.8a2.8 2.8 0 0 1 1.3-3l1.3-.8a1.6 1.6 0 0 1 2.1.4Z" fill="currentColor" /></svg>;
  if (name === "location") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 10.1c0 5-7 11.4-7 11.4S5 15.1 5 10.1a7 7 0 1 1 14 0Z" fill="currentColor" /><circle cx="12" cy="10" r="2.5" fill="#17601e" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="m3.5 6 8.5 7 8.5-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}

export default async function SiteFooter() {
  const footer = await getPublicFooterContent();

  return (
    <footer className="site-footer" id="kontak">
      <div className="footer-main content-width">
        <div className="footer-about">
          <Link className="brand brand-footer" href="/">
            <span className="brand-mark"><Image src="/images/icon.png" alt="" width={38} height={38} /></span>
            <span className="brand-copy"><span>PONDOK PESANTREN MODERN</span><strong>MBS PURWOREJO</strong></span>
          </Link>
          <p>{footer.aboutText}</p>
          <div className="social-links">
            {footer.xUrl && <a href={footer.xUrl} target="_blank" rel="noreferrer" aria-label="X (Twitter)"><SocialIcon name="x" /></a>}
            {footer.instagramUrl && <a href={footer.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram"><SocialIcon name="instagram" /></a>}
            {footer.youtubeUrl && <a href={footer.youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube"><SocialIcon name="youtube" /></a>}
            {footer.email && <a href={`mailto:${footer.email}`} aria-label="Email"><SocialIcon name="email" /></a>}
            {footer.tiktokUrl && <a href={footer.tiktokUrl} target="_blank" rel="noreferrer" aria-label="TikTok"><SocialIcon name="tiktok" /></a>}
          </div>
        </div>
        <div className="footer-links">
          <h3>Jelajahi</h3>
          <Link href="/#home">Beranda utama</Link>
          <Link href="/#profil">Profil</Link>
          <Link href="/berita">Berita</Link>
          <Link href="/#kontak">Kontak</Link>
        </div>
        <div className="footer-contact">
          <h3>Kontak Kami</h3>
          {footer.whatsappUrl ? (
            <a href={footer.whatsappUrl} target="_blank" rel="noreferrer">
              <span className="contact-icon"><ContactIcon name="phone" /></span>
              <span>{footer.phoneDisplay || footer.phone || "Hubungi Kami"}</span>
            </a>
          ) : footer.phone ? (
            <a href={`tel:${footer.phone}`}>
              <span className="contact-icon"><ContactIcon name="phone" /></span>
              <span>{footer.phoneDisplay || footer.phone}</span>
            </a>
          ) : null}
          {footer.address && (
            <span>
              <span className="contact-icon"><ContactIcon name="location" /></span>
              <span>{footer.address}</span>
            </span>
          )}
          {footer.email && (
            <a href={`mailto:${footer.email}`}>
              <span className="contact-icon"><ContactIcon name="email" /></span>
              <span>{footer.email}</span>
            </a>
          )}
        </div>
      </div>
      <div className="footer-bottom">{footer.copyright}</div>
    </footer>
  );
}
