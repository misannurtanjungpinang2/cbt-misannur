import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const adminCount = await prisma.admin.count();
    const subjectCount = await prisma.subject.count();
    const questionCount = await prisma.question.count();
    return NextResponse.json({ adminCount, subjectCount, questionCount, ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack?.substring(0, 800) }, { status: 500 });
  }
}
