"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LayoutSiswa from "@/components/LayoutSiswa";

interface SubjectItem {
  id: string;
  name: string;
  slug: string;
  durationMinutes: number;
  dayNumber: number | null;
  order: number;
  status: "available" | "in_progress" | "completed";
}

interface MapelResponse {
  subjects: SubjectItem[];
}

type PageState = "loading" | "error" | "empty" | "loaded" | "all_done";

export default function MapelPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setPageState("loading");

    try {
      const response = await fetch("/api/siswa/mapel", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 401) {
        // Session expired, redirect to login
        router.push("/");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Gagal memuat data mapel");
      }

      const data: MapelResponse = await response.json();

      if (!data.subjects || data.subjects.length === 0) {
        setPageState("empty");
        return;
      }

      // Cek apakah semua sudah completed
      const allDone = data.subjects.every(
        (s) => s.status === "completed"
      );

      setSubjects(data.subjects);
      setPageState(allDone ? "all_done" : "loaded");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data";
      setErrorMessage(message);
      setPageState("error");
    }
  };

  const handleSubjectAction = (subject: SubjectItem) => {
    // Redirect ke halaman ujian
    router.push(`/ujian/${subject.slug}`);
  };

  const getStatusLabel = (status: SubjectItem["status"]): string => {
    switch (status) {
      case "available":
        return "BELUM";
      case "in_progress":
        return "SEDANG";
      case "completed":
        return "SELESAI";
      default:
        return "BELUM";
    }
  };

  const getStatusStyle = (
    status: SubjectItem["status"]
  ): React.CSSProperties => {
    switch (status) {
      case "available":
        return {
          background: "var(--hijau-pucat)",
          color: "var(--hijau-tua)",
        };
      case "in_progress":
        return {
          background: "var(--emas-pucat)",
          color: "#b45309",
        };
      case "completed":
        return {
          background: "#e8e8e8",
          color: "#666",
        };
      default:
        return {
          background: "var(--hijau-pucat)",
          color: "var(--hijau-tua)",
        };
    }
  };

  const getButtonLabel = (status: SubjectItem["status"]): string => {
    switch (status) {
      case "available":
        return "Kerjakan";
      case "in_progress":
        return "Lanjutkan";
      case "completed":
        return "Selesai";
      default:
        return "Kerjakan";
    }
  };

  // --- Render berdasarkan state ---

  const renderLoading = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        gap: 16,
        padding: "60px 20px",
      }}
    >
      <div
        className="spinner-big"
        style={{
          width: 48,
          height: 48,
          border: "4px solid var(--hijau-pucat)",
          borderTopColor: "var(--hijau)",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <p style={{ color: "var(--teks-abu)", fontSize: "1rem" }}>
        Memuat daftar mapel...
      </p>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );

  const renderError = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        gap: 16,
        padding: "60px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#fce4e4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.8rem",
          color: "#c62828",
        }}
      >
        !
      </div>
      <h3 style={{ color: "var(--teks)", marginBottom: 4 }}>
        Gagal Memuat Data
      </h3>
      <p style={{ color: "var(--teks-abu)", fontSize: "0.9rem", maxWidth: 320 }}>
        {errorMessage}
      </p>
      <button
        className="btn btn-hijau"
        onClick={fetchSubjects}
        style={{ marginTop: 8 }}
      >
        Coba Lagi
      </button>
    </div>
  );

  const renderEmpty = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        gap: 16,
        padding: "60px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "var(--hijau-pucat)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.8rem",
          color: "var(--hijau-tua)",
        }}
      >
        📋
      </div>
      <h3 style={{ color: "var(--teks)", marginBottom: 4 }}>
        Belum Ada Mapel Aktif
      </h3>
      <p style={{ color: "var(--teks-abu)", fontSize: "0.9rem", maxWidth: 320 }}>
        Saat ini belum ada ujian yang aktif. Silakan cek kembali nanti atau hubungi guru.
      </p>
      <button
        className="btn btn-hijau"
        onClick={fetchSubjects}
        style={{ marginTop: 8 }}
      >
        Refresh
      </button>
    </div>
  );

  const renderAllDone = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        gap: 16,
        padding: "60px 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "var(--hijau-pucat)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.2rem",
          color: "var(--hijau-tua)",
        }}
      >
        ✓
      </div>
      <h3 style={{ color: "var(--hijau-tua)", marginBottom: 4 }}>
        Semua Ujian Selesai!
      </h3>
      <p style={{ color: "var(--teks-abu)", fontSize: "0.9rem", maxWidth: 360 }}>
        Selamat! Kamu telah menyelesaikan semua ujian hari ini.
        <br />
        Hasil akan diumumkan oleh guru.
      </p>
    </div>
  );

  const renderSubjects = () => (
    <div style={{ flex: 1 }}>
      {/* Info header */}
      <div
        style={{
          marginBottom: 20,
          padding: "14px 18px",
          background: "white",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow)",
          border: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <h3
          style={{
            color: "var(--hijau-tua)",
            fontSize: "1.1rem",
            fontWeight: 600,
          }}
        >
          Pilih Mata Pelajaran
        </h3>
        <p style={{ color: "var(--teks-abu)", fontSize: "0.85rem", marginTop: 2 }}>
          Klik "Kerjakan" untuk memulai ujian pada mapel yang tersedia
        </p>
      </div>

      {/* Grid mapel */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {subjects.map((subject) => (
          <div
            key={subject.id}
            style={{
              background: "white",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow)",
              border: "1px solid rgba(0,0,0,0.05)",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              transition: "var(--transition)",
              opacity: subject.status === "completed" ? 0.75 : 1,
            }}
          >
            {/* Icon / Number */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "var(--radius-sm)",
                background: "var(--hijau-pucat)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "var(--hijau-tua)",
                marginBottom: 12,
              }}
            >
              {subject.order}
            </div>

            {/* Nama Mapel */}
            <h4
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--teks)",
                marginBottom: 8,
                lineHeight: 1.3,
              }}
            >
              {subject.name}
            </h4>

            {/* Durasi */}
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--teks-abu)",
                marginBottom: 12,
              }}
            >
              Durasi: {subject.durationMinutes} menit
            </p>

            {/* Status badge */}
            <div style={{ marginBottom: 16 }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 12px",
                  borderRadius: 20,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  ...getStatusStyle(subject.status),
                }}
              >
                {getStatusLabel(subject.status)}
              </span>
            </div>

            {/* Tombol */}
            <div style={{ marginTop: "auto" }}>
              {subject.status === "completed" ? (
                <button
                  className="btn btn-block"
                  style={{
                    background: "#e8e8e8",
                    color: "#888",
                    cursor: "not-allowed",
                    borderRadius: 40,
                    padding: "10px 20px",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                  disabled
                >
                  {getButtonLabel(subject.status)}
                </button>
              ) : (
                <button
                  className="btn btn-hijau btn-block"
                  style={{
                    borderRadius: 40,
                    padding: "10px 20px",
                    fontSize: "0.9rem",
                  }}
                  onClick={() => handleSubjectAction(subject)}
                >
                  {getButtonLabel(subject.status)}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <LayoutSiswa
      title="MIS AN-NUR TANJUNGPINANG"
      subtitle="Pilih Mata Pelajaran"
      onLogout={() => {
        // Redirect ke halaman login (logout — cookie tidak dihapus, redirect saja)
        // Jika ingin benar-benar logout, perlu panggil API
        router.push("/");
      }}
    >
      {/* Konten utama */}
      {pageState === "loading" && renderLoading()}
      {pageState === "error" && renderError()}
      {pageState === "empty" && renderEmpty()}
      {pageState === "loaded" && renderSubjects()}
      {pageState === "all_done" && renderAllDone()}
    </LayoutSiswa>
  );
}
