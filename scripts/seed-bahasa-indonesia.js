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
  const questions = JSON.parse(
    fs.readFileSync(__dirname + "/../src/data/bahasa-indonesia.json", "utf-8")
  );

  const client = await pool.connect();

  try {
    // 1. Insert subject if not exists
    console.log("📌 Inserting subject...");
    await client.query(`
      INSERT INTO "Subject" (id, name, slug, token, "durationMinutes", "dayNumber", "isActive", "order", "createdAt")
      SELECT gen_random_uuid(), 'Bahasa Indonesia', 'bahasa-indonesia', NULL, 60, 4, false, 1, now()
      WHERE NOT EXISTS (SELECT 1 FROM "Subject" WHERE slug='bahasa-indonesia');
    `);
    console.log("   Subject OK");

    // 2. Delete old questions
    console.log("📌 Deleting old questions...");
    await client.query(`DELETE FROM "Question" WHERE "subjectId" = (SELECT id FROM "Subject" WHERE slug='bahasa-indonesia')`);
    console.log("   Delete OK");

    // 3. Insert new questions
    console.log(`📌 Inserting ${questions.length} questions...`);

    for (const q of questions) {
      await client.query(
        `INSERT INTO "Question" (id, "subjectId", number, type, text, "optionA", "optionB", "optionC", "optionD", "correctAnswer", "createdAt")
         VALUES (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-indonesia'), $1, $2, $3, $4, $5, $6, $7, $8, now())`,
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
    console.log("✅ Seed Bahasa Indonesia selesai!");
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
