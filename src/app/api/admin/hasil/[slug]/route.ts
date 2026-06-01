import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const adminId = await getAdminSession();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const subject = await prisma.subject.findUnique({
      where: { slug },
    });

    if (!subject) {
      return NextResponse.json({ error: "Mata pelajaran tidak ditemukan" }, { status: 404 });
    }

    // Hitung total siswa yang memiliki sesi untuk mapel ini
    const totalStudents = await prisma.examSession.groupBy({
      by: ["studentId"],
      where: { subjectId: subject.id },
      _count: { id: true },
    });

    // Ambil semua sesi yang completed/auto_submit
    const sessions = await prisma.examSession.findMany({
      where: {
        subjectId: subject.id,
        status: { in: ["completed", "auto_submit"] },
      },
      include: {
        student: true,
      },
      orderBy: {
        student: { name: "asc" },
      },
    });

    // Hitung jumlah soal PG untuk validasi skor
    const pgCount = await prisma.question.count({
      where: { subjectId: subject.id, type: "pg" },
    });

    return NextResponse.json({
      subject: {
        id: subject.id,
        name: subject.name,
        slug: subject.slug,
        durationMinutes: subject.durationMinutes,
        isActive: subject.isActive,
        dayNumber: subject.dayNumber,
      },
      totalStudents: totalStudents.length,
      pgCount,
      sessions: sessions.map((s) => ({
        id: s.id,
        student: {
          id: s.student.id,
          name: s.student.name,
          participantNumber: s.student.participantNumber,
          class: s.student.class,
        },
        startTime: s.startTime?.toISOString() || null,
        endTime: s.endTime?.toISOString() || null,
        status: s.status,
        scorePg: s.scorePg,
      })),
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
