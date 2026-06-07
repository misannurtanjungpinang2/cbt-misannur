// Seed Matematika ke Supabase
// Run: node scripts/seed-matematika.js
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const DATABASE_URL = "postgresql://postgres.uluhtaolhxdxragtcdem:MisAnnur2026Cbt%21@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });

  try {
    // 1. Buat atau update subject Matematika
    const subjectId = uuidv4();
    const existing = await pool.query(`SELECT id FROM "Subject" WHERE slug = 'matematika'`);

    let finalSubjectId;
    if (existing.rows.length > 0) {
      finalSubjectId = existing.rows[0].id;
      console.log(`ℹ️  Subject Matematika already exists (id=${finalSubjectId}), updating...`);
      await pool.query(
        `UPDATE "Subject" SET name='Matematika', "dayNumber"=5, "order"=1, "durationMinutes"=60, "isActive"=false WHERE slug='matematika'`
      );
    } else {
      await pool.query(
        `INSERT INTO "Subject" (id, name, slug, "dayNumber", "order", "durationMinutes", "isActive", "createdAt")
         VALUES ($1, 'Matematika', 'matematika', 5, 1, 60, false, now())`,
        [subjectId]
      );
      finalSubjectId = subjectId;
      console.log(`✅ Subject Matematika created (id=${finalSubjectId})`);
    }

    // 2. Hapus soal lama
    const deleteResult = await pool.query(`DELETE FROM "Question" WHERE "subjectId" = $1`, [finalSubjectId]);
    console.log(`🗑️  Deleted ${deleteResult.rowCount} old questions`);

    // 3. Baca JSON
    const jsonPath = path.join(__dirname, "..", "src", "data", "matematika.json");
    const questions = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    // 4. Insert soal
    let inserted = 0;
    for (const q of questions) {
      await pool.query(
        `INSERT INTO "Question" (id, "subjectId", number, type, text, "optionA", "optionB", "optionC", "optionD", "correctAnswer", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())`,
        [
          uuidv4(),
          finalSubjectId,
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
      inserted++;
    }

    console.log(`✅ Inserted ${inserted} questions`);
    console.log("");
    console.log("═══════════════════════════════════════════");
    console.log("✅ Seeding Matematika selesai!");
    console.log(`   Subject : Matematika (matematika)`);
    console.log(`   Hari    : 5 (bersama PJOK)`);
    console.log(`   Durasi  : 60 menit`);
    console.log(`   PG      : ${questions.filter(q => q.type === 'pg').length}`);
    console.log(`   Total   : ${inserted} soal`);
    console.log("═══════════════════════════════════════════");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
