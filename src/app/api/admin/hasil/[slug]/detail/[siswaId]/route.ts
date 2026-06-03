import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; siswaId: string }> }
) {
  const adminId = await getAdminSession();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, siswaId } = await params;

  try {
    const subject = await prisma.subject.findUnique({
      where: { slug },
    });

    if (!subject) {
      return NextResponse.json({ error: "Mata pelajaran tidak ditemukan" }, { status: 404 });
    }

    const student = await prisma.student.findUnique({
      where: { id: siswaId },
    });

    if (!student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    const session = await prisma.examSession.findFirst({
      where: {
        studentId: siswaId,
        subjectId: subject.id,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Sesi ujian tidak ditemukan" }, { status: 404 });
    }

    const questions = await prisma.question.findMany({
      where: { subjectId: subject.id },
      orderBy: { number: "asc" },
    });

    const answers = await prisma.answer.findMany({
      where: { sessionId: session.id },
    });

    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

    const pgQuestions = questions.filter((q) => q.type === "pg");
    const essayQuestions = questions.filter((q) => q.type === "essay");
    const pgCorrect = pgQuestions.filter((q) => {
      const ans = answerMap.get(q.id);
      return ans?.answer?.toUpperCase() === q.correctAnswer?.toUpperCase();
    }).length;

    const gradedEssays = essayQuestions.map((q) => {
      const ans = answerMap.get(q.id);
      return ans?.essayScore ?? null;
    }).filter((s) => s !== null) as number[];
    const avgEssay = gradedEssays.length > 0
      ? Math.round(gradedEssays.reduce((a, b) => a + b, 0) / gradedEssays.length)
      : null;
    const pgPercentage = pgQuestions.length > 0
      ? Math.round((session.scorePg / pgQuestions.length) * 100)
      : 0;
    const finalScore = avgEssay !== null && pgQuestions.length > 0
      ? Math.round((pgPercentage + avgEssay) / 2)
      : null;

    const questionsWithAnswers = questions.map((q) => {
      const answer = answerMap.get(q.id);
      return {
        id: q.id,
        number: q.number,
        type: q.type,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        studentAnswer: answer?.answer || null,
        isCorrect: answer?.isCorrect ?? null,
        flagged: answer?.flagged ?? false,
        essayScore: answer?.essayScore ?? null,
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
        startTime: session.startTime?.toISOString() || null,
        endTime: session.endTime?.toISOString() || null,
        status: session.status,
        scorePg: session.scorePg,
        pgCorrect,
        pgTotal: pgQuestions.length,
        pgPercentage,
        essayCount: essayQuestions.length,
        gradedEssayCount: gradedEssays.length,
        essayScore: avgEssay,
        finalScore,
      },
      questions: questionsWithAnswers,
    });
  } catch (error) {
    console.error("Error fetching detail:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
