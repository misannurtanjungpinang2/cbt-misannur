import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { PrismaClient } = await import("@/generated/prisma/client");

    const url = process.env.DATABASE_URL || "";
    const adapter = new PrismaPg({ connectionString: url });

    let dbStatus = "unknown";
    try {
      const p = new PrismaClient({ adapter });
      await p.$connect();
      dbStatus = "connected";
      await p.$disconnect();
    } catch (e: any) {
      dbStatus = `connect_error: ${e.message || e}`;
    }

    return NextResponse.json({
      env_url_set: !!process.env.DATABASE_URL,
      env_url_prefix: url.substring(0, 20),
      dbStatus,
      node: process.version,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e), stack: e.stack?.substring(0, 500) }, { status: 500 });
  }
}
