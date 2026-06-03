const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const DOCX_PATH = path.join(__dirname, "..", "..", "SOAL UJIAN", "kelas 5 B.Arab.docx");
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "bahasa-arab.json");

const PG_ANSWERS = [
  null,
  "B", "B", "C", "A", "C", "B", "A", "B", "C", "B",
  "B", "C", "C", "C", "C", "A", "B", "B", "B", "C",
  "C", "A", "B", "B", "B", "C", "A", "B", "B", "C",
  "A", "B", "C", "C", "A", "B", "C", "A", "B", "B",
];

const ESSAY_ANSWERS = [
  null,
  "اِثْنَانِ (Itsnaani)",
  "Itu (untuk perempuan)",
  "Perempuan",
  "أُمٌّ (Ummun)",
  "Kuning",
  "Meja / Kantor",
  "قَلَمٌ (Qalamun)",
  "Mata",
  "Selamat datang",
  "بَيْتٌ (Baitun)",
];

async function main() {
  const result = await mammoth.extractRawText({ path: DOCX_PATH });
  const text = result.value;

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const questions = [];
  let inEssay = false;
  let seenSix = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^II\.\s*Isilah\s+titik/i.test(line)) {
      inEssay = true;
      continue;
    }
    if (/^KUNCI\s+JAWABAN/i.test(line)) break;

    // PG questions
    const pgMatch = line.match(/^(\d{1,2})\.\s*(.+)/);
    if (pgMatch && !inEssay) {
      let num = parseInt(pgMatch[1]);

      // Handle duplicate #6 (second 6 should be 7)
      if (num === 6 && seenSix) num = 7;
      if (num === 6) seenSix = true;

      if (num < 1 || num > 40) continue;

      const questionText = pgMatch[2];

      const options = [];
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const optMatch = lines[j].match(/^([a-d])\.\s+(.+)/i);
        if (optMatch) {
          options.push({ letter: optMatch[1].toUpperCase(), text: optMatch[2] });
        } else {
          break;
        }
      }

      if (options.length >= 3) {
        questions.push({
          number: num,
          type: "pg",
          text: questionText,
          optionA: options.find((o) => o.letter === "A")?.text || null,
          optionB: options.find((o) => o.letter === "B")?.text || null,
          optionC: options.find((o) => o.letter === "C")?.text || null,
          optionD: options.find((o) => o.letter === "D")?.text || null,
          correctAnswer: PG_ANSWERS[num] || null,
        });
        i += options.length;
      }
      continue;
    }

    // Essay questions
    const essayMatch = line.match(/^(\d{1,2})\.\s*(.+)/);
    if (essayMatch && inEssay) {
      const num = parseInt(essayMatch[1]);
      if (num < 1 || num > 10) continue;

      questions.push({
        number: 40 + num,
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

  questions.sort((a, b) => a.number - b.number);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(questions, null, 2), "utf-8");
  console.log(`✅ Parsed ${questions.length} questions (${questions.filter(q => q.type === 'pg').length} PG, ${questions.filter(q => q.type === 'essay').length} Essay)`);
  console.log(`📁 Saved to ${OUTPUT_PATH}`);
}

main().catch(console.error);
