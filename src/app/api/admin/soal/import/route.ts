import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

// ============================================================
// Tipe hasil parsing
// ============================================================
interface ParsedQuestion {
  number: number;
  type: "pg" | "essay";
  text: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string | null;
}

interface ParseResult {
  success: boolean;
  questions: ParsedQuestion[];
  total: number;
  pgCount: number;
  essayCount: number;
  errors: string[];
}

// ============================================================
// POST — Import soal dari file .docx / .pdf
// ============================================================
export async function POST(request: NextRequest) {
  try {
    // === Cek session admin ===
    const adminId = await getAdminSession();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // === Parse FormData ===
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const subjectId = formData.get("subjectId") as string | null;
    const confirm = formData.get("confirm") === "true";

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }
    if (!subjectId) {
      return NextResponse.json({ error: "Subject ID tidak ditemukan" }, { status: 400 });
    }

    // === Validasi subject ===
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });
    if (!subject) {
      return NextResponse.json({ error: "Mapel tidak ditemukan" }, { status: 404 });
    }

    // === Ekstrak teks dari file ===
    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText = "";

    if (fileName.endsWith(".docx")) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value;
      } catch (err) {
        return NextResponse.json(
          {
            error: "Gagal parsing file .docx. Pastikan file adalah dokumen Word yang valid.",
            detail: err instanceof Error ? err.message : String(err),
          },
          { status: 400 }
        );
      }
    } else if (fileName.endsWith(".pdf")) {
      try {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        rawText = result.text;
        await parser.destroy();
      } catch (err) {
        return NextResponse.json(
          {
            error: "Gagal parsing file PDF. Pastikan file PDF tidak rusak.",
            detail: err instanceof Error ? err.message : String(err),
          },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan .docx atau .pdf." },
        { status: 400 }
      );
    }

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        { error: "Tidak ada teks yang bisa diekstrak dari file." },
        { status: 400 }
      );
    }

    // === Parsing soal ===
    const parseResult = parseQuestions(rawText);

    if (parseResult.questions.length === 0) {
      return NextResponse.json(
        { error: "Tidak ditemukan soal dalam file. Periksa format penulisan soal." },
        { status: 400 }
      );
    }

    // === Jika confirm=true, simpan ke database ===
    if (confirm) {
      // Hapus soal lama untuk subject ini jika user setuju (opsional)
      // Tapi kita ga hapus, kita tambahkan aja dengan nomor setelah nomor terakhir
      const lastQuestion = await prisma.question.findFirst({
        where: { subjectId },
        orderBy: { number: "desc" },
        select: { number: true },
      });
      let startNumber = lastQuestion ? lastQuestion.number + 1 : 1;

      // Siapkan data untuk insert
      const questionData = parseResult.questions.map((q, idx) => ({
        subjectId,
        number: startNumber + idx,
        type: q.type,
        text: q.text,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
      }));

      // Insert batch
      await prisma.question.createMany({
        data: questionData,
      });

      return NextResponse.json({
        success: true,
        message: `Berhasil mengimpor ${questionData.length} soal ke ${subject.name}`,
        questions: parseResult.questions,
        total: questionData.length,
        pgCount: parseResult.pgCount,
        essayCount: parseResult.essayCount,
        saved: true,
      });
    }

    // === Preview ===
    return NextResponse.json({
      success: true,
      questions: parseResult.questions,
      total: parseResult.total,
      pgCount: parseResult.pgCount,
      essayCount: parseResult.essayCount,
      subjectName: subject.name,
      saved: false,
    });
  } catch (error) {
    console.error("[IMPORT SOAL ERROR]", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server saat memproses file.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// ============================================================
// FUNGSI PARSING SOAL
// ============================================================
function parseQuestions(text: string): ParseResult {
  const errors: string[] = [];
  const questions: ParsedQuestion[] = [];

  // Bersihkan teks: normalize line endings, hapus BOM
  let cleanText = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\uFEFF/g, "")
    .trim();

  // Split berdasarkan pola nomor soal: "1." atau "1)" di awal baris
  // Regex: cocokkan angka diikuti titik/paren di awal baris
  const questionBlocks = cleanText.split(/\n\s*(?=\d+\s*[.)]\s*)/g);

  // Filter blocks yang benar-benar diawali nomor
  const filteredBlocks = questionBlocks.filter((block) => {
    return /^\d+\s*[.)]/.test(block.trim());
  });

  if (filteredBlocks.length === 0) {
    // Coba split berdasarkan "Nomor" atau pola lain
    // Fallback: split by newline pairs
    return { success: false, questions: [], total: 0, pgCount: 0, essayCount: 0, errors: ["Tidak dapat mendeteksi pola soal"] };
  }

  for (const block of filteredBlocks) {
    try {
      const question = parseSingleQuestion(block);
      if (question) {
        questions.push(question);
      } else {
        errors.push(`Gagal parse block: ${block.substring(0, 80)}...`);
      }
    } catch (e) {
      errors.push(`Error parsing: ${block.substring(0, 80)}... - ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const pgCount = questions.filter((q) => q.type === "pg").length;
  const essayCount = questions.filter((q) => q.type === "essay").length;

  return {
    success: errors.length === 0,
    questions,
    total: questions.length,
    pgCount,
    essayCount,
    errors,
  };
}

function parseSingleQuestion(block: string): ParsedQuestion | null {
  // Hapus nomor soal di awal
  let text = block.trim().replace(/^\d+\s*[.)]\s*/, "").trim();

  if (!text) return null;

  // === Deteksi pilihan ganda: cari pola "A.", "B.", "C.", "D." ===
  // Cari semua opsi
  const optionRegex = /^([A-D])[.)\s]\s*/;

  // Split baris
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  // Cari baris yang dimulai dengan A. B. C. D.
  const optionLines: { label: string; text: string; lineIndex: number }[] = [];
  let soalTextLines: string[] = [];
  let keyLine: string | null = null;
  let keyAfterOptions: string | null = null;

  let foundOptions = false;
  let foundKey = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Deteksi kunci jawaban
    const keyMatch = trimmed.match(
      /^(?:Kunci|JAWABAN|KUNCI|Jawaban|kunci jawaban|Kunci Jawaban)\s*[:=]\s*([A-D])/i
    );
    if (keyMatch && !foundKey) {
      keyLine = keyMatch[1].toUpperCase();
      foundKey = true;
      // Hapus baris kunci dari teks soal
      continue;
    }

    // Cek apakah baris ini opsi A/B/C/D
    const optionCheck = trimmed.match(/^([A-D])\s*[.)]\s*/);
    if (optionCheck) {
      const label = optionCheck[1].toUpperCase();
      const content = trimmed.replace(/^[A-D]\s*[.)]\s*/, "").trim();
      optionLines.push({ label, text: content, lineIndex: i });
      foundOptions = true;
      continue;
    }

    // Sebelum opsi ditemukan, ini bagian dari teks soal
    if (!foundOptions) {
      soalTextLines.push(trimmed);
    }
    // Setelah opsi, abaikan (kemungkinan teks lain)
  }

  // Gabungkan teks soal
  let soalText = soalTextLines.join(" ").trim();
  if (!soalText) {
    // Fallback: ambil semua teks sebelum opsi
    soalText = text;
  }

  // === Jika ditemukan opsi A-D ===
  if (foundOptions && optionLines.length >= 2) {
    // Urutkan berdasarkan label
    const optionMap: Record<string, string | null> = {
      A: null,
      B: null,
      C: null,
      D: null,
    };
    for (const ol of optionLines) {
      optionMap[ol.label] = ol.text || null;
    }

    // Cari kunci dari baris setelah opsi (yg mungkin terlewat)
    if (!keyLine) {
      // Coba cari di seluruh block asli dengan regex lebih longgar
      const broadKeyMatch = block.match(
        /(?:Kunci|JAWABAN|KUNCI|Jawaban|kunci jawaban|Kunci Jawaban)\s*[:=]?\s*([A-D])/i
      );
      if (broadKeyMatch) {
        keyLine = broadKeyMatch[1].toUpperCase();
      }
    }

    return {
      number: 0, // akan diisi ulang
      type: "pg",
      text: soalText,
      optionA: optionMap["A"] || null,
      optionB: optionMap["B"] || null,
      optionC: optionMap["C"] || null,
      optionD: optionMap["D"] || null,
      correctAnswer: keyLine || null,
    };
  }

  // === Jika tidak ada opsi, anggap essay ===
  return {
    number: 0,
    type: "essay",
    text: text,
    optionA: null,
    optionB: null,
    optionC: null,
    optionD: null,
    correctAnswer: null,
  };
}
