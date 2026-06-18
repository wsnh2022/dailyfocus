import { useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCountdown } from '../../hooks/useCountdown';
import { usePomodoro } from '../../hooks/usePomodoro';
import { useAppStore } from '../../store/useAppStore';
import { addSession } from '../../db/queries';
import { getColor } from '../../constants/colors';
import { todayStr } from '../../utils/dateHelpers';
import { soundBreakStart, soundWorkResume, soundAllDone } from '../../utils/sound';
import TimerDisplay from './TimerDisplay';

const LONG_PRESS_MS = 600;

function useLongPress(onLongPress) {
  const timerRef = useRef(null);
  const start = useCallback(() => {
    timerRef.current = setTimeout(onLongPress, LONG_PRESS_MS);
  }, [onLongPress]);
  const end = useCallback(() => clearTimeout(timerRef.current), []);
  return { start, end };
}

function Checkbox({ c, completed, onToggle }) {
  return (
    <button
      onMouseDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      onClick={onToggle}
      className={`w-8 h-8 rounded-lg border-2 ${c.border} flex items-center justify-center flex-shrink-0 transition-colors ${
        completed ? c.bg : 'bg-white'
      }`}
    >
      {completed && <span className={`text-sm font-bold ${c.text}`}>✓</span>}
    </button>
  );
}

// ── Checkbox card ─────────────────────────────────────────────────────────────
function CheckboxCard({ task, onToggleComplete }) {
  const { emoji, name, color, duration, durationUnit, completed } = task;
  const c = getColor(color);
  const navigate = useNavigate();
  const lp = useLongPress(() => navigate(`/editor/${task.id}`));

  return (
    <div
      className={`flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm select-none transition-opacity ${completed ? 'opacity-60' : ''}`}
      onMouseDown={lp.start} onMouseUp={lp.end} onMouseLeave={lp.end}
      onTouchStart={lp.start} onTouchEnd={lp.end}
    >
      <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xl font-bold text-slate-800 leading-tight">
          {duration ? `${duration} ${durationUnit ?? 'min'}` : '—'}
        </p>
        <p className="text-sm text-slate-500 truncate mt-0.5">{name}</p>
      </div>
      <Checkbox c={c} completed={completed} onToggle={() => onToggleComplete(!completed)} />
    </div>
  );
}

// ── Countdown card ────────────────────────────────────────────────────────────
function CountdownCard({ task, onToggleComplete }) {
  const { id, emoji, name, color, duration, durationUnit, completed } = task;
  const c = getColor(color);
  const navigate = useNavigate();
  const lp = useLongPress(() => navigate(`/editor/${task.id}`));

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

  const { formatted, isRunning, start, pause } = useCountdown(totalSeconds, handleComplete);

  // Pause when another timer becomes active
  useEffect(() => {
    if (activeTimerId !== id && isRunning) pause();
  }, [activeTimerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear activeTimerId if we unmount while running
  useEffect(() => {
    return () => {
      if (useAppStore.getState().activeTimerId === id) clearActiveTimer();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartPause = () => {
    if (isRunning) { pause(); clearActiveTimer(); }
    else { setActiveTimer(id); start(); }
  };

  return (
    <div
      className={`flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm select-none transition-opacity ${completed ? 'opacity-60' : ''}`}
      onMouseDown={lp.start} onMouseUp={lp.end} onMouseLeave={lp.end}
      onTouchStart={lp.start} onTouchEnd={lp.end}
    >
      <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <TimerDisplay formatted={formatted} />
        <p className="text-sm text-slate-500 truncate mt-0.5">{name}</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        {!completed && (
          <button
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            onClick={handleStartPause}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              isRunning ? 'bg-slate-200 text-slate-700' : `${c.bg} ${c.text}`
            }`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
        )}
        <Checkbox c={c} completed={completed} onToggle={() => onToggleComplete(!completed)} />
      </div>
    </div>
  );
}

// ── Pomodoro card ─────────────────────────────────────────────────────────────
function PomodoroCard({ task, onToggleComplete }) {
  const { id, emoji, name, color, workMin, breakMin, sets, completed } = task;
  const c = getColor(color);
  const navigate = useNavigate();
  const lp = useLongPress(() => navigate(`/editor/${task.id}`));

  const activeTimerId    = useAppStore(s => s.activeTimerId);
  const setActiveTimer   = useAppStore(s => s.setActiveTimer);
  const clearActiveTimer = useAppStore(s => s.clearActiveTimer);
  const showToast        = useAppStore(s => s.showToast);

  const handleSetComplete = useCallback(async (setNumber) => {
    try {
      await addSession({
        date:        todayStr(),
        taskId:      id,
        taskName:    name,
        setNumber,
        totalSets:   sets ?? 4,
        workMin:     workMin  ?? 25,
        breakMin:    breakMin ?? 5,
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to log pomodoro session:', err);
    }
  }, [id, name, sets, workMin, breakMin]);

  const handleAllComplete = useCallback(() => {
    onToggleComplete(true);
    clearActiveTimer();
    soundAllDone();
    showToast('All sets done! Great work 🎉', 'pomodoro-done', 5000);
  }, [onToggleComplete, clearActiveTimer, showToast]);

  const handleBreakStart = useCallback(() => {
    soundBreakStart();
    showToast(`Break time 🧘 — ${breakMin ?? 5} min`, 'pomodoro-break', 6000);
  }, [breakMin, showToast]);

  const handleBreakEnd = useCallback(() => {
    soundWorkResume();
    showToast(`Back to work 💪`, 'pomodoro-work', 4000);
  }, [showToast]);

  const { phase, currentSet, totalSets, formatted, start, skipCurrent, reset, isDone } = usePomodoro({
    workMin:       workMin  ?? 25,
    breakMin:      breakMin ?? 5,
    totalSets:     sets     ?? 4,
    onSetComplete: handleSetComplete,
    onAllComplete: handleAllComplete,
    onBreakStart:  handleBreakStart,
    onBreakEnd:    handleBreakEnd,
  });

  const isRunning = phase === 'work' || phase === 'break';

  // Reset if another timer takes over
  useEffect(() => {
    if (activeTimerId !== id && isRunning) reset();
  }, [activeTimerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear activeTimerId if we unmount while active
  useEffect(() => {
    return () => {
      if (useAppStore.getState().activeTimerId === id) clearActiveTimer();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = () => { setActiveTimer(id); start(); };

  return (
    <div
      className={`flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm select-none transition-opacity ${completed ? 'opacity-60' : ''}`}
      onMouseDown={lp.start} onMouseUp={lp.end} onMouseLeave={lp.end}
      onTouchStart={lp.start} onTouchEnd={lp.end}
    >
      <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <TimerDisplay
          formatted={isDone ? 'Done!' : formatted}
          phase={phase}
          currentSet={currentSet}
          totalSets={totalSets}
        />
        <p className="text-sm text-slate-500 truncate mt-0.5">{name}</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        {!completed && !isDone && (
          phase === 'idle'
            ? <button
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
                onClick={handleStart}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${c.bg} ${c.text}`}
              >Start</button>
            : <button
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
                onClick={skipCurrent}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 text-slate-700"
              >Skip</button>
        )}
        <Checkbox c={c} completed={completed} onToggle={() => onToggleComplete(!completed)} />
      </div>
    </div>
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
export default function TaskCard({ task, onToggleComplete }) {
  if (task.taskType === 'countdown') return <CountdownCard task={task} onToggleComplete={onToggleComplete} />;
  if (task.taskType === 'pomodoro')  return <PomodoroCard  task={task} onToggleComplete={onToggleComplete} />;
  return <CheckboxCard task={task} onToggleComplete={onToggleComplete} />;
}
