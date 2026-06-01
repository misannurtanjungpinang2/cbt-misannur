import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const adminId = await getAdminSession();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subjectId, isActive } = body;

    // Validasi input
    if (!subjectId) {
      return NextResponse.json(
        { error: "ID mapel harus diisi" },
        { status: 400 }
      );
    }

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive harus boolean" },
        { status: 400 }
      );
    }

    // Cek apakah subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Mapel tidak ditemukan" },
        { status: 404 }
      );
    }

    // Update status aktif
    await prisma.subject.update({
      where: { id: subjectId },
      data: { isActive },
    });

    return NextResponse.json({
      success: true,
      isActive,
      subjectId,
    });
  } catch (error) {
    console.error("Toggle aktif error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
