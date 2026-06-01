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

    // Ambil semua jawaban PG untuk menghitung score
    const answers = await prisma.answer.findMany({
      where: {
        sessionId: examSession.id,
      },
      include: {
        question: {
          select: {
            type: true,
            correctAnswer: true,
          },
        },
      },
    });

    // Hitung skor PG: jawaban benar dari soal PG
    let scorePg = 0;
    for (const a of answers) {
      if (
        a.question.type === "pg" &&
        a.question.correctAnswer &&
        a.answer &&
        a.answer.toUpperCase() === a.question.correctAnswer.toUpperCase()
      ) {
        scorePg++;
      }
    }

    // Update sesi: completed, endTime, score
    await prisma.examSession.update({
      where: { id: examSession.id },
      data: {
        endTime: new Date(),
        status: "completed",
        scorePg,
      },
    });

    // Hitung total soal PG untuk mapel ini
    const totalPgQuestions = await prisma.question.count({
      where: { subjectId: subject.id, type: "pg" },
    });

    return NextResponse.json({
      success: true,
      score: scorePg,
      totalPg: totalPgQuestions,
    });
  } catch (error) {
    console.error("Error submitting exam:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
