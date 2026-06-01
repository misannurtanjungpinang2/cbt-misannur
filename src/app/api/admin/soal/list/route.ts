import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// ============================================================
// GET — Daftar soal berdasarkan subjectId
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const adminId = await getAdminSession();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json({ error: "Parameter subjectId diperlukan" }, { status: 400 });
    }

    const questions = await prisma.question.findMany({
      where: { subjectId },
      orderBy: { number: "asc" },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[LIST SOAL ERROR]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
