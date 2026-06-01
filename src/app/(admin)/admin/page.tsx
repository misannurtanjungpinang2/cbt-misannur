"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function AdminLoginPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Password tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "admin",
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login gagal. Silakan coba lagi.");
        setIsLoading(false);
        return;
      }

      // Sukses — redirect ke dashboard
      router.push("/admin/dashboard");
    } catch (err) {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header
        title="MIS AN-NUR TANJUNGPINANG"
        subtitle="Panel Administrasi CBT"
        hideLogout
      />
      <main className="main-content">
        <div className="login-box">
          {/* Icon */}
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
            ADM
          </div>

          <h3
            style={{
              color: "var(--hijau-tua)",
              marginBottom: 4,
              fontSize: "1.3rem",
            }}
          >
            Admin Panel
          </h3>
          <p
            style={{
              color: "var(--teks-abu)",
              fontSize: "0.85rem",
              marginBottom: 8,
            }}
          >
            Masuk dengan password admin
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
            {/* Username (readonly, default admin) */}
            <label htmlFor="usernameInput">Username</label>
            <input
              id="usernameInput"
              type="text"
              value="admin"
              readOnly
              style={{
                background: "#f0f0f0",
                cursor: "not-allowed",
                color: "#888",
              }}
            />

            {/* Password */}
            <label htmlFor="passwordInput">Password</label>
            <input
              id="passwordInput"
              type="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Masukkan password"
              autoComplete="current-password"
              disabled={isLoading}
              autoFocus
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
                "Masuk"
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
            Panel Administrasi CBT MIS An-Nur
            <br />
            Hanya untuk guru dan admin
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
