import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const adminId = await getAdminSession();
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const subject = await prisma.subject.findUnique({
      where: { slug },
    });

    if (!subject) {
      return NextResponse.json({ error: "Mata pelajaran tidak ditemukan" }, { status: 404 });
    }

    // Ambil semua soal urut nomor
    const questions = await prisma.question.findMany({
      where: { subjectId: subject.id },
      orderBy: { number: "asc" },
    });

    // Ambil semua sesi completed
    const sessions = await prisma.examSession.findMany({
      where: {
        subjectId: subject.id,
        status: { in: ["completed", "auto_submit"] },
      },
      include: {
        student: true,
        answers: true,
      },
      orderBy: {
        student: { name: "asc" },
      },
    });

    // Hitung jumlah PG & Essay
    const pgQuestions = questions.filter((q) => q.type === "pg");
    const essayQuestions = questions.filter((q) => q.type === "essay");

    // --- Susun header ---
    const headers = [
      "No",
      "Nama",
      "No Peserta",
      "Kelas",
      "Waktu Mulai",
      "Waktu Selesai",
      "Skor PG",
      "Nilai PG %",
      "Nilai Essay",
      "Nilai Akhir",
    ];

    // Tambah header per soal
    questions.forEach((q) => {
      const label = q.type === "pg" ? `PG No.${q.number}` : `Essay No.${q.number}`;
      headers.push(label);
    });

    // --- Susun data baris ---
    const rows: (string | number | null)[][] = sessions.map((session, index) => {
      const answerMap = new Map(session.answers.map((a) => [a.questionId, a]));

      // Hitung nilai essay
      const essayAnswers = essayQuestions.map((q) => answerMap.get(q.id)).filter(Boolean);
      const gradedEssays = essayAnswers.filter((a) => a!.essayScore !== null);
      const avgEssay = gradedEssays.length > 0
        ? Math.round(gradedEssays.reduce((sum, a) => sum + (a!.essayScore || 0), 0) / gradedEssays.length)
        : null;
      const pgPct = pgQuestions.length > 0
        ? Math.round((session.scorePg / pgQuestions.length) * 100)
        : 0;
      const finalScore = avgEssay !== null && pgQuestions.length > 0
        ? Math.round((pgPct + avgEssay) / 2)
        : pgQuestions.length > 0 ? pgPct : null;

      const row: (string | number | null)[] = [
        index + 1,
        session.student.name,
        session.student.participantNumber,
        session.student.class,
        session.startTime
          ? new Date(session.startTime).toLocaleString("id-ID", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
        session.endTime
          ? new Date(session.endTime).toLocaleString("id-ID", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-",
        session.scorePg,
        pgPct,
        avgEssay,
        finalScore,
      ];

      questions.forEach((q) => {
        const answer = answerMap.get(q.id);
        if (q.type === "pg") {
          const studentAns = answer?.answer || "";
          const correctAns = q.correctAnswer || "";
          if (studentAns.toUpperCase() === correctAns.toUpperCase()) {
            row.push(studentAns.toUpperCase());
          } else if (studentAns) {
            row.push(`${studentAns.toUpperCase()} (Salah, kunci: ${correctAns})`);
          } else {
            row.push(`(Tidak dijawab, kunci: ${correctAns})`);
          }
        } else {
          // Essay — tampilkan cuplikan + nilai
          const essayAns = answer?.answer || "";
          const essayScore = answer?.essayScore;
          let cell = "";
          if (essayAns.length > 150) {
            cell = essayAns.substring(0, 150) + "...";
          } else {
            cell = essayAns || "(Tidak dijawab)";
          }
          if (essayScore !== null && essayScore !== undefined) {
            cell += ` [Nilai: ${essayScore}]`;
          }
          row.push(cell);
        }
      });

      return row;
    });

    // --- Buat workbook ---
    const wb = XLSX.utils.book_new();
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Atur lebar kolom
    ws["!cols"] = headers.map((_, i) => {
      if (i === 0) return { wch: 5 }; // No
      if (i === 1) return { wch: 35 }; // Nama
      if (i === 2) return { wch: 20 }; // No Peserta
      if (i === 3) return { wch: 8 }; // Kelas
      if (i === 4 || i === 5) return { wch: 18 }; // Waktu
      if (i === 6) return { wch: 10 }; // Skor PG
      if (i === 7) return { wch: 12 }; // Nilai PG %
      if (i === 8) return { wch: 12 }; // Nilai Essay
      if (i === 9) return { wch: 12 }; // Nilai Akhir
      return { wch: 22 }; // Kolom soal
    });

    XLSX.utils.book_append_sheet(wb, ws, "Hasil Ujian");

    // Generate buffer
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Nama file
    const filename = `Hasil_Ujian_${subject.name.replace(/\s+/g, "_")}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Error exporting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
