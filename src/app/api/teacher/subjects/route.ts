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

        // Hitung essay yang belum dinilai
        const sessions = await prisma.examSession.findMany({
          where: {
            subjectId: sa.subject.id,
            status: { in: ["completed", "auto_submit"] },
          },
          select: { id: true },
        });

        const sessionIds = sessions.map((s) => s.id);

        const ungradedEssays = sessionIds.length > 0
          ? await prisma.answer.count({
              where: {
                sessionId: { in: sessionIds },
                essayScore: null,
                question: { type: "essay" },
              },
            })
          : 0;

        return {
          id: sa.subject.id,
          name: sa.subject.name,
          slug: sa.subject.slug,
          totalStudents: totalStudents.length,
          ungradedEssays,
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
