"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";

interface LayoutGuruProps {
  children: React.ReactNode;
  title?: string;
}

export default function LayoutGuru({
  children,
  title = "Panel Guru",
}: LayoutGuruProps) {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie =
      "session_teacher=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/guru");
  };

  return (
    <div className="app-container">
      <Header
        title={title}
        subtitle="Panel Guru CBT MIS An-Nur"
        onLogout={handleLogout}
      />
      <main className="main-content">{children}</main>
    </div>
  );
}
