"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import LayoutGuru from "@/components/LayoutGuru";

interface StudentSession {
  id: string;
  student: { id: string; name: string; participantNumber: string };
  startTime: string | null;
  endTime: string | null;
  status: string;
  scorePg: number;
  totalEssay: number;
  gradedEssayCount: number;
  avgEssayScore: number | null;
  isFullyGraded: boolean;
}

interface StudentsData {
  subject: { id: string; name: string; slug: string };
  totalEssay: number;
  sessions: StudentSession[];
}

export default function GuruSubjekPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [data, setData] = useState<StudentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "ungraded" | "graded">("all");

  const fetchData = useCallback(async () => {
    if (!slug) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/teacher/subjek/${slug}/students`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) { router.push("/guru"); return; }
        const errData = await res.json();
        throw new Error(errData.error || "Gagal memuat data");
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally { setLoading(false); }
  }, [slug, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data?.sessions.filter((s) => {
    if (filter === "ungraded") return !s.isFullyGraded;
    if (filter === "graded") return s.isFullyGraded;
    return true;
  });

  const ungradedCount = data?.sessions.filter((s) => !s.isFullyGraded).length || 0;
  const formatDate = (iso: string | null) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <LayoutGuru title="Periksa Essay"><div className="loading-state"><div className="spinner" /><p>Memuat data siswa...</p></div></LayoutGuru>;
  if (error) return <LayoutGuru title="Periksa Essay"><div className="error-state"><p>❌ {error}</p><button className="btn btn-outline btn-sm" onClick={fetchData}>Coba Lagi</button></div></LayoutGuru>;

  return (
    <LayoutGuru title={`Periksa Essay - ${data?.subject?.name || slug}`}>
      <div className="admin-header">
        <div>
          <button className="btn btn-outline btn-sm" onClick={() => router.push("/guru/dashboard")} style={{ marginBottom: 12 }}>← Kembali ke Dashboard</button>
          <h3>Periksa Essay: {data?.subject?.name || slug}</h3>
          <p style={{ color: "var(--teks-abu)", marginTop: 4 }}>
            {data?.sessions.length} siswa | {data?.totalEssay} soal essay
            {ungradedCount > 0 && <span style={{ color: "#e65100", fontWeight: 600 }}> | ⏳ {ungradedCount} siswa belum dinilai</span>}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "all", label: `Semua (${data?.sessions.length || 0})` },
          { key: "ungraded", label: `Belum Dinilai (${ungradedCount})` },
          { key: "graded", label: `Sudah Dinilai (${(data?.sessions.length || 0) - ungradedCount})` },
        ].map((f) => (
          <button key={f.key} className={`btn btn-sm ${filter === f.key ? "btn-hijau" : "btn-outline"}`}
            onClick={() => setFilter(f.key as typeof filter)} type="button">
            {f.label}
          </button>
        ))}
      </div>

      {!filtered?.length ? (
        <div className="empty-state"><p>📭 Tidak ada data siswa.</p></div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead><tr>
              <th>No</th><th>Nama</th><th>No Peserta</th><th>Selesai</th><th>Skor PG</th>
              <th>Status Essay</th><th>Nilai Essay</th><th>Aksi</th>
            </tr></thead>
            <tbody>
              {filtered.map((s, idx) => (
                <tr key={s.id}>
                  <td className="text-center">{idx + 1}</td>
                  <td><strong>{s.student.name}</strong></td>
                  <td>{s.student.participantNumber}</td>
                  <td style={{ fontSize: "0.85rem" }}>{formatDate(s.endTime)}</td>
                  <td className="text-center">{s.scorePg}</td>
                  <td className="text-center">
                    {s.totalEssay === 0 ? <span style={{ color: "var(--teks-abu)", fontSize: "0.85rem" }}>—</span>
                      : s.isFullyGraded ? <span style={{ color: "#2e7d32", fontWeight: 600 }}>✅ {s.gradedEssayCount}/{s.totalEssay}</span>
                      : s.gradedEssayCount > 0 ? <span style={{ color: "#e65100", fontWeight: 600 }}>⏳ {s.gradedEssayCount}/{s.totalEssay}</span>
                      : <span style={{ color: "#c62828", fontWeight: 600 }}>⏳ 0/{s.totalEssay}</span>}
                  </td>
                  <td className="text-center">
                    {s.avgEssayScore !== null ? <span style={{ fontWeight: 700, color: "var(--hijau-tua)" }}>{s.avgEssayScore}</span>
                      : s.totalEssay > 0 ? <span style={{ color: "var(--teks-abu)" }}>—</span>
                      : <span style={{ color: "var(--teks-abu)" }}>—</span>}
                  </td>
                  <td className="text-center">
                    <button className="btn btn-hijau btn-sm" onClick={() => router.push(`/guru/subjek/${slug}/${s.student.id}`)}>
                      {s.isFullyGraded ? "📋 Lihat" : "✏️ Periksa"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </LayoutGuru>
  );
}
