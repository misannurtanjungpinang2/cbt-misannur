"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LayoutGuru from "@/components/LayoutGuru";

interface SubjectInfo {
  id: string;
  name: string;
  slug: string;
  totalStudents: number;
  ungradedStudentCount: number;
}

interface DashboardData {
  teacher: { name: string; username: string };
  subjects: SubjectInfo[];
}

export default function GuruDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/teacher/subjects");
      if (!res.ok) {
        if (res.status === 401) { router.push("/guru"); return; }
        const errData = await res.json();
        throw new Error(errData.error || "Gagal memuat data");
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally { setLoading(false); }
  };

  if (loading) return <LayoutGuru title="Dashboard"><div className="loading-state"><div className="spinner" /><p>Memuat dashboard...</p></div></LayoutGuru>;
  if (error) return <LayoutGuru title="Dashboard"><div className="error-state"><p>❌ {error}</p><button className="btn btn-outline btn-sm" onClick={fetchDashboard}>Coba Lagi</button></div></LayoutGuru>;

  return (
    <LayoutGuru title="Dashboard Guru">
      <div style={{ background: "white", borderRadius: "var(--radius)", padding: 24, boxShadow: "var(--shadow)", marginBottom: 24 }}>
        <h3 style={{ color: "var(--hijau-tua)", marginBottom: 4 }}>👋 Selamat datang, {data?.teacher.name}</h3>
        <p style={{ color: "var(--teks-abu)", fontSize: "0.9rem" }}>Username: {data?.teacher.username}</p>
      </div>

      <div style={{ background: "white", borderRadius: "var(--radius)", padding: 24, boxShadow: "var(--shadow)", marginBottom: 24, opacity: 0.6, cursor: "not-allowed", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 12, right: 12, background: "var(--emas)", color: "white", padding: "4px 14px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px" }}>COMING SOON</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, background: "var(--hijau-pucat)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>📝</div>
          <div>
            <h4 style={{ color: "var(--hijau-tua)", marginBottom: 2 }}>Buat Soal</h4>
            <p style={{ color: "var(--teks-abu)", fontSize: "0.85rem" }}>Fitur membuat soal akan segera hadir</p>
          </div>
        </div>
      </div>

      <h4 style={{ color: "var(--hijau-tua)", marginBottom: 16, fontSize: "1.1rem" }}>Mata Pelajaran yang Diampu</h4>

      {!data?.subjects?.length ? (
        <div className="empty-state">
          <p>📭 Anda belum ditugaskan ke mata pelajaran apapun.</p>
          <p style={{ fontSize: "0.85rem", color: "var(--teks-abu)", marginTop: 8 }}>Hubungi admin untuk menugaskan Anda ke mapel tertentu.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {data.subjects.map((subject) => (
            <div key={subject.id} className="mapel-card" style={{ cursor: "pointer", textAlign: "left" }} onClick={() => router.push(`/guru/subjek/${subject.slug}`)}>
              <div className="mapel-card-icon"><span>📋</span></div>
              <div className="mapel-card-body">
                <h4>{subject.name}</h4>
                <div className="mapel-card-stats">
                  <span className="stat-badge stat-total">👥 {subject.totalStudents} siswa</span>
                  {subject.ungradedStudentCount > 0 ? (
                    <span className="stat-badge" style={{ background: "#fff3cd", color: "#856404" }}>⏳ {subject.ungradedStudentCount} siswa belum dinilai</span>
                  ) : (
                    <span className="stat-badge stat-completed">✅ Semua sudah dinilai</span>
                  )}
                </div>
              </div>
              <div className="mapel-card-action"><span className="btn btn-sm btn-hijau">Periksa Essay</span></div>
            </div>
          ))}
        </div>
      )}
    </LayoutGuru>
  );
}
