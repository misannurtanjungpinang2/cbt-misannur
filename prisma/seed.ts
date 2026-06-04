// Seed script untuk CBT MIS An-Nur
// Membaca 4 file JSON dari src/data/ dan mengisi database

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

// Inisialisasi PrismaClient dengan adapter SQLite
// Path harus sama dengan DATABASE_URL di .env
const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// Path ke file JSON
const dataDir = path.join(__dirname, "..", "src", "data");

interface QuestionData {
  number: number;
  type: string;
  text: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string | null;
}

interface SubjectConfig {
  name: string;
  slug: string;
  dayNumber: number | null;
  order: number;
  file: string;
}

async function main() {
  console.log("🌱 Memulai seeding database...");

  // ============================================================
  // 1. Buat Admin default
  // ============================================================
  const adminPassword = "MISANNUR1234";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
    },
  });
  console.log(`✅ Admin: username="${admin.username}", password="${adminPassword}"`);

  // ============================================================
  // 2. Konfigurasi 8 Mapel
  // ============================================================
  const subjects: SubjectConfig[] = [
    {
      name: "Al-Quran Hadist",
      slug: "quran-hadist",
      dayNumber: 1,
      order: 1,
      file: "quran-hadist.json",
    },
    {
      name: "Akidah Akhlak",
      slug: "akidah-akhlak",
      dayNumber: 1,
      order: 2,
      file: "akidah-akhlak.json",
    },
    {
      name: "Fikih",
      slug: "fikih",
      dayNumber: 2,
      order: 1,
      file: "fikih.json",
    },
    {
      name: "SKI",
      slug: "ski",
      dayNumber: 2,
      order: 2,
      file: "ski.json",
    },
    {
      name: "PJOK",
      slug: "pjok",
      dayNumber: 5,
      order: 2,
      file: "pjok.json",
    },
    {
      name: "Bahasa Inggris",
      slug: "bahasa-inggris",
      dayNumber: 6,
      order: 1,
      file: "bahasa-inggris.json",
    },
    {
      name: "Bahasa Arab",
      slug: "bahasa-arab",
      dayNumber: 3,
      order: 1,
      file: "bahasa-arab.json",
    },
    {
      name: "Pendidikan Pancasila",
      slug: "pendidikan-pancasila",
      dayNumber: 3,
      order: 2,
      file: "pendidikan-pancasila.json",
    },
    {
      name: "Bahasa Indonesia",
      slug: "bahasa-indonesia",
      dayNumber: 4,
      order: 1,
      file: "bahasa-indonesia.json",
    },
  ];

  let totalQuestions = 0;

  for (const subjectConfig of subjects) {
    // Buat atau update subject (upsert)
    const existingSubject = await prisma.subject.findUnique({
      where: { slug: subjectConfig.slug },
    });

    const subject = existingSubject
      ? existingSubject
      : await prisma.subject.create({
          data: {
            name: subjectConfig.name,
            slug: subjectConfig.slug,
            dayNumber: subjectConfig.dayNumber,
            order: subjectConfig.order,
            durationMinutes: 60,
            isActive: false,
          },
        });
    console.log(`   Mapel: "${subject.name}" (${subject.slug})`);

    // Baca file JSON
    const filePath = path.join(dataDir, subjectConfig.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`   ⚠️  File tidak ditemukan: ${filePath}, skip`);
      continue;
    }

    const rawData = fs.readFileSync(filePath, "utf-8");
    const questions: QuestionData[] = JSON.parse(rawData);

    let insertedCount = 0;

    // Hapus soal lama untuk subject ini (kalau re-seed)
    await prisma.question.deleteMany({
      where: { subjectId: subject.id },
    });

    for (const q of questions) {
      await prisma.question.create({
        data: {
          subjectId: subject.id,
          number: q.number,
          type: q.type || "pg",
          text: q.text,
          optionA: q.optionA ?? null,
          optionB: q.optionB ?? null,
          optionC: q.optionC ?? null,
          optionD: q.optionD ?? null,
          correctAnswer: q.correctAnswer ?? null,
        },
      });
      insertedCount++;
    }

    console.log(`   → ${insertedCount} soal`);
    totalQuestions += insertedCount;
  }

  console.log("");
  console.log("═══════════════════════════════════════════");
  console.log(`✅ Seeding selesai!`);
  console.log(`   Admin  : 1 (admin / MISANNUR1234)`);
  console.log(`   Mapel  : ${subjects.length} (${subjects.map((s) => s.name).join(", ")})`);
  console.log(`   Soal   : ${totalQuestions}`);
  console.log("═══════════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
