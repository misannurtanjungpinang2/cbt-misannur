import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setTeacherSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password harus diisi" },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { username: username.trim() },
      select: { id: true, name: true, username: true, passwordHash: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    const bcrypt = await import("bcryptjs");
    const isValid = bcrypt.compareSync(password, teacher.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    await setTeacherSession({
      teacherId: teacher.id,
      name: teacher.name,
      username: teacher.username,
    });

    return NextResponse.json({
      message: "Login berhasil",
      teacher: { name: teacher.name, username: teacher.username },
    });
  } catch (error) {
    console.error("Teacher login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
