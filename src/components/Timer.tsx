"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";

interface TimerProps {
  /** Total detik (misal 3600 untuk 60 menit) */
  seconds: number;
  /** Dipanggil ketika waktu habis */
  onTimeUp?: () => void;
  /** Apakah timer berjalan */
  isRunning?: boolean;
}

/**
 * Format detik ke MM:DD
 */
function formatTime(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const m = Math.floor(totalSeconds / 60);
  const d = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(d).padStart(2, "0")}`;
}

/**
 * Timer countdown dengan interval 1 detik.
 * Props: seconds (total detik), onTimeUp (callback),
 *        isRunning (kontrol jalan/stop)
 *
 * Menampilkan sisa waktu dengan font monospace 2.1rem.
 * Jika sisa < 5 menit (300 detik), berwarna merah dan berkedip.
 */
export default function Timer({
  seconds,
  onTimeUp,
  isRunning = true,
}: TimerProps) {
  const [remaining, setRemaining] = useState<number>(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep callback ref up-to-date
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Reset remaining when seconds prop changes
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    clearTimer();

    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearTimer();
          // Fire onTimeUp asynchronously so it doesn't happen during render
          setTimeout(() => {
            onTimeUpRef.current?.();
          }, 0);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      clearTimer();
    };
  }, [isRunning, clearTimer]);

  const isWarning = remaining > 0 && remaining <= 300;

  const displayClass = [
    "timer-display",
    isWarning ? "timer-warning" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Calculate progress for visual indicator
  const progress = seconds > 0 ? (remaining / seconds) * 100 : 0;

  return (
    <div className="timer-bar">
      <span className="timer-label">⏱️ Sisa Waktu</span>
      <span className={displayClass}>{formatTime(remaining)}</span>
      <span className="timer-info">
        {isWarning
          ? "⚠️ Waktu tinggal sedikit!"
          : remaining > 0
            ? `${Math.floor(remaining / 60)} menit tersisa`
            : "⏰ Waktu habis!"}
      </span>
    </div>
  );
}

/**
 * Format detik ke HH:MM:SS (opsional, untuk penggunaan lain)
 */
export function formatTimeLong(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
