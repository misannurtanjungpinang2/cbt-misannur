const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const DOCX_PATH = path.join(__dirname, "..", "..", "SOAL UJIAN", "UAS S2_Matematika_V_TA 2025-2026.docx");
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "matematika.json");
const IMG_BASE = "/gambar-matematika/";

// Soal nomor yang memiliki gambar
const SOAL_DENGAN_GAMBAR = new Set([10, 11, 12, 13, 22, 23, 24, 25]);

async function main() {
  const result = await mammoth.extractRawText({ path: DOCX_PATH });
  const text = result.value;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Skip header lines
  let i = 0;
  while (i < lines.length) {
    if (/^Pilihlah jawaban/i.test(lines[i])) { i++; break; }
    if (/^(YAYASAN|MADRASAH|Jl\.|Email|SOAL UJIAN|TAHUN|MATA PELAJARAN|KELAS|WAKTU|SOAL\s*:)/i.test(lines[i])) { i++; continue; }
    i++;
  }

  const questions = [];
  let num = 0;

  while (i < lines.length) {
    // Cari "Kunci Jawaban" untuk batas akhir blok
    let kunciIdx = -1;
    for (let j = i; j < lines.length; j++) {
      if (/^Kunci Jawaban/i.test(lines[j])) {
        kunciIdx = j;
        break;
      }
    }
    if (kunciIdx === -1) break;

    // Baris dari i sampai kunciIdx = 1 baris soal + 4 baris opsi
    const blockLines = lines.slice(i, kunciIdx);
    if (blockLines.length < 5) {
      i = kunciIdx + 1;
      continue;
    }

    // Baris pertama = teks soal, 4 baris berikutnya = opsi
    const questionText = blockLines[0];
    const options = blockLines.slice(1, 5);

    if (options.length < 4) {
      i = kunciIdx + 1;
      continue;
    }

    const kunciMatch = lines[kunciIdx].match(/Kunci Jawaban\s*:?\s*([a-d])/i);
    if (!kunciMatch) { i = kunciIdx + 1; continue; }

    num++;

    // Bersihkan teks soal: hapus "......" di akhir
    let cleanText = questionText.replace(/[\.\s]+$/, "").trim();

    // Sisipkan <img> jika soal memiliki gambar
    if (SOAL_DENGAN_GAMBAR.has(num)) {
      const imgFileName = `Gambar-soal-${num}.jpg`;
      const imgTag = `<div style="margin:10px 0;text-align:center"><img src="${IMG_BASE}${imgFileName}" alt="Gambar soal ${num}" style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1)" /></div>`;
      cleanText = cleanText + "<br/>" + imgTag;
    }

    questions.push({
      number: num,
      type: "pg",
      text: cleanText,
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

  // Informasi gambar
  const withImages = questions.filter((q) => SOAL_DENGAN_GAMBAR.has(q.number));
  console.log(`🖼️  ${withImages.length} soal dengan gambar: ${withImages.map((q) => q.number).join(", ")}`);
}

main().catch(console.error);
