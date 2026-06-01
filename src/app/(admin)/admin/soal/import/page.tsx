"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import LayoutAdmin from "@/components/LayoutAdmin";

interface Subject {
  id: string;
  name: string;
  slug: string;
}

interface ParsedQuestion {
  number: number;
  type: "pg" | "essay";
  text: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string | null;
}

interface ParseResponse {
  success: boolean;
  questions: ParsedQuestion[];
  total: number;
  pgCount: number;
  essayCount: number;
  subjectName?: string;
  saved: boolean;
  error?: string;
  detail?: string;
  errors?: string[];
}

export default function ImportSoalPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setParseResult(null);
    setError(null);
    setSuccessMsg(null);
  };

  // Handle parse
  const handleParse = async () => {
    if (!file || !selectedSubjectId) {
      setError("Pilih mapel dan file terlebih dahulu");
      return;
    }

    // Validasi format file
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".docx") && !fileName.endsWith(".pdf")) {
      setError("Format file harus .docx atau .pdf");
      return;
    }

    setIsParsing(true);
    setError(null);
    setParseResult(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subjectId", selectedSubjectId);

      const res = await fetch("/api/admin/soal/import", {
        method: "POST",
        body: formData,
      });

      const data: ParseResponse & { error?: string; detail?: string } = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal parsing file");
        if (data.detail) {
          console.error("Detail error:", data.detail);
        }
        setIsParsing(false);
        return;
      }

      if (data.success && data.questions) {
        setParseResult(data);
      } else {
        setError("Tidak dapat memparse soal dari file ini");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memproses file");
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle save to database
  const handleSave = async () => {
    if (!file || !selectedSubjectId || !parseResult) return;

    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subjectId", selectedSubjectId);
      formData.append("confirm", "true");

      const res = await fetch("/api/admin/soal/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(
          `✅ Berhasil mengimpor ${data.total} soal ke ${data.subjectName || "mapel"}!`
        );
        setParseResult(null);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setTimeout(() => {
          router.push("/admin/soal");
        }, 2000);
      } else {
        setError(data.error || "Gagal menyimpan soal");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat menyimpan");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Strip HTML for preview
  const stripHtml = (text: string) => {
    return text.replace(/<[^>]*>/g, "");
  };

  const truncate = (text: string, max: number = 80) => {
    const clean = stripHtml(text);
    if (clean.length <= max) return clean;
    return clean.substring(0, max) + "...";
  };

  return (
    <LayoutAdmin title="Import Soal">
      <div style={{ marginBottom: 20 }}>
        <h3>📤 Import Soal dari File</h3>
        <p style={{ color: "#555", fontSize: "0.9rem" }}>
          Upload file .docx atau .pdf untuk mengimpor soal ke bank soal
        </p>
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
          {successMsg}
        </div>
      )}

      {/* Upload Form */}
      <div
        style={{
          background: "white",
          borderRadius: 18,
          padding: 28,
          boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
          marginBottom: 24,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: 6,
              color: "#555",
            }}
          >
            Pilih Mapel Tujuan <span style={{ color: "red" }}>*</span>
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setParseResult(null);
              setError(null);
            }}
            style={{
              width: "100%",
              maxWidth: 400,
              padding: "12px 16px",
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
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              marginBottom: 6,
              color: "#555",
            }}
          >
            Upload File <span style={{ color: "red" }}>*</span>
          </label>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf"
              onChange={handleFileChange}
              style={{
                flex: 1,
                minWidth: 200,
                padding: "10px 14px",
                border: "2px solid #dde",
                borderRadius: 12,
                fontSize: "0.95rem",
                background: "#fafbfa",
              }}
            />
            <button
              className="btn btn-hijau"
              type="button"
              onClick={handleParse}
              disabled={isParsing || !file || !selectedSubjectId}
              style={{ opacity: isParsing || !file || !selectedSubjectId ? 0.6 : 1 }}
            >
              {isParsing ? "⏳ Memproses..." : "🔍 Parsing & Preview"}
            </button>
          </div>
          {file && (
            <p style={{ fontSize: "0.85rem", color: "#888", marginTop: 6 }}>
              File: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div
          style={{
            background: "#f0f7f0",
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: "0.85rem",
            color: "#555",
          }}
        >
          <strong>📌 Format yang didukung:</strong>
          <ul style={{ margin: "6px 0 0 20px", lineHeight: 1.6 }}>
            <li>
              <strong>Pilihan Ganda:</strong> Nomor. Teks soal lalu A. Opsi A, B. Opsi B,
              C. Opsi C, D. Opsi D, dan Kunci: A
            </li>
            <li>
              <strong>Essay:</strong> Nomor. Teks soal (tanpa opsi A-D)
            </li>
            <li>File .docx (Word) atau .pdf</li>
          </ul>
        </div>
      </div>

      {/* Preview Parsing */}
      {parseResult && parseResult.questions && parseResult.questions.length > 0 && (
        <div
          style={{
            background: "white",
            borderRadius: 18,
            padding: 28,
            boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h4>📋 Preview Hasil Parsing</h4>
              <p style={{ fontSize: "0.85rem", color: "#888" }}>
                Ditemukan <strong>{parseResult.total}</strong> soal:
                <span style={{ color: "#1e4a2d", fontWeight: 600 }}>
                  {" "}{parseResult.pgCount} PG
                </span>
                <span style={{ color: "#856404", fontWeight: 600 }}>
                  {" "}{parseResult.essayCount} Essay
                </span>
                {parseResult.subjectName && (
                  <span> — {parseResult.subjectName}</span>
                )}
              </p>
            </div>
            <button
              className="btn btn-hijau"
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{ opacity: isSaving ? 0.7 : 1 }}
            >
              {isSaving
                ? "⏳ Menyimpan..."
                : `💾 Simpan ${parseResult.total} Soal ke Database`}
            </button>
          </div>

          {parseResult.errors && parseResult.errors.length > 0 && (
            <div
              style={{
                background: "#fff3cd",
                padding: "10px 14px",
                borderRadius: 10,
                marginBottom: 16,
                fontSize: "0.85rem",
              }}
            >
              <strong>⚠️ Peringatan:</strong> Ada {parseResult.errors.length} soal yang
              gagal diparse.
              <ul style={{ margin: "6px 0 0 20px" }}>
                {parseResult.errors.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "linear-gradient(135deg, #1e4a2d, #2d6a4f)",
                    color: "white",
                  }}
                >
                  <th style={{ padding: "10px 14px", textAlign: "center", width: 50 }}>
                    No
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "center", width: 60 }}>
                    Tipe
                  </th>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Teks Soal</th>
                  <th style={{ padding: "10px 14px", textAlign: "left" }}>Opsi</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", width: 60 }}>
                    Kunci
                  </th>
                </tr>
              </thead>
              <tbody>
                {parseResult.questions.map((q, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid #eef0ee",
                      background: idx % 2 === 0 ? "white" : "#f9fbf9",
                    }}
                  >
                    <td
                      style={{
                        padding: "10px 14px",
                        textAlign: "center",
                        fontWeight: 600,
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: q.type === "pg" ? "#d8f3dc" : "#fff3cd",
                          color: q.type === "pg" ? "#1e4a2d" : "#856404",
                        }}
                      >
                        {q.type === "pg" ? "PG" : "Essay"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", maxWidth: 300 }}>
                      {truncate(q.text, 100)}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: "0.8rem" }}>
                      {q.type === "pg" ? (
                        <span>
                          A: {truncate(q.optionA || "", 30)}
                          {q.optionB ? <>, B: {truncate(q.optionB, 30)}</> : ""}
                          {q.optionC ? <>, C: {truncate(q.optionC, 30)}</> : ""}
                          {q.optionD ? <>, D: {truncate(q.optionD, 30)}</> : ""}
                        </span>
                      ) : (
                        <span style={{ color: "#aaa" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      {q.correctAnswer ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            color: "#1e4a2d",
                            background: "#d8f3dc",
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            fontSize: "0.8rem",
                          }}
                        >
                          {q.correctAnswer}
                        </span>
                      ) : (
                        <span style={{ color: "#ccc" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "#fff3cd",
              borderRadius: 12,
              border: "1px solid #ffc107",
              fontSize: "0.85rem",
            }}
          >
            ⚠️ <strong>Perhatian:</strong> Soal akan ditambahkan di akhir (nomor
            urut setelah soal yang sudah ada). Periksa kembali hasil parsing sebelum
            menyimpan.
          </div>
        </div>
      )}

      {/* Kembali */}
      <div>
        <button
          className="btn btn-outline"
          type="button"
          onClick={() => router.push("/admin/soal")}
        >
          ← Kembali ke Daftar Soal
        </button>
      </div>
    </LayoutAdmin>
  );
}
