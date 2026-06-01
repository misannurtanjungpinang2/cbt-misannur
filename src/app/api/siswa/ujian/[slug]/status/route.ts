import { NextRequest, NextResponse } from "next/server";
import { getSiswaSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateTimeRemaining } from "@/lib/utils";

export async function GET(
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

    if (!examSession || !examSession.startTime) {
      return NextResponse.json({ error: "Tidak ada sesi ujian aktif" }, { status: 400 });
    }

    // Hitung sisa waktu
    const remainingSeconds = calculateTimeRemaining(
      examSession.startTime,
      subject.durationMinutes
    );

    // Ambil semua jawaban untuk sesi ini
    const answers = await prisma.answer.findMany({
      where: { sessionId: examSession.id },
      select: {
        questionId: true,
        answer: true,
        flagged: true,
      },
    });

    // Hitung jumlah terjawab (answer tidak kosong)
    const answeredCount = answers.filter(
      (a) => a.answer && a.answer.trim() !== ""
    ).length;

    // Total soal
    const totalQuestions = await prisma.question.count({
      where: { subjectId: subject.id },
    });

    // Ambil flagged questions
    const flaggedQuestions = answers
      .filter((a) => a.flagged)
      .map((a) => a.questionId);

    return NextResponse.json({
      remainingSeconds,
      answered: answeredCount,
      totalQuestions,
      flagged: flaggedQuestions,
      isTimeUp: remainingSeconds <= 0,
    });
  } catch (error) {
    console.error("Error getting exam status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
