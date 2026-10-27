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
        <Suspense fallback={null}>
          <WhatsAppFab />
        </Suspense>
      </body>
    </html>
  );
}
