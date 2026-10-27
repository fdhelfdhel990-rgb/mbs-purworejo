import { notFound } from "next/navigation";
import NewsForm from "../../../components/news-form";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";
import { getPublicNewsArticles } from "../../../../data/public-cms";

export default async function AdminNewsEditPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) notFound();

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
    published_at: articleData.published_at || "",
    paragraphs: Array.isArray(articleData.paragraphs)
      ? articleData.paragraphs.join("\n")
      : String(articleData.paragraphs || ""),
    status: (articleData.status as "published" | "draft") || "published",
  };

  return <NewsForm initialData={formattedInitialData} isEdit={true} />;
}
