import { createClient } from "@supabase/supabase-js";
import { defaultAchievements, type Achievement } from "./achievements";
import { newsArticles, type NewsArticle } from "./news";
import { safeImageUrl } from "./image-utils";

export type HomepageSettings = {
  arabic: string;
  heroKicker: string;
  heroTitle: string;
  heroImage: string;
  profileDescription: string;
  profileVideoUrl: string;
  valuesTitle: string;
  valuesDescription: string;
  valuesImage: string;
};

export const defaultHomepageSettings: HomepageSettings = {
  arabic: "معهد محمدية التربية الإسلامية الحديثة",
  heroKicker: "Pondok Pesantren Modern",
  heroTitle: "MBS Purworejo",
  heroImage: "/images/card.jpeg",
  profileDescription: "Pondok Pesantren Modern MBS Purworejo menghadirkan pendidikan Islami yang memadukan ilmu, karakter, dan kemandirian. Sejak 1986, kami mendampingi santri untuk bertumbuh menjadi pribadi yang beriman, berwawasan luas, dan membawa manfaat.",
  profileVideoUrl: "https://youtu.be/GrEcOhJ4900",
  valuesTitle: "Mendidik dengan Kasih Sayang, Keteladanan & Inspirasi",
  valuesDescription: "Di MBS Purworejo, pendidikan bukan sekadar transfer ilmu. Proses belajar dirancang untuk membangun karakter, menumbuhkan kepedulian, dan membiasakan santri mengamalkan ilmu dalam keseharian.",
  valuesImage: "/images/santri1.jpg",
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
type CmsNewsRow = { id: string; title: string; excerpt: string; paragraphs: unknown; image_url: string; category: string; published_at: string | null };
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
  const settings: HomepageSettings = rawSettings ? {
    ...defaultHomepageSettings,
    ...rawSettings,
    heroImage: safeImageUrl(rawSettings.heroImage, defaultHomepageSettings.heroImage),
    valuesImage: safeImageUrl(rawSettings.valuesImage, defaultHomepageSettings.valuesImage),
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
