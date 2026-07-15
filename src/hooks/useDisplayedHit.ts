import { useEffect, useRef, useState } from 'react';
import type { DetectedHit } from '../store/useAppStore';

export interface DisplayedHit {
  hit: DetectedHit;
  opacity: number;
}

const HOLD_MS = 500;
const FADE_MS = 500;

/**
 * Keep the latest detected cajon hit visible briefly, then fade it out.
 * Unlike a held pitch, a percussive hit is a single instantaneous event with
 * no "still ringing" signal to watch for, so this just reacts to the
 * detected hit's timestamp changing rather than tracking continuous gaps
 * the way useDisplayedNote does for pitch.
 */
export function useDisplayedHit(live: DetectedHit | null): DisplayedHit | null {
  const [displayed, setDisplayed] = useState<DisplayedHit | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeStartRef = useRef<number | null>(null);
  const fadeRafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const clearFade = () => {
    if (fadeRafRef.current) {
      cancelAnimationFrame(fadeRafRef.current);
      fadeRafRef.current = null;
    }
    fadeStartRef.current = null;
  };

  const clearHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const startFade = () => {
    fadeStartRef.current = performance.now();

    const tick = (now: number) => {
      const start = fadeStartRef.current;
      if (start == null) return;

      const t = (now - start) / FADE_MS;
      if (t >= 1) {
        setDisplayed(null);
        fadeStartRef.current = null;
        fadeRafRef.current = null;
        return;
      }

      setDisplayed((prev) => (prev ? { ...prev, opacity: 1 - t } : null));
      fadeRafRef.current = requestAnimationFrame(tick);
    };

    fadeRafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (!live || live.timestamp === lastTimestampRef.current) return;
    lastTimestampRef.current = live.timestamp;

    clearHold();
    clearFade();
    setDisplayed({ hit: live, opacity: 1 });

    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      startFade();
    }, HOLD_MS);
  }, [live]);

  useEffect(() => () => {
    clearHold();
    clearFade();
  }, []);

  return displayed;
}
