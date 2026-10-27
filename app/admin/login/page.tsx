import type { Metadata } from "next";
import AdminLoginForm from "../../components/admin-login-form";
import "../admin.css";

export const metadata: Metadata = {
  title: "Masuk Admin | MBS Purworejo",
  robots: { index: false, follow: false },
};
export const instant = false;

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AdminLoginForm accessError={error === "access"} />;
}
