"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import LayoutGuru from "@/components/LayoutGuru";

interface EssayData {
  id: string;
  number: number;
  text: string;
  studentAnswer: string | null;
  essayScore: number | null;
  answerId: string | null;
  gradedAt: string | null;
}

interface DetailData {
  student: { id: string; name: string; participantNumber: string; class: string };
  subject: { name: string; slug: string };
  session: {
    id: string; startTime: string | null; endTime: string | null;
    status: string; scorePg: number;
    pgCorrect: number; pgTotal: number; pgPercentage: number;
  };
  essays: EssayData[];
}

export default function GuruPeriksaPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const siswaId = params?.siswaId as string;

  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!slug || !siswaId) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/teacher/subjek/${slug}/detail/${siswaId}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) { router.push("/guru"); return; }
        const errData = await res.json();
        throw new Error(errData.error || "Gagal memuat data");
      }
      const json: DetailData = await res.json();
      setData(json);
      const initScores: Record<string, string> = {};
      json.essays.forEach((e) => { initScores[e.id] = e.essayScore !== null ? String(e.essayScore) : ""; });
      setScores(initScores);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally { setLoading(false); }
  }, [slug, siswaId, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleScoreChange = (questionId: string, value: string) => {
    if (value === "" || /^\d{0,3}$/.test(value)) {
      setScores((prev) => ({ ...prev, [questionId]: value }));
    }
  };

  const handleScoreBlur = (questionId: string) => {
    setScores((prev) => {
      const raw = prev[questionId];
      if (raw === "" || raw === undefined) return prev;
      const num = parseInt(raw, 10);
      if (isNaN(num)) return { ...prev, [questionId]: "" };
      return { ...prev, [questionId]: String(Math.max(0, Math.min(100, num))) };
    });
  };

  const getScoreNum = (questionId: string): number => {
    const raw = scores[questionId];
    if (raw === "" || raw === undefined) return 0;
    const num = parseInt(raw, 10);
    return isNaN(num) ? 0 : num;
  };

  const handleSaveAll = async () => {
    if (!data?.session.id) return;
    setSaving(true); setSaveMessage(null);
    try {
      const scoresPayload = data.essays.map((essay) => {
        if (!essay.answerId) return null;
        return { answerId: essay.answerId, essayScore: getScoreNum(essay.id) };
      }).filter(Boolean);

      const res = await fetch(`/api/teacher/subjek/${slug}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: data.session.id, scores: scoresPayload }),
      });
      if (!res.ok) { const errData = await res.json(); throw new Error(errData.error || "Gagal menyimpan nilai"); }
      setSaveMessage("Nilai berhasil disimpan ✅");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally { setSaving(false); }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <LayoutGuru title="Periksa Essay"><div className="loading-state"><div className="spinner" /><p>Memuat data...</p></div></LayoutGuru>;
  if (error && !data) return <LayoutGuru title="Periksa Essay"><div className="error-state"><p>❌ {error}</p><button className="btn btn-outline btn-sm" onClick={fetchData}>Coba Lagi</button></div></LayoutGuru>;
  if (!data) return <LayoutGuru title="Periksa Essay"><div className="empty-state"><p>Data tidak ditemukan.</p></div></LayoutGuru>;

  const { student, subject, session, essays } = data;
  const totalGraded = essays.filter((e) => scores[e.id] !== undefined && scores[e.id] !== "").length;
  const sumScores = essays.reduce((sum, e) => sum + getScoreNum(e.id), 0);
  const avgEssayScore = totalGraded > 0 ? Math.round(sumScores / essays.length) : 0;
  const finalScore = session.pgTotal > 0 ? Math.round((session.pgPercentage + avgEssayScore) / 2) : 0;

  return (
    <LayoutGuru title={`Periksa Essay - ${student.name}`}>
      <div className="admin-header">
        <div>
          <button className="btn btn-outline btn-sm" onClick={() => router.push(`/guru/subjek/${slug}`)} style={{ marginBottom: 12 }}>← Kembali ke Daftar</button>
          <h3>Periksa Essay: {student.name}</h3>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saveMessage && <span style={{ color: "#2e7d32", fontWeight: 600, fontSize: "0.9rem" }}>{saveMessage}</span>}
          <button className="btn btn-hijau" onClick={handleSaveAll} disabled={saving || essays.length === 0} type="button">
            {saving ? "Menyimpan..." : "💾 Simpan Semua Nilai"}
          </button>
        </div>
      </div>

      {error && <div style={{ background: "#fce4e4", color: "#c62828", padding: "10px 14px", borderRadius: "var(--radius-sm)", marginBottom: 16, fontSize: "0.85rem" }}>
        ❌ {error}</div>}

      <div className="detail-info-card">
        <div className="detail-info-grid">
          <div className="detail-info-item"><span className="detail-label">Nama</span><span className="detail-value">{student.name}</span></div>
          <div className="detail-info-item"><span className="detail-label">No Peserta</span><span className="detail-value">{student.participantNumber}</span></div>
          <div className="detail-info-item"><span className="detail-label">Kelas</span><span className="detail-value">{student.class}</span></div>
          <div className="detail-info-item"><span className="detail-label">Mapel</span><span className="detail-value">{subject.name}</span></div>
          <div className="detail-info-item"><span className="detail-label">Waktu</span><span className="detail-value">{formatDate(session.startTime)} — {formatDate(session.endTime)}</span></div>
          <div className="detail-info-item"><span className="detail-label">Nilai PG</span><span className="detail-value score-highlight">{session.pgCorrect}/{session.pgTotal} ({session.pgPercentage}%)</span></div>
        </div>
      </div>

      {essays.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, var(--hijau-tua), var(--hijau))", borderRadius: "var(--radius)", padding: "20px 24px", marginBottom: 24, color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div><div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Nilai PG</div><div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{session.pgPercentage}%</div></div>
          <div><div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Nilai Essay</div><div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{avgEssayScore}%</div></div>
          <div><div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Nilai Akhir</div><div style={{ fontSize: "2rem", fontWeight: 800 }}>{finalScore}<span style={{ fontSize: "1rem", fontWeight: 400, opacity: 0.8 }}> / 100</span></div></div>
        </div>
      )}

      {essays.length === 0 ? (
        <div className="empty-state"><p>📭 Tidak ada soal essay untuk mapel ini.</p></div>
      ) : (
        <div>
          <h4 style={{ marginBottom: 16, color: "var(--hijau-tua)" }}>Soal Essay ({essays.length})</h4>
          {essays.map((essay) => {
            const currentScore = scores[essay.id] ?? "";
            const isGraded = essay.essayScore !== null;
            return (
              <div key={essay.id} className="detail-question-card" style={{ borderLeft: `5px solid ${isGraded ? "var(--hijau-muda)" : "#ffc107"}` }}>
                <div className="question-header">
                  <span className="question-number-badge">Essay #{essay.number}</span>
                  {isGraded && <span className="badge badge-correct">✅ Sudah Dinilai</span>}
                  {!essay.studentAnswer && <span className="badge badge-unanswered">⚠️ Tidak Dijawab</span>}
                </div>
                <div className="question-text" dangerouslySetInnerHTML={{ __html: essay.text }} />
                <div style={{ marginTop: 12, padding: 12, background: "#f9fbf9", borderRadius: "var(--radius-sm)", border: "1px solid #eef3ee" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--hijau-tua)", marginBottom: 8 }}>✍️ Jawaban Siswa:</div>
                  {essay.studentAnswer ? (
                    <div style={{ whiteSpace: "pre-wrap", fontSize: "0.95rem", lineHeight: 1.7 }}>{essay.studentAnswer}</div>
                  ) : (
                    <div style={{ color: "var(--teks-abu)", fontStyle: "italic" }}>(Tidak dijawab)</div>
                  )}
                </div>
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
                  <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--hijau-tua)" }}>Skor (0-100):</label>
                  <input type="text" inputMode="numeric" value={currentScore}
                    onChange={(e) => handleScoreChange(essay.id, e.target.value)}
                    onBlur={(e) => { handleScoreBlur(essay.id); e.target.style.borderColor = "#dde"; }}
                    style={{ width: 100, padding: "8px 12px", border: "2px solid #dde", borderRadius: "var(--radius-sm)", fontSize: "1rem", fontWeight: 700, textAlign: "center", outline: "none" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--hijau-muda)"; }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {essays.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 32, marginBottom: 40 }}>
          <button className="btn btn-hijau" onClick={handleSaveAll} disabled={saving} type="button" style={{ padding: "14px 40px", fontSize: "1.1rem" }}>
            {saving ? "⏳ Menyimpan..." : "💾 Simpan Semua Nilai"}
          </button>
        </div>
      )}
    </LayoutGuru>
  );
}
