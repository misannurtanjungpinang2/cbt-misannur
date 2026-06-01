// Parse SOAL UJIAN KELAS 5 AKIDAH AKHLAK.docx → JSON
const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const DOCX_PATH = path.join(__dirname, "..", "..", "SOAL UJIAN", "SOAL UJIAN KELAS 5 AKIDAH AKHLAK.docx");
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "akidah-akhlak.json");

const PG_ANSWERS = [
  null, // 0-indexed dummy
  "B", "C", "B", "C", "C", "B", "C", "B", "D", "B",
  "C", "B", "B", "C", "B", "B", "A", "C", "B", "A",
  "B", "C", "B", "B", "C", "A", "B", "C", "B", "C",
];

const ESSAY_ANSWERS = [
  null,
  "Tarji'",
  "Kembali",
  "Menghidupkan",
  "Al-Ba'its",
  "Tetangga",
  "Adab/Etika",
  "Disiplin",
  "Mandiri",
  "Musa a.s.",
  "Ular (atau membelah lautan)",
];

async function main() {
  const result = await mammoth.extractRawText({ path: DOCX_PATH });
  const text = result.value;

  // Split by newlines, clean up
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const questions = [];
  let inEssay = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect essay section
    if (/^Jawablah\s+soal\s+isian/i.test(line)) {
      inEssay = true;
      continue;
    }
    if (/^Kunci\s+Jawaban/i.test(line)) break;

    // Try to match PG question: "1. text..."
    const pgMatch = line.match(/^(\d{1,2})\.\s+(.+)/);
    if (pgMatch && !inEssay) {
      const num = parseInt(pgMatch[1]);
      const questionText = pgMatch[2];

      // Collect options (next 4 lines starting with a./b./c./d.)
      const options = [];
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const optMatch = lines[j].match(/^([a-d])\.\s+(.+)/i);
        if (optMatch) {
          options.push({ letter: optMatch[1].toUpperCase(), text: optMatch[2] });
        } else {
          break;
        }
      }

      if (options.length === 4) {
        questions.push({
          number: num,
          type: "pg",
          text: questionText,
          optionA: options[0].text,
          optionB: options[1].text,
          optionC: options[2].text,
          optionD: options[3].text,
          correctAnswer: PG_ANSWERS[num] || null,
        });
        i += 4; // skip the 4 option lines
      }
      continue;
    }

    // Try to match essay question: "1. text..." (in essay section)
    const essayMatch = line.match(/^(\d{1,2})\.\s+(.+)/);
    if (essayMatch && inEssay) {
      const num = parseInt(essayMatch[1]);
      questions.push({
        number: num + 30, // Essay numbers start after PG
        type: "essay",
        text: essayMatch[2],
        optionA: null,
        optionB: null,
        optionC: null,
        optionD: null,
        correctAnswer: ESSAY_ANSWERS[num] || null,
      });
    }
  }

  // Sort by number
  questions.sort((a, b) => a.number - b.number);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(questions, null, 2), "utf-8");
  console.log(`✅ Parsed ${questions.length} questions (${questions.filter(q => q.type === 'pg').length} PG, ${questions.filter(q => q.type === 'essay').length} Essay)`);
  console.log(`📁 Saved to ${OUTPUT_PATH}`);
}

main().catch(console.error);
