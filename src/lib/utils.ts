/**
 * Generate random alfanumerik token (huruf kapital + angka)
 * @param length Panjang token (default: 6)
 * @returns Token string
 */
export function generateToken(length: number = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}

/**
 * Ubah nama mapel ke slug yang aman untuk URL
 * Contoh: "Al-Quran Hadist" → "al-quran-hadist"
 * @param name Nama mapel
 * @returns Slug string
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // hapus karakter non-alfanumerik kecuali spasi dan dash
    .replace(/\s+/g, "-") // ganti spasi dengan dash
    .replace(/-+/g, "-") // ganti multiple dash dengan single dash
    .replace(/^-|-$/g, ""); // hapus dash di awal/akhir
}

/**
 * Hitung jumlah jawaban benar
 * @param answers Array jawaban siswa
 * @param keys Array kunci jawaban
 * @returns Jumlah benar
 */
export function calculateScore(
  answers: { answer: string; correctAnswer: string }[]
): number {
  if (!answers || answers.length === 0) return 0;
  return answers.filter(
    (a) =>
      a.answer &&
      a.correctAnswer &&
      a.answer.toUpperCase() === a.correctAnswer.toUpperCase()
  ).length;
}

/**
 * Hitung sisa waktu dalam detik
 * @param startTime Waktu mulai
 * @param durationMinutes Durasi dalam menit
 * @returns Sisa waktu dalam detik (0 jika sudah habis)
 */
export function calculateTimeRemaining(
  startTime: Date,
  durationMinutes: number
): number {
  const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
  const now = new Date();
  const remaining = Math.floor((endTime.getTime() - now.getTime()) / 1000);
  return Math.max(0, remaining);
}

/**
 * Format detik ke MM:DD atau HH:MM:SS
 * @param seconds Jumlah detik
 * @returns String terformat
 */
export function formatTime(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Format tanggal ke format Indonesia
 * Contoh: "1 Juni 2026"
 * @param date Date object
 * @returns String tanggal terformat
 */
export function formatDate(date: Date): string {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format jam ke format Indonesia
 * Contoh: "08:30"
 * @param date Date object
 * @returns String jam terformat
 */
export function formatTimeFromDate(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Mapping 13 mapel ke jadwal 7 hari
 * @returns Record mapel → { day, order }
 */
export function mapelOrder(): Record<string, { day: number; order: number }> {
  return {
    "quran-hadist": { day: 1, order: 1 },
    "akidah-akhlak": { day: 1, order: 2 },
    "fikih": { day: 2, order: 1 },
    "ski": { day: 2, order: 2 },
    "bahasa-arab": { day: 3, order: 1 },
    "pendidikan-pancasila": { day: 3, order: 2 },
    "bahasa-indonesia": { day: 4, order: 1 },
    "ipas": { day: 4, order: 2 },
    "matematika": { day: 5, order: 1 },
    "pjok": { day: 5, order: 2 },
    "bahasa-inggris": { day: 6, order: 1 },
    "mulok": { day: 6, order: 2 },
    "sbdp": { day: 7, order: 1 },
  };
}
