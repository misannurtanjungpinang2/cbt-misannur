#!/usr/bin/env python3
# Parser Fikih SAS Semester 1 TA 2026/2027 (Kelas 5 & 6) -> JSON
import docx, re, json, os

BASE = "/home/tiny/CBT Project MIS AN-NUR/SOAL UJIAN/SOAL Semester 1 TA 2026-2027"
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "new-s1")
os.makedirs(OUT, exist_ok=True)

def clean(s):
    return re.sub(r"[ \t]+", " ", (s or "").replace("\xa0", " ")).strip()

def paras(f):
    return [clean(p.text) for p in docx.Document(f).paragraphs if clean(p.text)]

def parse_pg(region):
    qs = []
    cur = None
    for ln in region:
        if re.match(r"^\d+\.", ln) and not re.match(r"^\d+\.\s*[A-D]\.", ln):
            if cur:
                qs.append(cur)
            m = re.match(r"^(\d+)\.\s*(.*)", ln)
            cur = {"num": int(m.group(1)), "text": clean(m.group(2)), "opts": {}}
        elif re.match(r"^[A-D]\s*\.", ln) and cur is not None:
            L = ln[0]
            cur["opts"][L] = clean(re.sub(r"^[A-D]\s*\.\s*", "", ln))
        elif cur is not None and not cur["opts"]:
            cur["text"] = clean(cur["text"] + " " + ln)
    if cur:
        qs.append(cur)
    return qs

def key_from_regex(text):
    d = {}
    for m in re.finditer(r"(\d{1,2})\s*\.\s*([A-D])\b", text):
        d[int(m.group(1))] = m.group(2)
    return d

def parse_k5():
    f = os.path.join(BASE, "Kelas 5/3. Fiqih/Soal_Fikih_Kelas_5_Semester_1_Zakat_Infak_Sedekah format 1.docx")
    ps = paras(f)
    i_pg = next(i for i, p in enumerate(ps) if "SOAL PILIHAN GANDA" in p.upper())
    i_is = next(i for i, p in enumerate(ps) if "SOAL ISIAN SINGKAT" in p.upper())
    i_es = next(i for i, p in enumerate(ps) if "SOAL ESSAY" in p.upper())
    i_ky = next(i for i, p in enumerate(ps) if p.upper().startswith("KUNCI JAWABAN"))
    pg = parse_pg(ps[i_pg + 1:i_is])
    d = docx.Document(f)
    key = {}
    for t in d.tables:
        flat = "\n".join(c.text for r in t.rows for c in r.cells)
        kk = key_from_regex(flat)
        if len(kk) >= 30:
            key.update(kk)
    def numbered(a, b):
        out = []
        for ln in ps[a + 1:b]:
            m = re.match(r"^(\d+)\.\s*(.*)", ln)
            if m:
                out.append(clean(m.group(2)))
        return out
    isian = numbered(i_is, i_es)
    essay = numbered(i_es, i_ky)
    # Koreksi: Q3 "rukun Islam yang ke ..." jawabannya "Tiga" (B), file menulis C
    if key.get(3) == "C":
        key[3] = "B"
    return pg, isian, essay, key

def parse_k6():
    f = os.path.join(BASE, "Kelas 6/3. Fiqih/SOAL FIKIH KLS 6,GANJIL.docx")
    ps = paras(f)
    i_pg = next(i for i, p in enumerate(ps) if p.upper().startswith("I. JAWABLAH SOAL PILIHAN"))
    i_is = next(i for i, p in enumerate(ps) if p.upper().startswith("II. JAWABLAH SOAL ISIAN"))
    i_es = next(i for i, p in enumerate(ps) if p.upper().startswith("III. JAWABLAH SOAL ESSAY"))
    i_ky = next(i for i, p in enumerate(ps) if p.upper().startswith("I. KUNCI JAWABAN"))
    i_ky2 = next(i for i, p in enumerate(ps) if p.upper().startswith("II. KUNCI JAWABAN"))
    pg = parse_pg(ps[i_pg + 1:i_is])
    isian = [clean(p) for p in ps[i_is + 1:i_es] if p]
    essay = [clean(p) for p in ps[i_es + 1:i_ky] if p]
    key = {}
    for ln in ps[i_ky + 1:i_ky2]:
        m = re.match(r"^(\d+)\s*\.\s*([A-D])", ln)
        if m:
            key[int(m.group(1))] = m.group(2)
    return pg, isian, essay, key

def finalize(pg, isian, essays, key, label):
    res = []
    n = 0
    for q in pg:
        n += 1
        o = q["opts"]
        res.append({
            "number": q["num"], "type": "pg", "text": q["text"],
            "optionA": o.get("A"), "optionB": o.get("B"),
            "optionC": o.get("C"), "optionD": o.get("D"),
            "correctAnswer": key.get(q["num"]),
        })
    for t in isian:
        n += 1
        res.append({"number": n, "type": "essay", "text": t,
                    "optionA": None, "optionB": None, "optionC": None, "optionD": None,
                    "correctAnswer": None})
    for t in essays:
        n += 1
        res.append({"number": n, "type": "essay", "text": t,
                    "optionA": None, "optionB": None, "optionC": None, "optionD": None,
                    "correctAnswer": None})
    mk = sum(1 for q in pg if key.get(q["num"]))
    print(f"{label}: PG={len(pg)} (kunci={mk}), Isian={len(isian)}, Essay={len(essays)}, Total={len(res)}")
    bad = [q["num"] for q in pg if not all(q["opts"].get(k) for k in "ABCD")]
    nokey = [q["num"] for q in pg if not key.get(q["num"])]
    if bad: print("   ⚠️ opsi tidak lengkap:", bad)
    if nokey: print("   ⚠️ tanpa kunci:", nokey)
    return res

def main():
    pg, isian, essays, key = parse_k5()
    res = finalize(pg, isian, essays, key, "k5-fikih")
    json.dump(res, open(os.path.join(OUT, "k5-fikih.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    pg, isian, essays, key = parse_k6()
    res = finalize(pg, isian, essays, key, "k6-fikih")
    json.dump(res, open(os.path.join(OUT, "k6-fikih.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # preview
    for slug in ["k5-fikih", "k6-fikih"]:
        data = json.load(open(os.path.join(OUT, slug + ".json")))
        print(f"\n-- {slug} preview PG 1-3 --")
        for q in data[:3]:
            print(f"  Q{q['number']} {q['text'][:50]} | A:{q['optionA']} B:{q['optionB']} C:{q['optionC']} D:{q['optionD']} -> {q['correctAnswer']}")

if __name__ == "__main__":
    main()
