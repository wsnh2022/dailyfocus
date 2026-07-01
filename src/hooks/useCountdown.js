import { useState, useEffect, useRef, useCallback } from 'react';
import { vibrateLong } from '../utils/vibrate';

function loadSavedSeconds(storageKey) {
  if (!storageKey) return null;
  try {
    const v = localStorage.getItem(storageKey);
    return v !== null ? parseInt(v, 10) : null;
  } catch { return null; }
}

export function useCountdown(totalSeconds, onComplete, storageKey = null) {
  const savedSeconds = useRef(loadSavedSeconds(storageKey)).current;
  const initSeconds  = savedSeconds ?? totalSeconds;

  const [secondsLeft, setSecondsLeft] = useState(initSeconds);
  const [isRunning, setIsRunning]     = useState(false);
  const intervalRef  = useRef(null);
  const startTimeRef = useRef(null);
  const remainingRef = useRef(initSeconds);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    remainingRef.current = secondsLeft;
    setIsRunning(false);
    if (storageKey) try { localStorage.setItem(storageKey, String(secondsLeft)); } catch {}
  }, [secondsLeft, storageKey]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    remainingRef.current = totalSeconds;
    if (storageKey) try { localStorage.removeItem(storageKey); } catch {}
  }, [totalSeconds, storageKey]);

  // Sync when task duration changes (e.g. task was edited)
  useEffect(() => {
    if (!isRunning) {
      setSecondsLeft(totalSeconds);
      remainingRef.current = totalSeconds;
      if (storageKey) try { localStorage.removeItem(storageKey); } catch {}
    }
  }, [totalSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Screen-lock recovery
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isRunning && startTimeRef.current) {
        const elapsed      = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newRemaining = Math.max(0, remainingRef.current - elapsed);
        setSecondsLeft(newRemaining);
        if (newRemaining <= 0) {
          setIsRunning(false);
          vibrateLong();
          if (storageKey) try { localStorage.removeItem(storageKey); } catch {}
          onComplete?.();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning, onComplete, storageKey]);

  useEffect(() => {
    if (!isRunning) return;
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          vibrateLong();
          if (storageKey) try { localStorage.removeItem(storageKey); } catch {}
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, onComplete, storageKey]);

  const mins      = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs      = String(secondsLeft % 60).padStart(2, '0');
  const formatted = `${mins}:${secs}`;
  const progress  = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;

  return { secondsLeft, isRunning, formatted, progress, start, pause, reset };
}
