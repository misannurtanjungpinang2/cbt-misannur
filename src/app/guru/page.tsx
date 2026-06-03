"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function GuruLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Username dan password tidak boleh kosong");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login gagal");
        setIsLoading(false);
        return;
      }

      router.push("/guru/dashboard");
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header
        title="MIS AN-NUR TANJUNGPINANG"
        subtitle="Panel Guru CBT"
        hideLogout
      />
      <main className="main-content">
        <div className="login-box">
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
            GR
          </div>

          <h3 style={{ color: "var(--hijau-tua)", marginBottom: 4, fontSize: "1.3rem" }}>
            Login Guru
          </h3>
          <p style={{ color: "var(--teks-abu)", fontSize: "0.85rem", marginBottom: 8 }}>
            Masuk dengan akun guru yang diberikan admin
          </p>

          {error && (
            <div style={{
              background: "#fce4e4", color: "#c62828", padding: "10px 14px",
              borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 500,
              marginBottom: 12, textAlign: "left",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="usernameInput">Username</label>
            <input
              id="usernameInput"
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); if (error) setError(null); }}
              placeholder="Masukkan username"
              autoComplete="username"
              disabled={isLoading}
              autoFocus
            />
            <label htmlFor="passwordInput">Password</label>
            <input
              id="passwordInput"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
              placeholder="Masukkan password"
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button type="submit" className="btn btn-hijau btn-block" style={{ marginTop: 24 }} disabled={isLoading}>
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: "0.75rem", color: "var(--teks-abu)" }}>
            Panel Guru CBT MIS An-Nur
          </p>
        </div>
      </main>
    </div>
  );
}
