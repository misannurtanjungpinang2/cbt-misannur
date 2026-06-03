import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; siswaId: string }> }
) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, siswaId } = await params;

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

    const subject = await prisma.subject.findUnique({ where: { slug } });
    if (!subject) {
      return NextResponse.json({ error: "Mapel tidak ditemukan" }, { status: 404 });
    }

    const student = await prisma.student.findUnique({ where: { id: siswaId } });
    if (!student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    const examSession = await prisma.examSession.findFirst({
      where: {
        studentId: siswaId,
        subjectId: subject.id,
        status: { in: ["completed", "auto_submit"] },
      },
    });

    if (!examSession) {
      return NextResponse.json({ error: "Sesi ujian tidak ditemukan" }, { status: 404 });
    }

    // Ambil semua soal essay
    const essayQuestions = await prisma.question.findMany({
      where: { subjectId: subject.id, type: "essay" },
      orderBy: { number: "asc" },
    });

    // Ambil jawaban essay
    const answers = await prisma.answer.findMany({
      where: {
        sessionId: examSession.id,
        questionId: { in: essayQuestions.map((q) => q.id) },
      },
    });

    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

    const pgQuestions = await prisma.question.findMany({
      where: { subjectId: subject.id, type: "pg" },
      orderBy: { number: "asc" },
    });

    const pgAnswers = await prisma.answer.findMany({
      where: {
        sessionId: examSession.id,
        questionId: { in: pgQuestions.map((q) => q.id) },
      },
    });

    const pgMap = new Map(pgAnswers.map((a) => [a.questionId, a]));

    const pgCorrect = pgQuestions.filter((q) => {
      const ans = pgMap.get(q.id);
      return ans?.answer?.toUpperCase() === q.correctAnswer?.toUpperCase();
    }).length;

    const pgTotal = pgQuestions.length;

    const essays = essayQuestions.map((q) => {
      const ans = answerMap.get(q.id);
      return {
        id: q.id,
        number: q.number,
        text: q.text,
        studentAnswer: ans?.answer || null,
        essayScore: ans?.essayScore ?? null,
        answerId: ans?.id || null,
        gradedAt: ans?.gradedAt?.toISOString() || null,
      };
    });

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        participantNumber: student.participantNumber,
        class: student.class,
      },
      subject: { name: subject.name, slug: subject.slug },
      session: {
        id: examSession.id,
        startTime: examSession.startTime?.toISOString() || null,
        endTime: examSession.endTime?.toISOString() || null,
        status: examSession.status,
        scorePg: examSession.scorePg,
        pgCorrect,
        pgTotal,
        pgPercentage: pgTotal > 0 ? Math.round((pgCorrect / pgTotal) * 100) : 0,
      },
      essays,
    });
  } catch (error) {
    console.error("Error fetching essay detail:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
