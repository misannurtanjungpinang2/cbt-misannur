#!/usr/bin/env python3
# Parser Bahasa Arab SAS Sem 1 2026/2027 — Kelas 6 (tabel 44x3 tak beraturan)
# 25 PG (koreksi Q11 & Q12) + 10 isian + 5 esai = 40
import docx, re, json, os

BASE = "/home/tiny/CBT Project MIS AN-NUR/SOAL UJIAN/SOAL Semester 1 TA 2026-2027"
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "new-s1")
os.makedirs(OUT, exist_ok=True)

def clean(s):
    return re.sub(r"\s+", " ", (s or "").replace("\xa0", " ")).strip()

def strip_label(s):
    return re.sub(r"^(?:[أبجدABCDabcd])\s*\.\s*", "", s).strip()

def parse_options(optlines):
    if len(optlines) == 1:
        parts = [strip_label(p) for p in optlines[0].split("\t") if p.strip()]
        if len(parts) >= 4:
            return {"A": parts[0], "B": parts[1], "C": parts[2], "D": parts[3]}
        return {}
    # 2 baris => kiri (A,C) dan kanan (B,D) posisi
    left = [strip_label(p) for p in optlines[0].split("\t") if p.strip()]
    right = [strip_label(p) for p in optlines[1].split("\t") if p.strip()]
    opts = {}
    if len(left) >= 1: opts["A"] = left[0]
    if len(left) >= 2: opts["C"] = left[1]
    if len(right) >= 1: opts["B"] = right[0]
    if len(right) >= 2: opts["D"] = right[1]
    return opts

def main():
    f = os.path.join(BASE, "Kelas 6/4. Bahasa Arab/ASAS GANJIL BAHASA ARAB TP 2026-2027.docx")
    d = docx.Document(f)
    t = d.tables[1]
    rows = [r.cells[0].text for r in t.rows]

    # --- PG: rows index 1..27 (R01..R27) ---
    pg_rows = rows[1:28]
    items = []
    i = 0
    while i < len(pg_rows):
        lines = [l for l in pg_rows[i].split("\n") if l.strip()]
        if not lines:
            i += 1
            continue
        q = clean(lines[0])
        optlines = lines[1:]
        if not optlines:
            # opsi ada di baris berikutnya
            j = i + 1
            while j < len(pg_rows):
                nxt = [l for l in pg_rows[j].split("\n") if l.strip()]
                if nxt:
                    optlines = nxt
                    i = j
                    break
                j += 1
        opts = parse_options(optlines)
        items.append({"q": q, "opts": opts})
        i += 1

    # Koreksi Q11 & Q12
    if len(items) >= 12:
        items[10] = {"q": "الْفِعْلُ الْمُضَارِعُ مِنْ غَسَلَ هُوَ ......",
                     "opts": {"A": "يَغْسِلُ", "B": "أَغْسِلُ", "C": "تَغْسِلُ", "D": "نَغْسِلُ"}}
        items[11] = {"q": "الْفِعْلُ الْأَمْرُ مِنْ نَظَّفَ لِضَمِيرِ أَنْتَ هُوَ ......",
                     "opts": {"A": "نَظِّفْ", "B": "يُنَظِّفُ", "C": "نَظَّفَ", "D": "تَتَنَظَّفُ"}}

    # Kunci PG (Q1..Q25) — Q11=A, Q12=A (versi perbaikan)
    keys = ["C","A","B","C","A","B","B","D","A","A","A","A","A","B","B",
            "B","D","B","B","A","A","C","B","B","D"]

    out = []
    for idx, it in enumerate(items[:25]):
        n = idx + 1
        o = it["opts"]
        out.append({
            "number": n, "type": "pg", "text": it["q"],
            "optionA": o.get("A"), "optionB": o.get("B"),
            "optionC": o.get("C"), "optionD": o.get("D"),
            "correctAnswer": keys[idx] if idx < len(keys) else None,
        })

    # --- Isian: R29..R37 (index 29..37) flatten ---
    isian = []
    for r in rows[29:38]:
        for ln in r.split("\n"):
            if ln.strip():
                isian.append(clean(ln))
    # --- Esai: R39..R43 (index 39..43) tiap baris = 1 soal ---
    essay = []
    for r in rows[39:44]:
        txt = clean(" ".join([l for l in r.split("\n") if l.strip()]))
        if txt:
            essay.append(txt)

    n = len(out)
    for ttext in isian:
        n += 1
        out.append({"number": n, "type": "essay", "text": ttext,
                    "optionA": None, "optionB": None, "optionC": None, "optionD": None,
                    "correctAnswer": None})
    for ttext in essay:
        n += 1
        out.append({"number": n, "type": "essay", "text": ttext,
                    "optionA": None, "optionB": None, "optionC": None, "optionD": None,
                    "correctAnswer": None})

    pg = [q for q in out if q["type"] == "pg"]
    mk = sum(1 for q in pg if q["correctAnswer"])
    print(f"k6-bahasa-arab: PG={len(pg)} (kunci={mk}), Isian={len(isian)}, Essay={len(essay)}, Total={len(out)}")
    bad = [q["number"] for q in pg if not all(q.get(k) for k in ("optionA","optionB","optionC","optionD"))]
    nokey = [q["number"] for q in pg if not q.get("correctAnswer")]
    if bad: print("  ⚠️ opsi tidak lengkap:", bad)
    if nokey: print("  ⚠️ tanpa kunci:", nokey)

    json.dump(out, open(os.path.join(OUT, "k6-bahasa-arab.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    print("\n-- Preview PG (No | Kunci | A / B / C / D) --")
    for q in pg:
        print(f"  Q{q['number']} [{q['correctAnswer']}] A:{q['optionA']} | B:{q['optionB']} | C:{q['optionC']} | D:{q['optionD']}")
    print("\n-- Isian (26-35) --")
    for q in out[25:35]:
        print("  ", q["number"], q["text"][:70])
    print("-- Esai (36-40) --")
    for q in out[35:40]:
        print("  ", q["number"], q["text"][:70])

if __name__ == "__main__":
    main()
