"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LayoutAdmin from "@/components/LayoutAdmin";

interface DeleteTarget {
  siswaId: string;
  studentName: string;
}

interface SessionData {
  id: string;
  student: {
    id: string;
    name: string;
    participantNumber: string;
    class: string;
  };
  startTime: string | null;
  endTime: string | null;
  status: string;
  scorePg: number;
}

interface SubjectData {
  name: string;
  slug: string;
  durationMinutes: number;
  isActive: boolean;
  dayNumber: number | null;
}

interface ApiResponse {
  subject: SubjectData;
  totalStudents: number;
  pgCount: number;
  sessions: SessionData[];
}

export default function HasilSlugPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const fetchData = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/hasil/${slug}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal memuat data");
      }
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    if (!slug) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/hasil/${slug}/export`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal export");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Hasil_Ujian_${data?.subject.name || slug}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal download file");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!slug || !deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/hasil/${slug}/${deleteTarget.siswaId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menghapus");
      }
      alert(`Berhasil menghapus hasil ujian ${deleteTarget.studentName}`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus hasil ujian");
    } finally {
      setDeleting(false);
    }
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <LayoutAdmin title={data?.subject?.name || "Hasil Ujian"}>
      <div className="admin-header">
        <div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => router.push("/admin/hasil")}
            style={{ marginBottom: 12 }}
          >
            ← Kembali
          </button>
          <h3>
            Hasil Ujian: {data?.subject?.name || slug}
          </h3>
          {data && (
            <p style={{ color: "var(--teks-abu)", marginTop: 4 }}>
              Jumlah siswa yang telah ujian: {data.sessions.length} dari {data.totalStudents} sesi
              {data.pgCount > 0 && ` | Soal PG: ${data.pgCount} butir`}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-hijau btn-sm"
            onClick={handleExport}
            disabled={exporting || !data?.sessions?.length}
          >
            {exporting ? "⏳ Mengunduh..." : "📥 Export Excel"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Memuat data hasil ujian...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>❌ {error}</p>
          <button className="btn btn-outline btn-sm" onClick={fetchData}>
            Coba Lagi
          </button>
        </div>
      ) : !data?.sessions?.length ? (
        <div className="empty-state">
          <p>📭 Belum ada siswa yang menyelesaikan ujian ini.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama</th>
                <th>No Peserta</th>
                <th>Kelas</th>
                <th>Waktu Mulai</th>
                <th>Waktu Selesai</th>
                <th>Skor PG</th>
                <th>Aksi</th>
                <th>Hapus</th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((session, index) => (
                <tr key={session.id} className="table-row">
                  <td className="text-center">{index + 1}</td>
                  <td>
                    <strong>{session.student.name}</strong>
                  </td>
                  <td>{session.student.participantNumber}</td>
                  <td>{session.student.class}</td>
                  <td>{formatDateTime(session.startTime)}</td>
                  <td>{formatDateTime(session.endTime)}</td>
                  <td className="text-center">
                    <span className="score-badge">
                      {session.scorePg}
                    </span>
                  </td>
                  <td className="text-center">
                    <Link
                      href={`/admin/hasil/${slug}/${session.student.id}`}
                      className="btn btn-outline btn-sm"
                    >
                      Detail
                    </Link>
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        setDeleteTarget({
                          siswaId: session.student.id,
                          studentName: session.student.name,
                        })
                      }
                    >
                      🗑 Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          <div className="modal-box">
            <span style={{ fontSize: 48, display: "block" }}>🗑️</span>
            <h3 style={{ color: "var(--hijau-tua)" }}>Hapus Hasil Ujian?</h3>
            <p style={{ color: "var(--teks-abu)", margin: "12px 0" }}>
              Yakin ingin menghapus hasil ujian{" "}
              <strong>{deleteTarget.studentName}</strong>?
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--teks-abu)",
                marginBottom: 8,
              }}
            >
              Semua jawaban siswa ini untuk mata pelajaran ini akan dihapus.
              Siswa dapat mengerjakan ulang setelahnya.
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                marginTop: 24,
              }}
            >
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutAdmin>
  );
}
