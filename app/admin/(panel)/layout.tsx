import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient, hasSupabaseConfig } from "../../../lib/supabase/server";
import AdminLogout from "../../components/admin-logout";
import AdminNavigation from "../../components/admin-navigation";
import "../admin.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const instant = false;

export default async function AdminPanelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  if (!hasSupabaseConfig()) redirect("/admin/login");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("admin_profiles").select("display_name, role, active").eq("id", user.id).maybeSingle();
  if (!profile?.active) redirect("/admin/login?error=access");

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-sidebar-brand" href="/admin">
          <Image src="/images/icon.png" alt="" width={40} height={40} />
          <span><strong>MBS PURWOREJO</strong><small>CMS Website</small></span>
        </Link>
        <div className="admin-sidebar-label">PENGELOLAAN</div>
        <AdminNavigation />
        <div className="admin-sidebar-bottom">
          <div className="admin-user"><span className="admin-avatar">{(profile.display_name || user.email || "A").slice(0, 1).toUpperCase()}</span><span><strong>{profile.display_name}</strong><small>{profile.role === "superadmin" ? "Superadmin" : "Admin konten"}</small></span></div>
          <AdminLogout />
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar"><span>Panel pengelola</span><Link href="/" target="_blank">Lihat website <span aria-hidden="true">↗</span></Link></header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
