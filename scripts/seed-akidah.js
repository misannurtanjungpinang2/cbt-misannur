// Seed Akidah Akhlak ke Supabase
// Run: node scripts/seed-akidah.js
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const DATABASE_URL = "postgresql://postgres.uluhtaolhxdxragtcdem:MisAnnur2026Cbt%21@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });

  try {
    // 1. Buat atau update subject Akidah Akhlak
    const subjectId = uuidv4();
    const existing = await pool.query(`SELECT id FROM "Subject" WHERE slug = 'akidah-akhlak'`);

    let finalSubjectId;
    if (existing.rows.length > 0) {
      finalSubjectId = existing.rows[0].id;
      console.log(`ℹ️  Subject already exists (id=${finalSubjectId}), updating...`);
      await pool.query(
        `UPDATE "Subject" SET name='Akidah Akhlak', "dayNumber"=1, "order"=2, "durationMinutes"=60, "isActive"=false WHERE slug='akidah-akhlak'`
      );
    } else {
      await pool.query(
        `INSERT INTO "Subject" (id, name, slug, "dayNumber", "order", "durationMinutes", "isActive", "createdAt")
         VALUES ($1, 'Akidah Akhlak', 'akidah-akhlak', 1, 2, 60, false, now())`,
        [subjectId]
      );
      finalSubjectId = subjectId;
      console.log(`✅ Subject created (id=${finalSubjectId})`);
    }

    // 2. Hapus soal lama
    const deleteResult = await pool.query(`DELETE FROM "Question" WHERE "subjectId" = $1`, [finalSubjectId]);
    console.log(`🗑️  Deleted ${deleteResult.rowCount} old questions`);

    // 3. Baca JSON
    const jsonPath = path.join(__dirname, "..", "src", "data", "akidah-akhlak.json");
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
    console.log("✅ Seeding Akidah Akhlak selesai!");
    console.log(`   Subject : Akidah Akhlak (akidah-akhlak)`);
    console.log(`   Hari    : 1 (bersama Al-Quran Hadist)`);
    console.log(`   PG      : ${questions.filter(q => q.type === 'pg').length}`);
    console.log(`   Essay   : ${questions.filter(q => q.type === 'essay').length}`);
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
