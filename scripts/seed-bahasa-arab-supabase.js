const { Pool } = require("pg");
const fs = require("fs");

const DATABASE_URL =
  "postgresql://postgres.uluhtaolhxdxragtcdem:MisAnnur2026Cbt%21@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 10000,
});

async function main() {
  const sql = fs.readFileSync(__dirname + "/../seed-full.sql", "utf-8");

  // Extract only the Subject insert + Bahasa Arab questions section
  const lines = sql.split("\n");
  const startIdx = lines.findIndex((l) => l.includes("'bahasa-arab'"));
  const endIdx = lines.findIndex((l, i) => i > startIdx && l.trim() === "" && i > startIdx + 50);

  const subjectSQL = lines.find((l) => l.includes("'bahasa-arab'"));
  const questionsSQL = lines
    .slice(lines.findIndex((l) => l.includes("-- 3. Soal Bahasa Arab")))
    .join("\n");

  const client = await pool.connect();

  try {
    // 1. Insert subject if not exists
    console.log("📌 Inserting subject...");
    await client.query(`
      INSERT INTO "Subject" (id, name, slug, token, "durationMinutes", "dayNumber", "isActive", "order", "createdAt")
      SELECT gen_random_uuid(), 'Bahasa Arab', 'bahasa-arab', NULL, 60, 3, true, 1, now()
      WHERE NOT EXISTS (SELECT 1 FROM "Subject" WHERE slug='bahasa-arab');
    `);
    console.log("   Subject OK");

    // 2. Delete old questions
    console.log("📌 Deleting old questions...");
    await client.query(`DELETE FROM "Question" WHERE "subjectId" = (SELECT id FROM "Subject" WHERE slug='bahasa-arab')`);
    console.log("   Delete OK");

    // 3. Insert new questions
    console.log("📌 Inserting 50 questions...");

    // Read the JSON instead of parsing SQL (cleaner)
    const questions = JSON.parse(fs.readFileSync(__dirname + "/../src/data/bahasa-arab.json", "utf-8"));

    for (const q of questions) {
      await client.query(
        `INSERT INTO "Question" (id, "subjectId", number, type, text, "optionA", "optionB", "optionC", "optionD", "correctAnswer", "createdAt")
         VALUES (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-arab'), $1, $2, $3, $4, $5, $6, $7, $8, now())`,
        [
          q.number,
          q.type,
          q.text,
          q.optionA || null,
          q.optionB || null,
          q.optionC || null,
          q.optionD || null,
          q.correctAnswer || null,
        ]
      );
    }

    console.log(`   ✅ ${questions.length} questions inserted (${questions.filter((q) => q.type === "pg").length} PG, ${questions.filter((q) => q.type === "essay").length} Essay)`);
    console.log("");
    console.log("✅ Seed Bahasa Arab selesai!");
  } catch (err) {
    console.error("❌ Error:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
