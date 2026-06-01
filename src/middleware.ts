import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_SISWA,
  COOKIE_ADMIN,
  SISWA_PROTECTED_ROUTES,
  ADMIN_PROTECTED_ROUTES,
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
 *
 * Public routes (tidak perlu login):
 * - /                        → halaman login siswa
 * - /admin                   → halaman login admin
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

  // --- Baca cookie dari request ---
  const siswaCookie = request.cookies.get(COOKIE_SISWA)?.value;
  const adminCookie = request.cookies.get(COOKIE_ADMIN)?.value;

  const hasSiswaSession = !!siswaCookie;
  const hasAdminSession = !!adminCookie;

  // --- Redirect jika tidak terautentikasi ---

  // Route siswa diproteksi → redirect ke halaman login siswa (/)
  if (isProtectedSiswaRoute && !hasSiswaSession) {
    const loginUrl = new URL("/", request.nextUrl);
    // Simpan URL yang dituju untuk redirect balik setelah login
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Route admin diproteksi → redirect ke halaman login admin (/admin)
  if (isProtectedAdminRoute && !hasAdminSession) {
    const loginUrl = new URL("/admin", request.nextUrl);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Validasi struktur cookie (optional, parse JSON) ---
  // Untuk extra safety, cek apakah cookie siswa valid JSON
  if (isProtectedSiswaRoute && hasSiswaSession) {
    try {
      const data = JSON.parse(siswaCookie!);
      if (!data.studentId) {
        // Cookie tidak valid → redirect ke login
        const loginUrl = new URL("/", request.nextUrl);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      // Cookie corrupted → redirect ke login
      const loginUrl = new URL("/", request.nextUrl);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Validasi cookie admin
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

  return NextResponse.next();
}

/**
 * Konfigurasi matcher — middleware hanya jalan di route yang matching
 * Ini penting untuk performa (tidak jalan di semua request)
 */
export const config = {
  matcher: [
    // Siswa routes
    "/mapel/:path*",
    "/ujian/:path*",
    "/selesai/:path*",
    // Admin routes (kecuali /admin aja yang public)
    "/admin/dashboard/:path*",
    "/admin/atur/:path*",
    "/admin/soal/:path*",
    "/admin/hasil/:path*",
  ],
};
