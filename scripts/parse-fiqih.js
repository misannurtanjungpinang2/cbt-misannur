const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const DOCX_PATH = path.join(__dirname, "..", "..", "SOAL UJIAN", "SOAL UJIAN FIQIH  KELAS 5 SEMESTER GENAP...docx");
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "fikih.json");

const PG_ANSWERS = [
  null,
  "A", "D", "A", "C", "D", "B", "A", "C", "C", "A",
  "A", "B", "C", "C", "B", "B", "A", "C", "B", "A",
  "C", "D", "C", "D", "C", "C", "C", "A", "B", "C",
];

async function main() {
  const result = await mammoth.extractRawText({ path: DOCX_PATH });
  const text = result.value;

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const questions = [];
  let inEssay = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^isilah\s+titik/i.test(line)) {
      inEssay = true;
      continue;
    }
    if (/^Kunci\s+Jawaban/i.test(line)) break;

    const match = line.match(/^(\d{1,2})\.\s+(.+)/);
    if (match && !inEssay) {
      const num = parseInt(match[1]);
      if (num < 1 || num > 30) continue;

      const questionText = match[2];

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
        const q = {
          number: num,
          type: "pg",
          text: questionText,
          optionA: options.find((o) => o.letter === "A")?.text || null,
          optionB: options.find((o) => o.letter === "B")?.text || null,
          optionC: options.find((o) => o.letter === "C")?.text || null,
          optionD: options.find((o) => o.letter === "D")?.text || null,
          correctAnswer: PG_ANSWERS[num] || null,
        };
        questions.push(q);
        i += options.length;
      }
      continue;
    }

    if (inEssay && line.length > 10 && !line.startsWith("Kunci")) {
      questions.push({
        number: 30 + (questions.filter((q) => q.type === "essay").length) + 1,
        type: "essay",
        text: line.replace(/…+$/, "").trim(),
        optionA: null,
        optionB: null,
        optionC: null,
        optionD: null,
        correctAnswer: null,
      });
    }
  }

  questions.sort((a, b) => a.number - b.number);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(questions, null, 2), "utf-8");
  console.log(`✅ Parsed ${questions.length} questions (${questions.filter(q => q.type === 'pg').length} PG, ${questions.filter(q => q.type === 'essay').length} Essay)`);
  console.log(`📁 Saved to ${OUTPUT_PATH}`);
}

main().catch(console.error);
