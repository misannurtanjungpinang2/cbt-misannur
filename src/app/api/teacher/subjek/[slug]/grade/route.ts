import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    // Cek akses guru
    const teacherSubject = await prisma.subjectTeacher.findFirst({
      where: {
        teacherId: session.teacherId,
        subject: { slug },
      },
    });

    if (!teacherSubject) {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke mapel ini" }, { status: 403 });
    }

    const body = await request.json();
    const { sessionId, scores } = body;

    // scores = [{ answerId: string, essayScore: number }]

    if (!sessionId || !scores || !Array.isArray(scores)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    // Verifikasi sesi milik mapel ini
    const examSession = await prisma.examSession.findFirst({
      where: {
        id: sessionId,
        subject: { slug },
      },
    });

    if (!examSession) {
      return NextResponse.json({ error: "Sesi ujian tidak ditemukan" }, { status: 404 });
    }

    // Simpan nilai per jawaban
    for (const score of scores) {
      if (score.essayScore !== null && score.essayScore !== undefined) {
        const essayVal = Math.max(0, Math.min(100, Math.round(score.essayScore)));

        await prisma.answer.updateMany({
          where: {
            id: score.answerId,
            sessionId: sessionId,
          },
          data: {
            essayScore: essayVal,
            gradedBy: session.teacherId,
            gradedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ message: "Nilai berhasil disimpan" });
  } catch (error) {
    console.error("Error saving grades:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
