import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CBT MIS An-Nur Tanjungpinang",
  description: "Ujian Asesmen Madrasah MIS An-Nur Tanjungpinang",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
