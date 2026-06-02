"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface UseAntiCheatOptions {
  maxViolations?: number;
  graceSeconds?: number;
  onMaxViolations?: () => void;
}

interface UseAntiCheatReturn {
  violations: number;
  showWarning: boolean;
  graceRemaining: number;
  fullscreenSupported: boolean;
  enterFullscreen: () => Promise<void>;
  resetViolations: () => void;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  );
}

export default function useAntiCheat(
  enabled: boolean = true,
  options: UseAntiCheatOptions = {}
): UseAntiCheatReturn {
  const { maxViolations = 3, graceSeconds = 10, onMaxViolations } = options;

  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [graceRemaining, setGraceRemaining] = useState(graceSeconds);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);

  const violationsRef = useRef(0);
  const graceStartRef = useRef(0);
  const graceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInGraceRef = useRef(false);
  const onMaxViolationsRef = useRef(onMaxViolations);

  useEffect(() => {
    onMaxViolationsRef.current = onMaxViolations;
  }, [onMaxViolations]);

  const cancelGrace = useCallback(() => {
    if (graceTimerRef.current !== null) {
      clearInterval(graceTimerRef.current);
      graceTimerRef.current = null;
    }
    isInGraceRef.current = false;
    if (showWarning) {
      setShowWarning(false);
    }
    setGraceRemaining(graceSeconds);
  }, [graceSeconds, showWarning]);

  const startGrace = useCallback(() => {
    if (isInGraceRef.current) return;
    isInGraceRef.current = true;

    graceStartRef.current = Date.now();
    setGraceRemaining(graceSeconds);
    setShowWarning(true);

    const tick = () => {
      const elapsed = Math.floor(
        (Date.now() - graceStartRef.current) / 1000
      );
      const remaining = Math.max(0, graceSeconds - elapsed);
      setGraceRemaining(remaining);

      if (remaining <= 0) {
        if (graceTimerRef.current !== null) {
          clearInterval(graceTimerRef.current);
          graceTimerRef.current = null;
        }
        isInGraceRef.current = false;
        setShowWarning(false);
        setGraceRemaining(graceSeconds);

        const newCount = violationsRef.current + 1;
        violationsRef.current = newCount;
        setViolations(newCount);

        if (newCount >= maxViolations) {
          onMaxViolationsRef.current?.();
        }
      }
    };

    tick();
    graceTimerRef.current = setInterval(tick, 500);
  }, [graceSeconds, maxViolations]);

  const resetViolations = useCallback(() => {
    violationsRef.current = 0;
    setViolations(0);
    cancelGrace();
  }, [cancelGrace]);

  const enterFullscreen = useCallback(async () => {
    if (!fullscreenSupported) return;
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Browser might reject if not from user gesture — ignore
    }
  }, [fullscreenSupported]);

  // Cek support fullscreen
  useEffect(() => {
    if (typeof document === "undefined") return;
    const supported =
      !!document.documentElement.requestFullscreen && !isIOS();
    setFullscreenSupported(supported);
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    if (!enabled) return;
    const handleFSChange = () => {
      if (document.fullscreenElement) {
        cancelGrace();
      } else {
        startGrace();
      }
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFSChange);
  }, [enabled, cancelGrace, startGrace]);

  // Listen for visibility change (tab switch, app switch)
  useEffect(() => {
    if (!enabled) return;
    const handleVisibility = () => {
      if (document.hidden) {
        startGrace();
      } else {
        cancelGrace();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, cancelGrace, startGrace]);

  return {
    violations,
    showWarning,
    graceRemaining,
    fullscreenSupported,
    enterFullscreen,
    resetViolations,
  };
}
