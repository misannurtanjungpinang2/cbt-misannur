"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LayoutAdmin from "@/components/LayoutAdmin";

function TambahEditSoalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

interface Subject {
  id: string;
  name: string;
  slug: string;
}

interface Question {
  id: string;
  subjectId: string;
  number: number;
  type: "pg" | "essay";
  text: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string | null;
}

  const editId = searchParams.get("id");
  const preselectedSubjectId = searchParams.get("subjectId");

  const isEditMode = !!editId;

  // Form state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState(preselectedSubjectId || "");
  const [number, setNumber] = useState("");
  const [type, setType] = useState<"pg" | "essay">("pg");
  const [text, setText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load subjects
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch("/api/admin/subjects");
        if (res.ok) {
          const data = await res.json();
          if (data.subjects) {
            setSubjects(data.subjects);
          }
        }
      } catch (e) {
        console.error("Gagal load mapel:", e);
      }
    }
    loadSubjects();
  }, []);

  // If edit mode, load existing question
  useEffect(() => {
    if (!editId) return;

    setLoading(true);
    fetch(`/api/admin/soal/${editId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat data soal");
        return res.json();
      })
      .then((data) => {
        const q: Question = data.question;
        if (q) {
          setSubjectId(q.subjectId);
          setNumber(String(q.number));
          setType(q.type);
          setText(q.text);
          setOptionA(q.optionA || "");
          setOptionB(q.optionB || "");
          setOptionC(q.optionC || "");
          setOptionD(q.optionD || "");
          setCorrectAnswer(q.correctAnswer || "");
        }
      })
      .catch((err) => {
        setError(err.message || "Gagal memuat data soal");
      })
      .finally(() => setLoading(false));
  }, [editId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // === Validasi ===
    if (!subjectId) {
      setError("Pilih mata pelajaran");
      return;
    }
    if (!text.trim()) {
      setError("Teks soal tidak boleh kosong");
      return;
    }
    if (!number || parseInt(number) < 1) {
      setError("Nomor soal harus diisi dengan angka positif");
      return;
    }
    if (type === "pg") {
      if (!optionA.trim() || !optionB.trim()) {
        setError("Soal PG minimal harus memiliki opsi A dan B");
        return;
      }
      if (!correctAnswer || !["A", "B", "C", "D"].includes(correctAnswer.toUpperCase())) {
        setError("Kunci jawaban harus A, B, C, atau D");
        return;
      }
    }

    setSaving(true);

    try {
      const payload = {
        subjectId,
        number: parseInt(number),
        type,
        text: text.trim(),
        optionA: type === "pg" ? optionA.trim() : null,
        optionB: type === "pg" ? optionB.trim() : null,
        optionC: type === "pg" ? (optionC.trim() || null) : null,
        optionD: type === "pg" ? (optionD.trim() || null) : null,
        correctAnswer: type === "pg" ? correctAnswer.toUpperCase() : null,
      };

      let res: Response;

      if (isEditMode) {
        // PUT update
        res = await fetch(`/api/admin/soal/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // POST create
        res = await fetch("/api/admin/soal/tambah", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setSuccess(
          isEditMode ? "✅ Soal berhasil diperbarui!" : "✅ Soal berhasil ditambahkan!"
        );
        if (!isEditMode) {
          // Reset form for new entry
          setNumber("");
          setText("");
          setOptionA("");
          setOptionB("");
          setOptionC("");
          setOptionD("");
          setCorrectAnswer("");
        }
        setTimeout(() => {
          router.push("/admin/soal");
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menyimpan soal");
      }
    } catch (err) {
      setError("Terjadi kesalahan server");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LayoutAdmin title={isEditMode ? "Edit Soal" : "Tambah Soal"}>
        <div style={{ textAlign: "center", padding: 60, color: "#888" }}>
          ⏳ Memuat data soal...
        </div>
      </LayoutAdmin>
    );
  }

  return (
    <LayoutAdmin title={isEditMode ? "Edit Soal" : "Tambah Soal"}>
      <div style={{ marginBottom: 20 }}>
        <h3>{isEditMode ? "✏️ Edit Soal" : "➕ Tambah Soal Baru"}</h3>
        <p style={{ color: "#555", fontSize: "0.9rem" }}>
          {isEditMode
            ? "Perbarui data soal yang sudah ada"
            : "Buat soal baru untuk ditambahkan ke bank soal"}
        </p>
      </div>

      {error && (
        <div
          style={{
            background: "#f8d7da",
            color: "#721c24",
            padding: "12px 16px",
            borderRadius: 12,
            marginBottom: 16,
            border: "1px solid #f5c6cb",
          }}
        >
          ⚠️ {error}
          <button
            style={{
              marginLeft: 12,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              float: "right",
            }}
            onClick={() => setError(null)}
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div
          style={{
            background: "#d4edda",
            color: "#155724",
            padding: "12px 16px",
            borderRadius: 12,
            marginBottom: 16,
            border: "1px solid #c3e6cb",
          }}
        >
          {success}
          <button
            style={{
              marginLeft: 12,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              float: "right",
            }}
            onClick={() => setSuccess(null)}
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      <div
        style={{
          background: "white",
          borderRadius: 18,
          padding: 32,
          boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
          maxWidth: 800,
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Mapel */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: 6,
                color: "#555",
              }}
            >
              Mata Pelajaran <span style={{ color: "red" }}>*</span>
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              required
              disabled={isEditMode}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #dde",
                borderRadius: 12,
                fontSize: "1rem",
                background: isEditMode ? "#eee" : "#fafbfa",
                outline: "none",
              }}
            >
              <option value="">-- Pilih Mapel --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.slug ? `(${s.slug})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            {/* Nomor Soal */}
            <div style={{ flex: "0 0 120px" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: 6,
                  color: "#555",
                }}
              >
                Nomor <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                min="1"
                required
                placeholder="1"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "2px solid #dde",
                  borderRadius: 12,
                  fontSize: "1rem",
                  background: "#fafbfa",
                  outline: "none",
                }}
              />
            </div>

            {/* Tipe */}
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: 6,
                  color: "#555",
                }}
              >
                Tipe Soal <span style={{ color: "red" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <label
                  style={{
                    padding: "12px 24px",
                    borderRadius: 40,
                    cursor: "pointer",
                    border: `2px solid ${type === "pg" ? "#2d6a4f" : "#dde"}`,
                    background: type === "pg" ? "#d8f3dc" : "white",
                    fontWeight: 600,
                    color: type === "pg" ? "#1e4a2d" : "#555",
                    transition: "0.2s",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    value="pg"
                    checked={type === "pg"}
                    onChange={() => setType("pg")}
                    style={{ display: "none" }}
                  />
                  📝 Pilihan Ganda
                </label>
                <label
                  style={{
                    padding: "12px 24px",
                    borderRadius: 40,
                    cursor: "pointer",
                    border: `2px solid ${type === "essay" ? "#2d6a4f" : "#dde"}`,
                    background: type === "essay" ? "#fff3cd" : "white",
                    fontWeight: 600,
                    color: type === "essay" ? "#856404" : "#555",
                    transition: "0.2s",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    value="essay"
                    checked={type === "essay"}
                    onChange={() => setType("essay")}
                    style={{ display: "none" }}
                  />
                  📄 Essay
                </label>
              </div>
            </div>
          </div>

          {/* Teks Soal */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                marginBottom: 6,
                color: "#555",
              }}
            >
              Teks Soal <span style={{ color: "red" }}>*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              required
              placeholder="Tulis teks soal di sini... (bisa menggunakan HTML sederhana)"
              style={{
                width: "100%",
                padding: "14px 16px",
                border: "2px solid #dde",
                borderRadius: 12,
                fontSize: "1rem",
                fontFamily: "inherit",
                background: "#fafbfa",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.8,
              }}
            />
          </div>

          {/* Opsi PG */}
          {type === "pg" && (
            <div
              style={{
                background: "#f5faf5",
                borderRadius: 14,
                padding: 20,
                marginBottom: 20,
                border: "1px solid #d8f3dc",
              }}
            >
              <h4 style={{ marginBottom: 14, color: "#1e4a2d", fontSize: "0.95rem" }}>
                Opsi Jawaban
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: 4,
                      fontSize: "0.85rem",
                      color: "#555",
                    }}
                  >
                    Opsi A <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    value={optionA}
                    onChange={(e) => setOptionA(e.target.value)}
                    placeholder="Teks opsi A"
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "2px solid #dde",
                      borderRadius: 10,
                      fontSize: "0.95rem",
                      background: "white",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: 4,
                      fontSize: "0.85rem",
                      color: "#555",
                    }}
                  >
                    Opsi B <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    value={optionB}
                    onChange={(e) => setOptionB(e.target.value)}
                    placeholder="Teks opsi B"
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "2px solid #dde",
                      borderRadius: 10,
                      fontSize: "0.95rem",
                      background: "white",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: 4,
                      fontSize: "0.85rem",
                      color: "#555",
                    }}
                  >
                    Opsi C
                  </label>
                  <input
                    value={optionC}
                    onChange={(e) => setOptionC(e.target.value)}
                    placeholder="Teks opsi C (opsional)"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "2px solid #dde",
                      borderRadius: 10,
                      fontSize: "0.95rem",
                      background: "white",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      marginBottom: 4,
                      fontSize: "0.85rem",
                      color: "#555",
                    }}
                  >
                    Opsi D
                  </label>
                  <input
                    value={optionD}
                    onChange={(e) => setOptionD(e.target.value)}
                    placeholder="Teks opsi D (opsional)"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "2px solid #dde",
                      borderRadius: 10,
                      fontSize: "0.95rem",
                      background: "white",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Kunci Jawaban */}
              <div style={{ marginTop: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: 8,
                    color: "#555",
                  }}
                >
                  Kunci Jawaban <span style={{ color: "red" }}>*</span>
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {["A", "B", "C", "D"].map((opt) => (
                    <label
                      key={opt}
                      style={{
                        padding: "10px 24px",
                        borderRadius: 40,
                        cursor: "pointer",
                        border: `2px solid ${correctAnswer === opt ? "#2d6a4f" : "#dde"}`,
                        background: correctAnswer === opt ? "#d8f3dc" : "white",
                        fontWeight: 700,
                        color: correctAnswer === opt ? "#1e4a2d" : "#555",
                        transition: "0.2s",
                        minWidth: 56,
                        textAlign: "center",
                        fontSize: "1.05rem",
                        userSelect: "none",
                      }}
                    >
                      <input
                        type="radio"
                        name="correctAnswer"
                        value={opt}
                        checked={correctAnswer === opt}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        style={{ display: "none" }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              className="btn btn-hijau"
              type="submit"
              disabled={saving}
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              {saving
                ? "⏳ Menyimpan..."
                : isEditMode
                  ? "💾 Simpan Perubahan"
                  : "💾 Simpan Soal"}
            </button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => router.push("/admin/soal")}
            >
              ← Kembali ke Daftar
            </button>
          </div>
        </form>
      </div>
    </LayoutAdmin>
  );
}

export default function TambahEditSoalPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "var(--teks-abu)" }}>Memuat...</div>}>
      <TambahEditSoalForm />
    </Suspense>
  );
}
