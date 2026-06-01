import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query("SELECT COUNT(*) FROM \"Admin\"");
    const adminCount = parseInt(result.rows[0].count);
    await pool.end();
    return NextResponse.json({ adminCount, ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, code: e.code }, { status: 500 });
  }
}
