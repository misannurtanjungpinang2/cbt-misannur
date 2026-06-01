"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { label: "Atur Jadwal", href: "/admin/atur", icon: "⚙️" },
  { label: "Soal", href: "/admin/soal", icon: "📝" },
  { label: "Hasil Ujian", href: "/admin/hasil", icon: "📋" },
];

interface LayoutAdminProps {
  children: React.ReactNode;
  title?: string;
}

export default function LayoutAdmin({
  children,
  title = "Admin Panel",
}: LayoutAdminProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    // Clear admin session (cookie-based)
    document.cookie =
      "admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/admin");
  };

  return (
    <div className="app-container">
      <Header
        title={title}
        subtitle="Panel Administrasi CBT MIS An-Nur"
        onLogout={handleLogout}
      />
      <main className="main-content">
        <div className="admin-layout">
          <aside className="admin-sidebar no-print">
            <h4>📌 Menu Admin</h4>
            <nav className="admin-nav">
              {navItems.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={isActive ? "active" : ""}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div style={{ marginTop: "auto", paddingTop: 16 }}>
              <button
                className="btn btn-outline btn-sm"
                style={{ width: "100%" }}
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            </div>
          </aside>
          <div className="admin-content">{children}</div>
        </div>
      </main>
    </div>
  );
}
