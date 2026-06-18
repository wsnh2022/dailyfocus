import { useState, useEffect, useRef, useCallback } from 'react';
import { vibratePattern, vibrateLong } from '../utils/vibrate';

// phases: 'idle' | 'work' | 'work_done' | 'break' | 'break_done' | 'done'

export function usePomodoro({ workMin, breakMin, totalSets, onSetComplete, onAllComplete, onBreakStart, onBreakEnd }) {
  const [phase, setPhase]             = useState('idle');
  const [currentSet, setCurrentSet]   = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(workMin * 60);
  const intervalRef = useRef(null);

  const clearTimer = () => clearInterval(intervalRef.current);

  const startPhase = useCallback((type, durationMin) => {
    clearTimer();
    setPhase(type);
    setSecondsLeft(durationMin * 60);
  }, []);

  // Work timer finished — pause at work_done, wait for user to start break
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

  // Break timer finished — pause at break_done, wait for user to start work
  const finishBreak = useCallback(() => {
    clearTimer();
    setPhase('break_done');
    setSecondsLeft(0);
    onBreakEnd?.();
  }, [onBreakEnd]);

  // User manually starts break after work_done
  const beginBreak = useCallback(() => {
    if (phase !== 'work_done') return;
    setCurrentSet(s => s + 1);
    startPhase('break', breakMin);
  }, [phase, breakMin, startPhase]);

  // User manually starts next work set after break_done
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
  }, [workMin]);

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
