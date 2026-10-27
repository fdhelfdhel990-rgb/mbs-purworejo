import { notFound } from "next/navigation";
import AchievementForm from "../../../components/achievement-form";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";
import { defaultAchievements } from "../../../../data/achievements";

export default async function AdminAchievementEditPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) notFound();

  let achievementData: {
    id?: string;
    title: string;
    detail: string;
    image_url: string;
    image_alt?: string;
    year?: number | null;
    sort_order?: number | null;
    status: string;
  } | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("achievements")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    achievementData = data;
  } catch (err) {
    console.warn("Could not query supabase for achievement edit:", err);
  }

  if (!achievementData) {
    const fallback = defaultAchievements.find((a) => a.id === id);
    if (fallback) {
      achievementData = {
        id: fallback.id,
        title: fallback.title,
        detail: fallback.detail,
        image_url: fallback.image,
        image_alt: fallback.imageAlt || fallback.title,
        year: new Date().getFullYear(),
        sort_order: 0,
        status: "published",
      };
    }
  }

  if (!achievementData) notFound();

  const formattedInitialData = {
    id: achievementData.id,
    title: achievementData.title,
    detail: achievementData.detail || "",
    image_url: achievementData.image_url,
    image_alt: achievementData.image_alt || achievementData.title,
    year: (achievementData.year ?? new Date().getFullYear()) as number | "",
    sort_order: achievementData.sort_order ?? 0,
    status: (achievementData.status as "published" | "draft") || "published",
  };

  return <AchievementForm initialData={formattedInitialData} isEdit={true} />;
}

