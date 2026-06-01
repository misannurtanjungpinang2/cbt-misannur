import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url = process.env.DATABASE_URL || "";
    
    // Dynamic import untuk test koneksi
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { PrismaClient } = await import("@/generated/prisma/client");

    const adapter = new PrismaPg({ connectionString: url });
    const prisma = new PrismaClient({ adapter });

    const adminCount = await prisma.admin.count();
    await prisma.$disconnect();

    return NextResponse.json({
      connected: true,
      adminCount,
      url_prefix: url.substring(0, 25),
    });
  } catch (e: any) {
    return NextResponse.json({
      connected: false,
      error: e.message,
      code: e.code,
    }, { status: 500 });
  }
}
