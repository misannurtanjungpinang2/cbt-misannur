const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const DOCX_PATH = path.join(__dirname, "..", "..", "SOAL UJIAN", "UAS S2_IPAS_V_TA 2025-2026.docx");
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "ipas.json");

const PG_ANSWERS = [
  null,
  "C", "D", "A", "C", "D", "A", "B", "A", "C", "C",
  "B", "B", "B", "B", "B", "A", "C", "B", "B", "B",
  "C", "A", "B", "B", "C", "B", "B", "B", "A", "B",
];

function parseQuestionLine(line, num) {
  // Match question text up to ellipsis/dots before a.
  const match = line.match(/^(.+?)[…\s]*\.{2,}/);
  if (!match) return null;

  const text = match[1].replace(/…+$/g, "").trim();

  // Everything after dots starts with 'a.'
  const rest = line.slice(match[0].length).trim();

  // Extract options a-d in order
  const regex = /([a-d])\.\s+(.*?)(?=[a-d]\.\s|$)/g;
  const opts = {};
  let m;
  while ((m = regex.exec(rest)) !== null) {
    opts[m[1]] = m[2].trim();
  }

  // Clean up option B for question 39 (has stray ")")
  if (opts.b) opts.b = opts.b.replace(/\)$/, "").trim();

  return {
    number: num,
    type: "pg",
    text,
    optionA: opts.a || null,
    optionB: opts.b || null,
    optionC: opts.c || null,
    optionD: opts.d || null,
    correctAnswer: PG_ANSWERS[num] || null,
  };
}

async function main() {
  const result = await mammoth.extractRawText({ path: DOCX_PATH });
  const lines = result.value.split("\n").map(l => l.trim()).filter(Boolean);

  const questions = [];
  let questionNum = 0;

  for (const line of lines) {
    // Skip header lines
    if (line.match(/^[A-Z\s:]{3,}$/) || line.includes("Pilihlah jawaban")) continue;

    // Only process lines that look like questions (contain dots then a.)
    if (!line.match(/\.{2,}.*a\.\s/)) continue;

    questionNum++;
    const q = parseQuestionLine(line, questionNum);
    if (q && q.optionA && q.optionB) {
      questions.push(q);
    }
  }

  questions.sort((a, b) => a.number - b.number);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(questions, null, 2), "utf-8");
  console.log(`✅ Parsed ${questions.length} questions (${questions.filter(q => q.type === 'pg').length} PG, ${questions.filter(q => q.type === 'essay').length} Essay)`);
  console.log(`📁 Saved to ${OUTPUT_PATH}`);

  // Print summary
  questions.forEach(q => {
    console.log(`  ${q.number}. ${q.text.substring(0, 50)}... [${q.correctAnswer}]`);
  });
}

main().catch(console.error);
