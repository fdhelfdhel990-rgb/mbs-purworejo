import type { Metadata } from "next";
import { getPublicDonationContent } from "../data/public-cms";
import DonationClient from "./donation-client";

export const metadata: Metadata = {
  title: "Donasi & Infaq — Pondok Pesantren Modern MBS Purworejo",
  description:
    "Salurkan infaq, sedekah, dan donasi terbaik Anda untuk mendukung pendidikan santri penghafal Al-Qur'an dan sarana pesantren MBS Purworejo.",
  alternates: {
    canonical: "/donasi",
  },
  openGraph: {
    title: "Donasi & Infaq — Pondok Pesantren Modern MBS Purworejo",
    description:
      "Salurkan infaq dan sedekah untuk pendidikan santri dan sarana Pondok Pesantren Modern MBS Purworejo.",
    url: "https://mbs-purworejo.vercel.app/donasi",
    siteName: "Pondok Pesantren Modern MBS Purworejo",
    locale: "id_ID",
    type: "website",
  },
};

export const instant = false;

export default async function DonasiPage() {
  const settings = await getPublicDonationContent();

  return (
    <main>
      <DonationClient settings={settings} />
    </main>
  );
}
