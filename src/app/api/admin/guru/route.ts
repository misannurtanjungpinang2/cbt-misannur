import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const adminId = await getAdminSession();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        subjectAssignments: {
          include: {
            subject: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const result = teachers.map((t) => ({
      id: t.id,
      username: t.username,
      name: t.name,
      subjects: t.subjectAssignments.map((sa) => ({
        id: sa.subject.id,
        name: sa.subject.name,
        slug: sa.subject.slug,
      })),
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json({ teachers: result });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminId = await getAdminSession();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { username, name, password, subjectIds } = body;

    if (!username || !name || !password) {
      return NextResponse.json({ error: "Username, nama, dan password harus diisi" }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: "Username minimal 3 karakter" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    const existing = await prisma.teacher.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });
    }

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 10);

    const teacher = await prisma.teacher.create({
      data: {
        username,
        name,
        passwordHash,
        subjectAssignments: {
          create:
            subjectIds?.map((subjectId: string) => ({
              subjectId,
            })) || [],
        },
      },
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
    console.error("Error creating teacher:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
