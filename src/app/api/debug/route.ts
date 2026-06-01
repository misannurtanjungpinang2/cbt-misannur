import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, any> = {};

  // Test 1: Raw pg Pool
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const r = await pool.query("SELECT 1 as test");
    await pool.end();
    results.pg = { ok: true, test: r.rows[0].test };
  } catch (e: any) {
    results.pg = { ok: false, error: e.message, code: e.code };
  }

  // Test 2: Prisma with adapter
  try {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { PrismaClient } = await import("@/generated/prisma/client");
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    const prisma = new PrismaClient({ adapter });
    const count = await prisma.admin.count();
    await prisma.$disconnect();
    results.prisma = { ok: true, adminCount: count };
  } catch (e: any) {
    results.prisma = { ok: false, error: e.message, code: e.code };
  }

  return NextResponse.json(results);
}
