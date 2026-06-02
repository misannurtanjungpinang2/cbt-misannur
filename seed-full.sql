-- SEED DATABASE CBT MIS AN-NUR
-- Jalankan di Supabase SQL Editor
-- File ini create table + insert data sekaligus

-- ========================
-- CREATE TABLES
-- ========================

CREATE TABLE IF NOT EXISTS "Admin" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Subject" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  token TEXT,
  "durationMinutes" INTEGER NOT NULL DEFAULT 60,
  "dayNumber" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Question" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "subjectId" UUID NOT NULL REFERENCES "Subject"(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  "optionA" TEXT,
  "optionB" TEXT,
  "optionC" TEXT,
  "optionD" TEXT,
  "correctAnswer" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_question_subject ON "Question"("subjectId", number);

CREATE TABLE IF NOT EXISTS "Student" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "participantNumber" TEXT NOT NULL,
  class TEXT NOT NULL DEFAULT '5',
  "tokenUsed" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ExamSession" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "studentId" UUID NOT NULL REFERENCES "Student"(id) ON DELETE CASCADE,
  "subjectId" UUID NOT NULL REFERENCES "Subject"(id) ON DELETE CASCADE,
  "startTime" TIMESTAMP,
  "endTime" TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'in_progress',
  "scorePg" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exam_session ON "ExamSession"("studentId", "subjectId");

CREATE TABLE IF NOT EXISTS "Answer" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId" UUID NOT NULL REFERENCES "ExamSession"(id) ON DELETE CASCADE,
  "questionId" UUID NOT NULL REFERENCES "Question"(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  "isCorrect" BOOLEAN,
  flagged BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE("sessionId", "questionId")
);
CREATE INDEX IF NOT EXISTS idx_answer_session ON "Answer"("sessionId", "questionId");

-- SEED DATABASE CBT MIS AN-NUR
-- Jalankan di Supabase SQL Editor

-- 1. Admin
INSERT INTO "Admin" (id, username, "passwordHash", "createdAt") VALUES
  (gen_random_uuid(), 'admin', '$2b$10$mgxpbsenz78dnLlXcDZG5uUMWJDOkx7Rw1pog8K2xEj3dnFMADihK', now());

-- 2. Subjects (6 mapel)
INSERT INTO "Subject" (id, name, slug, token, "durationMinutes", "dayNumber", "isActive", "order", "createdAt") VALUES
  (gen_random_uuid(), 'Al-Quran Hadist', 'quran-hadist', NULL, 60, 1, true, 1, now()),
  (gen_random_uuid(), 'Akidah Akhlak', 'akidah-akhlak', NULL, 60, 1, true, 2, now()),
  (gen_random_uuid(), 'Fikih', 'fikih', NULL, 60, 2, true, 1, now()),
  (gen_random_uuid(), 'SKI', 'ski', NULL, 60, 2, true, 2, now()),
  (gen_random_uuid(), 'PJOK', 'pjok', NULL, 60, 5, true, 2, now()),
  (gen_random_uuid(), 'Bahasa Inggris', 'bahasa-inggris', NULL, 60, 6, true, 1, now());

-- 3. Soal Al-Quran Hadist (40 soal)
INSERT INTO "Question" (id, "subjectId", number, type, text, "optionA", "optionB", "optionC", "optionD", "correctAnswer", "createdAt") VALUES
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 1, 'pg', E'"Pencela" adalah arti dari nama surah ?', E'Al-Bayyinah', E'Al-Ma''un', E'Al-''Adiyat', E'Al-Humazah', 'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 2, 'pg', E'Manusia yang menolak untuk mensyukuri atas nikmat dan karunia Allah Swt. kepadanya disebut ?', E'Kufur nikmat', E'Ujub', E'Iri', E'Tamak', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 3, 'pg', E'Manusia yang memiliki derajat paling mulia di sisi Allah Swt. menurut Al-Qur''an yaitu ?', E'orang yang banyak hartanya', E'orang yang senantiasa bertakwa kepadanya', E'orang yang berposisi kuat dalam negara', E'orang yang senantiasa bertawakal kepadanya', 'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 4, 'pg', E'Lafal pertama surah Al-Humazah yaitu ?', E'قُلْ هُوَ اللَّهُ أَحَدٌ', E'وَيْلٌ لِكُلِّ هُمَزَةٍ لُمَزَةٍ', E'الْقَارِعَةُ', E'وَالْعَصْرِ', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 5, 'pg', E'Surah Al-Humazah terletak diantara surah ?', E'Al-Kausar dan Quraisy', E'Al-Lahab dan Al-Kafirun', E'Al-''Asr dan Al-Fil', E'An-nas dan Al-Ikhlas', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 6, 'pg', E'Bacalah ayat berikut ini! يَحْسَبُ أَنَّ مَالَهُ أَخْلَدَهُ Lafal yang bergaris bawah pada ayat di atas memiliki arti ?', E'Menyenangkanmu', E'Hartanya yang banyak', E'Mengekalkannya', E'Mengumpulkannya', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 7, 'pg', E'Ciri manusia yang bermewah-mewahan dan menimun harta lebih cenderung pada sifat ?', E'Bakhil', E'Royal', E'Adil', E'Hemat', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 8, 'pg', E'Asbabun nuzul surah al-Humazah yaitu ?', E'Karena ada tokoh dari kaum Quraisy yang kaya raya lalu menghina Rasul', E'Sahabat Rasulullah yang semula miskin lalu menjadi kaya karena doa Rasulullah', E'Kejadian sahabat Rasulullah berebut harta rampasan perang', E'Karena banyak orang Arab yang kaya harta benda', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 9, 'pg', E'Sifat tamak adalah salah satu sifat tercela dan juga sangat dibenci oleh Allah Swt. Tamak disebut juga dengan ?', E'Takabur', E'Sum''ah', E'Ghibah', E'Serakah', 'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 10, 'pg', E'Allah Swt. menurunkan surah al-Humazah untuk mengingatkan manusia berkaitan dengan ?', E'ketetapan hati Nabi Muhammad Saw. untuk tidak menghentikan dakwahnya', E'hinaan Abu Lahab atas dakwah secara terang-terangan yang disampaikan oleh Nabi Muhammad', E'kenikmatan yang telah banyak diterima oleh Nabi Muhammad Saw.', E'kekayaan yang dimiliki oleh ubay bin khalaf untuk menghina Nabi', 'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 11, 'pg', E'"Bukti yang nyata" adalah arti dari nama surah ?', E'Al-Fil', E'An-Naba', E'Serakah', E'Al-Bayyinah', 'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 12, 'pg', E'Lafal خَيْرُ الْبَرِيَّةِ dalam Surah Al-Bayyinah artinya ?', E'Sebaik-baik makhluk', E'Seburuk-buruk makhluk', E'Kejahatan manusia', E'Makhluk jahat', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 13, 'pg', E'Arti ayat berikut ini adalah ? فِيهَا كُتُبٌ قَيِّمَةٌ', E'Orang-orang yang didatangkan Al-Kitab', E'Dan yang demikian itulah agama yang lurus', E'Di dalamnya terdapat (isi) Kitab-Kitab yang lurus', E'Lembaran-lembaran disucikan (Al-Qur''an) yang lurus', 'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 14, 'pg', E'Salah satu surah dari golongan Madaniyyah adalah surah al-Bayyinah. Pengertian Madaniyyah, yaitu surah yang turun ?', E'Sebelum Rasulullah Saw. hijrah ke Madinah', E'Ketika Rasulullah Saw. hijrah ke Madinah', E'Akan Rasulullah Saw. hijrah ke Madinah', E'Setelah Rasulullah Saw. hijrah ke Madinah', 'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 15, 'pg', E'Cermatilah ayat berikut ini! Lafal tersebut memiliki arti ?', E'Dan supaya mereka menjadi orang-orang yang bertaqwa', E'Dan supaya mereka mendirikan salat dan mewakafkan harta benda', E'Dan supaya mereka mendirikan salat dan membayar fidiyah', E'Dan supaya mereka mendirika salat dan menunaikan zakat', 'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 16, 'pg', E'Arti waqaf menurut bahasa adalah ?', E'Berhenti', E'Diam', E'Menyambung', E'Membaca', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 17, 'pg', E'Menyambung dua ayat yang semestinya boleh berhenti disebut ?', E'Waqaf', E'Wasal', E'Wajib', E'Warak', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 18, 'pg', E'Tanda waqaf (صلى) pada ayat artinya ? اَلَمْ يَجِدْكَ يَتِيْمًا فَاٰوٰىۖ', E'Wajib waqaf', E'Wajib wasal', E'Boleh waqaf boleh wasal', E'Lebih baik waqaf', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 19, 'pg', E'Yang termasuk sebab-sebab mewaqafkan bacaan di bawah ini kecuali ?', E'Ketidaktahuan', E'Untuk menguji', E'Disengaja', E'Terpaksa', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 20, 'pg', E'Apabila menemui tanda waqaf لا maka artinya ?', E'Harus berhenti', E'Berhenti lebih baik', E'Tidak boleh berhenti', E'Boleh berhenti dan boleh terus', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 21, 'pg', E'Nabi Muhammad dijuluki Al Amin artinya ?', E'Dapat dipercaya', E'Dapat dibohongi', E'Ingkar janji', E'Berkhianat', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 22, 'pg', E'Perhatikan hadist di bawah ini ! عَنْ أَبِي هُرَيْرَةَ أَنَّ رَسُوْلَ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ قَالَ : أَيَةُ الْمُنَافِقِ ثَلَاثُ إِذَا حَدَّثَ كَذَبَ, وَإِذَا وَعَدَ أَخْلَفَ، وَإِذَا اؤْتُمِنَ خَانَ (رواه البخاري ومسلم) Artinya:Dari Abu Hurairah ra. bahwa Rasulullah saw. bersabda, "Tanda orang munafik ada tiga; apabila berkata ia dusta, apabila berjanji ia ingkar, dan apabila diberi amanat ia khianat". (HR. Bukhari Muslim) Hadist diatas merupakan hadist tentang ?', E'Orang munafik', E'Orang baik', E'Orang Pencela', E'Orang Jahat', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 23, 'pg', E'Lafal أَخْلَفَ artinya ?', E'Ingkar', E'Janji', E'Amanah', E'Khianat', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 24, 'pg', E'Salah satu ciri orang munafik adalah....', E'Jika dipercaya tidak menghirau-kan', E'Jika berbicara ia berdusta', E'Jika bersikap selalu keras', E'Jika diberi amanah menjalankan selalu', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 25, 'pg', E'Cermatilah pernyataan di bawah ini! (a) Ketika ia berjanji ia sering tidak menepati (b) Apabila ia berinfak tidak dikabarkan kepada orang lain (c) Apabila di beri amanah, ia berkhianat (d) Pada saat ia berkata ia sering berbohong (e) Apabila diberi uang saku maka digunakan untuk jajan di kantin Dari pernyataan di atas yang termasuk ciri-ciri orang munafik ditunjukkan pada huruf ?', E'(a) - (c) - (e)', E'(a) - (b) - (c)', E'(a) - (c) - (d)', E'(b) - (c) - (d)', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 26, 'essay', E'Arti surah Al-Humazah adalah ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 27, 'essay', E'Allah swt telah menyiapkan tempat bagi orang-orang yang memiliki perangai buruk. Orang yang tamak diancam Allah swt berupa ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 28, 'essay', E'Peristiwa yang menjadi latar belakang turunnya sebuah ayat atau surah disebut ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 29, 'essay', E'Surah Al-Bayyinah berjumlah berapa ayat ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 30, 'essay', E'Ada berapakah tanda wasal dan waqaf ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 31, 'essay', E'Sebutkan yang kamu ketahui tanda waqaf ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 32, 'essay', E'Orang yang munafik kalau berjanji selalu ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 33, 'essay', E'Waqaf jaiz dengan tanda huruf ج artinya ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 34, 'essay', E'Lawan kata dusta adalah?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 35, 'essay', E'Bermuka 2 sebutan bagi orang ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 36, 'essay', E'Bagaimana bunyi surah Al-Humazah ayat 1 ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 37, 'essay', E'Apa yang dimaksud dengan asbabun nuzul ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 38, 'essay', E'Apa yang di maksud waqaf ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 39, 'essay', E'Apa yang di maksud wasal ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='quran-hadist'), 40, 'essay', E'Sebutkan ciri - ciri orang munafik ?', E'', E'', E'', E'', NULL, now());

-- 3. Soal SKI (41 soal)
INSERT INTO "Question" (id, "subjectId", number, type, text, "optionA", "optionB", "optionC", "optionD", "correctAnswer", "createdAt") VALUES
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 1, 'pg', E'Peristiwa isra'' mi''raj oleh Rasulallah yang diluar akal sehat, namun Abu Bakar ra langsung mempercayainya tanpa banyak bertanya sehingga beliau diberi gelar ?', E'As Shiddiq', E'', E'Al-Faruq', E'Syaifullah', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 2, 'pg', E'Sahabat yang secara musyawarah terpilih menjadi khalifah pengganti Rasulallah adalah ?', E'Umar bin khattab ra', E'Zubair bin awwam ra', E'Zaid bin tsabit ra', E'Abu Bakar As-Shiddiq ra', 'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 3, 'pg', E'Salah satu budak yang dibebaskan oleh Abu Bakar as-Shiddiq ra adalah ?', E'Bilal bin Rabbah', E'Washi', E'Amr bin Lubay', E'Abu quhafah', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 4, 'pg', E'Nama lain dari Abu Bakar pada masa Jahiliyah yaitu ?', E'Abu ubaidillah', E'Abu lahab', E'Abdul Syuaib', E'Abdul Ka''bah', 'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 5, 'pg', E'Sahabat terdekat dan yang paling dicintai oleh Rasulullah saw adalah ?', E'Abu Bakar As-Shiddiq ra', E'Umar bin Khattab ra', E'Utsman bin Affan ra', E'Ali bin Abi Thalib ra', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 6, 'pg', E'Sikap Abu bakar terhadap kaum muslimin yang enggan membayar zakat adalah ?', E'Dinasehati, jika tetap tidak mau, maka diperangi', E'Lagsung dipenggal kepalanya', E'Cukup dinasehati', E'Dibiarkan saja', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 7, 'pg', E'Abu Bakar ra adalah mertua Nabi ,karena Rasulallah menikahi putrinya yang bernama ?', E'', E'Hafsah ra', E'Aisyah ra', E'Saudah ra.', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 8, 'pg', E'Perang antara kaum Muslimin dan Pasukan Romawi untuk membebaskan Syam disebut dengan ?', E'Perang Riddah', E'Perang Uhud', E'Perang Yarmuk', E'Perang Hunain', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 9, 'pg', E'Sifat-sifat abu bakar yang bisa kita jadikan tauladan adalah, kecuali ?', E'Mengorbankan harta dan jiwanya untuk agama Allah', E'Mencintai Rasulallah melebihi cintanya pada diri sendiri', E'Mencintai dirinya sendiri melebihi apapun', E'Bersahabat dengan manusia yang paling baik, yaitu Rasulallah', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 10, 'pg', E'Sahabat yang terketuk hatinya setelah mendengarkan bacaan Surah Taha lalu masuk Islam adalah ?', E'Abu Bakar Ash-Shidiq', E'Umar bin Khatab', E'Bilal bin Rabah', E'Khalid bin Walid', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 11, 'pg', E'Berikut ini adalah ciri dari gaya kepemimpinan amirul mukminin Umar bin Khattab ra adalah, kecuali ?', E'Sangat tegas dan tanpa kompromi', E'Berpegang teguh pada prinsip Islam', E'Sangat lembut dan takut kepada musuh', E'Meletakkan pemerintahan Islam dasar', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 12, 'pg', E'Ayah Umar bin Khattab adalah ?', E'Khattab Ar Riyad', E'Khattab bin Nufail', E'Khattab bin Maraf', E'Khattab bin Umair', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 13, 'pg', E'Umar bin Khattab memiliki julukan Al Faruq yang artinya', E'Pemberani', E'Angkuh', E'Dapat memisahkan kebenaran dan kebatilan', E'Tegas', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 14, 'pg', E'Yang membunuh khalifah Umar bin Khattab adalah ?', E'Abu Jahal', E'Abu Hurairah', E'Abu Lu''luah', E'Abu Darda', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 15, 'pg', E'Periode kekhalifahan Umar bin Khattab disebut ?', E'Khilfah Islamiyah', E'Futuhat Islamiyah', E'Daulah Islamiyah', E'Miftahul Islamiyah', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 16, 'pg', E'Cara Umar bin Khattab masuk Islam adalah ?', E'Karena mendengar bacaan Al Qur''an Surah Tahä', E'Karena melihat keuntungan ekonomi', E'Karena takut terhadap Abu Jahal', E'Karena takut kepada Nabi Muhammad saw.', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 17, 'pg', E'Sifat yang menonjol pada pribadi Usman bin Affan adalah ?', E'Pemberani', E'Sombong', E'Tegas', E'Dermawan', 'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 18, 'pg', E'Dua putri Rosulallah yang dinikahi Utsman bin Affan adalah ?', E'Fatimah dan Ummi Kulsum', E'Zainab dan Ruqayyah', E'Ummi Kulsum dan Ruqayah', E'Zainab dan Fatimah', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 19, 'pg', E'Ayah Usman bin Affan bernama ?', E'Affan bin Umayyah', E'Affan bin Qusyai', E'Affan bin Abu Al ''Ash', E'Affan bin Kilab', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 20, 'pg', E'Usman bin Affan sering dipanggil Abu Abdullah dan mendapatkan gelar ....', E'Syaifullah', E'Zun nurain walhijratain', E'Al Faruq', E'', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 21, 'pg', E'Sayyidina sebagai Dzun Nuraini, yang artinya ?', E'Dua Cahaya', E'Dua lampu', E'Dua Tanduk', E'Dua Matahari', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 22, 'pg', E'Tim pembukuan Al Qur''an diketuai oleh ?', E'Zaid bin Tsabit', E'Abdullah bin Zubair', E'Saad bin Al ''Ash', E'Abdurrahman bin Harits bin Hisyam', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 23, 'pg', E'Usman bin Affan berasal dari Bani ?', E'Hasyim', E'Adi', E'Umayyah', E'Hakam', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 24, 'pg', E'Ali bin Abi Thalib menjadi gelar Syaifullah yang artinya ?', E'Kekasih Allah swt.', E'Pedang Allah swt.', E'Singa Allah swt.', E'Allah swt. Mengasihinya', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 25, 'pg', E'Sayyidina Ali menikahi putri Rosulallah yang bernama ?', E'Zainab ra', E'Fatimah ra', E'Ummi Kulsum ra', E'Ruqayyah ra', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 26, 'pg', E'Pada saat Nabi Muhammad saw hijrah ke madinah, Ali Bin Abi Thalib menggantikan beliau di ?', E'Iman Masjid', E'Mengisi pengajian di masjid', E'Tempat tidurnya', E'Tempat sholatnya', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 27, 'essay', E'Abu bakar as shiddiq meninggal pada usia ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 28, 'essay', E'Orang-orang yang pertama kali masuk islam disebut ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 29, 'essay', E'Sahabat yang dimakamkan persis disamping rasulullah saw adalah ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 30, 'essay', E'Sahabat rasulullah saw. Yang diberi gelar Al Faruq adalah ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 31, 'essay', E'Masa kekhalifahan Umar bin Khattab berlangsung selama ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 32, 'essay', E'Umar bin Khattab adalah sahabat Nabi ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 33, 'essay', E'Usman bin Affan adalah khalifah keberapa?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 34, 'essay', E'Ayahanda Ali bin Abi Thalib bernama ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 35, 'essay', E'Sikap yang dimiliki oleh Ali Bin Abi Thalib adalah ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 36, 'essay', E'Ali bin Abi Thalib merupakan sepupu Nabi ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 37, 'essay', E'Sebutkan 4 sahabat rasulullah yang menjadi khalifah ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 38, 'essay', E'Sebutkan sifat yang dimiliki oleh Abu Bakar As shiddiq ra?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 39, 'essay', E'Apa kelebihan yang dimiliki Umar Bin Khattab?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 40, 'essay', E'Apa tujuan manusia diciptakan ?', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='ski'), 41, 'essay', E'Bagaimanakah sikap kamu ketika berbuat salah kepada oranglain ?', E'', E'', E'', E'', NULL, now());

-- 3. Soal PJOK (45 soal)
INSERT INTO "Question" (id, "subjectId", number, type, text, "optionA", "optionB", "optionC", "optionD", "correctAnswer", "createdAt") VALUES
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 1, 'pg', E'Gerakan dalam senam irama dilakukan sesuai dengan ....', E'aba-aba teman', E'irama musik', E'keinginan sendiri', E'warna pakaian', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 2, 'pg', E'Gerakan yang dilakukan pada gambar berikut adalah…', E'menarik lengan kebelakang', E'menekuk badan kedepan', E'meliukkan badan ke samping', E'memutar lengan', 'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 3, 'pg', E'Gerakan yang ditunjukan oleh gambar berikut ini adalah …', E'Mengayun lengan ke samping', E'Menekuk dan mengayun lengan', E'mengayun lengan ke atas dan bawah', E'mengayun lengan di atas kepala', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 4, 'pg', E'Langkah kaki dalam senam irama harus dilakukan secara ....', E'asal-asalan', E'tidak teratur', E'teratur', E'diam', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 5, 'pg', E'Gerakan pemanasan dilakukan agar tubuh terhindar dari ....', E'kesehatan', E'cedera', E'semangat', E'kebugaran', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 6, 'pg', E'Sikap badan saat melakukan gerak berirama harus ....', E'membungkuk', E'tegak', E'miring', E'duduk', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 7, 'pg', E'Gerak mengayun tangan mengikuti irama melatih ....', E'kelentukan', E'tidur', E'pendengaran', E'membaca', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 8, 'pg', E'Gerakan pendinginan dilakukan setelah olahraga agar ....', E'tubuh rileks', E'tubuh lelah', E'tubuh sakit', E'cepat haus', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 9, 'pg', E'Senam irama biasanya diiringi oleh ....', E'peluit', E'musik', E'drum saja', E'tepuk tangan', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 10, 'pg', E'Dalam senam irama diperlukan gerakan yang ....', E'kaku', E'lambat terus', E'indah dan teratur', E'sembarangan', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 11, 'pg', E'Gerak langkah rapat termasuk gerakan ....', E'tangan', E'kaki', E'kepala', E'bahu', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 12, 'pg', E'Sikap disiplin saat senam ditunjukkan dengan ....', E'bercanda saat latihan', E'mengikuti instruksi guru', E'mengobrol sendiri', E'duduk di lapangan', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 13, 'pg', E'Sebelum berenang sebaiknya melakukan ....', E'pendinginan', E'pemanasan', E'makan besar', E'tidur', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 14, 'pg', E'Tujuan pemanasan sebelum berenang adalah ....', E'membuat tubuh lelah', E'menghindari cedera', E'membuat haus', E'membuat mengantuk', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 15, 'pg', E'Gaya renang yang gerakannya seperti katak adalah gaya ....', E'bebas', E'dada', E'kupu-kupu', E'punggung', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 16, 'pg', E'Alat bantu yang digunakan saat belajar berenang adalah ....', E'raket', E'pelampung', E'tongkat', E'Net', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 17, 'pg', E'Berenang dapat melatih kekuatan ....', E'jari', E'paru-paru', E'rambut', E'kuku', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 18, 'pg', E'Saat berada di kolam renang kita harus ....', E'berlari-lari', E'mendorong teman', E'mematuhi aturan', E'bercanda berlebihan', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 19, 'pg', E'Air kolam renang yang sehat terlihat ....', E'hitam', E'keruh', E'jernih', E'berlumpur', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 20, 'pg', E'Gerakan kaki saat berenang dilakukan secara ....', E'asal', E'teratur', E'diam', E'kaku', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 21, 'pg', E'Setelah berenang sebaiknya tubuh segera ....', E'dibersihkan', E'dibiarkan basah', E'dijemur', E'tidur', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 22, 'pg', E'Manfaat berenang bagi tubuh adalah ....', E'membuat malas', E'menambah penyakit', E'menjaga kebugaran', E'membuat lemah', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 23, 'pg', E'Bagian tubuh yang digunakan untuk mengapung adalah ....', E'seluruh tubuh', E'kaki saja', E'tangan saja', E'kepala saja', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 24, 'pg', E'Sikap yang benar di kolam renang adalah ....', E'tertib dan hati-hati', E'saling mendorong', E'berteriak keras', E'bercanda berlebihan', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 25, 'pg', E'Kebugaran jasmani adalah kemampuan tubuh untuk ....', E'tidur sepanjang hari', E'melakukan aktivitas tanpa cepat lelah', E'bermain terus', E'bermalas-malasan', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 26, 'pg', E'Contoh latihan kekuatan otot adalah ....', E'push up', E'membaca', E'tidur', E'menulis', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 27, 'pg', E'Sit up bermanfaat untuk melatih otot ....', E'tangan', E'perut', E'kaki', E'bahu', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 28, 'pg', E'Lari jarak pendek melatih ....', E'kecepatan', E'kelentukan', E'keseimbangan', E'kelincahan', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 29, 'pg', E'Peregangan sebelum olahraga disebut ....', E'pendinginan', E'pemanasan', E'permainan', E'perlombaan', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 30, 'pg', E'Pendinginan dilakukan untuk ....', E'menaikkan suhu tubuh', E'melemaskan otot', E'membuat tubuh sakit', E'membuat tubuh lelah', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 31, 'pg', E'Latihan yang dilakukan secara rutin membuat tubuh menjadi ....', E'sakit', E'lemah', E'bugar', E'malas', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 32, 'pg', E'Push up dilakukan dengan mengandalkan kekuatan otot ....', E'kaki', E'tangan', E'telinga', E'mata', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 33, 'pg', E'Olahraga sebaiknya dilakukan secara ....', E'teratur', E'sesuka hati', E'jarang', E'malas-malasan', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 34, 'pg', E'Makanan bergizi membantu tubuh menjadi ....', E'sehat', E'lemah', E'sakit', E'malas', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 35, 'pg', E'Istirahat yang cukup diperlukan agar tubuh ....', E'cepat sakit', E'tetap sehat', E'lemah', E'malas bergerak', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 36, 'pg', E'Berolahraga dengan rutin dapat meningkatkan…', E'penyakit', E'daya tahan tubuh', E'rasa malas', E'rasa kantuk', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 37, 'pg', E'Merokok dapat merusak organ…', E'paru-paru', E'mata', E'kuku', E'rambut', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 38, 'pg', E'Asap rokok sangat berbahaya bagi…', E'perokok saja', E'semua orang di sekitar', E'pedagang', E'guru', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 39, 'pg', E'Minuman keras dapat merusak ....', E'kesehatan tubuh', E'warna kulit', E'pakaian', E'buku', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 40, 'pg', E'Sikap yang benar jika diajak merokok adalah ....', E'mencoba', E'menerima', E'menolak', E'membiarkan', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 41, 'pg', E'Salah satu bahaya minuman keras adalah ....', E'tubuh sehat', E'hilang kesadaran', E'tubuh segar', E'tubuh kuat', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 42, 'pg', E'Hidup sehat dapat dilakukan dengan cara ....', E'merokok', E'minum minuman keras', E'rajin olahraga', E'begadang setiap malam', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 43, 'pg', E'Rokok mengandung zat berbahaya seperti ....', E'vitamin', E'nikotin', E'protein', E'kalsium', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 44, 'pg', E'Menghindari rokok dan minuman keras membuat tubuh menjadi ....', E'sehat', E'lemah', E'cepat sakit', E'malas', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='pjok'), 45, 'pg', E'Contoh perilaku hidup sehat adalah ....', E'makan bergizi dan olahraga', E'merokok setiap hari', E'tidur larut malam', E'minum minuman keras', 'A', now());

-- 3. Soal Bahasa Inggris (43 soal)
INSERT INTO "Question" (id, "subjectId", number, type, text, "optionA", "optionB", "optionC", "optionD", "correctAnswer", "createdAt") VALUES
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 1, 'pg', E'What part of the body is it...', E'it is nose', E'it is eye', E'is it head', E'it is arm', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 2, 'pg', E'What part of the boody is it...', E'it is leg', E'it is lip', E'it is head', E'it is arm', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 3, 'pg', E'We use our ... to write someting', E'mouth', E'hand', E'head', E'foot', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 4, 'pg', E'i can see with my ...', E'eye', E'hand', E'knee', E'finger', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 5, 'pg', E'Mr. Haris can lift 100kg. Mr Haris is ...', E'strong', E'weak', E'thick', E'thin', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 6, 'pg', E'Mr. Candrawinatha is often sick. He is ...', E'strong', E'weak', E'thick', E'thin', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 7, 'pg', E'Horse is ... than cheetah. Cheetah can ruun 100 mph', E'slower', E'tamer', E'wilder', E'faster', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 8, 'pg', E'Tina is ... Than Indra. Tina always gets the first rank', E'more beautiful', E'more handsome', E'cleverer', E'stupider', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 9, 'pg', E'Lina is 70kg. Haris is 65kg. Lina is ... than Haris', E'fatter', E'lighter', E'more ferocious', E'greedier', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 10, 'pg', E'Buffalo is ... than rabbit', E'bigger', E'smaller', E'larger', E'narrower', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 11, 'pg', E'I’m so impressed, your masterpiece is ... than mine', E'good', E'better', E'best', E'more good', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 12, 'pg', E'Nisa is 178cm. Nanik is 160cm. Nanik is ... than Nisa', E'shorter', E'taller', E'larger', E'narrower', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 13, 'pg', E'Let’s go to your home at first, it’s ... than the others', E'near', E'nearer', E'nearest', E'more near', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 14, 'pg', E'Girrafe is ... than rhino', E'shorter', E'taller', E'smaller', E'stronger', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 15, 'pg', E'My new homework is ... than the old one', E'easy', E'easier', E'easiest', E'more easy', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 16, 'pg', E'Ear is part our ...', E'mouth', E'head', E'back', E'finger', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 17, 'pg', E'My hair is covered by ...', E'arm', E'hair', E'elbow', E'teet', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 18, 'pg', E'Every hands have ... finger', E'ten', E'five', E'seven', E'one', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 19, 'pg', E'Whale is ... fish in the world', E'the biggest', E'the shortest', E'the largest', E'the narrowest', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 20, 'pg', E'snake is ... animal', E'the longest', E'the shortest', E'the thickest', E'the thinnest', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 21, 'pg', E'Where did the writer during the holiday...', E'beach', E'mountain', E'library', E'gallery', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 22, 'pg', E'What did the writer feel at that time...', E'happy', E'disappointed', E'dejected', E'sad', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 23, 'pg', E'What kind of food that the writer eats in the restaurant...', E'seafood', E'fried rice', E'fried chicken', E'noodle', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 24, 'pg', E'four days after sunday is ...', E'monday', E'wednesday', E'thursday', E'friday', 'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 25, 'pg', E'The day before monday is ...', E'sunday', E'tuesday', E'friday', E'Saturday', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 26, 'pg', E'This month is May. The next month is ...', E'april', E'june', E'february', E'july', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 27, 'pg', E'Between January and march is...', E'february', E'april', E'thursday', E'june', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 28, 'pg', E'November come before ...', E'december', E'october', E'january', E'august', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 29, 'pg', E'This month is july. The last month is ...', E'june', E'may', E'october', E'november', 'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 30, 'pg', E'Two days before sunday is ...', E'monday', E'friday', E'wednesday', E'tuesday', 'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 31, 'pg', E'Amin is ... student in the school', E'as active as', E'the same active', E'more active', E'the most active', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 32, 'pg', E'We use contact lenses for our ...', E'eyes', E'nose', E'mouth', E'teeth', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 33, 'pg', E'Its function is to ...', E'pump the blood', E'make us stronger', E'breathe', E'see something', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 34, 'essay', E'What thing the writer tells about', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 35, 'essay', E'How old is Nanda', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 36, 'essay', E'Is Nanda the writer older brother', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 37, 'essay', E'What is Nanda characteristic', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 38, 'essay', E'What is Nanda Hobby', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 39, 'essay', E'What is the color of the writer bag', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 40, 'essay', E'what is the bag made of', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 41, 'essay', E'How many parts does the writer bag have', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 42, 'essay', E'What is the function of the first part', E'', E'', E'', E'', NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='bahasa-inggris'), 43, 'essay', E'Does the writter often clean her bag', E'', E'', E'', E'', NULL, now());



-- 3. Soal Fikih (40 soal)
INSERT INTO "Question" (id, "subjectId", number, type, text, "optionA", "optionB", "optionC", "optionD", "correctAnswer", "createdAt") VALUES
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 1, E'pg', E'Umur minimal kambing yang diperbolehkan untuk diqurbankan adalah ... tahun.', E'2', E'3', E'4', E'5', E'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 2, E'pg', E'Menyembelih hewan qurban sebelum salat Idul Adha, maka ibadah qurbannya ...', E'dimaklumi', E'makruh', E'sah', E'tidak sah', E'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 3, E'pg', E'Al Udhiyah ialah memotong hewan qurban pada ....', E'hari raya haji', E'hari lahirnya seseorang', E'hari-hari perkawinan', E'hari raya Idul Fitri', E'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 4, E'pg', E'Tujuh orang dapat berqurban dengan ....', E'seekor kambing', E'seekor domba', E'seekor sapi', E'seekor ayam', E'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 5, E'pg', E'Berikut yang bukan termasuk wajib haji adalah ....', E'Sa’i', E'bermalam di Mina', E'bermalam di Muzdalifah', E'menghindari segala larangan di musim haji', E'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 6, E'pg', E'Wukuf di padang Arafah dikerjakan pada tanggal ... Zulhijjah.', E'10', E'9', E'11', E'13', E'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 7, E'pg', E'Memakai pakaian putih tidak berjahit ketika haji disebut dengan pakian ... bagi laki-laki', E'ihram', E'tahalul', E'wukuf', E'sa’i', E'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 8, E'pg', E'Mengerjakan haji secara bersama dengan umrah dinamakan ....', E'haji tamattu''', E'haji ifrad', E'haji qiran', E'haji mabrur', E'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 9, E'pg', E'Sa’i adalah berlari kecil dari shofa ke marwa sebanyak....', E'3 kali', E'5 kali', E'7 kali', E'10 kali', E'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 10, E'pg', E'Memakai parfum saat berihram hukumnya adalah ....', E'haram', E'wajib', E'sunnah', NULL, E'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 11, E'pg', E'Ayat Al-Qur’an yang menerangkan tentang hukum haji terdapat yaitu surah ....', E'Ali ''Imran ayat 97', E'Al Hajj ayat 29', E'Al Hajj ayat 27', E'Al Hajj ayat 97', E'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 12, E'pg', E'Di bawah ini yang disebut hari tasyrik adalah tanggal ....', E'13,14, dan 15 Zulhijjah', E'11,12, dan 13 Zulhijjah', E'11,12, dan 13 Syawal', E'11,12, dan 13 Zulkaidah', E'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 13, E'pg', E'Unta yang sah untuk qurban bila sudah berumur ... tahun.', E'dua', E'tiga', E'empat', E'lima', E'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 14, E'pg', E'Haji yang baik di mata Allah swt. adalah ....', E'haji wada''', E'haji qiran', E'haji mabrur', E'haji tamattu''', E'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 15, E'pg', E'Penyembelihan qurban dilaksanakan ... salat Idul Adha.', E'sebelum', E'sesudah', E'bersamaan', E'beriringan', E'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 16, E'pg', E'Daging qurban biasanya dibagikan dalam keadaan ....', E'sudah dimasak', E'belum dimasak', E'dibekukan', E'kering', E'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 17, E'pg', E'Hewan qurban disunnahkan untuk dipotong oleh ...', E'orang yang berqurban', E'tukang jagal', E'takmir masjid', E'imam/tokoh agama', E'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 18, E'pg', E'Orang yang melakukan qurban dalam Islam disebut dengan....', E'takmir masjid', E'musafir', E'sohibul qurban', E'muslim', E'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 19, E'pg', E'Hewan yang hendak diqurbankan hendaknya musinnah, arti musinnah adalah ....', E'dicabut giginya', E'berganti gigi', E'bergigi tajam', E'berbulu banyak', E'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 20, E'pg', E'Salat Idul Adha terdiri dari ... rakaat.', E'2', E'3', E'4', E'5', E'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 21, E'pg', E'Menjual daging qurban hukumnya ...', E'sah', E'mubah', E'haram', E'makruh', E'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 22, E'pg', E'Membaca salawat atas Nabi Muhammad saw. merupakan ... dalam menyembelih hewan qurban.', E'rukun', E'syarat', E'manfaat', E'sunnah', E'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 23, E'pg', E'Setelah wukuf di Arafah, jamaah haji menuju ... untuk bermalam.', E'Mina', E'Madinah', E'Muzdalifah', E'Mekah', E'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 24, E'pg', E'Ketika menyembelih binatang qurban, disunnahkan mengucapkan, kecuali....', E'takbir', E'basmalah', E'salawat nabi', E'Al-Qur''an', E'D', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 25, E'pg', E'Menutup kepala bagi laki-laki merupakan ... saat melaksanakan ibadah haji.', E'sunnah', E'wajib haji', E'larangan', E'syarat haji', E'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 26, E'pg', E'melakukan Tawaf saat baru datang di Mekkah disebut tawaf....', E'wada', E'ifadah', E'qudum', E'sunnah', E'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 27, E'pg', E'Di bawah ini yang merupakan perbedaan utama antara haji dan umrah adalah ....', E'ihram', E'tahalul', E'wukuf', E'sa''i', E'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 28, E'pg', E'Melempar jumrah menggunakan dengan...', E'kerikil', E'kayu', E'koin', E'emas', E'A', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 29, E'pg', E'Wukuf adalah bagian dari....', E'wajib haji', E'rukun haji', E'syarat sah haji', E'sunnah haji', E'B', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 30, E'pg', E'Awal waktu pelaksanaan ibadah haji adalah pada bulan ....', E'Syawal', E'Zulkaidah', E'Zulhijjah', E'semua benar', E'C', now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 31, E'essay', E'Hari raya qurban dilaksanakan pada tanggal…………………………………………...', NULL, NULL, NULL, NULL, NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 32, E'essay', E'Hokum qurban adalah…………………………………………………………………..', NULL, NULL, NULL, NULL, NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 33, E'essay', E'Sa’i dalam haji meneladani kisah dari………………………………………………….', NULL, NULL, NULL, NULL, NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 34, E'essay', E'Mencukur rambut dalam ibadah haji disebut…………………………………………..', NULL, NULL, NULL, NULL, NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 35, E'essay', E'Sebutkan 3 hikmah ibadah dari qurban', NULL, NULL, NULL, NULL, NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 36, E'essay', E'Apa yang dimaksud dengan haji………………………………………………………..', NULL, NULL, NULL, NULL, NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 37, E'essay', E'Jelaskan pengertian dari ibadah qurban………………………………………………...', NULL, NULL, NULL, NULL, NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 38, E'essay', E'Apa yang dimaksud dengan tawaf', NULL, NULL, NULL, NULL, NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 39, E'essay', E'Wukuf merupakan……………………………………………………………………….', NULL, NULL, NULL, NULL, NULL, now()),
  (gen_random_uuid(), (SELECT id FROM "Subject" WHERE slug='fikih'), 40, E'essay', E'Umrah dapat dikerjakan pada bulan…………………………………………………….', NULL, NULL, NULL, NULL, NULL, now());

