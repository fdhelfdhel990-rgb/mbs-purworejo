import { notFound } from "next/navigation";
import { connection } from "next/server";
import NewsForm from "../../../components/news-form";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";
import { getPublicNewsArticles } from "../../../../data/public-cms";

function toValidDateInput(dateVal?: string): string {
  if (!dateVal) return new Date().toISOString().slice(0, 10);
  const trimmed = dateVal.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

  const months: Record<string, string> = {
    januari: "01", februari: "02", maret: "03", april: "04", mei: "05", juni: "06",
    juli: "07", agustus: "08", september: "09", oktober: "10", november: "11", desember: "12"
  };
  const parts = trimmed.toLowerCase().split(/[\s,]+/);
  let day = "";
  let month = "";
  let year = "";
  for (const part of parts) {
    if (months[part]) {
      month = months[part];
    } else if (/^\d{4}$/.test(part)) {
      year = part;
    } else if (/^\d{1,2}$/.test(part) && !day) {
      day = part.padStart(2, "0");
    }
  }
  if (year && month && day) {
    return `${year}-${month}-${day}`;
  }

  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

export const instant = false;

export default async function AdminNewsEditPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await connection();
  const rawId = (await searchParams).id;
  if (!rawId) notFound();
  const id = decodeURIComponent(rawId).trim();

  let articleData: {
    id: string;
    title: string;
    category: string;
    excerpt: string;
    image_url: string;
    image_alt?: string;
    published_at?: string;
    paragraphs: unknown;
    status: string;
  } | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("news_articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    articleData = data;
  } catch (err) {
    console.warn("Could not query supabase for article edit:", err);
  }

  if (!articleData) {
    const publicArticles = await getPublicNewsArticles();
    const fallback = publicArticles.find((a) => a.id === id);
    if (fallback) {
      articleData = {
        id: fallback.id,
        title: fallback.title,
        category: fallback.category,
        excerpt: fallback.excerpt,
        image_url: fallback.image,
        image_alt: fallback.title,
        published_at: fallback.date || "",
        paragraphs: fallback.paragraphs,
        status: "published",
      };
    }
  }

  if (!articleData) notFound();

  const formattedInitialData = {
    id: articleData.id,
    title: articleData.title,
    category: articleData.category,
    excerpt: articleData.excerpt,
    image_url: articleData.image_url,
    image_alt: articleData.image_alt || "",
    published_at: toValidDateInput(articleData.published_at || ""),
    paragraphs: Array.isArray(articleData.paragraphs)
      ? articleData.paragraphs.join("\n")
      : String(articleData.paragraphs || ""),
    status: (articleData.status as "published" | "draft") || "published",
  };

  return <NewsForm key={formattedInitialData.id} initialData={formattedInitialData} isEdit={true} />;
}
