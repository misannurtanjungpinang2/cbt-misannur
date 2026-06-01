import { NextRequest, NextResponse } from "next/server";
import { getSiswaSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Validasi session siswa
    const siswa = await getSiswaSession();
    if (!siswa) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body
    const body = await request.json();
    const { questionId, flagged } = body;

    if (!questionId) {
      return NextResponse.json({ error: "questionId diperlukan" }, { status: 400 });
    }

    // Cari subject
    const subject = await prisma.subject.findUnique({
      where: { slug },
    });

    if (!subject) {
      return NextResponse.json({ error: "Mata pelajaran tidak ditemukan" }, { status: 404 });
    }

    // Cari sesi ujian yang sedang berlangsung
    const examSession = await prisma.examSession.findFirst({
      where: {
        studentId: siswa.studentId,
        subjectId: subject.id,
        status: "in_progress",
      },
    });

    if (!examSession) {
      return NextResponse.json({ error: "Tidak ada sesi ujian aktif" }, { status: 400 });
    }

    // Upsert untuk menyimpan status flagged
    // Jika sudah ada answer, update flagged. Jika belum, buat record baru.
    const existingAnswer = await prisma.answer.findUnique({
      where: {
        sessionId_questionId: {
          sessionId: examSession.id,
          questionId,
        },
      },
    });

    if (existingAnswer) {
      await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: { flagged: flagged ?? false },
      });
    } else {
      // Buat record baru dengan answer kosong
      await prisma.answer.create({
        data: {
          sessionId: examSession.id,
          questionId,
          answer: "",
          flagged: flagged ?? false,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error toggling flag:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
