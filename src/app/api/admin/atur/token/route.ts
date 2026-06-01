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
    const { subjectId, token } = body;

    // Validasi input
    if (!subjectId) {
      return NextResponse.json(
        { error: "ID mapel harus diisi" },
        { status: 400 }
      );
    }

    if (!token || typeof token !== "string" || token.trim().length !== 6) {
      return NextResponse.json(
        { error: "Token harus 6 karakter" },
        { status: 400 }
      );
    }

    // Normalize token to uppercase
    const normalizedToken = token.trim().toUpperCase();

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

    // Update token
    await prisma.subject.update({
      where: { id: subjectId },
      data: { token: normalizedToken },
    });

    return NextResponse.json({ success: true, token: normalizedToken });
  } catch (error) {
    console.error("Set token error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
