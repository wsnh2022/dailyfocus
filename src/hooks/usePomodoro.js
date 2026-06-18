import { useState, useEffect, useRef, useCallback } from 'react';
import { vibratePattern, vibrateLong } from '../utils/vibrate';

export function usePomodoro({ workMin, breakMin, totalSets, onSetComplete, onAllComplete, onBreakStart, onBreakEnd }) {
  const [phase, setPhase]           = useState('idle'); // 'idle' | 'work' | 'break' | 'done'
  const [currentSet, setCurrentSet] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(workMin * 60);
  const intervalRef = useRef(null);

  const clearTimer = () => clearInterval(intervalRef.current);

  const startPhase = useCallback((type, durationMin) => {
    clearTimer();
    setPhase(type);
    setSecondsLeft(durationMin * 60);
  }, []);

  const advanceAfterWork = useCallback((completedSet) => {
    vibratePattern();
    onSetComplete?.(completedSet);
    if (completedSet >= totalSets) {
      setPhase('done');
      vibrateLong();
      onAllComplete?.();
    } else {
      setCurrentSet(s => s + 1);
      startPhase('break', breakMin);
      onBreakStart?.();
    }
  }, [totalSets, breakMin, startPhase, onSetComplete, onAllComplete, onBreakStart]);

  const start = useCallback(() => {
    if (phase === 'idle') startPhase('work', workMin);
  }, [phase, workMin, startPhase]);

  const skipCurrent = useCallback(() => {
    clearTimer();
    if (phase === 'work') advanceAfterWork(currentSet);
    else if (phase === 'break') { startPhase('work', workMin); onBreakEnd?.(); }
  }, [phase, currentSet, workMin, advanceAfterWork, startPhase]);

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
          clearTimer();
          if (phase === 'work') advanceAfterWork(currentSet);
          else { startPhase('work', workMin); onBreakEnd?.(); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, currentSet, workMin, advanceAfterWork, startPhase]);

  const mins      = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs      = String(secondsLeft % 60).padStart(2, '0');

  return {
    phase,
    currentSet,
    totalSets,
    formatted: `${mins}:${secs}`,
    start,
    skipCurrent,
    reset,
    isDone: phase === 'done',
  };
}
