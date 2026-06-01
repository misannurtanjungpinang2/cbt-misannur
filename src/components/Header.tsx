"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  hideLogout?: boolean;
  onLogout?: () => void;
  logoUrl?: string;
}

export default function Header({
  title = "MIS AN-NUR TANJUNGPINANG",
  subtitle,
  hideLogout = false,
  onLogout,
  logoUrl = "/logo.png",
}: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Default logout: redirect to home
      router.push("/");
    }
  };

  return (
    <header className="header">
      <Image
        src={logoUrl}
        alt="Logo MIS An-Nur"
        width={50}
        height={50}
        className="header-logo"
        onError={(e) => {
          // Hide image on error
          const img = e.currentTarget;
          img.style.display = "none";
        }}
      />
      <div className="header-text">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="header-spacer" />
      {!hideLogout && (
        <button
          className="btn btn-outline"
          style={{
            background: "rgba(255,255,255,0.15)",
            color: "white",
            borderColor: "rgba(255,255,255,0.4)",
            fontSize: "0.85rem",
            padding: "8px 18px",
          }}
          onClick={handleLogout}
          type="button"
        >
          Logout
        </button>
      )}
    </header>
  );
}
