import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTeacherSession } from "@/lib/auth";

export async function GET() {
  const session = await getTeacherSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: session.teacherId },
      include: {
        subjectAssignments: {
          include: {
            subject: {
              include: {
                _count: { select: { examSessions: true } },
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const subjects = await Promise.all(
      teacher.subjectAssignments.map(async (sa) => {
        const totalStudents = await prisma.examSession.groupBy({
          by: ["studentId"],
          where: { subjectId: sa.subject.id },
          _count: { id: true },
        });

        // Hitung siswa yang belum selesai dinilai (punya minimal 1 essay belum dinilai)
        const sessionsWithEssays = await prisma.examSession.findMany({
          where: {
            subjectId: sa.subject.id,
            status: { in: ["completed", "auto_submit"] },
          },
          select: { id: true, studentId: true },
        });

        const sessionIds = sessionsWithEssays.map((s) => s.id);
        const sessionStudentMap = new Map(sessionsWithEssays.map((s) => [s.id, s.studentId]));

        let ungradedStudentCount = 0;

        if (sessionIds.length > 0) {
          const ungradedSessions = await prisma.answer.findMany({
            where: {
              sessionId: { in: sessionIds },
              essayScore: null,
              question: { type: "essay" },
            },
            select: { sessionId: true },
            distinct: ["sessionId"],
          });

          const uniqueStudentIds = new Set(
            ungradedSessions
              .map((a) => sessionStudentMap.get(a.sessionId))
              .filter(Boolean)
          );
          ungradedStudentCount = uniqueStudentIds.size;
        }

        return {
          id: sa.subject.id,
          name: sa.subject.name,
          slug: sa.subject.slug,
          totalStudents: totalStudents.length,
          ungradedStudentCount,
        };
      })
    );

    return NextResponse.json({
      teacher: {
        name: teacher.name,
        username: teacher.username,
      },
      subjects,
    });
  } catch (error) {
    console.error("Error fetching teacher subjects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
