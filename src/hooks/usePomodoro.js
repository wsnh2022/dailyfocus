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

  const savedPhase = saved?.phase;
  const wasPaused  = !!(saved?.isPaused && (savedPhase === 'work' || savedPhase === 'break'));

  const initPhase =
    !savedPhase || savedPhase === 'idle' ? 'idle'       :
    wasPaused                            ? savedPhase   :
    savedPhase === 'work'                ? 'work_done'  :
    savedPhase === 'break'               ? 'break_done' :
    savedPhase;

  const initSeconds =
    wasPaused && saved?.secondsLeft ? saved.secondsLeft :
    initPhase === 'idle'            ? workMin * 60      : 0;

  const [phase, setPhase]             = useState(initPhase);
  const [currentSet, setCurrentSet]   = useState(saved?.currentSet ?? 1);
  const [secondsLeft, setSecondsLeft] = useState(initSeconds);
  const [isPaused, setIsPaused]       = useState(wasPaused);
  const intervalRef    = useRef(null);
  const secondsLeftRef = useRef(initSeconds);

  // Keep ref in sync so persistence effect can read it without adding it to deps
  useEffect(() => { secondsLeftRef.current = secondsLeft; }, [secondsLeft]);

  // Persist - include secondsLeft only when paused mid-phase
  useEffect(() => {
    if (!storageKey) return;
    if (phase === 'idle') { localStorage.removeItem(storageKey); return; }
    const data = { phase, currentSet };
    if (isPaused && (phase === 'work' || phase === 'break')) {
      data.isPaused    = true;
      data.secondsLeft = secondsLeftRef.current;
    }
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [phase, currentSet, isPaused, storageKey]);

  const clearTimer = () => clearInterval(intervalRef.current);

  const startPhase = useCallback((type, durationMin) => {
    clearTimer();
    setIsPaused(false);
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

  const pauseCurrent = useCallback(() => {
    clearTimer();
    setIsPaused(true);
  }, []);

  const resumeCurrent = useCallback(() => {
    setIsPaused(false);
  }, []);

  const skipCurrent = useCallback(() => {
    clearTimer();
    setIsPaused(false);
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
    setIsPaused(false);
    if (storageKey) localStorage.removeItem(storageKey);
  }, [workMin, storageKey]);

  // Timer - skips if paused
  useEffect(() => {
    if (phase !== 'work' && phase !== 'break') return;
    if (isPaused) return;
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
  }, [phase, currentSet, isPaused, finishWork, finishBreak]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const isActivelyRunning = (phase === 'work' || phase === 'break') && !isPaused;

  return {
    phase,
    currentSet,
    totalSets,
    formatted: `${mins}:${secs}`,
    start,
    beginBreak,
    beginWork,
    pauseCurrent,
    resumeCurrent,
    skipCurrent,
    reset,
    isDone: phase === 'done',
    isPaused,
    isActivelyRunning,
  };
}
