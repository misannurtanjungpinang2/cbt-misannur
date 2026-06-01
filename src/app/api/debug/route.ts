import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { PrismaClient } = await import("@/generated/prisma/client");

    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || "" });
    const prisma = new PrismaClient({ adapter });

    // Cek tabel dan data
    let adminCount = 0;
    let subjectCount = 0;
    let questionCount = 0;
    let errors: string[] = [];

    try {
      adminCount = await prisma.admin.count();
    } catch (e: any) {
      errors.push("Admin: " + e.message);
    }

    try {
      subjectCount = await prisma.subject.count();
    } catch (e: any) {
      errors.push("Subject: " + e.message);
    }

    try {
      questionCount = await prisma.question.count();
    } catch (e: any) {
      errors.push("Question: " + e.message);
    }

    await prisma.$disconnect();

    return NextResponse.json({
      status: "ok",
      adminCount,
      subjectCount,
      questionCount,
      errors,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack?.substring(0, 500) }, { status: 500 });
  }
}
