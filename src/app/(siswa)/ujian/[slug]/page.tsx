"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import LayoutSiswa from "@/components/LayoutSiswa";
import SoalCard from "@/components/SoalCard";
import type { SoalData } from "@/components/SoalCard";
import GridNavigasi from "@/components/GridNavigasi";
import Timer, { formatTimeLong } from "@/components/Timer";

// ============================================================
// Types
// ============================================================

interface ExamData {
  sessionId: string;
  questions: SoalData[];
  answers: Record<string, { answer: string; flagged: boolean }>;
  durationMinutes: number;
  totalQuestions: number;
  startTime: string;
}

interface StatusData {
  remainingSeconds: number;
  answered: number;
  totalQuestions: number;
  flagged: string[];
  isTimeUp: boolean;
}

type AnswerMap = Record<
  string,
  { answer: string; flagged: boolean }
>;

// ============================================================
// Utility: format sisa waktu (MM:DD)
// ============================================================
function formatTime(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const d = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(d).padStart(2, "0")}`;
}

// ============================================================
// Halaman Ujian
// ============================================================

export default function UjianPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data ujian
  const [sessionId, setSessionId] = useState<string>("");
  const [questions, setQuestions] = useState<SoalData[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startTime, setStartTime] = useState<string>("");

  // Navigation state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlagged, setIsFlagged] = useState(false);

  // Timer sync from server
  const [serverRemaining, setServerRemaining] = useState<number>(3600);
  const [serverAnswered, setServerAnswered] = useState(0);
  const [serverFlagged, setServerFlagged] = useState<string[]>([]);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Auto-save ref
  const lastSavedAnswerRef = useRef<string>("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ==========================================================
  // 1. Mulai / Load ujian
  // ==========================================================
  const startExam = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/siswa/ujian/${slug}/mulai`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          router.push("/");
          return;
        }
        throw new Error(data.error || "Gagal memulai ujian");
      }

      const data: ExamData = await res.json();
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setAnswers(data.answers || {});
      setDurationMinutes(data.durationMinutes || 60);
      setStartTime(data.startTime);

      // Hitung sisa waktu awal dari server
      if (data.startTime) {
        const start = new Date(data.startTime).getTime();
        const end = start + (data.durationMinutes || 60) * 60 * 1000;
        const remaining = Math.max(
          0,
          Math.floor((end - Date.now()) / 1000)
        );
        setServerRemaining(remaining);
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
      setLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    if (slug) {
      startExam();
    }
  }, [slug, startExam]);

  // ==========================================================
  // 2. Sync status dari server (tiap 30 detik)
  // ==========================================================
  useEffect(() => {
    if (!slug || !sessionId) return;

    const syncStatus = async () => {
      try {
        const res = await fetch(`/api/siswa/ujian/${slug}/status`);

        if (res.ok) {
          const data: StatusData = await res.json();
          setServerRemaining(data.remainingSeconds);
          setServerAnswered(data.answered);
          setServerFlagged(data.flagged);
          setIsTimeUp(data.isTimeUp);

          // Auto-submit jika waktu habis
          if (data.isTimeUp && !submitting) {
            handleSubmit(true);
          }
        } else if (res.status === 401) {
          router.push("/");
        }
      } catch {
        // Silent fail — jangan sampai sync mengganggu user
      }
    };

    // Sync pertama setelah 5 detik, lalu tiap 30 detik
    const initialTimer = setTimeout(syncStatus, 5000);
    const interval = setInterval(syncStatus, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [slug, sessionId, submitting]);

  // ==========================================================
  // 3. Update Flagged state dari server answers
  // ==========================================================
  useEffect(() => {
    if (questions.length > 0 && answers) {
      const currentQ = questions[currentIndex];
      if (currentQ) {
        const ans = answers[currentQ.id];
        setIsFlagged(ans?.flagged ?? false);
      }
    }
  }, [currentIndex, questions, answers]);

  // ==========================================================
  // 4. Auto-save jawaban
  // ==========================================================
  const saveAnswer = useCallback(
    async (questionId: string | number, answer: string) => {
      try {
        const res = await fetch(`/api/siswa/ujian/${slug}/jawab`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: String(questionId), answer }),
        });

        if (res.ok) {
          // Update local state sebagai cache
          setAnswers((prev) => ({
            ...prev,
            [String(questionId)]: {
              answer,
              flagged: prev[String(questionId)]?.flagged ?? false,
            },
          }));
        } else if (res.status === 400) {
          const data = await res.json();
          if (data.error?.includes("waktu telah habis")) {
            setIsTimeUp(true);
            handleSubmit(true);
          }
        }
      } catch {
        // Silent fail — auto-save failure shouldn't break UX
      }
    },
    [slug]
  );

  // Debounced save: simpan setelah 500ms tidak ada perubahan
  const debouncedSave = useCallback(
    (questionId: string | number, answer: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        saveAnswer(questionId, answer);
      }, 500);
    },
    [saveAnswer]
  );

  // ==========================================================
  // 5. Handler jawaban berubah
  // ==========================================================
  const handleAnswerChange = useCallback(
    (soalId: string | number, answer: string) => {
      // Update local state dulu untuk UX cepat
      setAnswers((prev) => ({
        ...prev,
        [String(soalId)]: {
          answer,
          flagged: prev[String(soalId)]?.flagged ?? false,
        },
      }));

      lastSavedAnswerRef.current = answer;
      debouncedSave(soalId, answer);
    },
    [debouncedSave]
  );

  // ==========================================================
  // 6. Toggle flag (ragu-ragu)
  // ==========================================================
  const handleToggleFlag = useCallback(
    async (soalId: string | number) => {
      const qId = String(soalId);
      const currentFlagged = answers[qId]?.flagged ?? false;
      const newFlagged = !currentFlagged;

      // Update local state dulu
      setAnswers((prev) => ({
        ...prev,
        [qId]: {
          answer: prev[qId]?.answer ?? "",
          flagged: newFlagged,
        },
      }));
      setIsFlagged(newFlagged);

      // Simpan ke server
      try {
        await fetch(`/api/siswa/ujian/${slug}/flagged`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: qId,
            flagged: newFlagged,
          }),
        });
      } catch {
        // Silent fail
      }
    },
    [slug, answers]
  );

  // ==========================================================
  // 7. Navigasi soal
  // ==========================================================
  const goToSoal = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= questions.length) return;
      setCurrentIndex(idx);
    },
    [questions.length]
  );

  const goPrev = useCallback(() => {
    goToSoal(currentIndex - 1);
  }, [currentIndex, goToSoal]);

  const goNext = useCallback(() => {
    goToSoal(currentIndex + 1);
  }, [currentIndex, goToSoal]);

  // ==========================================================
  // 8. Submit ujian
  // ==========================================================
  const handleSubmit = useCallback(
    async (isAuto: boolean = false) => {
      if (submitting) return;
      setSubmitting(true);
      setShowModal(false);

      try {
        const res = await fetch(`/api/siswa/ujian/${slug}/kumpul`, {
          method: "POST",
        });

        if (res.ok) {
          const data = await res.json();
          // Redirect ke halaman selesai
          router.push(
            `/selesai?score=${data.score || 0}&totalPg=${data.totalPg || 0}`
          );
        } else if (res.status === 401) {
          router.push("/");
        } else {
          const errData = await res.json();
          setError(errData.error || "Gagal mengumpulkan ujian");
        }
      } catch {
        setError("Gagal mengumpulkan ujian");
      } finally {
        setSubmitting(false);
      }
    },
    [slug, submitting, router]
  );

  // ==========================================================
  // 9. Timer habis → auto-submit
  // ==========================================================
  const handleTimeUp = useCallback(() => {
    if (!submitting) {
      setIsTimeUp(true);
      handleSubmit(true);
    }
  }, [submitting, handleSubmit]);

  // ==========================================================
  // 10. Build data untuk komponen
  // ==========================================================

  const currentSoal = questions[currentIndex] || null;
  const currentAnswer = currentSoal ? answers[currentSoal.id]?.answer ?? "" : "";

  // Hitung answered & flagged untuk GridNavigasi
  const answeredIds = Object.entries(answers)
    .filter(([, v]) => v.answer && v.answer.trim() !== "")
    .map(([k]) => k);

  const flaggedIds = Object.entries(answers)
    .filter(([, v]) => v.flagged)
    .map(([k]) => k);

  const totalAnswered = answeredIds.length;

  // ==========================================================
  // LOADING
  // ==========================================================
  if (loading) {
    return (
      <LayoutSiswa subtitle="Memuat ujian..." hideLogout>
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "var(--teks-abu)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              border: "4px solid var(--hijau-pucat)",
              borderTopColor: "var(--hijau)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p>Memuat soal ujian...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </LayoutSiswa>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================
  if (error) {
    return (
      <LayoutSiswa subtitle="Terjadi Kesalahan" hideLogout>
        <div className="finish-screen">
          <h3>❌ {error}</h3>
          <p style={{ color: "var(--teks-abu)", marginBottom: 20 }}>
            Silakan coba lagi atau hubungi pengawas.
          </p>
          <button
            className="btn btn-hijau"
            onClick={() => {
              setError(null);
              setLoading(true);
              startExam();
            }}
          >
            Coba Lagi
          </button>
          <button
            className="btn btn-outline"
            style={{ marginLeft: 8 }}
            onClick={() => router.push("/mapel")}
          >
            Kembali ke Mapel
          </button>
        </div>
      </LayoutSiswa>
    );
  }

  // ==========================================================
  // EMPTY
  // ==========================================================
  if (questions.length === 0) {
    return (
      <LayoutSiswa subtitle="Tidak Ada Soal" hideLogout>
        <div className="finish-screen">
          <h3>📭 Belum ada soal</h3>
          <p style={{ color: "var(--teks-abu)", marginBottom: 20 }}>
            Mata pelajaran ini belum memiliki soal. Hubungi pengawas.
          </p>
          <button
            className="btn btn-hijau"
            onClick={() => router.push("/mapel")}
          >
            Kembali ke Mapel
          </button>
        </div>
      </LayoutSiswa>
    );
  }

  // ==========================================================
  // MAIN EXAM UI
  // ==========================================================
  return (
    <LayoutSiswa subtitle={`Ujian - ${questions.length} Soal`} hideLogout>
      {/* Timer Bar */}
      <div className="timer-bar">
        <span style={{ fontWeight: 600, color: "var(--teks-abu)" }}>
          ⏱️ Sisa Waktu
        </span>
        <span
          className={`timer-display${
            serverRemaining > 0 && serverRemaining <= 300
              ? " timer-warning"
              : ""
          }`}
        >
          {formatTime(serverRemaining)}
        </span>
        <span style={{ fontSize: "0.9rem", color: "var(--teks-abu)" }}>
          {isTimeUp
            ? "⏰ Waktu habis!"
            : serverRemaining <= 300
              ? "⚠️ Waktu tinggal sedikit!"
              : `${Math.floor(serverRemaining / 60)} menit tersisa`}
        </span>
        <span style={{ fontSize: "0.85rem", color: "var(--teks-abu)" }}>
          Terjawab: {totalAnswered}/{questions.length}
        </span>
      </div>

      {/* Exam Layout */}
      <div className="exam-layout">
        {/* Question Area */}
        <div className="question-area">
          {currentSoal && (
            <SoalCard
              key={currentSoal.id}
              soal={currentSoal}
              selectedAnswer={currentAnswer}
              isFlagged={isFlagged}
              onAnswerChange={handleAnswerChange}
              onToggleFlag={handleToggleFlag}
              disabled={isTimeUp || submitting}
            />
          )}

          {/* Navigation Buttons */}
          <div className="nav-buttons">
            <button
              className="btn btn-outline btn-sm"
              disabled={currentIndex === 0 || isTimeUp || submitting}
              onClick={goPrev}
            >
              ⬅ Sebelumnya
            </button>
            <button
              className="btn btn-hijau btn-sm"
              onClick={() => setShowModal(true)}
              disabled={isTimeUp || submitting}
              style={{ background: "var(--hijau)", border: "none" }}
            >
              ✋ Kumpulkan
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={
                currentIndex === questions.length - 1 || isTimeUp || submitting
              }
              onClick={goNext}
            >
              Selanjutnya ➡
            </button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <GridNavigasi
          totalSoal={questions.length}
          currentNomor={currentIndex}
          answered={answeredIds}
          flagged={flaggedIds}
          onClick={goToSoal}
        />
      </div>

      {/* Modal Konfirmasi Kumpul */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal-box">
            <span style={{ fontSize: 48, display: "block" }}>📝</span>
            <h3 style={{ color: "var(--hijau-tua)" }}>Kumpulkan Ujian?</h3>
            <p style={{ color: "var(--teks-abu)", margin: "12px 0" }}>
              Pastikan semua jawaban sudah diisi dengan benar. Anda tidak dapat
              mengubah jawaban setelah dikumpulkan.
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--teks-abu)",
                marginBottom: 8,
              }}
            >
              Terjawab: {totalAnswered}/{questions.length}
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
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Batal
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
              >
                {submitting ? "Mengumpulkan..." : "Ya, Kumpulkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Timer component for time-up callback */}
      <div style={{ display: "none" }}>
        <Timer
          seconds={serverRemaining}
          onTimeUp={handleTimeUp}
          isRunning={!isTimeUp && !submitting}
        />
      </div>
    </LayoutSiswa>
  );
}
