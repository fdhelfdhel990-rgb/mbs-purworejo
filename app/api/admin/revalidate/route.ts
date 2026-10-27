import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesi admin tidak ditemukan." }, { status: 401 });
  const { data: profile } = await supabase.from("admin_profiles").select("active").eq("id", user.id).maybeSingle();
  if (!profile?.active) return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 });

  revalidatePath("/");
  revalidatePath("/berita");
  revalidatePath("/berita/detail");
  return NextResponse.json({ revalidated: true });
}
