"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface UseAntiCheatOptions {
  maxViolations?: number;
  graceSeconds?: number;
  onViolation?: (count: number) => void;
  onMaxViolations?: () => void;
}

interface UseAntiCheatReturn {
  violations: number;
  inGracePeriod: boolean;
  graceRemaining: number;
  fullscreenSupported: boolean;
  enterFullscreen: () => Promise<void>;
  resetViolations: () => void;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export default function useAntiCheat(
  enabled: boolean = true,
  options: UseAntiCheatOptions = {}
): UseAntiCheatReturn {
  const {
    maxViolations = 3,
    graceSeconds = 10,
    onViolation,
    onMaxViolations,
  } = options;

  const [violations, setViolations] = useState(0);
  const [inGracePeriod, setInGracePeriod] = useState(false);
  const [graceRemaining, setGraceRemaining] = useState(graceSeconds);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);

  const violationsRef = useRef(0);
  const graceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onMaxViolationsRef = useRef(onMaxViolations);
  const onViolationRef = useRef(onViolation);

  useEffect(() => {
    onMaxViolationsRef.current = onMaxViolations;
  }, [onMaxViolations]);

  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  const cancelGrace = useCallback(() => {
    if (graceTimerRef.current !== null) {
      clearInterval(graceTimerRef.current);
      graceTimerRef.current = null;
    }
    setInGracePeriod(false);
    setGraceRemaining(graceSeconds);
  }, [graceSeconds]);

  const startGrace = useCallback(() => {
    setInGracePeriod(true);
    setGraceRemaining(graceSeconds);

    let remaining = graceSeconds;
    graceTimerRef.current = setInterval(() => {
      remaining--;
      setGraceRemaining(remaining);

      if (remaining <= 0) {
        cancelGrace();
        const newCount = violationsRef.current + 1;
        violationsRef.current = newCount;
        setViolations(newCount);
        onViolationRef.current?.(newCount);

        if (newCount >= maxViolations) {
          onMaxViolationsRef.current?.();
        }
      }
    }, 1000);
  }, [graceSeconds, maxViolations, cancelGrace]);

  const resetViolations = useCallback(() => {
    violationsRef.current = 0;
    setViolations(0);
    cancelGrace();
  }, [cancelGrace]);

  const enterFullscreen = useCallback(async () => {
    if (!fullscreenSupported) return;

    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      }
    } catch {
      // User gesture required — browser akan tolak kalo bukan dari klik
    }
  }, [fullscreenSupported]);

  // Cek support fullscreen + iOS
  useEffect(() => {
    if (typeof document === "undefined") return;
    const supported = !!document.documentElement.requestFullscreen && !isIOS();
    setFullscreenSupported(supported);
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    if (!enabled) return;

    const handleFSChange = () => {
      if (!document.fullscreenElement) {
        // User left fullscreen
        if (!inGracePeriod) {
          startGrace();
        }
      } else {
        // User returned to fullscreen — cancel grace
        cancelGrace();
      }
    };

    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, [enabled, inGracePeriod, startGrace, cancelGrace]);

  // Listen for visibility change (tab switch, app switch)
  useEffect(() => {
    if (!enabled) return;

    const handleVisibility = () => {
      if (document.hidden) {
        if (!inGracePeriod) {
          startGrace();
        }
      } else {
        cancelGrace();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, inGracePeriod, startGrace, cancelGrace]);

  return {
    violations,
    inGracePeriod,
    graceRemaining,
    fullscreenSupported,
    enterFullscreen,
    resetViolations,
  };
}
