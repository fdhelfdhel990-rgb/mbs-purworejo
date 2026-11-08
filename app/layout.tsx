import type { Metadata } from "next";
import { Suspense } from "react";
import SiteHeader from "./components/site-header";
import SiteFooter from "./components/site-footer";
import WhatsAppFab from "./components/whatsapp-fab";
import ScrollReveal from "./components/scroll-reveal";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = "https://mbs-purworejo.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pondok Pesantren Modern MBS Purworejo",
    template: "%s | MBS Purworejo",
  },
  description:
    "Website resmi Pondok Pesantren Modern MBS Purworejo. Informasi profil, pendidikan, kegiatan, berita, dan pendaftaran santri baru.",
  keywords: [
    "Pondok Pesantren Modern MBS Purworejo",
    "MBS Purworejo",
    "Muhammadiyah Boarding School Purworejo",
    "Pesantren Purworejo",
    "Pondok Pesantren Modern",
    "Pendidikan Karakter Islami",
    "PSB MBS Purworejo",
    "Pendaftaran Santri Baru",
    "SMP MBS Purworejo",
    "SMA MBS Purworejo",
    "Pituruh Purworejo",
  ],
  authors: [{ name: "MBS Purworejo", url: siteUrl }],
  creator: "MBS Purworejo",
  publisher: "Pondok Pesantren Modern MBS Purworejo",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Pondok Pesantren Modern MBS Purworejo",
    description:
      "Website resmi Pondok Pesantren Modern MBS Purworejo. Informasi profil, pendidikan, kegiatan, berita, dan pendaftaran santri baru.",
    url: siteUrl,
    siteName: "Pondok Pesantren Modern MBS Purworejo",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/images/card.jpeg",
        width: 1200,
        height: 630,
        alt: "Pondok Pesantren Modern MBS Purworejo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pondok Pesantren Modern MBS Purworejo",
    description:
      "Website resmi Pondok Pesantren Modern MBS Purworejo. Informasi profil, pendidikan, kegiatan, berita, dan pendaftaran santri baru.",
    images: ["/images/card.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/images/icon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/images/icon.png",
    apple: "/images/icon.png",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export const instant = false;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": ["EducationalOrganization", "School"],
  name: "Pondok Pesantren Modern MBS Purworejo",
  alternateName: "MBS Purworejo",
  url: siteUrl,
  logo: `${siteUrl}/images/icon.png`,
  image: `${siteUrl}/images/card.jpeg`,
  description:
    "Website resmi Pondok Pesantren Modern MBS Purworejo. Informasi profil, pendidikan, kegiatan, berita, dan pendaftaran santri baru.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Jl. Srudutan No. 06, Dukuh Wetan, Pituruh",
    addressLocality: "Purworejo",
    addressRegion: "Jawa Tengah",
    postalCode: "54263",
    addressCountry: "ID",
  },
  telephone: "+6281234567890",
  sameAs: [
    "https://youtube.com",
    "https://instagram.com",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${poppins.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="/images/icon.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/images/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,0,0&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <Suspense fallback={<footer className="site-footer" id="kontak" suppressHydrationWarning />}>
          <SiteFooter />
        </Suspense>
        <Suspense fallback={null}>
          <WhatsAppFab />
        </Suspense>
        <ScrollReveal />
      </body>
    </html>
  );
}
