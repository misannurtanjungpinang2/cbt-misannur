"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

interface LoginFormData {
  name: string;
  participantNumber: string;
  class: string;
  token: string;
}

interface LoginError {
  message: string;
}

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<LoginFormData>({
    name: "",
    participantNumber: "",
    class: "5",
    token: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Auto uppercase untuk nama
    if (name === "name") {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else if (name === "token") {
      // Token otomatis uppercase
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Hapus error saat user mengetik
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // --- Validasi client-side ---
    if (!formData.name.trim()) {
      setError("Nama lengkap tidak boleh kosong");
      return;
    }
    if (!formData.participantNumber.trim()) {
      setError("Nomor peserta tidak boleh kosong");
      return;
    }
    if (!formData.token.trim()) {
      setError("Token tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/siswa/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          participantNumber: formData.participantNumber.trim(),
          class: formData.class,
          token: formData.token.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login gagal. Silakan coba lagi.");
        setIsLoading(false);
        return;
      }

      // Sukses — redirect ke halaman pilih mapel
      router.push("/mapel");
    } catch (err) {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header
        title="MIS AN-NUR TANJUNGPINANG"
        subtitle="Ujian Asesmen Madrasah Kelas 5"
        hideLogout
      />
      <main className="main-content">
        <div className="login-box">
          {/* Logo / Ilustrasi */}
          <div
            style={{
              width: 80,
              height: 80,
              background: "var(--hijau-pucat)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--hijau-tua)",
            }}
          >
            CBT
          </div>

          <h3
            style={{
              color: "var(--hijau-tua)",
              marginBottom: 4,
              fontSize: "1.3rem",
            }}
          >
            Masuk Ujian
          </h3>
          <p
            style={{
              color: "var(--teks-abu)",
              fontSize: "0.85rem",
              marginBottom: 8,
            }}
          >
            Isi data diri dengan benar
          </p>

          {/* Error message */}
          {error && (
            <div
              style={{
                background: "#fce4e4",
                color: "#c62828",
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.85rem",
                fontWeight: 500,
                marginBottom: 12,
                textAlign: "left",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Nama Lengkap */}
            <label htmlFor="namaInput">Nama Lengkap</label>
            <input
              id="namaInput"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="NAMA LENGKAP"
              autoComplete="off"
              disabled={isLoading}
              autoFocus
            />

            {/* Nomor Peserta */}
            <label htmlFor="pesertaInput">Nomor Peserta</label>
            <input
              id="pesertaInput"
              type="text"
              name="participantNumber"
              value={formData.participantNumber}
              onChange={handleChange}
              placeholder="Masukkan nomor peserta"
              autoComplete="off"
              disabled={isLoading}
            />

            {/* Kelas */}
            <label htmlFor="kelasSelect">Kelas</label>
            <select
              id="kelasSelect"
              name="class"
              value={formData.class}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="5">5</option>
            </select>

            {/* Token */}
            <label htmlFor="tokenInput">Token</label>
            <input
              id="tokenInput"
              type="text"
              name="token"
              value={formData.token}
              onChange={handleChange}
              placeholder="Masukkan token (6 karakter)"
              maxLength={6}
              autoComplete="off"
              disabled={isLoading}
              style={{ letterSpacing: "3px", textAlign: "center" }}
            />

            {/* Tombol Submit */}
            <button
              type="submit"
              className="btn btn-hijau btn-block"
              style={{ marginTop: 24 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner"
                    style={{
                      display: "inline-block",
                      width: 18,
                      height: 18,
                      border: "3px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                  Memproses...
                </>
              ) : (
                "Mulai Ujian"
              )}
            </button>
          </form>

          {/* Informasi */}
          <p
            style={{
              marginTop: 20,
              fontSize: "0.75rem",
              color: "var(--teks-abu)",
              lineHeight: 1.5,
            }}
          >
            Ujian Asesmen Madrasah MIS An-Nur Tanjungpinang
            <br />
            Tahun Pelajaran 2025/2026
          </p>
        </div>
      </main>

      {/* Inline style untuk animasi spinner */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
