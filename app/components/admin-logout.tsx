"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

export default function AdminLogout() {
  const router = useRouter();
  const logout = async () => {
    await createSupabaseBrowserClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };
  return <button className="admin-logout" type="button" onClick={logout}><span aria-hidden="true">↪</span> Keluar</button>;
}
