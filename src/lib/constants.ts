export const SUBJECTS = [
  { name: "Al-Quran Hadist", day: 1, order: 1 },
  { name: "Akidah Akhlak", day: 1, order: 2 },
  { name: "Fikih", day: 2, order: 1 },
  { name: "SKI", day: 2, order: 2 },
  { name: "Bahasa Arab", day: 3, order: 1 },
  { name: "Pendidikan Pancasila", day: 3, order: 2 },
  { name: "Bahasa Indonesia", day: 4, order: 1 },
  { name: "IPAS", day: 4, order: 2 },
  { name: "Matematika", day: 5, order: 1 },
  { name: "PJOK", day: 5, order: 2 },
  { name: "Bahasa Inggris", day: 6, order: 1 },
  { name: "Mulok", day: 6, order: 2 },
  { name: "SBDP", day: 7, order: 1 },
] as const;

export const MAPEL_LIST = [
  { name: "Al-Quran Hadist", slug: "quran-hadist" },
  { name: "Akidah Akhlak", slug: "akidah-akhlak" },
  { name: "Fikih", slug: "fikih" },
  { name: "SKI", slug: "ski" },
  { name: "Bahasa Arab", slug: "bahasa-arab" },
  { name: "Pendidikan Pancasila", slug: "pendidikan-pancasila" },
  { name: "Bahasa Indonesia", slug: "bahasa-indonesia" },
  { name: "IPAS", slug: "ipas" },
  { name: "Matematika", slug: "matematika" },
  { name: "PJOK", slug: "pjok" },
  { name: "Bahasa Inggris", slug: "bahasa-inggris" },
  { name: "Mulok", slug: "mulok" },
  { name: "SBDP", slug: "sbdp" },
] as const;

export const JADWAL_7_HARI = [
  { day: 1, subjects: ["quran-hadist", "akidah-akhlak"] },
  { day: 2, subjects: ["fikih", "ski"] },
  { day: 3, subjects: ["bahasa-arab", "pendidikan-pancasila"] },
  { day: 4, subjects: ["bahasa-indonesia", "ipas"] },
  { day: 5, subjects: ["matematika", "pjok"] },
  { day: 6, subjects: ["bahasa-inggris", "mulok"] },
  { day: 7, subjects: ["sbdp"] },
] as const;

export const DEFAULT_DURATION = 60; // menit
export const SISWA_SESSION_DURATION = 86400; // 24 jam (detik)
export const ADMIN_SESSION_DURATION = 28800; // 8 jam (detik)
export const TEACHER_SESSION_DURATION = 28800; // 8 jam (detik)

export const COOKIE_SISWA = "session_siswa";
export const COOKIE_ADMIN = "session_admin";
export const COOKIE_TEACHER = "session_teacher";

export const SISWA_PROTECTED_ROUTES = [
  "/mapel",
  "/ujian",
  "/selesai",
];

export const ADMIN_PROTECTED_ROUTES = [
  "/admin/dashboard",
  "/admin/atur",
  "/admin/soal",
  "/admin/hasil",
  "/admin/guru",
];

export const TEACHER_PROTECTED_ROUTES = [
  "/guru/dashboard",
  "/guru/subjek",
];

export const ADMIN_PASSWORD_HASH = "$2b$10$NTWQwWUvwkvJVSgidcdgz.1lfi5T2BHnieyB3vsfz1zRjemodWDcW"; // hash bcrypt dari "MISANNUR1234"
