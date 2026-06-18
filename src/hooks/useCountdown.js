import { useState, useEffect, useRef, useCallback } from 'react';
import { vibrateLong } from '../utils/vibrate';

export function useCountdown(totalSeconds, onComplete) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning]     = useState(false);
  const intervalRef  = useRef(null);
  const startTimeRef = useRef(null);
  const remainingRef = useRef(totalSeconds);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    remainingRef.current = secondsLeft;
    setIsRunning(false);
  }, [secondsLeft]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    remainingRef.current = totalSeconds;
  }, [totalSeconds]);

  // Recalculate elapsed time when screen wakes from lock
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isRunning && startTimeRef.current) {
        const elapsed     = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newRemaining = Math.max(0, remainingRef.current - elapsed);
        setSecondsLeft(newRemaining);
        if (newRemaining <= 0) {
          setIsRunning(false);
          vibrateLong();
          onComplete?.();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning, onComplete]);

  useEffect(() => {
    if (!isRunning) return;
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          vibrateLong();
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, onComplete]);

  const mins      = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs      = String(secondsLeft % 60).padStart(2, '0');
  const formatted = `${mins}:${secs}`;
  const progress  = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;

  return { secondsLeft, isRunning, formatted, progress, start, pause, reset };
}
