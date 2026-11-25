import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { setSiswaSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, participantNumber, class: className, token } = body;

    // --- Validasi input tidak kosong ---
    const errors: string[] = [];

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      errors.push("Nama lengkap tidak boleh kosong");
    }

    if (
      !participantNumber ||
      typeof participantNumber !== "string" ||
      participantNumber.trim().length === 0
    ) {
      errors.push("Nomor peserta tidak boleh kosong");
    }

    if (!className || typeof className !== "string" || className.trim().length === 0) {
      errors.push("Kelas tidak boleh kosong");
    }

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      errors.push("Token tidak boleh kosong");
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(". ") }, { status: 400 });
    }

    const normalizedToken = token.trim().toUpperCase();
    const trimmedName = name.trim().toUpperCase();
    const trimmedParticipant = participantNumber.trim();
    const trimmedClass = className.trim();

    // --- Validasi token KHUSUS untuk mapel kelas yang dipilih (k5-/k6-) ---
    const subjectWithToken = await prisma.subject.findFirst({
      where: {
        token: normalizedToken,
        isActive: true,
        slug: { startsWith: `k${trimmedClass}-` },
      },
      select: { id: true, name: true },
    });

    if (!subjectWithToken) {
      return NextResponse.json(
        { error: `Token tidak valid untuk Kelas ${trimmedClass}` },
        { status: 401 }
      );
    }

    // --- Cari student berdasarkan participantNumber + class, buat baru jika tidak ada ---
    let student = await prisma.student.findFirst({
      where: { participantNumber: trimmedParticipant, class: trimmedClass },
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          name: trimmedName,
          participantNumber: trimmedParticipant,
          class: trimmedClass,
          tokenUsed: normalizedToken,
        },
      });
    } else {
      // Update data jika perlu
      student = await prisma.student.update({
        where: { id: student.id },
        data: {
          name: trimmedName,
          class: trimmedClass,
          tokenUsed: normalizedToken,
        },
      });
    }

    // --- Set cookie session siswa ---
    await setSiswaSession({
      studentId: student.id,
      name: student.name,
      participantNumber: student.participantNumber,
      class: student.class,
    });

    return NextResponse.json({
      success: true,
      student: { id: student.id, name: student.name },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
