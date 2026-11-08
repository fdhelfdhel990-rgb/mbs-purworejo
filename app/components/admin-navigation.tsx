"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavGroup = {
  category: string;
  items: {
    href: string;
    label: string;
    number: string;
  }[];
};

const navGroups: NavGroup[] = [
  {
    category: "UMUM",
    items: [
      { href: "/admin", label: "Dashboard", number: "01" },
    ],
  },
  {
    category: "MANAJEMEN KONTEN",
    items: [
      { href: "/admin/konten", label: "Konten Beranda", number: "02" },
      { href: "/admin/berita", label: "Berita & Artikel", number: "03" },
      { href: "/admin/prestasi", label: "Prestasi Santri", number: "04" },
      { href: "/admin/faq", label: "Tanya Jawab (FAQ)", number: "05" },
    ],
  },
  {
    category: "PENGATURAN & LAYANAN",
    items: [
      { href: "/admin/pendaftaran", label: "Pendaftaran (PSB)", number: "06" },
      { href: "/admin/footer", label: "Kontak & Footer", number: "07" },
    ],
  },
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className="admin-navigation" aria-label="Navigasi panel admin">
      {navGroups.map((group) => (
        <div key={group.category} className="admin-nav-group">
          <span className="admin-nav-group-title">{group.category}</span>
          <div className="admin-nav-group-items">
            {group.items.map((item) => {
              const isActive = item.href === "/admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-item ${isActive ? "is-active" : ""}`}
                >
                  <span className="admin-nav-num">{item.number}</span>
                  <span className="admin-nav-label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
