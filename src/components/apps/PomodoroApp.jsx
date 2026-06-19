import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePomodoro } from '../../hooks/usePomodoro';
import { useAppStore } from '../../store/useAppStore';
import { soundBreakStart, soundWorkResume, soundAllDone } from '../../utils/sound';

const PRESETS = [
  { label: '25 / 5',  sub: 'Classic',    workMin: 25, breakMin: 5,  sets: 4 },
  { label: '50 / 10', sub: 'Deep Work',  workMin: 50, breakMin: 10, sets: 3 },
  { label: '90 / 20', sub: 'Ultradian',  workMin: 90, breakMin: 20, sets: 2 },
];

export default function PomodoroApp() {
  const navigate           = useNavigate();
  const showToast          = useAppStore(s => s.showToast);
  const setPomodoroRunning = useAppStore(s => s.setPomodoroRunning);

  const [presetIdx, setPresetIdx] = useState(0);
  const [muted, setMuted]         = useState(false);
  const preset = PRESETS[presetIdx];

  const speak = useCallback((fn, ...args) => {
    if (!muted) fn(...args);
  }, [muted]);

  const handleBreakStart = useCallback(() => {
    speak(soundBreakStart, '', preset.breakMin);
    showToast(`Break — ${preset.breakMin} min`, 'pomodoro-break', 6000);
  }, [speak, preset.breakMin, showToast]);

  const handleBreakEnd = useCallback(() => {
    speak(soundWorkResume, '');
    showToast('Back to work 💪', 'pomodoro-work', 4000);
  }, [speak, showToast]);

  const handleAllComplete = useCallback(() => {
    speak(soundAllDone, '');
    setPomodoroRunning(false);
    showToast('All sets done! Great work 🎉', 'pomodoro-done', 5000);
  }, [speak, setPomodoroRunning, showToast]);

  const { phase, currentSet, totalSets, formatted, start, beginBreak, beginWork, skipCurrent, reset, isDone } =
    usePomodoro({
      taskId:       null,
      workMin:      preset.workMin,
      breakMin:     preset.breakMin,
      totalSets:    preset.sets,
      onSetComplete: () => {},
      onAllComplete: handleAllComplete,
      onBreakStart:  handleBreakStart,
      onBreakEnd:    handleBreakEnd,
    });

  const isRunning = phase === 'work' || phase === 'break';

  // Sync nav visibility with running state
  useEffect(() => {
    setPomodoroRunning(isRunning);
    return () => setPomodoroRunning(false);
  }, [isRunning, setPomodoroRunning]);

  const handleBack = () => {
    reset();
    setPomodoroRunning(false);
    navigate('/apps');
  };

  const handlePreset = (idx) => {
    if (phase !== 'idle') return; // can't change while running
    setPresetIdx(idx);
  };

  const dark = isRunning;

  return (
    <div className={`fixed inset-0 flex flex-col transition-colors duration-500 ${dark ? 'bg-slate-900' : 'bg-slate-50'}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-6 pb-2">
        <button
          onClick={handleBack}
          className={`text-sm font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}
        >
          ← Back
        </button>
        <span className={`text-sm font-semibold ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
          Pomodoro
        </span>
        <button
          onClick={() => setMuted(m => !m)}
          className={`text-xl ${muted ? 'opacity-40' : 'opacity-100'}`}
        >
          {muted ? '🔇' : '🔔'}
        </button>
      </div>

      {/* Preset selector — only shown when idle */}
      {phase === 'idle' && (
        <div className="flex gap-2 px-5 mt-4">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => handlePreset(i)}
              className={`flex-1 py-3 rounded-2xl text-center transition-colors ${
                presetIdx === i
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <div className="text-sm font-bold">{p.label}</div>
              <div className="text-[10px] mt-0.5 opacity-70">{p.sub}</div>
            </button>
          ))}
        </div>
      )}

      {/* Timer — centre of screen */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-5">

        {/* Phase badge */}
        {phase !== 'idle' && !isDone && (
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest ${
            phase === 'work' || phase === 'work_done'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-blue-500/20 text-blue-400'
          }`}>
            {phase === 'work'       ? 'WORK'
           : phase === 'work_done'  ? 'WORK DONE'
           : phase === 'break'      ? 'BREAK'
           : phase === 'break_done' ? 'BREAK DONE'
           : ''}
          </div>
        )}

        {/* Big timer */}
        <div className={`text-7xl font-mono font-bold tabular-nums ${dark ? 'text-white' : 'text-slate-800'}`}>
          {isDone ? '🎉' : formatted}
        </div>

        {/* Set counter */}
        {phase !== 'idle' && (
          <div className="flex gap-2">
            {Array.from({ length: preset.sets }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i < currentSet - 1
                    ? 'bg-green-400'
                    : i === currentSet - 1
                    ? (dark ? 'bg-white' : 'bg-slate-700')
                    : (dark ? 'bg-slate-700' : 'bg-slate-200')
                }`}
              />
            ))}
          </div>
        )}

        {isDone && (
          <p className={`text-base font-medium ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
            All sets complete!
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="px-5 pb-12 flex flex-col gap-3">
        {phase === 'idle' && (
          <button
            onClick={() => start()}
            className="w-full py-4 rounded-2xl bg-slate-800 text-white text-base font-semibold active:scale-[0.98] transition-transform"
          >
            Start
          </button>
        )}
        {phase === 'work_done' && (
          <button
            onClick={beginBreak}
            className="w-full py-4 rounded-2xl bg-teal-500 text-white text-base font-semibold"
          >
            Start Break →
          </button>
        )}
        {phase === 'break_done' && (
          <button
            onClick={beginWork}
            className="w-full py-4 rounded-2xl bg-amber-500 text-white text-base font-semibold"
          >
            Start Work →
          </button>
        )}
        {isRunning && (
          <button
            onClick={skipCurrent}
            className="w-full py-4 rounded-2xl bg-slate-700 text-slate-200 text-base font-semibold"
          >
            Skip
          </button>
        )}
        {isDone && (
          <button
            onClick={() => { reset(); }}
            className="w-full py-4 rounded-2xl bg-slate-800 text-white text-base font-semibold"
          >
            Restart
          </button>
        )}
        {phase !== 'idle' && !isDone && (
          <button
            onClick={handleBack}
            className={`w-full py-3 rounded-2xl text-sm font-medium ${
              dark ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            Stop & Exit
          </button>
        )}
      </div>
    </div>
  );
}
