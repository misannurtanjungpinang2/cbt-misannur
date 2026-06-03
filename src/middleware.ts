import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_SISWA,
  COOKIE_ADMIN,
  COOKIE_TEACHER,
  SISWA_PROTECTED_ROUTES,
  ADMIN_PROTECTED_ROUTES,
  TEACHER_PROTECTED_ROUTES,
} from "./lib/constants";

/**
 * Middleware untuk proteksi route berdasarkan session cookie
 *
 * Route dilindungi (wajib login):
 * - /mapel, /mapel/*         → harus ada session siswa
 * - /ujian/*                 → harus ada session siswa
 * - /selesai, /selesai/*     → harus ada session siswa
 * - /admin/dashboard/*       → harus ada session admin
 * - /admin/atur/*            → harus ada session admin
 * - /admin/soal/*            → harus ada session admin
 * - /admin/hasil/*           → harus ada session admin
 * - /admin/guru/*            → harus ada session admin
 * - /guru/dashboard/*        → harus ada session guru
 * - /guru/subjek/*           → harus ada session guru
 *
 * Public routes (tidak perlu login):
 * - /                        → halaman login siswa
 * - /admin                   → halaman login admin
 * - /guru                    → halaman login guru
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Cek apakah route termasuk yang diproteksi ---

  // Route siswa yang diproteksi
  const isProtectedSiswaRoute = SISWA_PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Route admin yang diproteksi (kecuali /admin aja)
  const isProtectedAdminRoute = ADMIN_PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Route guru yang diproteksi (kecuali /guru aja yang public)
  const isProtectedTeacherRoute = TEACHER_PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // --- Baca cookie dari request ---
  const siswaCookie = request.cookies.get(COOKIE_SISWA)?.value;
  const adminCookie = request.cookies.get(COOKIE_ADMIN)?.value;
  const teacherCookie = request.cookies.get(COOKIE_TEACHER)?.value;

  const hasSiswaSession = !!siswaCookie;
  const hasAdminSession = !!adminCookie;
  const hasTeacherSession = !!teacherCookie;

  // --- Redirect jika tidak terautentikasi ---

  // Route siswa diproteksi → redirect ke halaman login siswa (/)
  if (isProtectedSiswaRoute && !hasSiswaSession) {
    const loginUrl = new URL("/", request.nextUrl);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Route admin diproteksi → redirect ke halaman login admin (/admin)
  if (isProtectedAdminRoute && !hasAdminSession) {
    const loginUrl = new URL("/admin", request.nextUrl);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Route guru diproteksi → redirect ke halaman login guru (/guru)
  if (isProtectedTeacherRoute && !hasTeacherSession) {
    const loginUrl = new URL("/guru", request.nextUrl);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Validasi struktur cookie (optional, parse JSON) ---
  if (isProtectedSiswaRoute && hasSiswaSession) {
    try {
      const data = JSON.parse(siswaCookie!);
      if (!data.studentId) {
        const loginUrl = new URL("/", request.nextUrl);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL("/", request.nextUrl);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isProtectedAdminRoute && hasAdminSession) {
    try {
      const data = JSON.parse(adminCookie!);
      if (!data.adminId) {
        const loginUrl = new URL("/admin", request.nextUrl);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL("/admin", request.nextUrl);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isProtectedTeacherRoute && hasTeacherSession) {
    try {
      const data = JSON.parse(teacherCookie!);
      if (!data.teacherId) {
        const loginUrl = new URL("/guru", request.nextUrl);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL("/guru", request.nextUrl);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

/**
 * Konfigurasi matcher — middleware hanya jalan di route yang matching
 */
export const config = {
  matcher: [
    "/mapel/:path*",
    "/ujian/:path*",
    "/selesai/:path*",
    "/admin/dashboard/:path*",
    "/admin/atur/:path*",
    "/admin/soal/:path*",
    "/admin/hasil/:path*",
    "/admin/guru/:path*",
    "/guru/dashboard/:path*",
    "/guru/subjek/:path*",
  ],
};
