"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LayoutAdmin from "@/components/LayoutAdmin";

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

export default function DaftarSoalPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load subjects
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch("/api/admin/atur/jadwal");
        if (res.ok) {
          const data = await res.json();
          if (data.subjects) {
            setSubjects(data.subjects);
            return;
          }
        }
        // Fallback: fetch from a known endpoint or use a dummy
        console.warn("Using fallback subject list");
        setSubjects([]);
      } catch (e) {
        console.error("Gagal load mapel:", e);
      }
    }
    loadSubjects();
  }, []);

  // Load questions when subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setQuestions([]);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    fetch(`/api/admin/soal/list?subjectId=${selectedSubjectId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat soal");
        return res.json();
      })
      .then((data) => {
        setQuestions(data.questions || []);
      })
      .catch((err) => {
        console.error("Gagal load soal:", err);
        setError("Gagal memuat soal. Pastikan Anda sudah login.");
      })
      .finally(() => setLoading(false));
  }, [selectedSubjectId]);

  // Hapus soal
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/soal/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        setSuccessMsg("Soal berhasil dihapus");
        setDeleteConfirm(null);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menghapus soal");
      }
    } catch (e) {
      setError("Terjadi kesalahan saat menghapus soal");
    }
  };

  // Truncate text
  const truncate = (text: string, max: number = 100) => {
    if (text.length <= max) return text;
    return text.substring(0, max) + "...";
  };

  // Strip HTML tags
  const stripHtml = (text: string) => {
    return text.replace(/<[^>]*>/g, "");
  };

  const selectedSubjectName = subjects.find(
    (s) => s.id === selectedSubjectId
  )?.name;

  return (
    <LayoutAdmin title="Daftar Soal">
      <div style={{ marginBottom: 20 }}>
        <h3>📝 Daftar Soal</h3>
        <p style={{ color: "#555", fontSize: "0.9rem" }}>
          Kelola soal ujian untuk setiap mata pelajaran
        </p>
      </div>

      {/* Pilih Mapel + Tombol Aksi */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <label style={{ fontWeight: 600, color: "#555" }}>Pilih Mapel:</label>
        <select
          value={selectedSubjectId}
          onChange={(e) => {
            setSelectedSubjectId(e.target.value);
            setError(null);
            setSuccessMsg(null);
            setDeleteConfirm(null);
          }}
          style={{
            flex: 1,
            minWidth: 200,
            padding: "10px 14px",
            border: "2px solid #dde",
            borderRadius: 12,
            fontSize: "1rem",
            background: "#fafbfa",
            outline: "none",
          }}
        >
          <option value="">-- Pilih Mapel --</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <button
          className="btn btn-hijau"
          type="button"
          onClick={() => router.push("/admin/soal/tambah")}
        >
          ➕ Tambah Soal
        </button>
        <button
          className="btn btn-outline"
          type="button"
          onClick={() => router.push("/admin/soal/import")}
        >
          📤 Import Soal
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div
          style={{
            background: "#fff3cd",
            color: "#856404",
            padding: "12px 16px",
            borderRadius: 12,
            marginBottom: 16,
            border: "1px solid #ffc107",
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

      {successMsg && (
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
          ✅ {successMsg}
        </div>
      )}

      {/* Tabel Soal */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
          ⏳ Memuat soal...
        </div>
      ) : !selectedSubjectId ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "#888",
            background: "white",
            borderRadius: 18,
            boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
          }}
        >
          📋 Silakan pilih mata pelajaran terlebih dahulu
        </div>
      ) : questions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 50,
            color: "#888",
            background: "white",
            borderRadius: 18,
            boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
          }}
        >
          <p style={{ fontSize: "1.1rem", marginBottom: 8, fontWeight: 600 }}>
            Belum ada soal untuk {selectedSubjectName}
          </p>
          <p style={{ fontSize: "0.9rem", marginBottom: 20 }}>
            Gunakan tombol &ldquo;Tambah Soal&rdquo; atau &ldquo;Import Soal&rdquo; di atas
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              className="btn btn-hijau"
              type="button"
              onClick={() => router.push(`/admin/soal/tambah?subjectId=${selectedSubjectId}`)}
            >
              ➕ Tambah Soal Baru
            </button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => router.push("/admin/soal/import")}
            >
              📤 Import dari File
            </button>
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "linear-gradient(135deg, #1e4a2d, #2d6a4f)",
                  color: "white",
                }}
              >
                <th style={{ padding: "12px 16px", textAlign: "center", width: 60 }}>
                  No
                </th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: 80 }}>
                  Tipe
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Teks Soal</th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: 80 }}>
                  Kunci
                </th>
                <th style={{ padding: "12px 16px", textAlign: "center", width: 150 }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, idx) => (
                <tr
                  key={q.id}
                  style={{
                    borderBottom: "1px solid #eef0ee",
                    background: idx % 2 === 0 ? "white" : "#f9fbf9",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 16px",
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    {q.number}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        background: q.type === "pg" ? "#d8f3dc" : "#fff3cd",
                        color: q.type === "pg" ? "#1e4a2d" : "#856404",
                      }}
                    >
                      {q.type === "pg" ? "PG" : "Essay"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", maxWidth: 400 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {truncate(stripHtml(q.text), 120)}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    {q.type === "pg" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          color: "#1e4a2d",
                          background: "#d8f3dc",
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          fontSize: "0.85rem",
                        }}
                      >
                        {q.correctAnswer}
                      </span>
                    ) : (
                      <span style={{ color: "#ccc" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <div
                      style={{ display: "flex", gap: 6, justifyContent: "center" }}
                    >
                      <button
                        className="btn btn-outline btn-sm"
                        type="button"
                        onClick={() =>
                          router.push(`/admin/soal/tambah?id=${q.id}`)
                        }
                        style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                      >
                        ✏️ Edit
                      </button>
                      {deleteConfirm === q.id ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            className="btn btn-danger btn-sm"
                            type="button"
                            onClick={() => handleDelete(q.id)}
                            style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                          >
                            Ya, Hapus
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            type="button"
                            onClick={() => setDeleteConfirm(null)}
                            style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-danger btn-sm"
                          type="button"
                          onClick={() => setDeleteConfirm(q.id)}
                          style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                        >
                          🗑️ Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p
            style={{
              textAlign: "right",
              fontSize: "0.85rem",
              color: "#888",
              marginTop: 8,
            }}
          >
            Total: {questions.length} soal {selectedSubjectName && `— ${selectedSubjectName}`}
          </p>
        </div>
      )}
    </LayoutAdmin>
  );
}
