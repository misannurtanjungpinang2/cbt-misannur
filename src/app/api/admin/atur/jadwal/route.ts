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
    const { subjectId, dayNumber, order } = body;

    // Validasi input
    if (!subjectId) {
      return NextResponse.json(
        { error: "ID mapel harus diisi" },
        { status: 400 }
      );
    }

    // dayNumber harus antara 1-7, atau null (tidak dijadwalkan)
    if (dayNumber !== null && dayNumber !== undefined) {
      const day = Number(dayNumber);
      if (!Number.isInteger(day) || day < 1 || day > 7) {
        return NextResponse.json(
          { error: "Hari harus antara 1-7" },
          { status: 400 }
        );
      }
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

    // Siapkan data update
    const updateData: Record<string, number | null> = {};

    if (dayNumber !== undefined) {
      updateData.dayNumber = dayNumber !== null ? Number(dayNumber) : null;
    }

    if (order !== undefined) {
      updateData.order = Number(order);
    }

    // Update jadwal
    await prisma.subject.update({
      where: { id: subjectId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      subjectId,
      ...updateData,
    });
  } catch (error) {
    console.error("Atur jadwal error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
