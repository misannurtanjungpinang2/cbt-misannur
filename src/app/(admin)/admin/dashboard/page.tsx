"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LayoutAdmin from "@/components/LayoutAdmin";

interface SubjectProgress {
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
}

interface RecentExam {
  id: string;
  status: string;
  scorePg: number;
  createdAt: string;
  startTime: string | null;
  endTime: string | null;
  student: {
    name: string;
    participantNumber: string;
  };
  subject: {
    name: string;
  };
}

interface DashboardData {
  totalStudents: number;
  studentsCompleted: number;
  studentsNotStarted: number;
  totalCompletedSessions: number;
  totalInProgress: number;
  subjectProgress: SubjectProgress[];
  recentExams: RecentExam[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      if (response.status === 401) {
        router.push("/admin");
        return;
      }
      if (!response.ok) {
        throw new Error("Gagal memuat data dashboard");
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan server"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <LayoutAdmin title="Dashboard">
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
          <p style={{ color: "var(--teks-abu)" }}>Memuat data dashboard...</p>
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

  if (error) {
    return (
      <LayoutAdmin title="Dashboard">
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            background: "#fce4e4",
            borderRadius: "var(--radius)",
            color: "#c62828",
          }}
        >
          <p>{error}</p>
          <button
            className="btn btn-outline"
            style={{ marginTop: 16 }}
            onClick={fetchDashboard}
            type="button"
          >
            Coba Lagi
          </button>
        </div>
      </LayoutAdmin>
    );
  }

  if (!data) return null;

  const maxCompleted = Math.max(
    ...data.subjectProgress.map((s) => s.completedSessions),
    1
  );

  return (
    <LayoutAdmin title="Dashboard">
      {/* Statistik Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Total Siswa */}
        <div className="stat-card">
          <div
            style={{
              background: "var(--hijau-pucat)",
              borderRadius: "var(--radius)",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                color: "var(--hijau-tua)",
                lineHeight: 1.2,
              }}
            >
              {data.totalStudents}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--teks-abu)",
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              Total Siswa
            </div>
          </div>
        </div>

        {/* Sudah Ujian */}
        <div className="stat-card">
          <div
            style={{
              background: "#e8f5e9",
              borderRadius: "var(--radius)",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                color: "#2e7d32",
                lineHeight: 1.2,
              }}
            >
              {data.studentsCompleted}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--teks-abu)",
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              Sudah Ujian
            </div>
          </div>
        </div>

        {/* Belum Ujian */}
        <div className="stat-card">
          <div
            style={{
              background: data.studentsNotStarted > 0 ? "#fff3e0" : "#e8f5e9",
              borderRadius: "var(--radius)",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                color:
                  data.studentsNotStarted > 0 ? "#e65100" : "#2e7d32",
                lineHeight: 1.2,
              }}
            >
              {data.studentsNotStarted}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--teks-abu)",
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              Belum Ujian
            </div>
          </div>
        </div>

        {/* Sesi Selesai */}
        <div className="stat-card">
          <div
            style={{
              background: "#e3f2fd",
              borderRadius: "var(--radius)",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                color: "#1565c0",
                lineHeight: 1.2,
              }}
            >
              {data.totalCompletedSessions}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--teks-abu)",
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              Sesi Selesai
            </div>
          </div>
        </div>

        {/* Sedang Berjalan */}
        <div className="stat-card">
          <div
            style={{
              background: "#f3e5f5",
              borderRadius: "var(--radius)",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                color: "#6a1b9a",
                lineHeight: 1.2,
              }}
            >
              {data.totalInProgress}
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--teks-abu)",
                marginTop: 4,
                fontWeight: 600,
              }}
            >
              Sedang Berjalan
            </div>
          </div>
        </div>
      </div>

      {/* Progress Per Mapel */}
      <div
        style={{
          background: "white",
          borderRadius: "var(--radius)",
          padding: 24,
          boxShadow: "var(--shadow)",
          marginBottom: 24,
        }}
      >
        <h4
          style={{
            color: "var(--hijau-tua)",
            marginBottom: 16,
            fontSize: "1.1rem",
          }}
        >
          Progress Per Mapel
        </h4>

        {data.subjectProgress.length === 0 ? (
          <p style={{ color: "var(--teks-abu)", textAlign: "center" }}>
            Belum ada mapel
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.subjectProgress.map((subject) => {
              const percentage =
                maxCompleted > 0
                  ? Math.round(
                      (subject.completedSessions / maxCompleted) * 100
                    )
                  : 0;

              return (
                <div key={subject.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        {subject.name}
                      </span>
                      {subject.isActive && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            background: "#c8e6c9",
                            color: "#2e7d32",
                            padding: "2px 8px",
                            borderRadius: 10,
                            fontWeight: 600,
                          }}
                        >
                          Aktif
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "0.85rem", color: "var(--teks-abu)" }}>
                      {subject.completedSessions} selesai
                      {subject.inProgressSessions > 0 &&
                        ` (${subject.inProgressSessions} berjalan)`}
                    </span>
                  </div>
                  {/* Bar chart CSS */}
                  <div
                    style={{
                      height: 10,
                      background: "#f0f0f0",
                      borderRadius: 5,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.max(percentage, subject.completedSessions > 0 ? 3 : 0)}%`,
                        background: subject.isActive
                          ? "linear-gradient(90deg, var(--hijau-muda), var(--hijau))"
                          : "#bdbdbd",
                        borderRadius: 5,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigasi Cepat */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <button
          className="btn btn-hijau"
          onClick={() => router.push("/admin/atur")}
          type="button"
        >
          ⚙️ Atur Jadwal & Token
        </button>
        <button
          className="btn btn-outline"
          onClick={() => router.push("/admin/soal")}
          type="button"
        >
          📝 Kelola Soal
        </button>
        <button
          className="btn btn-outline"
          onClick={() => router.push("/admin/hasil")}
          type="button"
        >
          📋 Lihat Hasil
        </button>
      </div>

      {/* 5 Ujian Terakhir */}
      <div
        style={{
          background: "white",
          borderRadius: "var(--radius)",
          padding: 24,
          boxShadow: "var(--shadow)",
        }}
      >
        <h4
          style={{
            color: "var(--hijau-tua)",
            marginBottom: 16,
            fontSize: "1.1rem",
          }}
        >
          5 Ujian Terakhir
        </h4>

        {data.recentExams.length === 0 ? (
          <p style={{ color: "var(--teks-abu)", textAlign: "center" }}>
            Belum ada ujian yang dikerjakan
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "2px solid var(--hijau-pucat)",
                    textAlign: "left",
                  }}
                >
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>
                    Siswa
                  </th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>
                    No. Peserta
                  </th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>
                    Mapel
                  </th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>
                    Status
                  </th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>
                    Skor
                  </th>
                  <th style={{ padding: "10px 12px", fontWeight: 700 }}>
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recentExams.map((exam) => (
                  <tr
                    key={exam.id}
                    style={{
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <td style={{ padding: "10px 12px" }}>
                      {exam.student.name}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {exam.student.participantNumber}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {exam.subject.name}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: 10,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          background:
                            exam.status === "completed"
                              ? "#c8e6c9"
                              : exam.status === "in_progress"
                              ? "#fff3cd"
                              : "#f5f5f5",
                          color:
                            exam.status === "completed"
                              ? "#2e7d32"
                              : exam.status === "in_progress"
                              ? "#e65100"
                              : "#666",
                        }}
                      >
                        {exam.status === "completed"
                          ? "Selesai"
                          : exam.status === "in_progress"
                          ? "Berjalan"
                          : exam.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                      {exam.scorePg}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--teks-abu)", fontSize: "0.8rem" }}>
                      {new Date(exam.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </LayoutAdmin>
  );
}
