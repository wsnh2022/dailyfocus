import { useState } from 'react';
import { todayStr } from '../../utils/dateHelpers';

const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATE_BG = {
  hit:     'bg-green-400',
  partial: 'bg-green-200',
  miss:    'bg-red-300',
  rest:    'bg-blue-300',
  pause:   'bg-amber-300',
  planned: 'bg-violet-200',
  none:    'bg-slate-100',
  future:  'bg-slate-50',
};

const STATE_TEXT = {
  hit:     'text-white',
  partial: 'text-green-800',
  miss:    'text-white',
  rest:    'text-white',
  pause:   'text-amber-900',
  planned: 'text-violet-700',
  none:    'text-slate-400',
  future:  'text-slate-300',
};

const STATE_EMOJI = { rest: '🌿', pause: '⏸️' };

function getDayState(log, isFuture) {
  if (isFuture) return (log && (log.tasks ?? []).length > 0) ? 'planned' : 'future';
  if (!log) return 'none';
  if (log.dayState === 'rest') return 'rest';
  if (log.dayState === 'pause') return 'pause';
  const tasks = log.tasks ?? [];
  const done = tasks.filter(t => t.completed).length;
  if (tasks.length === 0) return 'none';
  if (done === tasks.length) return 'hit';
  if (done > 0) return 'partial';
  return 'miss';
}

function getMondayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const offset = dow === 0 ? 6 : dow - 1;
  return addDays(dateStr, -offset);
}

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().split('T')[0];
}

function formatWeekLabel(mondayStr) {
  const endStr = addDays(mondayStr, 6);
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(mondayStr)} – ${fmt(endStr)}`;
}

function WeekTaskList({ days, logMap }) {
  const pastDays = days.filter(d => !d.isFuture);
  if (pastDays.length === 0) return (
    <p className="text-center text-sm text-slate-400 py-6">No data for this week yet.</p>
  );

  return (
    <div className="space-y-3">
      {days.map(day => {
        const log   = logMap[day.dateStr];
        const tasks = log?.tasks ?? [];
        const done  = tasks.filter(t => t.completed).length;
        const label = new Date(day.dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        if (day.isFuture && tasks.length === 0) return null;

        return (
          <div key={day.dateStr}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATE_BG[day.state]} ${STATE_TEXT[day.state]}`}>
                {STATE_EMOJI[day.state] ?? label}
              </span>
              {!STATE_EMOJI[day.state] && (
                <span className="text-[10px] text-slate-400">{label}</span>
              )}
              {!day.isFuture && tasks.length > 0 && (
                <span className="ml-auto text-[10px] font-semibold text-slate-400">{done}/{tasks.length}</span>
              )}
            </div>
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-300 pl-1 pb-1">
                {day.isFuture ? 'Planned: no tasks yet' : 'No tasks logged'}
              </p>
            ) : (
              <ul className="space-y-1">
                {tasks.map((task, i) => (
                  <li key={task.id ?? i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50">
                    <span className="text-sm leading-none">{task.emoji}</span>
                    <span className={`flex-1 text-xs ${task.completed ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                      {task.name}
                    </span>
                    <span className={`text-xs font-medium ${task.completed ? 'text-green-500' : 'text-slate-300'}`}>
                      {task.completed ? '✓' : '○'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function WeekView({ logs }) {
  const today = todayStr();
  const [weekStart, setWeekStart] = useState(() => getMondayOf(today));

  const logMap = Object.fromEntries(logs.map(l => [l.date, l]));

  const days = Array.from({ length: 7 }, (_, i) => {
    const dateStr = addDays(weekStart, i);
    const isFuture = dateStr > today;
    const log = logMap[dateStr];
    const state = getDayState(log, isFuture);
    const tasks = log?.tasks ?? [];
    const done = tasks.filter(t => t.completed).length;
    return {
      dateStr,
      isFuture,
      isToday: dateStr === today,
      state,
      done,
      total: tasks.length,
      num: new Date(dateStr + 'T00:00:00').getDate(),
      abbr: DAY_ABBR[i],
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 text-xl font-bold active:bg-slate-200"
        >‹</button>
        <span className="text-xs font-semibold text-slate-600">{formatWeekLabel(weekStart)}</span>
        <button
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 text-xl font-bold active:bg-slate-200"
        >›</button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {days.map(day => (
          <button
            key={day.dateStr}
            className={[
              'flex flex-col items-center gap-1 py-3 rounded-2xl',
              STATE_BG[day.state],
              STATE_TEXT[day.state],
              day.isToday ? 'ring-2 ring-slate-700 ring-offset-1' : '',
            ].join(' ')}
          >
            <span className="text-[10px] font-medium opacity-75 leading-none">{day.abbr}</span>
            <span className="text-base font-bold leading-none">{day.num}</span>
            {STATE_EMOJI[day.state] ? (
              <span className="text-[11px] leading-none">{STATE_EMOJI[day.state]}</span>
            ) : day.total > 0 && !day.isFuture ? (
              <span className="text-[9px] leading-none opacity-75">{day.done}/{day.total}</span>
            ) : (
              <span className="text-[9px] opacity-0 leading-none">·</span>
            )}
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-100">
        <WeekTaskList days={days} logMap={logMap} />
      </div>
    </div>
  );
}
