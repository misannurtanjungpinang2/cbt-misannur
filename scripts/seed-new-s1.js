// Setup data ujian Semester 1 TA 2026/2027 (Supabase)
// - Buat 22 mapel (k5-/k6-)
// - Nonaktifkan mapel lama
// - Promosi siswa kelas 5 -> 6
// - Import 4 set soal hari ini (QH & Akidah kls 5/6)
// - Set token kelas (beda antar kelas) + aktifkan 4 mapel hari ini
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const DATABASE_URL =
  "postgresql://postgres.uluhtaolhxdxragtcdem:MisAnnur2026Cbt%21@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";

const SUBJECTS = [
  ["quran-hadis", "Al-Qur'an Hadis", 1, 1],
  ["akidah-akhlak", "Akidah Akhlak", 1, 2],
  ["fikih", "Fikih", null, 0],
  ["bahasa-arab", "Bahasa Arab", null, 0],
  ["ppkn", "PPKN", null, 0],
  ["bahasa-indonesia", "Bahasa Indonesia", null, 0],
  ["ipas", "IPAS", null, 0],
  ["matematika", "Matematika", null, 0],
  ["pjok", "PJOK", null, 0],
  ["bahasa-inggris", "Bahasa Inggris", null, 0],
  ["ski", "SKI", null, 0],
];

const TODAY = ["quran-hadis", "akidah-akhlak"];
const DATA_DIR = path.join(__dirname, "..", "src", "data", "new-s1");

function genToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });
  try {
    // 0. Deactivate all old subjects (non k5-/k6-)
    const de = await pool.query(
      `UPDATE "Subject" SET "isActive"=false WHERE slug NOT LIKE 'k5-%' AND slug NOT LIKE 'k6-%'`
    );
    console.log(`Nonaktifkan mapel lama: ${de.rowCount} baris`);

    // tokens per class (today) - distinct
    const tok5 = genToken();
    const tok6 = genToken();

    // 1. Create subjects
    const idBySlug = {};
    for (const cls of ["5", "6"]) {
      const token = cls === "5" ? tok5 : tok6;
      for (const [s, name, day, order] of SUBJECTS) {
        const slug = `k${cls}-${s}`;
        const fullName = `${name} Kelas ${cls}`;
        const isToday = TODAY.includes(s);
        const active = isToday; // aktifkan hanya mapel hari ini
        const existing = await pool.query(`SELECT id FROM "Subject" WHERE slug=$1`, [slug]);
        let id;
        if (existing.rows.length) {
          id = existing.rows[0].id;
          await pool.query(
            `UPDATE "Subject" SET name=$2, "dayNumber"=$3, "order"=$4, "durationMinutes"=60,
               "isActive"=$5, token=$6 WHERE id=$1`,
            [id, fullName, day, order, active, isToday ? token : null]
          );
          idBySlug[slug] = id;
        } else {
          id = uuidv4();
          await pool.query(
            `INSERT INTO "Subject" (id,name,slug,"dayNumber","order","durationMinutes","isActive",token,"createdAt")
             VALUES ($1,$2,$3,$4,$5,60,$6,$7, now())`,
            [id, fullName, slug, day, order, active, isToday ? token : null]
          );
          idBySlug[slug] = id;
        }
      }
    }
    console.log(`Mapel dibuat: ${Object.keys(idBySlug).length} (11 kls5 + 11 kls6)`);

    // 2. Promote students class 5 -> 6
    const pr = await pool.query(`UPDATE "Student" SET class='6' WHERE class='5'`);
    console.log(`Promosi siswa 5->6: ${pr.rowCount} siswa`);

    // 3. Import today's question sets
    const sets = [
      ["k5-quran-hadis", "k5-quran-hadis.json"],
      ["k5-akidah-akhlak", "k5-akidah-akhlak.json"],
      ["k6-quran-hadis", "k6-quran-hadis.json"],
      ["k6-akidah-akhlak", "k6-akidah-akhlak.json"],
    ];
    for (const [slug, file] of sets) {
      const subjectId = idBySlug[slug];
      const qs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
      await pool.query(`DELETE FROM "Question" WHERE "subjectId"=$1`, [subjectId]);
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
      console.log(`Import ${slug}: ${qs.length} soal (PG ${pg}, essay ${qs.length - pg})`);
    }

    console.log("\n========================================");
    console.log("TOKEN HARI INI (bagikan ke kelas masing-masing):");
    console.log(`  KELAS 5 : ${tok5}`);
    console.log(`  KELAS 6 : ${tok6}`);
    console.log("Mapel aktif: Al-Qur'an Hadis + Akidah Akhlak (kedua kelas)");
    console.log("========================================");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
