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

export default function WeekView({ logs, onSelectDay }) {
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

      <div className="grid grid-cols-7 gap-1.5">
        {days.map(day => (
          <button
            key={day.dateStr}
            onClick={() => day.state !== 'future' && onSelectDay(day.dateStr)}
            className={[
              'flex flex-col items-center gap-1 py-3 rounded-2xl transition-opacity',
              STATE_BG[day.state],
              STATE_TEXT[day.state],
              day.isToday ? 'ring-2 ring-slate-700 ring-offset-1' : '',
              day.state !== 'future' ? 'active:opacity-70' : 'cursor-default',
            ].join(' ')}
          >
            <span className="text-[10px] font-medium opacity-75 leading-none">{day.abbr}</span>
            <span className="text-base font-bold leading-none">{day.num}</span>
            {day.total > 0 && !day.isFuture ? (
              <span className="text-[9px] leading-none opacity-75">{day.done}/{day.total}</span>
            ) : (
              <span className="text-[9px] opacity-0 leading-none">·</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
