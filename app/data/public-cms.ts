import { createClient } from "@supabase/supabase-js";
import { defaultAchievements, type Achievement } from "./achievements";
import { newsArticles, type NewsArticle } from "./news";

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
    image: article.image_url,
    category: article.category,
    date: article.published_at ? new Date(`${article.published_at}T00:00:00`).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "",
    title: article.title,
    excerpt: article.excerpt,
    paragraphs: Array.isArray(article.paragraphs) ? article.paragraphs as string[] : [],
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

  const settings = settingsResult.data?.data && typeof settingsResult.data.data === "object" ? { ...defaultHomepageSettings, ...(settingsResult.data.data as Partial<HomepageSettings>) } : defaultHomepageSettings;
  const articles: NewsArticle[] = articlesResult.error ? newsArticles : mapNewsRows((articlesResult.data ?? []) as unknown as CmsNewsRow[]);
  const achievements: Achievement[] = achievementResult.error ? defaultAchievements : (achievementResult.data ?? []).map((item) => ({ id: item.id, title: item.title, detail: item.detail, image: item.image_url, imageAlt: item.image_alt }));
  const faqs: FaqItem[] = faqResult.error ? defaultFaqs : (faqResult.data ?? []).map((item) => ({ id: item.id, question: item.question, answer: item.answer }));
  return { settings, articles, achievements, faqs };
}
