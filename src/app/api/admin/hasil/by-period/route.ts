import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET — daftar mapel untuk Tahun Ajaran + Semester + Kelas tertentu (beserta jumlah sesi)
export async function GET(request: NextRequest) {
  const adminId = await getAdminSession();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const semester = searchParams.get("semester");
  const classLevel = searchParams.get("class");

  if (!year || !semester || !classLevel) {
    return NextResponse.json(
      { error: "Parameter year, semester, dan class wajib diisi" },
      { status: 400 }
    );
  }

  try {
    const subjects = await prisma.subject.findMany({
      where: { academicYear: year, semester, classLevel },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        durationMinutes: true,
        isActive: true,
      },
    });

    const ids = subjects.map((s) => s.id);
    const totalMap = new Map<string, number>();
    const completedMap = new Map<string, number>();

    if (ids.length > 0) {
      const totals = await prisma.examSession.groupBy({
        by: ["subjectId"],
        where: { subjectId: { in: ids } },
        _count: { id: true },
      });
      const completed = await prisma.examSession.groupBy({
        by: ["subjectId"],
        where: {
          subjectId: { in: ids },
          status: { in: ["completed", "auto_submit"] },
        },
        _count: { id: true },
      });

      for (const t of totals) totalMap.set(t.subjectId, t._count.id);
      for (const c of completed) completedMap.set(c.subjectId, c._count.id);
    }

    const result = subjects.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      durationMinutes: s.durationMinutes,
      isActive: s.isActive,
      totalSessions: totalMap.get(s.id) ?? 0,
      completedSessions: completedMap.get(s.id) ?? 0,
    }));

    return NextResponse.json({ subjects: result });
  } catch (error) {
    console.error("[BY-PERIOD ERROR]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
