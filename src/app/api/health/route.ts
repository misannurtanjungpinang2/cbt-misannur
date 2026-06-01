import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, unknown> = {};
  let status = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "connected";
  } catch (error) {
    status = "degraded";
    checks.database = "failed";
    checks.error = error instanceof Error ? error.message : String(error);
  }

  try {
    checks.adminCount = await prisma.admin.count();
    checks.subjectCount = await prisma.subject.count();
    checks.studentCount = await prisma.student.count();
  } catch {
    // stats not critical
  }

  return NextResponse.json(
    { status, timestamp: new Date().toISOString(), checks },
    { status: status === "ok" ? 200 : 503 }
  );
}
