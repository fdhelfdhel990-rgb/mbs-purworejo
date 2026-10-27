"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);
  const isNewsPage = pathname === "/berita" || pathname.startsWith("/berita/");

  return (
    <header className="site-header" ref={headerRef}>
      <Link className="brand" href="/" aria-label="MBS Purworejo — Beranda" onClick={closeMenu}>
        <span className="brand-mark"><Image src="/images/icon.png" alt="" width={40} height={40} /></span>
        <span className="brand-copy">
          <span>PONDOK PESANTREN MODERN</span>
          <strong>MBS PURWOREJO</strong>
        </span>
      </Link>

      <button
        className={`menu-toggle ${open ? "is-open" : ""}`}
        type="button"
        aria-label={open ? "Tutup menu" : "Buka menu"}
        aria-expanded={open}
        aria-controls="primary-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        <span /><span /><span />
      </button>

      <nav id="primary-navigation" className={`main-nav ${open ? "is-open" : ""}`} aria-label="Navigasi utama">
        <Link className={pathname === "/" ? "nav-active" : ""} href="/" onClick={closeMenu}>Home</Link>
        <Link href="/#profil" onClick={closeMenu}>Profil</Link>
        <Link className={isNewsPage ? "nav-active" : ""} href="/berita" onClick={closeMenu}>Berita</Link>
        <Link className={pathname === "/kontak" ? "nav-active" : ""} href="/kontak" onClick={closeMenu}>Kontak</Link>
        <Link className="button button-gold mobile-nav-cta" href="/#pendaftaran" onClick={closeMenu}>Daftar PSB</Link>
      </nav>

      <Link className="button button-gold nav-cta" href="/#pendaftaran">Daftar PSB</Link>

    </header>
  );
}
