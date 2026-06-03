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
  essayScore: number | null;
  totalEssay: number;
  gradedEssayCount: number;
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
  essayCount: number;
  sessions: SessionData[];
}

interface QuestionDetail {
  id: string;
  number: number;
  type: string;
  text: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string | null;
  studentAnswer: string | null;
  isCorrect: boolean | null;
}

interface DetailResponse {
  student: {
    id: string;
    name: string;
    participantNumber: string;
    class: string;
  };
  subject: {
    name: string;
    slug: string;
  };
  session: {
    startTime: string | null;
    endTime: string | null;
    status: string;
    scorePg: number;
  };
  questions: QuestionDetail[];
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
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedPrintIds, setSelectedPrintIds] = useState<Set<string>>(new Set());
  const [printing, setPrinting] = useState(false);

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

  const togglePrintSelect = (studentId: string) => {
    setSelectedPrintIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data) return;
    if (selectedPrintIds.size === data.sessions.length) {
      setSelectedPrintIds(new Set());
    } else {
      setSelectedPrintIds(new Set(data.sessions.map((s) => s.student.id)));
    }
  };

  const buildPrintHtml = (
    subjectName: string,
    details: DetailResponse[]
  ): string => {
    const formatDate = (iso: string | null) => {
      if (!iso) return "-";
      return new Date(iso).toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const renderQuestion = (q: QuestionDetail) => {
      const isPg = q.type === "pg";
      const optionsHtml = isPg
        ? ["A", "B", "C", "D"]
            .map((opt) => {
              const optKey = opt as "A" | "B" | "C" | "D";
              const optionText =
                optKey === "A"
                  ? q.optionA
                  : optKey === "B"
                  ? q.optionB
                  : optKey === "C"
                  ? q.optionC
                  : q.optionD;
              if (!optionText) return "";

              const isStudentChoice =
                q.studentAnswer?.toUpperCase() === opt;
              const isCorrectAnswer =
                q.correctAnswer?.toUpperCase() === opt;

              let marks: string[] = [];
              if (isStudentChoice) marks.push("Pilihanmu");
              if (isCorrectAnswer) marks.push("Kunci");

              return `
                <div class="opt ${
                  isStudentChoice
                    ? isCorrectAnswer
                      ? "opt-correct"
                      : "opt-wrong"
                    : isCorrectAnswer
                    ? "opt-key"
                    : ""
                }">
                  <span class="opt-letter">${opt}.</span>
                  <span class="opt-text">${optionText}</span>
                  ${marks.length ? `<span class="opt-mark">[${marks.join(", ")}]</span>` : ""}
                </div>`;
            })
            .join("")
        : `<div class="essay-answer">
            <div class="essay-label">Jawaban Siswa:</div>
            <div class="essay-text">${
              q.studentAnswer
                ? q.studentAnswer
                : "<em>(Tidak dijawab)</em>"
            }</div>
           </div>`;

      const statusBadge =
        isPg && q.studentAnswer === null
          ? '<span class="badge badge-un">Tidak Dijawab</span>'
          : isPg && q.isCorrect === true
          ? '<span class="badge badge-r">Benar</span>'
          : isPg && q.isCorrect === false
          ? '<span class="badge badge-s">Salah</span>'
          : "";

      return `
        <div class="soal">
          <div class="soal-header">
            <span class="soal-tag">${isPg ? "PG" : "Essay"} No. ${q.number}</span>
            ${statusBadge}
          </div>
          <div class="soal-text">${q.text}</div>
          ${optionsHtml}
        </div>`;
    };

    const studentsHtml = details
      .map((d) => {
        const pgQuestions = d.questions.filter((q) => q.type === "pg");
        const pgCorrect = pgQuestions.filter(
          (q) => q.isCorrect === true
        ).length;

        return `
          <div class="student-page">
            <table class="info-table">
              <tr>
                <td class="info-label">Nama</td>
                <td class="info-value">: ${d.student.name}</td>
                <td class="info-label">Kelas</td>
                <td class="info-value">: ${d.student.class}</td>
              </tr>
              <tr>
                <td class="info-label">No. Peserta</td>
                <td class="info-value">: ${d.student.participantNumber}</td>
                <td class="info-label">Skor PG</td>
                <td class="info-value">: ${pgCorrect} / ${pgQuestions.length} (${
          pgQuestions.length > 0
            ? Math.round((pgCorrect / pgQuestions.length) * 100)
            : 0
        }%)</td>
              </tr>
              <tr>
                <td class="info-label">Mata Pelajaran</td>
                <td class="info-value">: ${d.subject.name}</td>
                <td class="info-label">Waktu</td>
                <td class="info-value">: ${formatDate(
                  d.session.startTime
                )} - ${formatDate(d.session.endTime)}</td>
              </tr>
            </table>
            ${d.questions.map(renderQuestion).join("")}
          </div>`;
      })
      .join("");

    return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Cetak Lembar Jawaban - ${subjectName}</title>
<style>
  @page { margin: 20mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 11pt;
    line-height: 1.6;
    color: #000;
    padding: 0;
  }
  .kop {
    text-align: center;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 2px solid #000;
  }
  .kop h1 { font-size: 16pt; font-weight: 700; letter-spacing: 1px; }
  .kop h2 { font-size: 14pt; font-weight: 600; margin-top: 2px; }
  .kop h3 { font-size: 11pt; font-weight: 500; margin-top: 2px; color: #333; }
  .student-page { page-break-after: always; }
  .student-page:last-child { page-break-after: avoid; }
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px;
    font-size: 10.5pt;
  }
  .info-table td { padding: 2px 8px; }
  .info-label {
    font-weight: 600;
    width: 110px;
    color: #444;
  }
  .info-value { font-weight: 500; }
  .soal {
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 10px;
  }
  .soal-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .soal-tag {
    display: inline-block;
    background: #e8f0e8;
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 9pt;
    font-weight: 700;
    color: #1e4a2d;
  }
  .badge {
    display: inline-block;
    padding: 1px 10px;
    border-radius: 10px;
    font-size: 9pt;
    font-weight: 700;
  }
  .badge-r { background: #e8f5e9; color: #2e7d32; border: 1px solid #2e7d32; }
  .badge-s { background: #ffebee; color: #c62828; border: 1px solid #c62828; }
  .badge-un { background: #fff8e1; color: #f57f17; border: 1px solid #f57f17; }
  .soal-text {
    font-size: 10.5pt;
    padding: 6px 0;
    border-bottom: 1px dashed #ddd;
    margin-bottom: 6px;
  }
  .opt {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 3px 8px;
    border-radius: 4px;
    margin: 2px 0;
    font-size: 10pt;
  }
  .opt-letter { font-weight: 700; min-width: 18px; }
  .opt-text { flex: 1; }
  .opt-mark {
    font-size: 8pt;
    font-weight: 700;
    padding: 0 6px;
    white-space: nowrap;
  }
  .opt-correct { background: #e8f5e9; border: 1px solid #4caf50; }
  .opt-correct .opt-mark { color: #2e7d32; }
  .opt-wrong { background: #ffebee; border: 1px solid #ef5350; }
  .opt-wrong .opt-mark { color: #c62828; }
  .opt-key { background: #e3f2fd; border: 1px solid #64b5f6; }
  .opt-key .opt-mark { color: #1565c0; }
  .essay-answer {
    margin-top: 6px;
    padding: 8px 10px;
    background: #f5f9f5;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  .essay-label { font-weight: 700; font-size: 9.5pt; color: #1e4a2d; margin-bottom: 4px; }
  .essay-text { font-size: 10pt; white-space: pre-wrap; }
  @media print {
    body { padding: 0; }
    .kop { margin-top: 0; }
  }
</style>
</head>
<body>
<div class="kop">
  <h1>HASIL UJIAN BERBASIS DIGITAL</h1>
  <h2>MIS AN-NUR TANJUNGPINANG</h2>
  <h3>SEMESTER GENAP TAHUN AJARAN 2025/2026</h3>
</div>
${studentsHtml}
<script>
window.onload = function() {
  setTimeout(function() { window.print(); }, 300);
};
window.onafterprint = function() {
  window.close();
};
</script>
</body>
</html>`;
  };

  const handlePrintLembar = async () => {
    if (!slug || selectedPrintIds.size === 0) return;
    setPrinting(true);
    try {
      const promises = Array.from(selectedPrintIds).map((siswaId) =>
        fetch(`/api/admin/hasil/${slug}/detail/${siswaId}`).then((res) => {
          if (!res.ok) throw new Error("Gagal mengambil data siswa");
          return res.json() as Promise<DetailResponse>;
        })
      );
      const details = await Promise.all(promises);

      const printHtml = buildPrintHtml(data!.subject.name, details);

      const newWin = window.open("", "_blank");
      if (!newWin) {
        alert(
          "Pop-up diblokir. Izinkan pop-up untuk mencetak, atau tekan tombol Cetak lagi."
        );
        return;
      }
      newWin.document.write(printHtml);
      newWin.document.close();
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Gagal menyiapkan lembar cetak"
      );
    } finally {
      setPrinting(false);
      setShowPrintModal(false);
    }
  };

  const openPrintModal = () => {
    setSelectedPrintIds(new Set());
    setShowPrintModal(true);
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
              {data.essayCount > 0 && ` | Soal Essay: ${data.essayCount} butir`}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn btn-hijau btn-sm"
            onClick={openPrintModal}
            disabled={!data?.sessions?.length}
          >
            🖨 Cetak Lembar Jawaban
          </button>
          <button
            className="btn btn-outline btn-sm"
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
                <th>Nilai Essay</th>
                <th>Nilai Akhir</th>
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
                    {session.totalEssay > 0 ? (
                      session.gradedEssayCount > 0 ? (
                        <span style={{ fontWeight: 700, color: "var(--hijau-tua)" }}>
                          {session.essayScore}
                        </span>
                      ) : (
                        <span style={{ color: "var(--teks-abu)", fontSize: "0.85rem" }}>
                          ⏳
                        </span>
                      )
                    ) : (
                      <span style={{ color: "#ccc" }}>—</span>
                    )}
                  </td>
                  <td className="text-center">
                    {session.totalEssay > 0 && session.gradedEssayCount > 0 && data.pgCount > 0 ? (
                      <span style={{
                        fontWeight: 800,
                        color: "var(--hijau-tua)",
                        background: "var(--hijau-pucat)",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: "0.95rem",
                      }}>
                        {Math.round(((session.scorePg / data.pgCount) * 100 + (session.essayScore || 0)) / 2)}
                      </span>
                    ) : data.pgCount > 0 ? (
                      <span style={{ color: "var(--teks-abu)" }}>
                        {Math.round((session.scorePg / data.pgCount) * 100)}
                      </span>
                    ) : (
                      <span style={{ color: "#ccc" }}>—</span>
                    )}
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

      {/* Modal Pilih Siswa untuk Cetak */}
      {showPrintModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !printing)
              setShowPrintModal(false);
          }}
        >
          <div
            className="modal-box"
            style={{ maxWidth: 520, textAlign: "left" }}
          >
            <h3 style={{ color: "var(--hijau-tua)", marginBottom: 4 }}>
              🖨 Cetak Lembar Jawaban
            </h3>
            <p
              style={{
                color: "var(--teks-abu)",
                fontSize: "0.9rem",
                marginBottom: 16,
              }}
            >
              Pilih siswa yang akan dicetak lembar jawabannya.
            </p>

            <div
              style={{
                maxHeight: 320,
                overflowY: "auto",
                border: "1px solid #eef3ee",
                borderRadius: "var(--radius-sm)",
                padding: "4px 0",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eef3ee",
                  fontWeight: 700,
                  color: "var(--hijau-tua)",
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    data
                      ? selectedPrintIds.size === data.sessions.length
                      : false
                  }
                  onChange={toggleSelectAll}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                Pilih Semua ({data?.sessions.length || 0} siswa)
              </label>
              {data?.sessions.map((s) => (
                <label
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 14px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f5f8f5",
                    background: selectedPrintIds.has(s.student.id)
                      ? "#f0f7f0"
                      : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedPrintIds.has(s.student.id)}
                    onChange={() => togglePrintSelect(s.student.id)}
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                  />
                  <div style={{ flex: 1 }}>
                    <strong>{s.student.name}</strong>
                    <span style={{ color: "var(--teks-abu)", fontSize: "0.85rem", marginLeft: 8 }}>
                      {s.student.participantNumber}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color:
                        s.status === "completed"
                          ? "var(--hijau)"
                          : "var(--emas)",
                    }}
                  >
                    Skor: {s.scorePg}
                  </span>
                </label>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
                marginTop: 20,
              }}
            >
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowPrintModal(false)}
                disabled={printing}
              >
                Batal
              </button>
              <button
                className="btn btn-hijau btn-sm"
                onClick={handlePrintLembar}
                disabled={selectedPrintIds.size === 0 || printing}
              >
                {printing
                  ? "⏳ Menyiapkan..."
                  : `🖨 Cetak (${selectedPrintIds.size} siswa)`}
              </button>
            </div>
          </div>
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
