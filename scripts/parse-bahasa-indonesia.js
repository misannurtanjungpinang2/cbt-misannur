const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const DOCX_PATH = path.join(__dirname, "..", "..", "SOAL UJIAN", "UAS S2_B.Indonesia_V_TA 2025-2026.docx");
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "bahasa-indonesia.json");

async function main() {
  const result = await mammoth.extractRawText({ path: DOCX_PATH });
  const text = result.value;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Skip header lines until instruction line
  let i = 0;
  while (i < lines.length) {
    if (/^Pilihlah jawaban/i.test(lines[i])) { i++; break; }
    if (/^(YAYASAN|MADRASAH|Jl\.|Email|SOAL UJIAN|TAHUN|MATA PELAJARAN|KELAS|WAKTU|SOAL\s*:)/i.test(lines[i])) { i++; continue; }
    i++;
  }

  const questions = [];
  let num = 0;

  while (i < lines.length) {
    // Skip standalone instruction lines (they'll be captured as part of question text)
    if (/^Kunci Jawaban/i.test(lines[i])) { i++; continue; }

    // Find next Kunci Jawaban to mark end of block
    let kunciIdx = -1;
    for (let j = i; j < lines.length; j++) {
      if (/^Kunci Jawaban/i.test(lines[j])) {
        kunciIdx = j;
        break;
      }
    }
    if (kunciIdx === -1) break;

    const blockLines = lines.slice(i, kunciIdx);
    if (blockLines.length < 5) { i = kunciIdx + 1; continue; }

    // Last 4 lines = options, everything before = question text
    const options = blockLines.slice(-4);
    const questionLines = blockLines.slice(0, -4);

    const kunciMatch = lines[kunciIdx].match(/Kunci Jawaban\s*:?\s*([a-d])/i);
    if (!kunciMatch) { i = kunciIdx + 1; continue; }

    num++;
    questions.push({
      number: num,
      type: "pg",
      text: questionLines.join("\n"),
      optionA: options[0],
      optionB: options[1],
      optionC: options[2],
      optionD: options[3],
      correctAnswer: kunciMatch[1].toUpperCase(),
    });

    i = kunciIdx + 1;
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(questions, null, 2), "utf-8");
  console.log(`✅ Parsed ${questions.length} PG questions`);
  console.log(`📁 Saved to ${OUTPUT_PATH}`);
}

main().catch(console.error);
