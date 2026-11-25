#!/usr/bin/env python3
# Parser soal SAS Semester 1 TA 2026/2027 -> JSON
# 4 set: Kelas 5/6 x (Al-Qur'an Hadis, Akidah Akhlak)
import docx, re, json, os, sys
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph

BASE = "/home/tiny/CBT Project MIS AN-NUR/SOAL UJIAN/SOAL Semester 1 TA 2026-2027"
OUT  = os.path.join(os.path.dirname(__file__), "..", "src", "data", "new-s1")
os.makedirs(OUT, exist_ok=True)

def clean(s):
    return re.sub(r"[ \t]+", " ", (s or "").replace("\xa0", " ")).strip()

def has_hl(run):
    try:
        return run.font.highlight_color is not None
    except Exception:
        return False

def para_hl(p):
    return any(has_hl(r) for r in p.runs)

def blocks(path):
    d = docx.Document(path)
    out = []
    for ch in d.element.body.iterchildren():
        if ch.tag == qn("w:p"):
            t = clean(Paragraph(ch, d).text)
            if t:
                hl = para_hl(Paragraph(ch, d))
                out.append({"type": "P", "text": t, "hl": hl})
        elif ch.tag == qn("w:tbl"):
            tb = Table(ch, d)
            cells = []
            for row in tb.rows:
                rc = []
                for c in row.cells:
                    txt = clean(c.text)
                    hl = any(para_hl(p) for p in c.paragraphs)
                    rc.append({"text": txt, "hl": hl})
                cells.append(rc)
            out.append({"type": "T", "cells": cells})
    return out

def paras(path):
    return [clean(p.text) for p in docx.Document(path).paragraphs if clean(p.text)]

def split_inline_options(line):
    marks = list(re.finditer(r"(?:^|\s)([A-Da-d])\.\s*", line))
    res = []
    for k, m in enumerate(marks):
        s = m.end()
        e = marks[k + 1].start() if k + 1 < len(marks) else len(line)
        res.append((m.group(1).upper(), clean(line[s:e])))
    return res

def opt_letter(line):
    m = re.match(r"^([A-Da-d])\s*[.)]\s*", line)
    return (m.group(1).upper(), clean(line[m.end():])) if m else (None, line)

def cell_lines(cell):
    return [clean(x) for x in cell["text"].split("\n") if clean(x)]

# ---------- K5 QH ----------
def parse_k5_qh():
    f = os.path.join(BASE, "Kelas 5/1. Al Qur'an Hadis/Soal Ujian Quran Hadis Kelas 5.docx")
    ps = paras(f)
    i_pg = ps.index("A. PILIHAN GANDAL") if "A. PILIHAN GANDAL" in ps else next(i for i,p in enumerate(ps) if p.startswith("A. PILIHAN"))
    i_is = next(i for i,p in enumerate(ps) if p.startswith("B. ISIAN"))
    i_ur = next(i for i,p in enumerate(ps) if p.startswith("C. URAIAN"))
    i_ky = next(i for i,p in enumerate(ps) if p.startswith("KUNCI JAWABAN"))
    # PG — kumpulkan soal + baris opsi, lalu petakan posisi (A,K / B,D)
    qs = []
    cur = None
    for ln in ps[i_pg+1:i_is]:
        if re.match(r"^\d+\.", ln) and not re.match(r"^\d+\.\s*[A-D]\.", ln):
            if cur: qs.append(cur)
            m = re.match(r"^(\d+)\.\s*(.*)", ln)
            cur = {"num": int(m.group(1)), "text": clean(m.group(2)), "optlines": []}
        elif cur is not None:
            if re.search(r"(?:^|\s)[A-Da-d]\.", ln):
                cur["optlines"].append(ln)
            else:
                cur["text"] = clean(cur["text"] + " " + ln)
    if cur: qs.append(cur)
    for q in qs:
        ol = q["optlines"]; opts = {}
        if len(ol) == 2:
            for line, lL, rL in [(ol[0], "A", "C"), (ol[1], "B", "D")]:
                m = re.search(r"(?:^|\s)" + rL + r"\.\s*", line)
                if m:
                    left = line[:m.start()].strip(); right = line[m.end():].strip()
                else:
                    spl = split_inline_options(line)
                    left = spl[0][1] if spl else ""; right = spl[1][1] if len(spl) > 1 else ""
                left = re.sub(r"^[A-Da-d]\.\s*", "", left)
                opts[lL] = clean(left); opts[rL] = clean(right)
        else:
            for k, line in enumerate(ol):
                txt = re.sub(r"^[A-Da-d]\.\s*", "", line)
                if k < 4: opts[["A","B","C","D"][k]] = clean(txt)
        q["opts"] = opts
    # key from table 1 (1x7 cells "n. X")
    d = docx.Document(f)
    key = {}
    for t in d.tables:
        flat = "\n".join(c.text for r in t.rows for c in r.cells)
        for m in re.finditer(r"(\d{1,2})\s*\.\s*([A-D])\b", flat):
            key[int(m.group(1))] = m.group(2)
    out = []
    for q in qs:
        out.append({"number": q["num"], "type": "pg", "text": q["text"],
                    "optionA": q["opts"].get("A"), "optionB": q["opts"].get("B"),
                    "optionC": q["opts"].get("C"), "optionD": q["opts"].get("D"),
                    "correctAnswer": key.get(q["num"])})
    # isian (10) & uraian (5) numbered
    def grab(a, b):
        res = []
        for ln in ps[a+1:b]:
            m = re.match(r"^(\d+)\.\s*(.*)", ln)
            if m: res.append(clean(m.group(2)))
        return res
    isian = grab(i_is, i_ur)
    uraian = grab(i_ur, i_ky)
    return out, isian, uraian

# ---------- K6 QH ----------
def parse_k6_qh():
    f = os.path.join(BASE, "Kelas 6/1. Al Qur'an Hadis/2-Soal ASAS Ganjil QH 6 MI.docx")
    ps = paras(f)
    i_pg = next(i for i,p in enumerate(ps) if p.strip().upper() == "PILIHAN GANDA")
    i_is = next(i for i,p in enumerate(ps) if p.strip().upper() == "ISIAN SINGKAT")
    i_ur = next(i for i,p in enumerate(ps) if p.strip().upper() == "C. URAIAN")
    qs = []
    qbuf = []
    cur = {"opts": {}}
    active = False
    for ln in ps[i_pg+1:i_is]:
        L, txt = opt_letter(ln)
        if L in ("A",):
            if active and cur["opts"]:
                qs.append(cur)
            cur = {"text": clean(" ".join(qbuf)), "opts": {}}
            qbuf = []
            cur["opts"]["A"] = txt; active = True
        elif L in ("B", "C", "D") and active:
            cur["opts"][L] = txt
            if L == "D":
                qs.append(cur); cur = {"opts": {}}; active = False
        else:
            if not active and not ln.lower().startswith("pilihlah"):
                qbuf.append(ln)
    # isian: skip instruction line i_is+1
    isian = [ps[k] for k in range(i_is+2, i_ur)]
    uraian = [ps[k] for k in range(i_ur+2, len(ps))]
    # key from separate file
    kf = os.path.join(BASE, "Kelas 6/1. Al Qur'an Hadis/3-Kunci Jawaban dan Pembahasan.docx")
    kp = paras(kf)
    ans = []
    for p in kp:
        if p.upper().startswith(("A. PILIHAN", "B. ISIAN", "C. URAIAN")):
            continue
        m = re.match(r"^([A-D])\.\s", p)
        if m:
            ans.append(m.group(1))
    out = []
    for idx, q in enumerate(qs):
        o = q["opts"]
        out.append({"number": idx+1, "type": "pg", "text": q["text"],
                    "optionA": o.get("A"), "optionB": o.get("B"),
                    "optionC": o.get("C"), "optionD": o.get("D"),
                    "correctAnswer": ans[idx] if idx < len(ans) else None})
    return out, isian, uraian

# ---------- K5 Akidah ----------
def parse_k5_akidah():
    f = os.path.join(BASE, "Kelas 5/2. Akidah Akhlak/SOAL SAS AKIDAH AKHLAK KELAS 5 S1 TH 2026.docx")
    b = blocks(f)
    # find start after "BERILAH TANDA" and end at "A. ISIAN"
    i0 = next(i for i,x in enumerate(b) if x["type"]=="P" and "BERILAH TANDA" in x["text"].upper()) + 1
    i_is = next(i for i,x in enumerate(b) if x["type"]=="P" and x["text"].upper().strip() in ("A. ISIAN","ISIAN"))
    i_es = next(i for i,x in enumerate(b) if x["type"]=="P" and x["text"].upper().strip() in ("ESSAI","ESAI","B. ESSAI"))
    qs = []
    # first 25: P then T  (i0 .. i_is)
    i = i0
    while i < i_is:
        x = b[i]
        if x["type"]=="P":
            qtext = x["text"]
            # decide: table options (next is T) else 4 paragraph options
            if i+1 < i_is and b[i+1]["type"]=="T":
                cells = b[i+1]["cells"]
                # 1 row, 2 cols -> cell0 lines = A,B ; cell1 lines = C,D
                row = cells[0]
                linesL = cell_lines(row[0]); linesR = cell_lines(row[1]) if len(row)>1 else []
                opts = {}
                if len(linesL)>=1: opts["A"]=linesL[0]
                if len(linesL)>=2: opts["B"]=linesL[1]
                if len(linesR)>=1: opts["C"]=linesR[0]
                if len(linesR)>=2: opts["D"]=linesR[1]
                qs.append({"text": qtext, "opts": opts}); i += 2; continue
            else:
                # 4 paragraph options
                opts = {}
                j = i+1; L = ["A","B","C","D"]; k=0
                while j < i_is and k < 4:
                    Lx, txt = opt_letter(b[j]["text"])
                    opts[L[k]] = txt; k += 1; j += 1
                qs.append({"text": qtext, "opts": opts}); i = j; continue
        i += 1
    # key: last table + paragraphs 31..35
    d = docx.Document(f)
    key = {}
    kt = d.tables[-1]
    for r in kt.rows:
        cells = [c.text.strip() for c in r.cells]
        for i in range(0, len(cells) - 1, 2):
            nc = cells[i]; ac = cells[i+1]
            m = re.match(r"^(\d{1,2})$", nc)
            ma = re.search(r"([A-D])", ac)
            if m and ma:
                key[int(m.group(1))] = ma.group(1)
            for mm in re.finditer(r"(\d{1,2})\s*\.\s*([A-D])", ac):
                key[int(mm.group(1))] = mm.group(2)
    for x in b[i_is:i_es]:
        if x["type"]=="P":
            m = re.match(r"^(3[1-5])\s*[.)]\s*([A-D])\b", x["text"])
            if m: key[int(m.group(1))] = m.group(2)
    # also catch 31..35 in whole doc paragraphs (before single 'ISIAN' key section)
    for p in paras(f):
        m = re.match(r"^(3[1-5])\s*[.)]\s*([A-D])$", clean(p))
        if m: key[int(m.group(1))] = m.group(2)
    out = []
    for idx, q in enumerate(qs):
        n = idx+1; o = q["opts"]
        out.append({"number": n, "type": "pg", "text": q["text"],
                    "optionA": o.get("A"), "optionB": o.get("B"),
                    "optionC": o.get("C"), "optionD": o.get("D"),
                    "correctAnswer": key.get(n)})
    # isian blocks i_is+2 .. i_es ; essay i_es+1 .. until answer-key start
    isian = [b[k]["text"] for k in range(i_is+2, i_es) if b[k]["type"]=="P"]
    # essay: after i_es until block starting "Jawaban"/"Tahun"/"Jawab"
    essays = []
    for k in range(i_es+1, len(b)):
        t = b[k]["text"]
        if t.lower().startswith(("jawaban","tahun pelajaran","jawab")):
            break
        if b[k]["type"]=="P" and len(t) > 3:
            essays.append(t)
    return out, isian, essays

# ---------- K6 Akidah ----------
def parse_k6_blocks(path):
    b = blocks(path)
    # start after "Pilihlah salah satu jawaban"
    i0 = next(i for i,x in enumerate(b) if x["type"]=="P" and x["text"].lower().startswith("pilihlah")) + 1
    # end of PG: block starting "isilah titik"
    i_end = next(i for i,x in enumerate(b) if x["type"]=="P" and x["text"].lower().startswith("isilah"))
    qs = []
    qbuf = []
    i = i0
    def table_opts(cells):
        opts = {}
        for row in cells:
            for c in row:
                L, txt = opt_letter(c["text"])
                if L: opts[L] = {"text": txt, "hl": c["hl"]}
        return opts
    def para_opts(j):
        opts = {}; k = j
        while k < i_end and b[k]["type"]=="P":
            L, txt = opt_letter(b[k]["text"])
            if L and L not in opts:
                opts[L] = {"text": txt, "hl": b[k]["hl"]}; k += 1
                if len(opts)==4: break
            else:
                break
        return opts, k
    while i < i_end:
        x = b[i]
        if x["type"]=="T":
            opts = table_opts(x["cells"])
            qs.append({"text": clean(" ".join(qbuf)), "opts": opts}); qbuf = []; i += 1
        else:
            L, txt = opt_letter(x["text"])
            if L == "A":
                opts, j = para_opts(i)
                qs.append({"text": clean(" ".join(qbuf)), "opts": opts}); qbuf = []; i = j
            else:
                qbuf.append(x["text"]); i += 1
    return b, i_end, qs

def parse_k6_akidah():
    fs = os.path.join(BASE, "Kelas 6/2. Akidah Akhlak/SOAL AKIDAH KELAS 6.docx")
    fk = os.path.join(BASE, "Kelas 6/2. Akidah Akhlak/KUNCI JAWABAN AKIDAH KELAS 6.docx")
    bs, i_end, qs_s = parse_k6_blocks(fs)
    bk, _, qs_k = parse_k6_blocks(fk)
    out = []
    for idx, q in enumerate(qs_s):
        key = None
        if idx < len(qs_k):
            for L, info in qs_k[idx]["opts"].items():
                if info["hl"]:
                    key = L; break
        o = {L: v["text"] for L, v in q["opts"].items()}
        out.append({"number": idx+1, "type": "pg", "text": q["text"],
                    "optionA": o.get("A"), "optionB": o.get("B"),
                    "optionC": o.get("C"), "optionD": o.get("D"),
                    "correctAnswer": key})
    # isian: after instruction (i_end) until "Jawablah pertanyaan..."
    i_ur = next(i for i,x in enumerate(bs) if x["type"]=="P" and x["text"].lower().startswith("jawablah pertanyaan"))
    isian = [bs[k]["text"] for k in range(i_end+1, i_ur) if bs[k]["type"]=="P"]
    raw = [bs[k]["text"] for k in range(i_ur+1, len(bs)) if bs[k]["type"]=="P"]
    essays = []
    k = 0
    while k < len(raw):
        if raw[k].lower().startswith("perhatikan") and k+1 < len(raw):
            essays.append(raw[k] + " " + raw[k+1]); k += 2
        else:
            essays.append(raw[k]); k += 1
    return out, isian, essays

def finalize(pg, isian, essays, label):
    res = list(pg)
    n = len(pg)
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
    mk = sum(1 for q in pg if q.get("correctAnswer"))
    print(f"{label}: PG={len(pg)} (kunci={mk}), Isian={len(isian)}, Essay={len(essays)}, Total={len(res)}")
    # sanity: PG options complete
    bad = [q["number"] for q in pg if not all(q.get(k) for k in ("optionA","optionB","optionC","optionD"))]
    noKey = [q["number"] for q in pg if not q.get("correctAnswer")]
    if bad: print(f"   ⚠️ PG opsi tidak lengkap: {bad}")
    if noKey: print(f"   ⚠️ PG tanpa kunci: {noKey}")
    return res

def main():
    jobs = [
        ("k5-quran-hadis", parse_k5_qh),
        ("k5-akidah-akhlak", parse_k5_akidah),
        ("k6-quran-hadis", parse_k6_qh),
        ("k6-akidah-akhlak", parse_k6_akidah),
    ]
    for slug, fn in jobs:
        pg, isian, essays = fn()
        res = finalize(pg, isian, essays, slug)
        with open(os.path.join(OUT, slug + ".json"), "w", encoding="utf-8") as fh:
            json.dump(res, fh, ensure_ascii=False, indent=1)
        # show 2 PG + key sample
        for q in res[:2]:
            print("    Q", q["number"], q["text"][:55], "|", q["optionA"], "/", q["optionB"], "/", q["optionC"], "/", q["optionD"], "->", q["correctAnswer"])
    print("Output:", os.path.abspath(OUT))

if __name__ == "__main__":
    main()
