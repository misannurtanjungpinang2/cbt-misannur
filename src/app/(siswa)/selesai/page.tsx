"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LayoutSiswa from "@/components/LayoutSiswa";

function SelesaiContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const score = searchParams?.get("score") ?? "0";
  const totalPg = searchParams?.get("totalPg") ?? "0";
  const now = new Date();
  const waktuSelesai = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const tanggalSelesai = now.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <LayoutSiswa subtitle="Ujian Selesai" hideLogout>
      <div className="finish-screen">
        <span style={{ fontSize: 64, display: "block", marginBottom: 16 }}>
          ✅
        </span>
        <h3>Ujian Telah Dikumpulkan</h3>
        <p style={{ color: "var(--teks-abu)", margin: "12px 0 24px" }}>
          Jawaban Anda telah tersimpan dengan aman.
        </p>

        <div
          style={{
            background: "var(--hijau-pucat)",
            borderRadius: "var(--radius-sm)",
            padding: "20px",
            maxWidth: 400,
            margin: "0 auto 24px",
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ color: "var(--teks-abu)", fontWeight: 600 }}>
              Skor PG
            </span>
            <span
              style={{
                fontWeight: 700,
                fontSize: "1.2rem",
                color: "var(--hijau-tua)",
              }}
            >
              {score}/{totalPg}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ color: "var(--teks-abu)", fontWeight: 600 }}>
              Waktu Selesai
            </span>
            <span style={{ fontWeight: 600, color: "var(--teks)" }}>
              {waktuSelesai}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--teks-abu)", fontWeight: 600 }}>
              Tanggal
            </span>
            <span style={{ fontWeight: 600, color: "var(--teks)" }}>
              {tanggalSelesai}
            </span>
          </div>
        </div>

        <p
          style={{
            color: "var(--teks-abu)",
            fontSize: "0.85rem",
            marginBottom: 24,
          }}
        >
          Silakan lanjutkan ke mata pelajaran berikutnya jika tersedia.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            className="btn btn-hijau"
            onClick={() => router.push("/mapel")}
          >
            📋 Kembali ke Pilih Mapel
          </button>
        </div>
      </div>
    </LayoutSiswa>
  );
}

export default function SelesaiPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--teks-abu)" }}>Memuat...</div>}>
      <SelesaiContent />
    </Suspense>
  );
}
