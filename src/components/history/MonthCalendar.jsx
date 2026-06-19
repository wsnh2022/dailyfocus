import { useState } from 'react';
import { todayStr } from '../../utils/dateHelpers';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

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

export default function MonthCalendar({ logs, onSelectDay }) {
  const today = todayStr();
  const [ym, setYm] = useState(() => today.slice(0, 7));

  const [year, month] = ym.split('-').map(Number);
  const logMap = Object.fromEntries(logs.map(l => [l.date, l]));

  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const leadingBlanks = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const prevMonth = () => {
    const d = new Date(Date.UTC(year, month - 2, 1));
    setYm(d.toISOString().slice(0, 7));
  };
  const nextMonth = () => {
    const d = new Date(Date.UTC(year, month, 1));
    setYm(d.toISOString().slice(0, 7));
  };

  const cells = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const dateStr = `${ym}-${String(i + 1).padStart(2, '0')}`;
      const isFuture = dateStr > today;
      const log = logMap[dateStr];
      const state = getDayState(log, isFuture);
      const tasks = log?.tasks ?? [];
      const done = tasks.filter(t => t.completed).length;
      return { dateStr, isFuture, isToday: dateStr === today, state, done, total: tasks.length, num: i + 1 };
    }),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 text-xl font-bold active:bg-slate-200"
        >‹</button>
        <span className="text-sm font-semibold text-slate-700">{MONTH_NAMES[month - 1]} {year}</span>
        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 text-xl font-bold active:bg-slate-200"
        >›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) =>
          cell === null ? (
            <div key={`b${i}`} />
          ) : (
            <button
              key={cell.dateStr}
              onClick={() => cell.state !== 'future' && onSelectDay(cell.dateStr)}
              className={[
                'aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5',
                STATE_BG[cell.state],
                STATE_TEXT[cell.state],
                cell.isToday ? 'ring-2 ring-slate-700 ring-offset-1' : '',
                cell.state !== 'future' ? 'active:opacity-70' : 'cursor-default',
              ].join(' ')}
            >
              <span className="text-sm font-bold leading-none">{cell.num}</span>
              {cell.total > 0 && !cell.isFuture && (
                <span className="text-[9px] leading-none opacity-80">{cell.done}/{cell.total}</span>
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
}
