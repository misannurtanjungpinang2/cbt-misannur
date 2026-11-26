import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET — daftar kombinasi Tahun Ajaran + Semester + Kelas
export async function GET() {
  const adminId = await getAdminSession();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subjects = await prisma.subject.findMany({
      where: {
        academicYear: { not: null },
        semester: { not: null },
        classLevel: { not: null },
      },
      select: { academicYear: true, semester: true, classLevel: true },
    });

    const map = new Map<
      string,
      { academicYear: string; semester: string; classLevel: string; subjectCount: number }
    >();

    for (const s of subjects) {
      const key = `${s.academicYear}|${s.semester}|${s.classLevel}`;
      const existing = map.get(key);
      if (existing) {
        existing.subjectCount += 1;
      } else {
        map.set(key, {
          academicYear: s.academicYear as string,
          semester: s.semester as string,
          classLevel: s.classLevel as string,
          subjectCount: 1,
        });
      }
    }

    const semOrder: Record<string, number> = { Ganjil: 0, Genap: 1 };
    const periods = Array.from(map.values()).sort((a, b) => {
      if (a.academicYear !== b.academicYear) {
        return a.academicYear < b.academicYear ? 1 : -1;
      }
      const sa = semOrder[a.semester] ?? 9;
      const sb = semOrder[b.semester] ?? 9;
      if (sa !== sb) return sa - sb;
      return a.classLevel.localeCompare(b.classLevel);
    });

    return NextResponse.json({ periods });
  } catch (error) {
    console.error("[PERIODS ERROR]", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
