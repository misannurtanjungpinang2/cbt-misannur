import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; siswaId: string }> }
) {
  const adminId = await getAdminSession();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, siswaId } = await params;

  try {
    const subject = await prisma.subject.findUnique({ where: { slug } });
    if (!subject) {
      return NextResponse.json({ error: "Mata pelajaran tidak ditemukan" }, { status: 404 });
    }

    const student = await prisma.student.findUnique({ where: { id: siswaId } });
    if (!student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    const session = await prisma.examSession.findFirst({
      where: { studentId: siswaId, subjectId: subject.id },
    });

    if (!session) {
      return NextResponse.json({ error: "Sesi ujian tidak ditemukan" }, { status: 404 });
    }

    // Hapus sesi — cascade otomatis hapus semua Answer (onDelete: Cascade di schema)
    await prisma.examSession.delete({ where: { id: session.id } });

    return NextResponse.json({ success: true, message: "Hasil ujian berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE HASIL ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat menghapus hasil ujian" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST — Reset & lanjutkan ujian (jawaban tetap, sisa waktu dijaga)
// ============================================================
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; siswaId: string }> }
) {
  const adminId = await getAdminSession();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, siswaId } = await params;

  try {
    const subject = await prisma.subject.findUnique({ where: { slug } });
    if (!subject) {
      return NextResponse.json({ error: "Mata pelajaran tidak ditemukan" }, { status: 404 });
    }

    const student = await prisma.student.findUnique({ where: { id: siswaId } });
    if (!student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    const session = await prisma.examSession.findFirst({
      where: { studentId: siswaId, subjectId: subject.id },
    });

    if (!session) {
      return NextResponse.json({ error: "Sesi ujian tidak ditemukan" }, { status: 404 });
    }

    const durationMs = subject.durationMinutes * 60 * 1000;
    let newStart = session.startTime ?? new Date();

    // Jika sesi sudah selesai/di-submit: pertahankan sisa waktu
    if (session.status !== "in_progress") {
      const end = session.endTime ?? new Date();
      const start = session.startTime ?? end;
      let usedMs = end.getTime() - start.getTime();
      if (usedMs < 0) usedMs = 0;
      if (usedMs > durationMs) usedMs = durationMs;
      newStart = new Date(Date.now() - usedMs);
    }

    await prisma.examSession.update({
      where: { id: session.id },
      data: {
        status: "in_progress",
        endTime: null,
        startTime: newStart,
      },
    });

    const remainingMs = durationMs - (Date.now() - newStart.getTime());
    const remainingMinutes = Math.max(0, Math.round(remainingMs / 60000));

    return NextResponse.json({
      success: true,
      message: "Sesi berhasil diaktifkan untuk dilanjutkan",
      remainingMinutes,
    });
  } catch (error) {
    console.error("[RESET SESI ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat mengaktifkan lanjut" },
      { status: 500 }
    );
  }
}
