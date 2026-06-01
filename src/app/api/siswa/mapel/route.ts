import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSiswaSession } from "@/lib/auth";

export async function GET() {
  try {
    // --- Ambil session siswa dari cookie ---
    const sessionSiswa = await getSiswaSession();
    if (!sessionSiswa) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Ambil subject yang aktif, urut berdasarkan dayNumber dan order ---
    const subjects = await prisma.subject.findMany({
      where: { isActive: true },
      orderBy: [{ dayNumber: "asc" as const }, { order: "asc" as const }],
      select: {
        id: true,
        name: true,
        slug: true,
        token: true,
        durationMinutes: true,
        dayNumber: true,
        isActive: true,
        order: true,
        createdAt: true,
      },
    });

    // --- Cek status ujian siswa untuk setiap mapel ---
    const result = await Promise.all(
      subjects.map(async (subject) => {
        const examSession = await prisma.examSession.findFirst({
          where: {
            studentId: sessionSiswa.studentId,
            subjectId: subject.id,
          },
          select: { id: true, status: true },
        });

        let status: string;
        if (!examSession) {
          status = "available";
        } else if (examSession.status === "in_progress") {
          status = "in_progress";
        } else if (examSession.status === "completed" || examSession.status === "auto_submit") {
          status = "completed";
        } else {
          status = "available";
        }

        return {
          id: subject.id,
          name: subject.name,
          slug: subject.slug,
          durationMinutes: subject.durationMinutes,
          dayNumber: subject.dayNumber,
          order: subject.order,
          status,
        };
      })
    );

    return NextResponse.json({ subjects: result });
  } catch (error) {
    console.error("Mapel fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
