"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LayoutAdmin from "@/components/LayoutAdmin";

interface Period {
  academicYear: string;
  semester: string;
  classLevel: string;
  subjectCount: number;
}

interface SubjectRow {
  id: string;
  name: string;
  slug: string;
  durationMinutes: number;
  isActive: boolean;
  totalSessions: number;
  completedSessions: number;
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "2px solid #dde",
  borderRadius: "var(--radius-sm)",
  fontSize: "0.95rem",
  background: "#fafbfa",
  color: "var(--teks)",
};

export default function HasilPage() {
  const router = useRouter();

  const [periods, setPeriods] = useState<Period[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);

  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [classLevel, setClassLevel] = useState("");

  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPeriods() {
      try {
        const res = await fetch("/api/admin/hasil/periods");
        if (!res.ok) throw new Error("Gagal memuat periode");
        const data = await res.json();
        setPeriods(data.periods || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat periode");
      } finally {
        setLoadingPeriods(false);
      }
    }
    loadPeriods();
  }, []);

  const years = useMemo(
    () => Array.from(new Set(periods.map((p) => p.academicYear))),
    [periods]
  );

  const semesters = useMemo(
    () =>
      Array.from(
        new Set(
          periods
            .filter((p) => p.academicYear === year)
            .map((p) => p.semester)
        )
      ),
    [periods, year]
  );

  const classes = useMemo(
    () =>
      Array.from(
        new Set(
          periods
            .filter((p) => p.academicYear === year && p.semester === semester)
            .map((p) => p.classLevel)
        )
      ),
    [periods, year, semester]
  );

  const onYearChange = (val: string) => {
    setYear(val);
    setSemester("");
    setClassLevel("");
    setSubjects([]);
    setHasShown(false);
  };
  const onSemesterChange = (val: string) => {
    setSemester(val);
    setClassLevel("");
    setSubjects([]);
    setHasShown(false);
  };
  const onClassChange = (val: string) => {
    setClassLevel(val);
    setSubjects([]);
    setHasShown(false);
  };

  const handleShow = async () => {
    if (!year || !semester || !classLevel) return;
    setLoadingList(true);
    setError(null);
    setHasShown(true);
    try {
      const url = `/api/admin/hasil/by-period?year=${encodeURIComponent(
        year
      )}&semester=${encodeURIComponent(semester)}&class=${encodeURIComponent(
        classLevel
      )}`;
      const res = await fetch(url);
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Gagal memuat mapel");
      }
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat mapel");
      setSubjects([]);
    } finally {
      setLoadingList(false);
    }
  };

  const canShow = !!year && !!semester && !!classLevel;

  return (
    <LayoutAdmin title="Hasil Ujian">
      <div className="admin-header">
        <h3>Pilih Periode Ujian</h3>
        <p style={{ color: "var(--teks-abu)", marginTop: 4 }}>
          Pilih Tahun Ajaran, Semester, dan Kelas terlebih dahulu
        </p>
      </div>

      {/* Langkah 1 — Filter */}
      <div
        style={{
          background: "white",
          borderRadius: "var(--radius)",
          padding: 20,
          boxShadow: "var(--shadow)",
          marginBottom: 20,
        }}
      >
        {loadingPeriods ? (
          <p style={{ color: "var(--teks-abu)" }}>Memuat periode...</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
              alignItems: "end",
            }}
          >
            <div>
              <label
                style={{
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "var(--teks-abu)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Tahun Ajaran
              </label>
              <select
                value={year}
                onChange={(e) => onYearChange(e.target.value)}
                style={selectStyle}
              >
                <option value="">— Pilih Tahun —</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "var(--teks-abu)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => onSemesterChange(e.target.value)}
                disabled={!year}
                style={selectStyle}
              >
                <option value="">— Pilih Semester —</option>
                {semesters.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "var(--teks-abu)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Kelas
              </label>
              <select
                value={classLevel}
                onChange={(e) => onClassChange(e.target.value)}
                disabled={!semester}
                style={selectStyle}
              >
                <option value="">— Pilih Kelas —</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    Kelas {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                className="btn btn-hijau btn-block"
                onClick={handleShow}
                disabled={!canShow || loadingList}
                style={{ height: 44 }}
              >
                {loadingList ? "Memuat..." : "Tampilkan"}
              </button>
            </div>
          </div>
        )}
        {error && (
          <p style={{ color: "#c62828", marginTop: 12, fontSize: "0.9rem" }}>
            {error}
          </p>
        )}
      </div>

      {/* Langkah 2 — Daftar mapel */}
      {hasShown && (
        <>
          {loadingList ? (
            <div className="loading-state">
              <p>Memuat data mapel...</p>
            </div>
          ) : subjects.length === 0 ? (
            <div className="empty-state">
              <p>📭 Tidak ada mapel untuk periode ini.</p>
            </div>
          ) : (
            <div className="mapel-grid">
              {subjects.map((s) => (
                <button
                  key={s.slug}
                  className="mapel-card"
                  onClick={() => router.push(`/admin/hasil/${s.slug}`)}
                >
                  <div className="mapel-card-icon">
                    <span>📋</span>
                  </div>
                  <div className="mapel-card-body">
                    <h4>{s.name}</h4>
                    <div className="mapel-card-stats">
                      <span className="stat-badge stat-completed">
                        ✅ {s.completedSessions} selesai
                      </span>
                      <span className="stat-badge stat-total">
                        👥 {s.totalSessions} total
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </LayoutAdmin>
  );
}
