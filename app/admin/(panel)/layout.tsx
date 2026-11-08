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
        <Link className="admin-brand-card-link" href="/admin" title="Kembali ke Dashboard">
          <div className="admin-brand-card">
            <div className="admin-brand-mark">
              <Image src="/images/icon.png" alt="Logo MBS Purworejo" width={36} height={36} />
            </div>
            <div className="admin-brand-text">
              <strong className="admin-brand-card-title">MBS PURWOREJO</strong>
              <span className="admin-brand-card-sub">Pondok Pesantren Modern</span>
            </div>
          </div>
        </Link>

        <AdminNavigation />

        <div className="admin-sidebar-bottom">
          <Link className="admin-public-link" href="/" target="_blank">
            <span aria-hidden="true">↗</span>
            Lihat website publik
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-breadcrumb">
            <span>Workspace</span>
            <span className="admin-breadcrumb-sep">/</span>
            <strong>Panel Admin</strong>
          </div>

          <div className="admin-topbar-user">
            <div className="admin-user-pill">
              <span className="admin-avatar">
                {(profile.display_name || user.email || "A").slice(0, 1).toUpperCase()}
              </span>
              <div className="admin-user-meta">
                <strong>{profile.display_name || "Admin"}</strong>
                <small>{profile.role === "superadmin" ? "Super admin" : "Admin konten"}</small>
              </div>
            </div>
            <AdminLogout />
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
