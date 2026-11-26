#!/usr/bin/env python3
# Parser Bahasa Arab SAS Semester 1 TA 2026/2027 — Kelas 5 (25 PG + isian + esai)
import docx, re, json, os

BASE = "/home/tiny/CBT Project MIS AN-NUR/SOAL UJIAN/SOAL Semester 1 TA 2026-2027"
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "new-s1")
os.makedirs(OUT, exist_ok=True)

def clean(s):
    return re.sub(r"[ \t]+", " ", (s or "").replace("\xa0", " ")).strip()

def paras(f):
    return [clean(p.text) for p in docx.Document(f).paragraphs if clean(p.text)]

def parse_k5():
    f = os.path.join(BASE, "Kelas 5/4. Bahasa Arab/SOAL SAS KELAS V MIS_.docx")
    ps = paras(f)
    i_instr = next(i for i, p in enumerate(ps) if p.startswith("A. Berilah tanda"))
    i_is = next(i for i, p in enumerate(ps) if p.startswith("B. Isilah"))
    i_es = next(i for i, p in enumerate(ps) if p.startswith("C. Jawablah"))
    i_key = next(i for i, p in enumerate(ps) if p.upper().startswith("KUNCI JAWABAN"))
    pg_lines = ps[i_instr + 1:i_is]
    # 5 baris per soal: 1 soal + 4 opsi
    qs = []
    for k in range(0, len(pg_lines) - 4, 5):
        block = pg_lines[k:k + 5]
        qs.append({
            "text": block[0],
            "A": block[1], "B": block[2], "C": block[3], "D": block[4],
        })
    # kunci PG: cari paragraf berisi "1. A ... 25. A"
    key = {}
    for p in ps[i_key:]:
        if "Pilihan Ganda" in p or re.search(r"\d+\.\s*[A-D]", p):
            for m in re.finditer(r"(\d{1,2})\s*\.\s*([A-D])\b", p):
                d = int(m.group(1))
                if 1 <= d <= 60:
                    key.setdefault(d, m.group(2))
    # isian: antara B dan C
    isian = [ps[i] for i in range(i_is + 1, i_es) if ps[i]]
    # essay: baris bernomor antara C dan KUNCI (lewati "Jawaban:")
    essay = []
    for i in range(i_es + 1, i_key):
        m = re.match(r"^(\d+)\.\s*(.*)", ps[i])
        if m:
            essay.append(clean(m.group(2)))
    return qs, isian, essay, key

def main():
    qs, isian, essay, key = parse_k5()
    out = []
    for idx, q in enumerate(qs):
        n = idx + 1
        out.append({
            "number": n, "type": "pg", "text": q["text"],
            "optionA": q["A"], "optionB": q["B"], "optionC": q["C"], "optionD": q["D"],
            "correctAnswer": key.get(n),
        })
    n = len(qs)
    for t in isian:
        n += 1
        out.append({"number": n, "type": "essay", "text": t,
                    "optionA": None, "optionB": None, "optionC": None, "optionD": None,
                    "correctAnswer": None})
    for t in essay:
        n += 1
        out.append({"number": n, "type": "essay", "text": t,
                    "optionA": None, "optionB": None, "optionC": None, "optionD": None,
                    "correctAnswer": None})

    mk = sum(1 for q in out if q["type"] == "pg" and q["correctAnswer"])
    print(f"k5-bahasa-arab: PG={len(qs)} (kunci={mk}), Isian={len(isian)}, Essay={len(essay)}, Total={len(out)}")
    bad = [q["number"] for q in out if q["type"] == "pg" and not all(q.get(k) for k in ("optionA","optionB","optionC","optionD"))]
    nokey = [q["number"] for q in out if q["type"] == "pg" and not q.get("correctAnswer")]
    if bad: print("  ⚠️ opsi tidak lengkap:", bad)
    if nokey: print("  ⚠️ tanpa kunci:", nokey)
    json.dump(out, open(os.path.join(OUT, "k5-bahasa-arab.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("\n-- preview Q1-3 --")
    for q in out[:3]:
        print(f"  Q{q['number']} {q['text'][:50]} | A:{q['optionA']} B:{q['optionB']} C:{q['optionC']} D:{q['optionD']} -> {q['correctAnswer']}")
    print("-- preview Q25 --")
    q = out[24]
    print(f"  Q{q['number']} {q['text'][:50]} | A:{q['optionA']} B:{q['optionB']} C:{q['optionC']} D:{q['optionD']} -> {q['correctAnswer']}")

if __name__ == "__main__":
    main()
