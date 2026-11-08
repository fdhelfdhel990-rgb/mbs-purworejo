import { createClient } from "@supabase/supabase-js";
import { defaultAchievements, type Achievement } from "./achievements";
import { newsArticles, type NewsArticle } from "./news";
import { safeImageUrl } from "./image-utils";

export type RegistrationTrack = {
  id: string;
  name: string;
  status: string;
  description: string;
  url?: string;
};

export const defaultRegistrationTracks: RegistrationTrack[] = [
  {
    id: "prestasi",
    name: "Jalur prestasi",
    status: "Pendaftaran dibuka",
    description: "Seleksi dan informasi menyusul",
    url: "",
  },
  {
    id: "reguler",
    name: "Jalur reguler",
    status: "Pendaftaran santri baru",
    description: "Informasi jadwal melalui panitia PSB",
    url: "",
  },
];

export type HeroSlideItem = {
  image: string;
  hasLink?: boolean;
  linkUrl?: string;
  openInNewTab?: boolean;
};

export type HomepageSettings = {
  arabic: string;
  heroKicker: string;
  heroTitle: string;
  heroImage: string;
  heroImages?: string[];
  heroSlides?: HeroSlideItem[];
  profileDescription: string;
  profileVideoUrl: string;
  valuesTitle: string;
  valuesDescription: string;
  valuesImage: string;
  registrationAcademicYear?: string;
  registrationUrl?: string;
  registrationPrestasiUrl?: string;
  registrationRegulerUrl?: string;
  registrationTracks?: RegistrationTrack[];
};

export const defaultHomepageSettings: HomepageSettings = {
  arabic: "معهد محمدية للتربية الإسلامية الحديثة",
  heroKicker: "Pondok Pesantren Modern",
  heroTitle: "MBS Purworejo",
  heroImage: "/images/card.jpeg",
  heroImages: ["/images/card.jpeg"],
  heroSlides: [{ image: "/images/card.jpeg", hasLink: false, linkUrl: "" }],
  profileDescription: "Pondok Pesantren Modern MBS Purworejo menghadirkan pendidikan Islami yang memadukan ilmu, karakter, dan kemandirian. Sejak 1986, kami mendampingi santri untuk bertumbuh menjadi pribadi yang beriman, berwawasan luas, dan membawa manfaat.",
  profileVideoUrl: "https://youtu.be/GrEcOhJ4900",
  valuesTitle: "Mendidik dengan Kasih Sayang, Keteladanan & Inspirasi",
  valuesDescription: "Di MBS Purworejo, pendidikan bukan sekadar transfer ilmu. Proses belajar dirancang untuk membangun karakter, menumbuhkan kepedulian, dan membiasakan santri mengamalkan ilmu dalam keseharian.",
  valuesImage: "/images/santri1.jpg",
  registrationAcademicYear: "PSB Tahun Ajaran 2026/2027",
  registrationUrl: "https://forms.google.com",
  registrationPrestasiUrl: "",
  registrationRegulerUrl: "",
  registrationTracks: defaultRegistrationTracks,
};

export type FooterSettings = {
  aboutText: string;
  phone: string;
  phoneDisplay: string;
  whatsappUrl: string;
  address: string;
  email: string;
  youtubeUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  xUrl: string;
  copyright: string;
};

export const defaultFooterSettings: FooterSettings = {
  aboutText: "Berdiri sejak 1986 di Pituruh, Kabupaten Purworejo, Jawa Tengah. Bersama menyiapkan generasi yang berilmu dan berakhlak.",
  phone: "081234567890",
  phoneDisplay: "0812 3456 7890",
  whatsappUrl: "https://wa.me/6281234567890",
  address: "Jl. Srudutan No. 06, Dukuh Wetan, Pituruh, Purworejo",
  email: "literasiremaja@gmail.com",
  youtubeUrl: "https://youtube.com",
  instagramUrl: "https://instagram.com",
  tiktokUrl: "https://tiktok.com",
  xUrl: "https://x.com",
  copyright: "© 2026 MBS Purworejo. All rights reserved.",
};

export function formatWhatsAppUrl(numberOrUrl?: string): string {
  if (!numberOrUrl) return "https://wa.me/6281234567890";
  const trimmed = numberOrUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const digits = trimmed.replace(/\D/g, "");
  const phoneCode = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${phoneCode || "6281234567890"}`;
}

export type FaqItem = { id: string; question: string; answer: string };
type CmsNewsRow = {
  id: string;
  title: string;
  excerpt: string;
  paragraphs: unknown;
  image_url: string;
  category: string;
  published_at: string | null;
  updated_at?: string | null;
};
const defaultFaqs: FaqItem[] = [
  { id: "faq-biaya", question: "Berapa biaya pendidikan per bulan?", answer: "Biaya pendidikan menyesuaikan jalur dan kebutuhan santri. Hubungi panitia PSB untuk memperoleh rincian biaya dan informasi terbaru." },
  { id: "faq-daftar", question: "Bagaimana cara mendaftar sebagai santri baru?", answer: "Isi formulir pendaftaran melalui tombol Daftar PSB atau hubungi panitia penerimaan santri baru kami." },
  { id: "faq-jenjang", question: "Apa saja jenjang pendidikan yang tersedia?", answer: "Informasi jenjang dan program pendidikan dapat ditanyakan langsung kepada tim penerimaan santri baru." },
  { id: "faq-asrama", question: "Apakah santri tinggal di asrama?", answer: "MBS Purworejo menyediakan lingkungan pesantren dan pendampingan santri. Hubungi kami untuk informasi kehidupan asrama." },
];

function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

export function youtubeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    let id = "";
    if (url.hostname === "youtu.be") id = url.pathname.slice(1);
    else if (url.hostname === "youtube.com" || url.hostname === "www.youtube.com" || url.hostname.endsWith(".youtube.com")) id = url.pathname === "/watch" ? url.searchParams.get("v") ?? "" : url.pathname.split("/").filter(Boolean).at(-1) ?? "";
    return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0` : "https://www.youtube-nocookie.com/embed/GrEcOhJ4900?rel=0";
  } catch {
    return "https://www.youtube-nocookie.com/embed/GrEcOhJ4900?rel=0";
  }
}

function mapNewsRows(rows: CmsNewsRow[]): NewsArticle[] {
  return rows.map((article) => ({
    id: article.id,
    image: safeImageUrl(article.image_url, "/images/card.jpeg"),
    category: article.category || "Kegiatan",
    date: article.published_at ? new Date(`${article.published_at}T00:00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "",
    publishedAt: article.published_at ? `${article.published_at}T00:00:00.000Z` : undefined,
    updatedAt: article.updated_at || undefined,
    title: article.title,
    excerpt: article.excerpt,
    paragraphs: Array.isArray(article.paragraphs) ? article.paragraphs as string[] : typeof article.paragraphs === "string" ? [article.paragraphs] : [],
  }));
}

export async function getPublicNewsArticles() {
  const client = getPublicClient();
  if (!client) return newsArticles;
  const { data, error } = await client.from("news_articles").select("*").eq("status", "published").order("published_at", { ascending: false });
  if (error) return newsArticles;
  return mapNewsRows((data ?? []) as unknown as CmsNewsRow[]);
}

export async function getPublicHomepageContent() {
  const client = getPublicClient();
  if (!client) return { settings: defaultHomepageSettings, articles: newsArticles, achievements: defaultAchievements, faqs: defaultFaqs };

  const [settingsResult, articlesResult, achievementResult, faqResult] = await Promise.all([
    client.from("site_settings").select("data").eq("key", "homepage").maybeSingle(),
    client.from("news_articles").select("*").eq("status", "published").order("published_at", { ascending: false }),
    client.from("achievements").select("*").eq("status", "published").order("sort_order", { ascending: true }),
    client.from("faqs").select("*").eq("status", "published").order("sort_order", { ascending: true }),
  ]);

  const rawSettings = settingsResult.data?.data && typeof settingsResult.data.data === "object" ? settingsResult.data.data as Partial<HomepageSettings> : null;
  const baseHeroImg = safeImageUrl(rawSettings?.heroImage, defaultHomepageSettings.heroImage);

  let resolvedHeroSlides: HeroSlideItem[] = [];
  if (Array.isArray(rawSettings?.heroSlides) && rawSettings.heroSlides.length > 0) {
    resolvedHeroSlides = rawSettings.heroSlides
      .filter((s) => s && typeof s === "object" && typeof s.image === "string" && s.image.trim().length > 0)
      .slice(0, 3)
      .map((s) => ({
        image: safeImageUrl(s.image, baseHeroImg),
        hasLink: Boolean(s.hasLink),
        linkUrl: typeof s.linkUrl === "string" ? s.linkUrl.trim() : "",
        openInNewTab: Boolean(s.openInNewTab),
      }));
  } else if (Array.isArray(rawSettings?.heroImages) && rawSettings.heroImages.length > 0) {
    resolvedHeroSlides = rawSettings.heroImages
      .filter((url) => typeof url === "string" && url.trim().length > 0)
      .slice(0, 3)
      .map((url) => ({
        image: safeImageUrl(url, baseHeroImg),
        hasLink: false,
        linkUrl: "",
      }));
  }

  if (resolvedHeroSlides.length === 0) {
    resolvedHeroSlides = [{ image: baseHeroImg, hasLink: false, linkUrl: "" }];
  }

  const resolvedHeroImages = resolvedHeroSlides.map((s) => s.image);

  const settings: HomepageSettings = rawSettings ? {
    ...defaultHomepageSettings,
    ...rawSettings,
    heroImage: resolvedHeroImages[0] || baseHeroImg,
    heroImages: resolvedHeroImages,
    heroSlides: resolvedHeroSlides,
    valuesImage: safeImageUrl(rawSettings.valuesImage, defaultHomepageSettings.valuesImage),
    registrationAcademicYear: rawSettings.registrationAcademicYear || defaultHomepageSettings.registrationAcademicYear,
    registrationUrl: rawSettings.registrationUrl || defaultHomepageSettings.registrationUrl,
    registrationPrestasiUrl: rawSettings.registrationPrestasiUrl || "",
    registrationRegulerUrl: rawSettings.registrationRegulerUrl || "",
    registrationTracks: Array.isArray(rawSettings.registrationTracks) && rawSettings.registrationTracks.length > 0
      ? rawSettings.registrationTracks
      : defaultRegistrationTracks,
  } : defaultHomepageSettings;

  const articles: NewsArticle[] = articlesResult.error ? newsArticles : mapNewsRows((articlesResult.data ?? []) as unknown as CmsNewsRow[]);
  const achievements: Achievement[] = achievementResult.error
    ? defaultAchievements.slice(0, 5)
    : (achievementResult.data ?? []).slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    image: safeImageUrl(item.image_url, "/images/prestasi1.jpg"),
    imageAlt: item.image_alt || item.title || "Prestasi santri MBS Purworejo",
  }));
  const faqs: FaqItem[] = faqResult.error ? defaultFaqs : (faqResult.data ?? []).map((item) => ({ id: item.id, question: item.question, answer: item.answer }));
  return { settings, articles, achievements, faqs };
}

export async function getPublicFooterContent(): Promise<FooterSettings> {
  const client = getPublicClient();
  if (!client) return defaultFooterSettings;
  const { data, error } = await client.from("site_settings").select("data").eq("key", "footer").maybeSingle();
  if (error || !data?.data || typeof data.data !== "object") return defaultFooterSettings;
  return { ...defaultFooterSettings, ...(data.data as Partial<FooterSettings>) };
}

export type BankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

export type DonationSettings = {
  enabled: boolean;
  campaignTitle: string;
  campaignCategory: string;
  campaignSubtitle: string;
  campaignDescription: string;
  campaignImage: string;
  targetAmount: number;
  collectedAmount: number;
  donorCount: number;
  quickAmounts: number[];
  qrisEnabled: boolean;
  qrisImage: string;
  qrisMerchantName: string;
  bankAccounts: BankAccount[];
  confirmationPhone: string;
  confirmationName: string;
  disclaimerText: string;
};

export const defaultDonationSettings: DonationSettings = {
  enabled: true,
  campaignTitle: "Donasi Pengembangan Pendidikan & Fasilitas Santri",
  campaignCategory: "Infaq & Sedekah Pendidikan",
  campaignSubtitle: "Salurkan infaq dan donasi terbaik Anda untuk mencetak generasi penghafal Al-Qur'an dan kader dakwah berakhlak mulia di MBS Purworejo.",
  campaignDescription: "Setiap rupiah infaq dan donasi yang Anda amanahkan akan disalurkan untuk pemenuhan fasilitas asrama, laboratorium, beasiswa santri berprestasi/dhuafa, serta pengembangan sarana ibadah di lingkungan Pondok Pesantren Modern MBS Purworejo.",
  campaignImage: "/images/card.jpeg",
  targetAmount: 250000000,
  collectedAmount: 85400000,
  donorCount: 146,
  quickAmounts: [25000, 50000, 100000, 250000, 500000, 1000000],
  qrisEnabled: true,
  qrisImage: "",
  qrisMerchantName: "MBS PURWOREJO / LAZISMU",
  bankAccounts: [
    {
      id: "bank-bsi",
      bankName: "Bank Syariah Indonesia (BSI)",
      accountNumber: "7188822331",
      accountHolder: "Ponpes Modern MBS Purworejo",
    },
    {
      id: "bank-jateng",
      bankName: "Bank Jateng Syariah",
      accountNumber: "5032001122",
      accountHolder: "MBS Purworejo Infaq",
    },
    {
      id: "bank-bri",
      bankName: "Bank BRI",
      accountNumber: "007701001234538",
      accountHolder: "Pondok Pesantren Modern MBS Purworejo",
    },
  ],
  confirmationPhone: "6281234567890",
  confirmationName: "Bendahara MBS Purworejo",
  disclaimerText: "Dengan mengisi formulir ini, saya menyatakan bahwa zakat, infak, sedekah, serta donasi yang ditunaikan berasal dari harta halal yang dimiliki secara sah dan sempurna sesuai ketentuan syariat Islam.",
};

export async function getPublicDonationContent(): Promise<DonationSettings> {
  const client = getPublicClient();
  if (!client) return defaultDonationSettings;
  const { data, error } = await client.from("site_settings").select("data").eq("key", "donation").maybeSingle();
  if (error || !data?.data || typeof data.data !== "object") return defaultDonationSettings;
  const d = data.data as Partial<DonationSettings>;

  const bankAccounts = Array.isArray(d.bankAccounts) && d.bankAccounts.length > 0
    ? (d.bankAccounts as BankAccount[]).map((b, i) => ({
        id: b.id || `bank-${i}`,
        bankName: b.bankName || "Bank Transfer",
        accountNumber: b.accountNumber || "",
        accountHolder: b.accountHolder || "MBS Purworejo",
      }))
    : defaultDonationSettings.bankAccounts;

  return {
    ...defaultDonationSettings,
    ...d,
    campaignImage: safeImageUrl(d.campaignImage, defaultDonationSettings.campaignImage),
    qrisImage: safeImageUrl(d.qrisImage, ""),
    targetAmount: Number(d.targetAmount) || defaultDonationSettings.targetAmount,
    collectedAmount: Number(d.collectedAmount) || defaultDonationSettings.collectedAmount,
    donorCount: Number(d.donorCount) || defaultDonationSettings.donorCount,
    quickAmounts: Array.isArray(d.quickAmounts) && d.quickAmounts.length > 0
      ? d.quickAmounts.map(Number).filter((n) => !isNaN(n) && n > 0)
      : defaultDonationSettings.quickAmounts,
    bankAccounts,
  };
}
