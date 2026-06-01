import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// ============================================================
// GET — Ambil satu soal berdasarkan ID
// ============================================================
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAdminSession();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (id === "tambah") {
      // Mode tambah baru — tidak perlu ambil data
      return NextResponse.json({ question: null });
    }

    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error("[GET SOAL ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — Buat soal baru
// ============================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAdminSession();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (id !== "tambah") {
      return NextResponse.json({ error: "Gunakan POST /api/admin/soal/tambah" }, { status: 400 });
    }

    const body = await request.json();
    const { subjectId, number, type, text, optionA, optionB, optionC, optionD, correctAnswer } = body;

    // === Validasi ===
    if (!subjectId) {
      return NextResponse.json({ error: "Mapel harus dipilih" }, { status: 400 });
    }
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Teks soal tidak boleh kosong" }, { status: 400 });
    }
    if (!number || number < 1) {
      return NextResponse.json({ error: "Nomor soal harus diisi dengan angka positif" }, { status: 400 });
    }
    if (type !== "pg" && type !== "essay") {
      return NextResponse.json({ error: "Tipe soal harus 'pg' atau 'essay'" }, { status: 400 });
    }
    if (type === "pg") {
      if (!optionA || !optionB) {
        return NextResponse.json({ error: "Soal PG minimal harus memiliki opsi A dan B" }, { status: 400 });
      }
      if (!correctAnswer || !["A", "B", "C", "D"].includes(correctAnswer.toUpperCase())) {
        return NextResponse.json({ error: "Kunci jawaban harus A, B, C, atau D" }, { status: 400 });
      }
    }

    // Cek apakah nomor sudah dipakai
    const existing = await prisma.question.findFirst({
      where: { subjectId, number },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Nomor soal ${number} sudah ada untuk mapel ini. Gunakan nomor lain.` },
        { status: 400 }
      );
    }

    // === Simpan ===
    const question = await prisma.question.create({
      data: {
        subjectId,
        number,
        type,
        text: text.trim(),
        optionA: optionA?.trim() || null,
        optionB: optionB?.trim() || null,
        optionC: optionC?.trim() || null,
        optionD: optionD?.trim() || null,
        correctAnswer: type === "pg" ? (correctAnswer?.toUpperCase() || null) : null,
      },
    });

    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error) {
    console.error("[POST SOAL ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat menyimpan soal" },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT — Update soal
// ============================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAdminSession();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Cek apakah soal ada
    const existing = await prisma.question.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const { subjectId, number, type, text, optionA, optionB, optionC, optionD, correctAnswer } = body;

    // === Validasi ===
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Teks soal tidak boleh kosong" }, { status: 400 });
    }
    if (type !== "pg" && type !== "essay") {
      return NextResponse.json({ error: "Tipe soal harus 'pg' atau 'essay'" }, { status: 400 });
    }
    if (type === "pg") {
      if (!optionA || !optionB) {
        return NextResponse.json({ error: "Soal PG minimal harus memiliki opsi A dan B" }, { status: 400 });
      }
      if (!correctAnswer || !["A", "B", "C", "D"].includes(correctAnswer.toUpperCase())) {
        return NextResponse.json({ error: "Kunci jawaban harus A, B, C, atau D" }, { status: 400 });
      }
    }

    // Cek duplicate nomor (kecuali nomor yang sama dengan dirinya sendiri)
    if (number && number !== existing.number) {
      const duplicate = await prisma.question.findFirst({
        where: {
          subjectId: subjectId || existing.subjectId,
          number,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `Nomor soal ${number} sudah dipakai soal lain` },
          { status: 400 }
        );
      }
    }

    // === Update ===
    const question = await prisma.question.update({
      where: { id },
      data: {
        subjectId: subjectId || existing.subjectId,
        number: number || existing.number,
        type,
        text: text.trim(),
        optionA: type === "pg" ? (optionA?.trim() || null) : null,
        optionB: type === "pg" ? (optionB?.trim() || null) : null,
        optionC: type === "pg" ? (optionC?.trim() || null) : null,
        optionD: type === "pg" ? (optionD?.trim() || null) : null,
        correctAnswer: type === "pg" ? (correctAnswer?.toUpperCase() || null) : null,
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error("[PUT SOAL ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat mengupdate soal" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE — Hapus soal
// ============================================================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAdminSession();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Cek apakah soal ada
    const existing = await prisma.question.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 });
    }

    // Hapus jawaban terkait dulu (karena FK constraint)
    await prisma.answer.deleteMany({
      where: { questionId: id },
    });

    // Hapus soal
    await prisma.question.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Soal berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE SOAL ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat menghapus soal" },
      { status: 500 }
    );
  }
}
