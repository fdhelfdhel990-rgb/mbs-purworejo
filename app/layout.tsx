import type { Metadata } from "next";
import { Suspense } from "react";
import SiteHeader from "./components/site-header";
import SiteFooter from "./components/site-footer";
import ScrollReveal from "./components/scroll-reveal";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MBS Purworejo | Pondok Pesantren Modern",
  description:
    "Pondok Pesantren Modern MBS Purworejo. Pendidikan Islami yang memadukan ilmu, karakter, dan kemandirian.",
  icons: {
    icon: [
      { url: "/images/icon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/images/icon.png",
    apple: "/images/icon.png",
  },
};

export const instant = false;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${poppins.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/images/icon.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/images/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0,0"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <ScrollReveal />
        {children}
        <Suspense fallback={<footer className="site-footer" id="kontak" />}>
          <SiteFooter />
        </Suspense>
        <a className="whatsapp-fab" href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" aria-label="Hubungi MBS Purworejo melalui WhatsApp">
          <svg className="whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.4-4.7a8.5 8.5 0 1 1 16.1-4.1Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M8.4 7.8c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 1.8c.1.2.1.4-.1.6l-.6.7c-.2.2-.2.4-.1.6.7 1.2 1.6 2.1 2.8 2.7.2.1.4.1.6-.1l.8-.9c.2-.2.4-.2.6-.1l1.7.8c.3.1.4.3.4.5 0 .4-.2 1.3-.8 1.7-.6.5-1.4.7-2.3.5-1-.2-2.3-.7-3.9-2.1-1.9-1.7-3-3.8-3.2-4.7-.2-.9 0-1.5.3-1.9.4-.4.8-.6 1-.6Z" fill="currentColor" /></svg>
          <span className="whatsapp-label">Hubungi kami</span>
        </a>
      </body>
    </html>
  );
}
