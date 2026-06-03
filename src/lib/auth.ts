import "server-only";

import { cookies } from "next/headers";
import prisma from "./prisma";
import {
  COOKIE_SISWA,
  COOKIE_ADMIN,
  COOKIE_TEACHER,
  SISWA_SESSION_DURATION,
  ADMIN_SESSION_DURATION,
  TEACHER_SESSION_DURATION,
} from "./constants";

// ============================================================
// Tipe Session
// ============================================================

export interface SiswaSessionData {
  studentId: string;
  name: string;
  participantNumber: string;
  class: string;
}

export interface AdminSessionData {
  adminId: string;
}

export interface TeacherSessionData {
  teacherId: string;
  name: string;
  username: string;
}

// ============================================================
// SISWA AUTH
// ============================================================

/**
 * Set cookie session siswa
 * Cookie: session_siswa = JSON.stringify({ studentId, name, participantNumber, class })
 * httpOnly, secure, sameSite=lax, maxAge=86400 (24 jam)
 */
export async function setSiswaSession(siswa: SiswaSessionData): Promise<void> {
  const cookieStore = await cookies();

  const cookieValue = JSON.stringify({
    studentId: siswa.studentId,
    name: siswa.name,
    participantNumber: siswa.participantNumber,
    class: siswa.class,
  });

  cookieStore.set(COOKIE_SISWA, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SISWA_SESSION_DURATION,
    path: "/",
  });
}

/**
 * Baca cookie session siswa
 * Parse JSON, return data siswa atau null jika tidak valid
 */
export async function getSiswaSession(): Promise<SiswaSessionData | null> {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(COOKIE_SISWA)?.value;

    if (!cookieValue) return null;

    const data = JSON.parse(cookieValue) as SiswaSessionData;

    // Validasi field yang diperlukan
    if (!data.studentId || !data.name) {
      return null;
    }

    return {
      studentId: data.studentId,
      name: data.name,
      participantNumber: data.participantNumber || "",
      class: data.class || "5",
    };
  } catch {
    // Parse error, cookie corrupted
    return null;
  }
}

/**
 * Hapus cookie session siswa
 */
export async function clearSiswaSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_SISWA);
}

// ============================================================
// ADMIN AUTH
// ============================================================

/**
 * Set cookie session admin
 * Cookie: session_admin = JSON.stringify({ adminId })
 * httpOnly, secure, sameSite=lax, maxAge=28800 (8 jam)
 */
export async function setAdminSession(adminId: string): Promise<void> {
  const cookieStore = await cookies();

  const cookieValue = JSON.stringify({ adminId });

  cookieStore.set(COOKIE_ADMIN, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_DURATION,
    path: "/",
  });
}

/**
 * Baca cookie session admin
 * @returns adminId atau null jika tidak valid
 */
export async function getAdminSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(COOKIE_ADMIN)?.value;

    if (!cookieValue) return null;

    const data = JSON.parse(cookieValue) as AdminSessionData;

    if (!data.adminId) return null;

    return data.adminId;
  } catch {
    // Parse error, cookie corrupted
    return null;
  }
}

/**
 * Hapus cookie session admin
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_ADMIN);
}

// ============================================================
// VALIDASI TOKEN
// ============================================================

/**
 * Validasi token siswa terhadap subject yang aktif hari ini
 * Cek apakah token cocok dengan subject mana pun yang aktif & di hari yang sesuai
 */
export async function validateToken(token: string): Promise<boolean> {
  if (!token || token.trim().length === 0) return false;

  const normalizedToken = token.trim().toUpperCase();

  try {
    // Cari subject yang memiliki token yang cocok
    const subject = await prisma.subject.findFirst({
      where: {
        token: normalizedToken,
        isActive: true,
      },
      select: { id: true },
    });

    return !!subject;
  } catch {
    return false;
  }
}

/**
 * Verifikasi password admin
 * @param password Plain text password
 * @returns true jika password cocok dengan hash di database
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!password) return false;

  try {
    const admin = await prisma.admin.findFirst({
      where: { username: "admin" },
      select: { passwordHash: true },
    });

    if (!admin) return false;

    const bcrypt = await import("bcryptjs");
    return bcrypt.compareSync(password, admin.passwordHash);
  } catch {
    return false;
  }
}

// ============================================================
// TEACHER AUTH
// ============================================================

export async function setTeacherSession(teacher: TeacherSessionData): Promise<void> {
  const cookieStore = await cookies();

  const cookieValue = JSON.stringify({
    teacherId: teacher.teacherId,
    name: teacher.name,
    username: teacher.username,
  });

  cookieStore.set(COOKIE_TEACHER, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TEACHER_SESSION_DURATION,
    path: "/",
  });
}

export async function getTeacherSession(): Promise<TeacherSessionData | null> {
  try {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(COOKIE_TEACHER)?.value;

    if (!cookieValue) return null;

    const data = JSON.parse(cookieValue) as TeacherSessionData;

    if (!data.teacherId || !data.name) {
      return null;
    }

    return {
      teacherId: data.teacherId,
      name: data.name,
      username: data.username || "",
    };
  } catch {
    return null;
  }
}

export async function clearTeacherSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_TEACHER);
}
