"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import LayoutAdmin from "@/components/LayoutAdmin";

interface SubjectData {
  id: string;
  name: string;
  slug: string;
  token: string | null;
  durationMinutes: number;
  dayNumber: number | null;
  isActive: boolean;
  order: number;
}

interface DashboardData {
  subjectProgress: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    dayNumber: number | null;
    token: string | null;
    totalQuestions: number;
    totalSessions: number;
    completedSessions: number;
    inProgressSessions: number;
  }[];
}

interface StatusMessage {
  type: "success" | "error";
  text: string;
}

export default function AturPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingToken, setSavingToken] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  // Token input per mapel
  const [tokenInputs, setTokenInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      if (response.status === 401) {
        router.push("/admin");
        return;
      }
      if (!response.ok) throw new Error("Gagal memuat data");
      const result: DashboardData = await response.json();

      const mapped: SubjectData[] = result.subjectProgress.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        token: s.token,
        durationMinutes: 60,
        dayNumber: s.dayNumber,
        isActive: s.isActive,
        order: 0,
      }));

      setSubjects(mapped);

      // Init token inputs
      const tokens: Record<string, string> = {};
      mapped.forEach((s) => {
        tokens[s.id] = s.token || "";
      });
      setTokenInputs(tokens);
    } catch (err) {
      setStatus({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal memuat data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle simpan token
  const handleSaveToken = async (subjectId: string) => {
    const token = tokenInputs[subjectId] || "";

    if (token.length !== 6) {
      setStatus({ type: "error", text: "Token harus 6 karakter" });
      return;
    }

    setSavingToken(subjectId);
    setStatus(null);

    try {
      const response = await fetch("/api/admin/atur/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          token: token.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus({ type: "error", text: data.error || "Gagal menyimpan token" });
        return;
      }

      setStatus({ type: "success", text: "Token berhasil disimpan" });

      // Update local state
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId ? { ...s, token: token.toUpperCase() } : s
        )
      );

      // Clear status after 3 seconds
      setTimeout(() => setStatus(null), 3000);
    } catch {
      setStatus({ type: "error", text: "Terjadi kesalahan jaringan" });
    } finally {
      setSavingToken(null);
    }
  };

  // Handle toggle aktif
  const handleToggleActive = async (subjectId: string, currentActive: boolean) => {
    const newActive = !currentActive;
    setStatus(null);

    // Optimistic update
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, isActive: newActive } : s
      )
    );

    try {
      const response = await fetch("/api/admin/atur/aktifkan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          isActive: newActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Rollback on error
        setSubjects((prev) =>
          prev.map((s) =>
            s.id === subjectId ? { ...s, isActive: currentActive } : s
          )
        );
        setStatus({ type: "error", text: data.error || "Gagal mengubah status" });
        return;
      }

      setStatus({
        type: "success",
        text: `${subjects.find((s) => s.id === subjectId)?.name} ${
          newActive ? "diaktifkan" : "dinonaktifkan"
        }`,
      });

      setTimeout(() => setStatus(null), 3000);
    } catch {
      // Rollback
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId ? { ...s, isActive: currentActive } : s
        )
      );
      setStatus({ type: "error", text: "Terjadi kesalahan jaringan" });
    }
  };

  // Handle ubah jadwal (dayNumber)
  const handleDayChange = async (subjectId: string, dayNumber: string) => {
    const day = dayNumber ? parseInt(dayNumber) : null;
    setStatus(null);

    const prevSubject = subjects.find((s) => s.id === subjectId);

    // Optimistic update
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, dayNumber: day } : s
      )
    );

    try {
      const response = await fetch("/api/admin/atur/jadwal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          dayNumber: day,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Rollback
        if (prevSubject) {
          setSubjects((prev) =>
            prev.map((s) =>
              s.id === subjectId ? { ...s, dayNumber: prevSubject.dayNumber } : s
            )
          );
        }
        setStatus({ type: "error", text: data.error || "Gagal mengubah jadwal" });
        return;
      }

      setStatus({ type: "success", text: "Jadwal berhasil diubah" });
      setTimeout(() => setStatus(null), 3000);
    } catch {
      // Rollback
      if (prevSubject) {
        setSubjects((prev) =>
          prev.map((s) =>
            s.id === subjectId ? { ...s, dayNumber: prevSubject.dayNumber } : s
          )
        );
      }
      setStatus({ type: "error", text: "Terjadi kesalahan jaringan" });
    }
  };

  if (isLoading) {
    return (
      <LayoutAdmin title="Atur Token & Jadwal">
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "4px solid var(--hijau-pucat)",
              borderTopColor: "var(--hijau)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "var(--teks-abu)" }}>Memuat data...</p>
          <style jsx>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </LayoutAdmin>
    );
  }

  return (
    <LayoutAdmin title="Atur Token & Jadwal">
      {/* Status Message */}
      {status && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.9rem",
            fontWeight: 500,
            marginBottom: 20,
            background:
              status.type === "success" ? "#e8f5e9" : "#fce4e4",
            color:
              status.type === "success" ? "#2e7d32" : "#c62828",
          }}
        >
          {status.text}
        </div>
      )}

      {/* Info */}
      <div
        style={{
          background: "#e3f2fd",
          borderRadius: "var(--radius-sm)",
          padding: "14px 18px",
          marginBottom: 20,
          fontSize: "0.85rem",
          color: "#1565c0",
          lineHeight: 1.6,
        }}
      >
        <strong>Info:</strong> Atur token (6 karakter) untuk setiap mapel dan aktifkan
        mapel yang akan diujikan hari ini. Siswa akan memasukkan token saat login untuk
        mengakses ujian.
      </div>

      {subjects.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            background: "white",
            borderRadius: "var(--radius)",
            boxShadow: "var(--shadow)",
          }}
        >
          <p style={{ color: "var(--teks-abu)" }}>
            Belum ada data mapel. Silakan seed database terlebih dahulu.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
              borderRadius: "var(--radius)",
              boxShadow: "var(--shadow)",
              fontSize: "0.9rem",
              overflow: "hidden",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--hijau-tua)",
                  color: "white",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "14px 16px" }}>Mapel</th>
                <th style={{ padding: "14px 16px" }}>Hari</th>
                <th style={{ padding: "14px 16px" }}>Token</th>
                <th style={{ padding: "14px 16px" }}>Aktif</th>
                <th style={{ padding: "14px 16px" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => (
                <tr
                  key={subject.id}
                  style={{
                    borderBottom: "1px solid #eee",
                    background:
                      index % 2 === 0 ? "white" : "#fafbfa",
                  }}
                >
                  {/* Nama Mapel */}
                  <td
                    style={{
                      padding: "14px 16px",
                      fontWeight: 600,
                    }}
                  >
                    {subject.name}
                  </td>

                  {/* Hari */}
                  <td style={{ padding: "14px 16px" }}>
                    <select
                      value={subject.dayNumber ?? ""}
                      onChange={(e) =>
                        handleDayChange(subject.id, e.target.value)
                      }
                      style={{
                        padding: "6px 10px",
                        border: "2px solid #dde",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                        background: "white",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">--</option>
                      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <option key={day} value={day}>
                          Hari {day}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Token */}
                  <td style={{ padding: "14px 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        maxLength={6}
                        value={tokenInputs[subject.id] || ""}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setTokenInputs((prev) => ({
                            ...prev,
                            [subject.id]: val,
                          }));
                        }}
                        placeholder="6 digit"
                        style={{
                          width: 110,
                          padding: "8px 10px",
                          border: "2px solid #dde",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.9rem",
                          textAlign: "center",
                          letterSpacing: "3px",
                          fontWeight: 700,
                          outline: "none",
                          fontFamily: "'Courier New', monospace",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "var(--hijau-muda)")}
                        onBlur={(e) => (e.target.style.borderColor = "#dde")}
                      />
                      <button
                        className="btn btn-hijau btn-sm"
                        onClick={() => handleSaveToken(subject.id)}
                        disabled={savingToken === subject.id}
                        type="button"
                      >
                        {savingToken === subject.id ? "..." : "Simpan"}
                      </button>
                    </div>
                  </td>

                  {/* Aktif (Toggle) */}
                  <td style={{ padding: "14px 16px" }}>
                    <label
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        onClick={() =>
                          handleToggleActive(subject.id, subject.isActive)
                        }
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          background: subject.isActive
                            ? "var(--hijau-muda)"
                            : "#ccc",
                          position: "relative",
                          transition: "background 0.2s ease",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "white",
                            position: "absolute",
                            top: 2,
                            left: subject.isActive ? 22 : 2,
                            transition: "left 0.2s ease",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color: subject.isActive
                            ? "var(--hijau-tua)"
                            : "var(--teks-abu)",
                        }}
                      >
                        {subject.isActive ? "Aktif" : "Non-aktif"}
                      </span>
                    </label>
                  </td>

                  {/* Aksi (token display untuk siswa) */}
                  <td style={{ padding: "14px 16px" }}>
                    {subject.token ? (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          background: "#f5f5f5",
                          padding: "4px 12px",
                          borderRadius: "var(--radius-sm)",
                          fontFamily: "'Courier New', monospace",
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          letterSpacing: "2px",
                          color: "var(--hijau-tua)",
                        }}
                      >
                        🔑 {subject.token}
                      </div>
                    ) : (
                      <span style={{ color: "#bbb", fontSize: "0.85rem" }}>
                        Belum di-set
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Catatan */}
      <div
        style={{
          marginTop: 24,
          padding: "16px 20px",
          background: "white",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow)",
          fontSize: "0.85rem",
          color: "var(--teks-abu)",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "var(--hijau-tua)" }}>Petunjuk:</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>
            <strong>Token</strong> — Set token 6 karakter untuk setiap mapel. Token
            akan digunakan siswa saat login.
          </li>
          <li>
            <strong>Aktif/Non-aktif</strong> — Toggle untuk mengaktifkan atau
            menonaktifkan mapel. Hanya mapel aktif yang bisa diakses siswa.
          </li>
          <li>
            <strong>Hari</strong> — Atur jadwal mapel ke hari ke-1 s/d 7. Pilih
            &quot;--&quot; untuk menghapus jadwal.
          </li>
        </ul>
      </div>
    </LayoutAdmin>
  );
}
