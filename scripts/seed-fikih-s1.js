// Import soal Fikih (K5 & K6) ke Supabase + set token + aktifkan
// Nonaktifkan mapel sesi sebelumnya (QH). Hanya menyentuh mapel Fikih & QH.
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const DATABASE_URL =
  "postgresql://postgres.uluhtaolhxdxragtcdem:MisAnnur2026Cbt%21@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";
const DATA_DIR = path.join(__dirname, "..", "src", "data", "new-s1");

const SETS = [
  { slug: "k5-fikih", file: "k5-fikih.json", token: "PEHW3K" },
  { slug: "k6-fikih", file: "k6-fikih.json", token: "MZNJKE" },
];
const DEACTIVATE = ["k5-quran-hadis", "k6-quran-hadis"];

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });
  try {
    for (const s of SETS) {
      const sub = await pool.query(`SELECT id FROM "Subject" WHERE slug=$1`, [s.slug]);
      if (sub.rows.length === 0) throw new Error(`Subject ${s.slug} tidak ditemukan`);
      const subjectId = sub.rows[0].id;

      await pool.query(`DELETE FROM "Question" WHERE "subjectId"=$1`, [subjectId]);

      const qs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, s.file), "utf-8"));
      for (const q of qs) {
        await pool.query(
          `INSERT INTO "Question" (id,"subjectId",number,type,text,"optionA","optionB","optionC","optionD","correctAnswer","createdAt")
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())`,
          [uuidv4(), subjectId, q.number, q.type, q.text,
           q.optionA || null, q.optionB || null, q.optionC || null, q.optionD || null,
           q.correctAnswer || null]
        );
      }
      const pg = qs.filter((q) => q.type === "pg").length;

      await pool.query(
        `UPDATE "Subject" SET token=$2, "isActive"=true, "durationMinutes"=90 WHERE id=$1`,
        [subjectId, s.token]
      );
      console.log(`✅ ${s.slug}: ${qs.length} soal (PG ${pg}, esai ${qs.length - pg}) | token=${s.token} | AKTIF`);
    }

    const de = await pool.query(
      `UPDATE "Subject" SET "isActive"=false WHERE slug = ANY($1)`,
      [DEACTIVATE]
    );
    console.log(`⛔ Nonaktifkan: ${DEACTIVATE.join(", ")} (${de.rowCount} baris)`);

    console.log("\n=== Verifikasi mapel hari ini ===");
    const chk = await pool.query(
      `SELECT slug,"isActive",token,"durationMinutes",
         (SELECT count(*) FROM "Question" q WHERE q."subjectId"=s.id) AS soal,
         (SELECT count(*) FROM "Question" q WHERE q."subjectId"=s.id AND q.type='pg') AS pg,
         (SELECT count(*) FROM "Question" q WHERE q."subjectId"=s.id AND q.type='pg' AND q."correctAnswer" IS NOT NULL) AS pgkey
       FROM "Subject" s WHERE slug IN ('k5-fikih','k6-fikih','k5-quran-hadis','k6-quran-hadis') ORDER BY slug`
    );
    for (const r of chk.rows) {
      console.log(`${r.isActive ? "AKTIF" : "-    "} ${r.slug} | ${r.durationMinutes}m | ${r.soal} soal (PG ${r.pg}, kunci ${r.pgkey}) | tok=${r.token || "-"}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
