import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// ============================================================
// GET — Daftar semua mata pelajaran
// ============================================================
export async function GET() {
  try {
    const adminId = await getAdminSession();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjects = await prisma.subject.findMany({
      orderBy: [{ dayNumber: "asc" }, { order: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        token: true,
        durationMinutes: true,
        dayNumber: true,
        isActive: true,
        order: true,
        _count: {
          select: { questions: true },
        },
      },
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("[SUBJECTS API ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
