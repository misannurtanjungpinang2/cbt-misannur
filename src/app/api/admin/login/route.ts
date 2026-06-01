import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validasi input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password harus diisi" },
        { status: 400 }
      );
    }

    // Cari admin di database
    const admin = await prisma.admin.findFirst({
      where: { username },
      select: { id: true, passwordHash: true },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Verifikasi password dengan bcrypt
    const bcrypt = await import("bcryptjs");
    const isValid = bcrypt.compareSync(password, admin.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Set cookie session admin
    await setAdminSession(admin.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login admin error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
