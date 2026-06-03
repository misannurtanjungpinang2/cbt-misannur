"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import LayoutAdmin from "@/components/LayoutAdmin";

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
  essayScore: number | null;
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
    pgCorrect: number;
    pgTotal: number;
    pgPercentage: number;
    essayCount: number;
    gradedEssayCount: number;
    essayScore: number | null;
    finalScore: number | null;
  };
  questions: QuestionDetail[];
}

export default function DetailJawabanPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const siswaId = params?.siswaId as string;

  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!slug || !siswaId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/hasil/${slug}/detail/${siswaId}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal memuat detail");
      }
      const json: DetailResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [slug, siswaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const getOptionLabel = (key: string) => {
    const labels: Record<string, string> = {
      A: "A",
      B: "B",
      C: "C",
      D: "D",
    };
    return labels[key] || key;
  };

  if (loading) {
    return (
      <LayoutAdmin title="Detail Jawaban">
        <div className="loading-state">
          <div className="spinner" />
          <p>Memuat detail jawaban...</p>
        </div>
      </LayoutAdmin>
    );
  }

  if (error) {
    return (
      <LayoutAdmin title="Detail Jawaban">
        <div className="error-state">
          <p>❌ {error}</p>
          <button className="btn btn-outline btn-sm" onClick={fetchData}>
            Coba Lagi
          </button>
          <Link
            href={`/admin/hasil/${slug}`}
            className="btn btn-outline btn-sm"
            style={{ marginLeft: 8 }}
          >
            ← Kembali
          </Link>
        </div>
      </LayoutAdmin>
    );
  }

  if (!data) {
    return (
      <LayoutAdmin title="Detail Jawaban">
        <div className="empty-state">
          <p>Data tidak ditemukan.</p>
          <Link href={`/admin/hasil/${slug}`} className="btn btn-outline btn-sm">
            ← Kembali
          </Link>
        </div>
      </LayoutAdmin>
    );
  }

  const { student, subject, session, questions } = data;
  const pgQuestions = questions.filter((q) => q.type === "pg");
  const essayQuestions = questions.filter((q) => q.type === "essay");
  const pgCorrect = pgQuestions.filter((q) => q.isCorrect === true).length;
  const gradedEssays = essayQuestions.filter((q) => q.essayScore !== null);
  const avgEssayScore = gradedEssays.length > 0
    ? Math.round(gradedEssays.reduce((sum, q) => sum + (q.essayScore || 0), 0) / gradedEssays.length)
    : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <LayoutAdmin title={`Detail Jawaban - ${student.name}`}>
      {/* Kop surat untuk cetak — hanya muncul saat print */}
      <div className="print-header">
        <h1>HASIL UJIAN BERBASIS DIGITAL</h1>
        <h2>MIS AN-NUR TANJUNGPINANG</h2>
        <h3>SEMESTER GENAP TAHUN AJARAN 2025/2026</h3>
      </div>

      <div className="admin-header no-print">
        <div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => router.push(`/admin/hasil/${slug}`)}
            style={{ marginBottom: 12 }}
          >
            ← Kembali ke Tabel
          </button>
          <h3>Detail Jawaban Siswa</h3>
        </div>
        <button
          className="btn btn-hijau btn-sm"
          onClick={handlePrint}
        >
          🖨 Cetak
        </button>
      </div>

      {/* Info Siswa */}
      <div className="detail-info-card">
        <div className="detail-info-grid">
          <div className="detail-info-item">
            <span className="detail-label">Nama</span>
            <span className="detail-value">{student.name}</span>
          </div>
          <div className="detail-info-item">
            <span className="detail-label">No Peserta</span>
            <span className="detail-value">{student.participantNumber}</span>
          </div>
          <div className="detail-info-item">
            <span className="detail-label">Kelas</span>
            <span className="detail-value">{student.class}</span>
          </div>
          <div className="detail-info-item">
            <span className="detail-label">Mata Pelajaran</span>
            <span className="detail-value">{subject.name}</span>
          </div>
          <div className="detail-info-item">
            <span className="detail-label">Waktu Mulai</span>
            <span className="detail-value">{formatDateTime(session.startTime)}</span>
          </div>
          <div className="detail-info-item">
            <span className="detail-label">Waktu Selesai</span>
            <span className="detail-value">{formatDateTime(session.endTime)}</span>
          </div>
          <div className="detail-info-item">
            <span className="detail-label">Status</span>
            <span className="detail-value">
              {session.status === "completed"
                ? "✅ Selesai"
                : session.status === "auto_submit"
                ? "⏰ Auto Submit"
                : "🔄 In Progress"}
            </span>
          </div>
          <div className="detail-info-item">
            <span className="detail-label">Skor PG</span>
            <span className="detail-value score-highlight">
              {pgCorrect} / {pgQuestions.length}
              {pgQuestions.length > 0 && (
                <span className="score-pct">
                  ({Math.round((pgCorrect / pgQuestions.length) * 100)}%)
                </span>
              )}
            </span>
          </div>
          {essayQuestions.length > 0 && (
            <>
              <div className="detail-info-item">
                <span className="detail-label">Nilai Essay</span>
                <span className="detail-value score-highlight">
                  {gradedEssays.length > 0
                    ? `${avgEssayScore}% (${gradedEssays.length}/${essayQuestions.length})`
                    : "⏳ Belum dinilai"}
                </span>
              </div>
              <div className="detail-info-item">
                <span className="detail-label">Nilai Akhir</span>
                <span className="detail-value score-highlight" style={{ fontSize: "1.3rem", color: "var(--hijau-tua)" }}>
                  {avgEssayScore !== null && pgQuestions.length > 0
                    ? `${Math.round(((pgCorrect / pgQuestions.length) * 100 + avgEssayScore) / 2)} / 100`
                    : pgQuestions.length > 0
                    ? `${Math.round((pgCorrect / pgQuestions.length) * 100)} / 100 (PG only)`
                    : "—"}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Daftar Soal */}
      <div className="detail-questions">
        <h4 style={{ marginBottom: 16 }}>
          Daftar Soal ({questions.length} soal)
        </h4>

        {questions.map((q) => (
          <div
            key={q.id}
            className={`detail-question-card ${
              q.type === "pg"
                ? q.isCorrect === true
                  ? "card-correct"
                  : q.isCorrect === false
                  ? "card-wrong"
                  : ""
                : ""
            }`}
          >
            <div className="question-header">
              <span className="question-number-badge">
                {q.type === "pg" ? "PG" : "Essay"} #{q.number}
              </span>
              {q.type === "pg" && q.isCorrect === true && (
                <span className="badge badge-correct">✅ Benar</span>
              )}
              {q.type === "pg" && q.isCorrect === false && (
                <span className="badge badge-wrong">❌ Salah</span>
              )}
              {q.type === "pg" && q.studentAnswer === null && (
                <span className="badge badge-unanswered">⚠️ Tidak Dijawab</span>
              )}
            </div>

            <div
              className="question-text"
              dangerouslySetInnerHTML={{ __html: q.text }}
            />

            {q.type === "pg" && (
              <div className="pg-options-review">
                {["A", "B", "C", "D"].map((opt) => {
                  const optionText =
                    opt === "A"
                      ? q.optionA
                      : opt === "B"
                      ? q.optionB
                      : opt === "C"
                      ? q.optionC
                      : q.optionD;
                  if (!optionText) return null;

                  const isStudentChoice = q.studentAnswer?.toUpperCase() === opt;
                  const isCorrectAnswer = q.correctAnswer?.toUpperCase() === opt;

                  let className = "option-item";
                  if (isCorrectAnswer) className += " option-correct";
                  if (isStudentChoice && !isCorrectAnswer)
                    className += " option-wrong";
                  if (isStudentChoice) className += " option-chosen";

                  return (
                    <div key={opt} className={className}>
                      <span className="option-key">{opt}.</span>
                      <span
                        className="option-text"
                        dangerouslySetInnerHTML={{ __html: optionText }}
                      />
                      {isCorrectAnswer && (
                        <span className="option-mark">✔ Kunci</span>
                      )}
                      {isStudentChoice && !isCorrectAnswer && (
                        <span className="option-mark mark-wrong">✘ Pilihanmu</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {q.type === "essay" && (
              <div className="essay-answer-review">
                <div className="essay-label">Jawaban Siswa:</div>
                <div className="essay-text">
                  {q.studentAnswer ? (
                    <p>{q.studentAnswer}</p>
                  ) : (
                    <p className="text-muted">(Tidak dijawab)</p>
                  )}
                </div>
                {q.essayScore !== null && (
                  <div style={{
                    marginTop: 10,
                    padding: "8px 14px",
                    background: "var(--hijau-pucat)",
                    borderRadius: "var(--radius-sm)",
                    display: "inline-block",
                  }}>
                    <span style={{ fontWeight: 700, color: "var(--hijau-tua)" }}>
                      Nilai: {q.essayScore}/100
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </LayoutAdmin>
  );
}
