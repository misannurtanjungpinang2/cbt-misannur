import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAdminSession();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        subjectAssignments: {
          include: {
            subject: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Guru tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        username: teacher.username,
        name: teacher.name,
        subjects: teacher.subjectAssignments.map((sa) => ({
          id: sa.subject.id,
          name: sa.subject.name,
          slug: sa.subject.slug,
        })),
        createdAt: teacher.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAdminSession();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { username, name, password, subjectIds } = body;

    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Guru tidak ditemukan" }, { status: 404 });
    }

    // Cek duplikat username (kalo beda id)
    if (username && username !== existing.username) {
      const dup = await prisma.teacher.findUnique({ where: { username } });
      if (dup) {
        return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (username) updateData.username = username;
    if (name) updateData.name = name;
    if (password) {
      const bcrypt = await import("bcryptjs");
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Update relasi subject jika ada
    if (subjectIds !== undefined) {
      await prisma.subjectTeacher.deleteMany({ where: { teacherId: id } });
      if (subjectIds.length > 0) {
        await prisma.subjectTeacher.createMany({
          data: subjectIds.map((subjectId: string) => ({
            teacherId: id,
            subjectId,
          })),
        });
      }
    }

    const teacher = await prisma.teacher.update({
      where: { id },
      data: updateData,
      include: {
        subjectAssignments: {
          include: {
            subject: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    return NextResponse.json({
      teacher: {
        id: teacher.id,
        username: teacher.username,
        name: teacher.name,
        subjects: teacher.subjectAssignments.map((sa) => ({
          id: sa.subject.id,
          name: sa.subject.name,
          slug: sa.subject.slug,
        })),
        createdAt: teacher.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating teacher:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAdminSession();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Guru tidak ditemukan" }, { status: 404 });
    }

    await prisma.teacher.delete({ where: { id } });

    return NextResponse.json({ message: "Guru berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
