import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCountdown } from '../../hooks/useCountdown';
import { usePomodoro } from '../../hooks/usePomodoro';
import { useAppStore } from '../../store/useAppStore';
import { addSession, deleteTask, saveLog } from '../../db/queries';
import { getColor } from '../../constants/colors';
import { todayStr, getISOWeek } from '../../utils/dateHelpers';
import { soundBreakStart, soundWorkResume, soundAllDone } from '../../utils/sound';
import TimerDisplay from './TimerDisplay';

const ACTION_WIDTH = 80;

function useSwipeCard() {
  const [offset, setOffset]               = useState(0);
  const [isOpenLeft, setIsOpenLeft]       = useState(false); // edit (swipe left, negative offset)
  const [isOpenRight, setIsOpenRight]     = useState(false); // delete (swipe right, positive offset)
  const [transitioning, setTransitioning] = useState(false);
  const startX       = useRef(null);
  const startY       = useRef(null);
  const isHoriz      = useRef(false);
  const autoCloseRef = useRef(null);

  const cancelAutoClose = useCallback(() => {
    if (autoCloseRef.current) { clearTimeout(autoCloseRef.current); autoCloseRef.current = null; }
  }, []);

  const scheduleAutoClose = useCallback(() => {
    cancelAutoClose();
    autoCloseRef.current = setTimeout(() => {
      setTransitioning(true);
      setOffset(0);
      setIsOpenLeft(false);
      setIsOpenRight(false);
    }, 1500);
  }, [cancelAutoClose]);

  useEffect(() => cancelAutoClose, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onTouchStart = useCallback((e) => {
    cancelAutoClose();
    setTransitioning(false);
    startX.current  = e.touches[0].clientX;
    startY.current  = e.touches[0].clientY;
    isHoriz.current = false;
  }, [cancelAutoClose]);

  const onTouchMove = useCallback((e) => {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (!isHoriz.current) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      if (Math.abs(dy) >= Math.abs(dx)) { startX.current = null; return; }
      isHoriz.current = true;
    }
    const base = isOpenLeft ? -ACTION_WIDTH : isOpenRight ? ACTION_WIDTH : 0;
    setOffset(Math.max(-ACTION_WIDTH, Math.min(ACTION_WIDTH, base + dx)));
  }, [isOpenLeft, isOpenRight]);

  const onTouchEnd = useCallback(() => {
    if (!isHoriz.current) return;
    setTransitioning(true);
    setOffset(prev => {
      const snap = prev < -ACTION_WIDTH / 2 ? -ACTION_WIDTH
                 : prev > ACTION_WIDTH / 2  ?  ACTION_WIDTH
                 : 0;
      setIsOpenLeft(snap < 0);
      setIsOpenRight(snap > 0);
      if (snap !== 0) scheduleAutoClose();
      return snap;
    });
    startX.current = null;
  }, [scheduleAutoClose]);

  const close = useCallback(() => {
    cancelAutoClose();
    setTransitioning(true);
    setOffset(0);
    setIsOpenLeft(false);
    setIsOpenRight(false);
  }, [cancelAutoClose]);

  return { offset, isOpenLeft, isOpenRight, transitioning, onTouchStart, onTouchMove, onTouchEnd, close };
}

function Checkbox({ c, completed, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`w-8 h-8 rounded-lg border-2 ${c.border} flex items-center justify-center flex-shrink-0 transition-colors ${
        completed ? c.bg : 'bg-white dark:bg-slate-800'
      }`}
    >
      {completed && <span className={`text-sm font-bold ${c.text}`}>✓</span>}
    </button>
  );
}

function SwipeCard({ taskId, completed, children, dragListeners, dragAttributes }) {
  const navigate      = useNavigate();
  const showToast     = useAppStore(s => s.showToast);
  const todayTasks    = useAppStore(s => s.todayTasks);
  const setTodayTasks = useAppStore(s => s.setTodayTasks);
  const todayDayState = useAppStore(s => s.todayDayState);

  const { offset, isOpenLeft, isOpenRight, transitioning, onTouchStart, onTouchMove, onTouchEnd, close } = useSwipeCard();

  const handleDelete = async () => {
    close();
    try {
      await deleteTask(taskId);
      const today   = todayStr();
      const updated = useAppStore.getState().todayTasks.filter(t => t.id !== taskId);
      setTodayTasks(updated);
      await saveLog({
        date:       today,
        dayState:   useAppStore.getState().todayDayState,
        tasks:      updated,
        weekNumber: getISOWeek(today),
        createdAt:  new Date().toISOString(),
      });
      showToast('Task deleted');
    } catch {
      showToast('Failed to delete task', 'error');
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-sm select-none ${completed ? 'opacity-60' : ''}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Delete action - revealed by swiping right */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center">
        <button onClick={handleDelete} className="flex flex-col items-center gap-1 text-white">
          <span className="text-xl">🗑️</span>
          <span className="text-xs font-medium">Delete</span>
        </button>
      </div>

      {/* Edit action - revealed by swiping left */}
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-slate-700 dark:bg-slate-600 flex items-center justify-center">
        <button
          onClick={() => { close(); navigate(`/editor/${taskId}`); }}
          className="flex flex-col items-center gap-1 text-white"
        >
          <span className="text-xl">✏️</span>
          <span className="text-xs font-medium">Edit</span>
        </button>
      </div>

      {/* Sliding card content */}
      <div
        className="bg-white dark:bg-slate-900 dark:border dark:border-white/5 p-4 flex items-center gap-3"
        style={{ transform: `translateX(${offset}px)`, transition: transitioning ? 'transform 0.2s ease-out' : 'none' }}
      >
        {/* Drag handle */}
        <button
          {...dragListeners}
          {...dragAttributes}
          className="touch-none shrink-0 text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing px-0.5 -ml-1"
          style={{ touchAction: 'none' }}
          tabIndex={-1}
        >
          <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
            <circle cx="4" cy="4"  r="1.8"/><circle cx="10" cy="4"  r="1.8"/>
            <circle cx="4" cy="10" r="1.8"/><circle cx="10" cy="10" r="1.8"/>
            <circle cx="4" cy="16" r="1.8"/><circle cx="10" cy="16" r="1.8"/>
          </svg>
        </button>
        {children}
      </div>

      {/* Overlay when edit is open - covers card area, not edit button */}
      {isOpenLeft && (
        <div className="absolute inset-0" style={{ right: `${ACTION_WIDTH}px` }} onClick={close} />
      )}

      {/* Overlay when delete is open - covers card area, not delete button */}
      {isOpenRight && (
        <div className="absolute inset-0" style={{ left: `${ACTION_WIDTH}px` }} onClick={close} />
      )}
    </div>
  );
}

// ── Checkbox card ─────────────────────────────────────────────────────────────
function CheckboxCard({ task, onToggleComplete, dragListeners, dragAttributes }) {
  const { emoji, name, color, duration, durationUnit, completed } = task;
  const c = getColor(color);

  return (
    <SwipeCard taskId={task.id} completed={completed} dragListeners={dragListeners} dragAttributes={dragAttributes}>
      <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">{name}</p>
      </div>
      <Checkbox c={c} completed={completed} onToggle={() => onToggleComplete(!completed)} />
    </SwipeCard>
  );
}

// ── Countdown card ────────────────────────────────────────────────────────────
function CountdownCard({ task, onToggleComplete, dragListeners, dragAttributes }) {
  const { id, emoji, name, color, duration, durationUnit, completed } = task;
  const c = getColor(color);

  const activeTimerId    = useAppStore(s => s.activeTimerId);
  const setActiveTimer   = useAppStore(s => s.setActiveTimer);
  const clearActiveTimer = useAppStore(s => s.clearActiveTimer);

  const totalSeconds = durationUnit === 'hrs'
    ? (duration ?? 30) * 3600
    : (duration ?? 30) * 60;

  const handleComplete = useCallback(() => {
    onToggleComplete(true);
    clearActiveTimer();
  }, [onToggleComplete, clearActiveTimer]);

  const { secondsLeft, formatted, isRunning, start, pause } = useCountdown(totalSeconds, handleComplete);

  useEffect(() => {
    if (activeTimerId !== id && isRunning) pause();
  }, [activeTimerId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (useAppStore.getState().activeTimerId === id) clearActiveTimer(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartPause = () => {
    if (isRunning) { pause(); clearActiveTimer(); }
    else { setActiveTimer(id); start(); }
  };

  return (
    <SwipeCard taskId={id} completed={completed} dragListeners={dragListeners} dragAttributes={dragAttributes}>
      <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">{name}</p>
        {!isRunning && secondsLeft === totalSeconds
          ? <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{duration ?? 30} {durationUnit ?? 'min'}</p>
          : <TimerDisplay formatted={formatted} />
        }
      </div>
      <div className="flex flex-col items-center gap-2">
        {!completed && (
          <button
            onClick={handleStartPause}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              isRunning ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' : `${c.bg} ${c.text}`
            }`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
        )}
        <Checkbox c={c} completed={completed} onToggle={() => onToggleComplete(!completed)} />
      </div>
    </SwipeCard>
  );
}

// ── Pomodoro card ─────────────────────────────────────────────────────────────
function PomodoroCard({ task, onToggleComplete, dragListeners, dragAttributes }) {
  const { id, emoji, name, color, workMin, breakMin, sets, completed } = task;
  const c = getColor(color);

  const activeTimerId    = useAppStore(s => s.activeTimerId);
  const setActiveTimer   = useAppStore(s => s.setActiveTimer);
  const clearActiveTimer = useAppStore(s => s.clearActiveTimer);
  const showToast        = useAppStore(s => s.showToast);

  const handleSetComplete = useCallback(async (setNumber) => {
    try {
      await addSession({
        date: todayStr(), taskId: id, taskName: name,
        setNumber, totalSets: sets ?? 4,
        workMin: workMin ?? 25, breakMin: breakMin ?? 5,
        completedAt: new Date().toISOString(),
      });
    } catch (err) { console.error('Failed to log pomodoro session:', err); }
  }, [id, name, sets, workMin, breakMin]);

  const handleAllComplete = useCallback(() => {
    onToggleComplete(true); clearActiveTimer();
    soundAllDone(name);
    showToast('All sets done! Great work 🎉', 'pomodoro-done', 5000);
  }, [onToggleComplete, clearActiveTimer, showToast, name]);

  const handleBreakStart = useCallback(() => {
    soundBreakStart(name, breakMin);
    showToast(`Break time 🧘 - ${breakMin ?? 5} min`, 'pomodoro-break', 6000);
  }, [name, breakMin, showToast]);

  const handleBreakEnd = useCallback(() => {
    soundWorkResume(name);
    showToast('Back to work 💪', 'pomodoro-work', 4000);
  }, [name, showToast]);

  const { phase, currentSet, totalSets, formatted, start, beginBreak, beginWork, skipCurrent, reset, isDone } = usePomodoro({
    taskId: id, workMin: workMin ?? 25, breakMin: breakMin ?? 5, totalSets: sets ?? 4,
    onSetComplete: handleSetComplete, onAllComplete: handleAllComplete,
    onBreakStart: handleBreakStart, onBreakEnd: handleBreakEnd,
  });

  const isRunning = phase === 'work' || phase === 'break';

  useEffect(() => {
    if (activeTimerId !== id && isRunning) reset();
  }, [activeTimerId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (useAppStore.getState().activeTimerId === id) clearActiveTimer(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SwipeCard taskId={id} completed={completed} dragListeners={dragListeners} dragAttributes={dragAttributes}>
      <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">{name}</p>
        {phase === 'idle'
          ? <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{workMin ?? 25} min · {breakMin ?? 5} min break</p>
          : <TimerDisplay
              formatted={
                isDone               ? 'Done!'       :
                phase === 'work_done'  ? 'Work done!'  :
                phase === 'break_done' ? 'Break done!' :
                formatted
              }
              phase={phase} currentSet={currentSet} totalSets={totalSets}
            />
        }
      </div>
      <div className="flex flex-col items-center gap-2">
        {!completed && !isDone && (() => {
          if (phase === 'idle')
            return <button onClick={() => { setActiveTimer(id); start(); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${c.bg} ${c.text}`}>Start</button>;
          if (phase === 'work_done')
            return <button onClick={beginBreak}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-500 text-white">Break →</button>;
          if (phase === 'break_done')
            return <button onClick={beginWork}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 text-white">Work →</button>;
          if (isRunning)
            return <button onClick={skipCurrent}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">Skip</button>;
          return null;
        })()}
        <Checkbox c={c} completed={completed} onToggle={() => onToggleComplete(!completed)} />
      </div>
    </SwipeCard>
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
export default function TaskCard({ task, onToggleComplete, dragListeners, dragAttributes }) {
  if (task.taskType === 'countdown') return <CountdownCard task={task} onToggleComplete={onToggleComplete} dragListeners={dragListeners} dragAttributes={dragAttributes} />;
  if (task.taskType === 'pomodoro')  return <PomodoroCard  task={task} onToggleComplete={onToggleComplete} dragListeners={dragListeners} dragAttributes={dragAttributes} />;
  return <CheckboxCard task={task} onToggleComplete={onToggleComplete} dragListeners={dragListeners} dragAttributes={dragAttributes} />;
}
