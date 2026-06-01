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
    const { questionId, answer } = body;

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

    // Cek apakah waktu masih cukup
    if (examSession.startTime) {
      const endTime = new Date(
        examSession.startTime.getTime() + subject.durationMinutes * 60 * 1000
      );
      if (new Date() > endTime) {
        // Auto-submit jika waktu habis
        await prisma.examSession.update({
          where: { id: examSession.id },
          data: { status: "auto_submit", endTime: new Date() },
        });
        return NextResponse.json({ error: "Waktu ujian telah habis" }, { status: 400 });
      }
    }

    // Cari soal untuk cek tipe
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { type: true, correctAnswer: true },
    });

    if (!question) {
      return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 });
    }

    // Hitung isCorrect untuk PG
    let isCorrect: boolean | null = null;
    if (question.type === "pg" && answer && question.correctAnswer) {
      isCorrect = answer.toUpperCase() === question.correctAnswer.toUpperCase();
    }

    // Upsert jawaban (gunakan unique constraint sessionId + questionId)
    await prisma.answer.upsert({
      where: {
        sessionId_questionId: {
          sessionId: examSession.id,
          questionId,
        },
      },
      create: {
        sessionId: examSession.id,
        questionId,
        answer: answer ?? "",
        isCorrect,
      },
      update: {
        answer: answer ?? "",
        isCorrect,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving answer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
