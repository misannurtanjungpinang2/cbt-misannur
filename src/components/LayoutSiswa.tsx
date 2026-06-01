"use client";

import React from "react";
import Header from "./Header";

interface LayoutSiswaProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  hideLogout?: boolean;
  onLogout?: () => void;
}

export default function LayoutSiswa({
  children,
  title,
  subtitle,
  hideLogout = false,
  onLogout,
}: LayoutSiswaProps) {
  return (
    <div className="app-container">
      <Header
        title={title || "MIS AN-NUR TANJUNGPINANG"}
        subtitle={subtitle}
        hideLogout={hideLogout}
        onLogout={onLogout}
      />
      <main className="main-content">{children}</main>
    </div>
  );
}
