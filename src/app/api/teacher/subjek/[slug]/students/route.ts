import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    // Cek akses guru ke mapel ini
    const teacherSubject = await prisma.subjectTeacher.findFirst({
      where: {
        teacherId: session.teacherId,
        subject: { slug },
      },
    });

    if (!teacherSubject) {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke mapel ini" }, { status: 403 });
    }

    const subject = await prisma.subject.findUnique({
      where: { slug },
    });

    if (!subject) {
      return NextResponse.json({ error: "Mapel tidak ditemukan" }, { status: 404 });
    }

    const sessions = await prisma.examSession.findMany({
      where: {
        subjectId: subject.id,
        status: { in: ["completed", "auto_submit"] },
      },
      include: {
        student: true,
        answers: {
          where: {
            question: { type: "essay" },
          },
          select: {
            id: true,
            essayScore: true,
            answer: true,
          },
        },
      },
      orderBy: {
        student: { name: "asc" },
      },
    });

    const essayCount = await prisma.question.count({
      where: { subjectId: subject.id, type: "essay" },
    });

    const pgCount = await prisma.question.count({
      where: { subjectId: subject.id, type: "pg" },
    });

    const result = sessions.map((s) => {
      const essayAnswers = s.answers;
      const gradedCount = essayAnswers.filter((a) => a.essayScore !== null).length;
      const totalEssayScore = essayAnswers
        .filter((a) => a.essayScore !== null)
        .reduce((sum, a) => sum + (a.essayScore || 0), 0);
      const avgEssayScore = gradedCount > 0 ? Math.round(totalEssayScore / gradedCount) : null;

      const pgPercentage = pgCount > 0 ? Math.round((s.scorePg / pgCount) * 100) : 0;
      const finalScore = avgEssayScore !== null && pgCount > 0
        ? Math.round((pgPercentage + avgEssayScore) / 2)
        : null;

      return {
        id: s.id,
        student: {
          id: s.student.id,
          name: s.student.name,
          participantNumber: s.student.participantNumber,
        },
        startTime: s.startTime?.toISOString() || null,
        endTime: s.endTime?.toISOString() || null,
        status: s.status,
        scorePg: s.scorePg,
        totalEssay: essayCount,
        gradedEssayCount: gradedCount,
        avgEssayScore,
        finalScore,
        isFullyGraded: gradedCount > 0 && gradedCount === essayCount,
      };
    });

    return NextResponse.json({
      subject: { id: subject.id, name: subject.name, slug: subject.slug },
      pgCount,
      totalEssay: essayCount,
      sessions: result,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
