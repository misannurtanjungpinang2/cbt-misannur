import { NextRequest, NextResponse } from "next/server";
import { getSiswaSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Validasi session siswa
    const siswa = await getSiswaSession();
    if (!siswa) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cari subject berdasarkan slug
    const subject = await prisma.subject.findUnique({
      where: { slug },
    });

    if (!subject) {
      return NextResponse.json({ error: "Mata pelajaran tidak ditemukan" }, { status: 404 });
    }

    if (!subject.isActive) {
      return NextResponse.json({ error: "Mata pelajaran belum aktif" }, { status: 403 });
    }

    // Validasi token siswa sesuai mapel
    const student = await prisma.student.findUnique({
      where: { id: siswa.studentId },
      select: { tokenUsed: true },
    });

    if (student?.tokenUsed && subject.token && student.tokenUsed !== subject.token) {
      return NextResponse.json({ error: "Token tidak sesuai dengan mata pelajaran ini" }, { status: 403 });
    }

    // Cek apakah sudah ada sesi completed — tidak boleh mulai ulang
    const completedSession = await prisma.examSession.findFirst({
      where: {
        studentId: siswa.studentId,
        subjectId: subject.id,
        status: { in: ["completed", "auto_submit"] },
      },
    });

    if (completedSession) {
      return NextResponse.json({ error: "Anda sudah menyelesaikan ujian ini" }, { status: 403 });
    }

    // Cek apakah sudah ada sesi in_progress
    let examSession = await prisma.examSession.findFirst({
      where: {
        studentId: siswa.studentId,
        subjectId: subject.id,
        status: "in_progress",
      },
    });

    // Jika belum ada, buat sesi baru
    if (!examSession) {
      examSession = await prisma.examSession.create({
        data: {
          studentId: siswa.studentId,
          subjectId: subject.id,
          startTime: new Date(),
          status: "in_progress",
          scorePg: 0,
        },
      });
    }

    // Ambil semua soal (tanpa correctAnswer)
    const questions = await prisma.question.findMany({
      where: { subjectId: subject.id },
      orderBy: { number: "asc" },
      select: {
        id: true,
        number: true,
        type: true,
        text: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
      },
    });

    // Ambil jawaban yang sudah ada untuk sesi ini
    const existingAnswers = await prisma.answer.findMany({
      where: { sessionId: examSession.id },
      select: {
        questionId: true,
        answer: true,
        flagged: true,
      },
    });

    // Map jawaban per questionId
    const answersMap: Record<string, { answer: string; flagged: boolean }> = {};
    for (const a of existingAnswers) {
      answersMap[a.questionId] = { answer: a.answer, flagged: a.flagged };
    }

    return NextResponse.json({
      sessionId: examSession.id,
      questions,
      answers: answersMap,
      durationMinutes: subject.durationMinutes,
      totalQuestions: questions.length,
      startTime: examSession.startTime?.toISOString() ?? new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error starting exam:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
