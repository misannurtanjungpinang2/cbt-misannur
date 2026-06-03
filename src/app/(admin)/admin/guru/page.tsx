"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LayoutAdmin from "@/components/LayoutAdmin";

interface SubjectItem {
  id: string;
  name: string;
  slug: string;
}

interface TeacherItem {
  id: string;
  username: string;
  name: string;
  subjects: SubjectItem[];
  createdAt: string;
}

interface FormData {
  username: string;
  name: string;
  password: string;
  subjectIds: string[];
}

export default function KelolaGuruPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    username: "",
    name: "",
    password: "",
    subjectIds: [],
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teachersRes, subjectsRes] = await Promise.all([
        fetch("/api/admin/guru"),
        fetch("/api/admin/guru/subjects"),
      ]);

      if (!teachersRes.ok) throw new Error("Gagal memuat data guru");
      if (!subjectsRes.ok) throw new Error("Gagal memuat data mapel");

      const teachersData = await teachersRes.json();
      const subjectsData = await subjectsRes.json();

      setTeachers(teachersData.teachers || []);
      setSubjects(subjectsData.subjects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ username: "", name: "", password: "", subjectIds: [] });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const openEdit = async (teacher: TeacherItem) => {
    setForm({
      username: teacher.username,
      name: teacher.name,
      password: "",
      subjectIds: teacher.subjects.map((s) => s.id),
    });
    setEditingId(teacher.id);
    setShowForm(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.username.trim() || !form.name.trim()) {
      setError("Username dan Nama harus diisi");
      return;
    }

    if (!editingId && !form.password.trim()) {
      setError("Password harus diisi untuk guru baru");
      return;
    }

    if (!editingId && form.password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = editingId
        ? `/api/admin/guru/${editingId}`
        : "/api/admin/guru";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menyimpan");
        return;
      }

      setSuccess(editingId ? "Guru berhasil diperbarui" : "Guru berhasil ditambahkan");
      resetForm();
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/guru/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Gagal menghapus");
        return;
      }
      setSuccess("Guru berhasil dihapus");
      setDeleteConfirm(null);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Terjadi kesalahan jaringan");
    }
  };

  const toggleSubject = (subjectId: string) => {
    setForm((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter((id) => id !== subjectId)
        : [...prev.subjectIds, subjectId],
    }));
  };

  return (
    <LayoutAdmin title="Kelola Guru">
      <div className="admin-header">
        <div>
          <h3>👨‍🏫 Kelola Akun Guru</h3>
          <p style={{ color: "var(--teks-abu)", marginTop: 4 }}>
            Buat, edit, dan hapus akun guru beserta mata pelajaran yang diampu
          </p>
        </div>
        <button
          className="btn btn-hijau"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          ➕ Tambah Guru
        </button>
      </div>

      {error && (
        <div style={{
          background: "#fce4e4",
          color: "#c62828",
          padding: "12px 16px",
          borderRadius: "var(--radius-sm)",
          marginBottom: 16,
          fontSize: "0.9rem",
        }}>
          ❌ {error}
          <button
            style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div style={{
          background: "#e8f5e9",
          color: "#2e7d32",
          padding: "12px 16px",
          borderRadius: "var(--radius-sm)",
          marginBottom: 16,
          fontSize: "0.9rem",
        }}>
          ✅ {success}
        </div>
      )}

      {/* Form Tambah/Edit */}
      {showForm && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) resetForm();
          }}
        >
          <div className="modal-box" style={{ maxWidth: 520, textAlign: "left" }}>
            <h3 style={{ color: "var(--hijau-tua)", marginBottom: 4 }}>
              {editingId ? "✏️ Edit Guru" : "➕ Tambah Guru"}
            </h3>
            <p style={{ color: "var(--teks-abu)", fontSize: "0.85rem", marginBottom: 20 }}>
              {editingId
                ? "Ubah data guru dan mata pelajaran yang diampu"
                : "Buat akun guru baru beserta mata pelajaran yang diampu"}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  placeholder="Username untuk login"
                  style={{ marginTop: 4 }}
                />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>Nama Lengkap</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nama guru"
                  style={{ marginTop: 4 }}
                />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  Password {editingId && <span style={{ fontWeight: 400, color: "var(--teks-abu)" }}>(kosongkan jika tidak diubah)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder={editingId ? "Biarkan kosong jika tidak diubah" : "Minimal 6 karakter"}
                  style={{ marginTop: 4 }}
                />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>Mata Pelajaran Diampu</label>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginTop: 8,
                  maxHeight: 240,
                  overflowY: "auto",
                  border: "1px solid #eef3ee",
                  borderRadius: "var(--radius-sm)",
                  padding: 12,
                }}>
                  {subjects.length === 0 ? (
                    <p style={{ color: "var(--teks-abu)", fontSize: "0.85rem", gridColumn: "1 / -1" }}>
                      Belum ada mapel tersedia
                    </p>
                  ) : (
                    subjects.map((s) => (
                      <label
                        key={s.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          padding: "6px 8px",
                          borderRadius: 8,
                          background: form.subjectIds.includes(s.id) ? "#f0f7f0" : "transparent",
                          transition: "background 0.15s",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.subjectIds.includes(s.id)}
                          onChange={() => toggleSubject(s.id)}
                          style={{ width: 18, height: 18, cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "0.9rem" }}>{s.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={resetForm}
                disabled={saving}
                type="button"
              >
                Batal
              </button>
              <button
                className="btn btn-hijau btn-sm"
                onClick={handleSave}
                disabled={saving}
                type="button"
              >
                {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Guru"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabel Guru */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Memuat data guru...</p>
        </div>
      ) : teachers.length === 0 ? (
        <div className="empty-state">
          <p>📭 Belum ada guru. Klik "Tambah Guru" untuk membuat akun.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Username</th>
                <th>Nama</th>
                <th>Mapel Diampu</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, idx) => (
                <tr key={t.id}>
                  <td className="text-center">{idx + 1}</td>
                  <td><strong>{t.username}</strong></td>
                  <td>{t.name}</td>
                  <td>
                    {t.subjects.length === 0 ? (
                      <span style={{ color: "var(--teks-abu)", fontSize: "0.85rem" }}>Belum ada</span>
                    ) : (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {t.subjects.map((s) => (
                          <span key={s.id} className="badge badge-mapel">{s.name}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openEdit(t)}
                      >
                        ✏️ Edit
                      </button>
                      {deleteConfirm === t.id ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(t.id)}
                          >
                            Ya, Hapus
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteConfirm(t.id)}
                        >
                          🗑 Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .badge-mapel {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          background: var(--hijau-pucat);
          color: var(--hijau-tua);
        }
      `}</style>
    </LayoutAdmin>
  );
}
