import { useState, useEffect, useRef, useCallback } from 'react';
import { vibratePattern, vibrateLong } from '../utils/vibrate';

// phases: 'idle' | 'work' | 'work_done' | 'break' | 'break_done' | 'done'

function loadSaved(taskId) {
  if (!taskId) return null;
  try { return JSON.parse(localStorage.getItem(`df_pomo_${taskId}`)); } catch { return null; }
}

export function usePomodoro({ taskId, workMin, breakMin, totalSets, onSetComplete, onAllComplete, onBreakStart, onBreakEnd }) {
  const saved = useRef(loadSaved(taskId)).current;
  const storageKey = taskId ? `df_pomo_${taskId}` : null;

  // Normalize: if page was refreshed mid-timer, treat as if that phase just ended
  const savedPhase = saved?.phase;
  const initPhase =
    !savedPhase || savedPhase === 'idle' ? 'idle'       :
    savedPhase === 'work'                ? 'work_done'  :
    savedPhase === 'break'               ? 'break_done' :
    savedPhase; // work_done | break_done | done

  const [phase, setPhase]             = useState(initPhase);
  const [currentSet, setCurrentSet]   = useState(saved?.currentSet ?? 1);
  const [secondsLeft, setSecondsLeft] = useState(initPhase === 'idle' ? workMin * 60 : 0);
  const intervalRef = useRef(null);

  // Persist phase + currentSet on every change
  useEffect(() => {
    if (!storageKey) return;
    if (phase === 'idle') localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, JSON.stringify({ phase, currentSet }));
  }, [phase, currentSet, storageKey]);

  const clearTimer = () => clearInterval(intervalRef.current);

  const startPhase = useCallback((type, durationMin) => {
    clearTimer();
    setPhase(type);
    setSecondsLeft(durationMin * 60);
  }, []);

  const finishWork = useCallback((completedSet) => {
    clearTimer();
    vibratePattern();
    onSetComplete?.(completedSet);
    if (completedSet >= totalSets) {
      setPhase('done');
      vibrateLong();
      onAllComplete?.();
    } else {
      setPhase('work_done');
      setSecondsLeft(0);
      onBreakStart?.();
    }
  }, [totalSets, onSetComplete, onAllComplete, onBreakStart]);

  const finishBreak = useCallback(() => {
    clearTimer();
    setPhase('break_done');
    setSecondsLeft(0);
    onBreakEnd?.();
  }, [onBreakEnd]);

  const beginBreak = useCallback(() => {
    if (phase !== 'work_done') return;
    setCurrentSet(s => s + 1);
    startPhase('break', breakMin);
  }, [phase, breakMin, startPhase]);

  const beginWork = useCallback(() => {
    if (phase !== 'break_done') return;
    startPhase('work', workMin);
  }, [phase, workMin, startPhase]);

  const start = useCallback(() => {
    if (phase === 'idle') startPhase('work', workMin);
  }, [phase, workMin, startPhase]);

  const skipCurrent = useCallback(() => {
    clearTimer();
    if      (phase === 'work')       finishWork(currentSet);
    else if (phase === 'work_done')  { setCurrentSet(s => s + 1); startPhase('break', breakMin); }
    else if (phase === 'break')      finishBreak();
    else if (phase === 'break_done') startPhase('work', workMin);
  }, [phase, currentSet, breakMin, workMin, finishWork, finishBreak, startPhase]);

  const reset = useCallback(() => {
    clearTimer();
    setPhase('idle');
    setCurrentSet(1);
    setSecondsLeft(workMin * 60);
    if (storageKey) localStorage.removeItem(storageKey);
  }, [workMin, storageKey]);

  useEffect(() => {
    if (phase !== 'work' && phase !== 'break') return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (phase === 'work') finishWork(currentSet);
          else finishBreak();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, currentSet, finishWork, finishBreak]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return {
    phase,
    currentSet,
    totalSets,
    formatted: `${mins}:${secs}`,
    start,
    beginBreak,
    beginWork,
    skipCurrent,
    reset,
    isDone: phase === 'done',
  };
}
