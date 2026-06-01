import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  try {
    // Check admin auth
    const adminId = await getAdminSession();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Total siswa
    const totalStudents = await prisma.student.count();

    // Total siswa yang sudah pernah ujian (minimal 1 sesi)
    const studentsWithSession = await prisma.examSession.groupBy({
      by: ["studentId"],
    });
    const studentsCompleted = studentsWithSession.length;

    // Siswa yang belum ujian
    const studentsNotStarted = totalStudents - studentsCompleted;

    // Total sesi ujian completed
    const totalCompletedSessions = await prisma.examSession.count({
      where: { status: "completed" },
    });

    // Total sesi in_progress
    const totalInProgress = await prisma.examSession.count({
      where: { status: "in_progress" },
    });

    // Progress per mapel
    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        dayNumber: true,
        token: true,
        _count: {
          select: {
            questions: true,
            examSessions: true,
          },
        },
      },
      orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
    });

    // Hitung jumlah siswa yang sudah mengerjakan per mapel
    const subjectProgress = await Promise.all(
      subjects.map(async (subject) => {
        const completedSessions = await prisma.examSession.count({
          where: {
            subjectId: subject.id,
            status: "completed",
          },
        });

        const inProgressSessions = await prisma.examSession.count({
          where: {
            subjectId: subject.id,
            status: "in_progress",
          },
        });

        return {
          id: subject.id,
          name: subject.name,
          slug: subject.slug,
          isActive: subject.isActive,
          dayNumber: subject.dayNumber,
          token: subject.token,
          totalQuestions: subject._count.questions,
          totalSessions: subject._count.examSessions,
          completedSessions,
          inProgressSessions,
        };
      })
    );

    // 5 ujian terakhir
    const recentExams = await prisma.examSession.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        scorePg: true,
        createdAt: true,
        startTime: true,
        endTime: true,
        student: {
          select: {
            name: true,
            participantNumber: true,
          },
        },
        subject: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      totalStudents,
      studentsCompleted,
      studentsNotStarted,
      totalCompletedSessions,
      totalInProgress,
      subjectProgress,
      recentExams,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan server";
    return NextResponse.json(
      { error: message, detail: error instanceof Error ? error.stack : null },
      { status: 500 }
    );
  }
}
