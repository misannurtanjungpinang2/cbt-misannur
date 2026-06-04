const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const DOCX_PATH = path.join(__dirname, "..", "..", "SOAL UJIAN", "SOAL UJIAN PKN  KELAS 5 SEMESTER GENAP...docx");
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "pendidikan-pancasila.json");

async function main() {
  const result = await mammoth.extractRawText({ path: DOCX_PATH });
  const text = result.value;

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const questions = [];
  let lastNum = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip Kunci Jawaban lines (will be handled when processing question)
    if (/^Kunci\s+[Jj]awaban/i.test(line)) { i++; continue; }
    // Skip header/doc info lines
    if (/^(YAYASAN|MADRASAH|Jl\.|Email|SOAL\s+UJIAN|TAHUN|MATA\s+PELAJARAN|KELAS|WAKTU|SOAL\s*:|Pilihlah)/i.test(line)) { i++; continue; }

    // Try standard format: "N. question text..."
    const qMatch = line.match(/^(\d{1,2})\.\s+(.+)/);
    
    let currentNum;
    let questionStartLine;

    if (qMatch) {
      currentNum = parseInt(qMatch[1]);
      if (currentNum < 1 || currentNum > 40) { i++; continue; }
      questionStartLine = qMatch[2];
      lastNum = currentNum;
    } else {
      // Try compressed format without number: "text....A. optB. optC. optD. opt"
      const compressedLineCheck = line.match(/^(.*?)(?:\.{3,})\s*A\.\s*(.+?)B\.\s*(.+?)C\.\s*(.+?)D\.\s*(.*?)$/i);
      if (compressedLineCheck && lastNum > 0 && lastNum < 40) {
        currentNum = lastNum + 1;
        if (currentNum > 40) { i++; continue; }

        let answer = null;
        for (let k = i + 1; k < Math.min(lines.length, i + 3); k++) {
          const ansMatch = lines[k].match(/Kunci\s+[Jj]awaban\s*:?\s*([a-d])/i);
          if (ansMatch) { answer = ansMatch[1].toUpperCase(); break; }
        }

        questions.push({
          number: currentNum,
          type: "pg",
          text: compressedLineCheck[1].trim(),
          optionA: compressedLineCheck[2].trim(),
          optionB: compressedLineCheck[3].trim(),
          optionC: compressedLineCheck[4].trim(),
          optionD: compressedLineCheck[5].trim(),
          correctAnswer: answer,
        });
        lastNum = currentNum;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    // Standard format: collect full question text until options
    let questionLines = [questionStartLine];
    let j = i + 1;
    let options = [];

    while (j < lines.length) {
      const l = lines[j];

      // Kunci Jawaban line
      if (/^Kunci\s+[Jj]awaban/i.test(l)) {
        j++;
        break;
      }

      // Option line
      const optMatch = l.match(/^([a-d])\.\s+(.+)/i);
      if (optMatch) {
        options.push({ letter: optMatch[1].toUpperCase(), text: optMatch[2] });
        if (options.length === 4) {
          j++;
          // Look for Kunci Jawaban after options
          if (j < lines.length && /^Kunci\s+[Jj]awaban/i.test(lines[j])) {
            j++;
          }
          break;
        }
      } else {
        questionLines.push(l);
      }
      j++;
    }

    if (options.length === 4) {
      let answer = null;
      for (let k = Math.max(0, j - 2); k < Math.min(lines.length, j + 1); k++) {
        const ansMatch = lines[k].match(/Kunci\s+[Jj]awaban\s*:?\s*([a-d])/i);
        if (ansMatch) { answer = ansMatch[1].toUpperCase(); break; }
      }

      questions.push({
        number: currentNum,
        type: "pg",
        text: questionLines.join("\n"),
        optionA: options[0].text,
        optionB: options[1].text,
        optionC: options[2].text,
        optionD: options[3].text,
        correctAnswer: answer,
      });
      i = j;
      continue;
    }

    i++;
  }

  questions.sort((a, b) => a.number - b.number);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(questions, null, 2), "utf-8");
  console.log(`✅ Parsed ${questions.length} questions (${questions.filter(q => q.type === 'pg').length} PG, ${questions.filter(q => q.type === 'essay').length} Essay)`);
  console.log(`📁 Saved to ${OUTPUT_PATH}`);
}

main().catch(console.error);
