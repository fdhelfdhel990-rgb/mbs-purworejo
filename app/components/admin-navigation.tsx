"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Ringkasan", icon: "▦" },
  { href: "/admin/konten", label: "Konten beranda", icon: "⌂" },
  { href: "/admin/berita", label: "Berita", icon: "▤" },
  { href: "/admin/prestasi", label: "Prestasi", icon: "✳" },
  { href: "/admin/faq", label: "FAQ", icon: "?" },
  { href: "/admin/media", label: "Media", icon: "▧" },
];

export default function AdminNavigation() {
  const pathname = usePathname();
  return <nav className="admin-navigation" aria-label="Navigasi panel admin">{items.map((item) => <Link className={(item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href)) ? "is-active" : ""} href={item.href} key={item.href}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>)}</nav>;
}
