import { useState } from 'react';
import { todayStr } from '../../utils/dateHelpers';
import { CalendarLegend } from './HistoryScreen';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const STATE_BG = {
  hit:     'bg-green-400',
  partial: 'bg-green-200',
  miss:    'bg-red-300',
  rest:    'bg-blue-300',
  pause:   'bg-amber-300',
  planned: 'bg-violet-200',
  none:    'bg-slate-100 dark:bg-white/5',
  future:  'bg-slate-50 dark:bg-white/[0.02]',
};

const STATE_TEXT = {
  hit:     'text-white',
  partial: 'text-green-800',
  miss:    'text-white',
  rest:    'text-white',
  pause:   'text-amber-900',
  planned: 'text-violet-700',
  none:    'text-slate-400 dark:text-slate-500',
  future:  'text-slate-300 dark:text-slate-600',
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

function MonthSummary({ logs, ym }) {
  const monthLogs = logs.filter(l => l.date.startsWith(ym));
  const activeLogs = monthLogs.filter(l => l.dayState === 'active' && (l.tasks ?? []).length > 0);
  const activeDays = activeLogs.filter(l => l.tasks.some(t => t.completed)).length;
  const totalDone  = monthLogs.reduce((s, l) => s + (l.tasks ?? []).filter(t => t.completed).length, 0);
  const rates      = activeLogs.map(l => l.tasks.filter(t => t.completed).length / l.tasks.length * 100);
  const avgRate    = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
  const restDays   = monthLogs.filter(l => l.dayState === 'rest').length;
  const pauseDays  = monthLogs.filter(l => l.dayState === 'pause').length;

  if (monthLogs.length === 0) return (
    <div className="text-center py-6 text-sm text-slate-400 dark:text-slate-500">No data for this month yet.</div>
  );

  return (
    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
      {[
        { label: 'Active days',   value: activeDays },
        { label: 'Avg completion', value: `${avgRate}%` },
        { label: 'Tasks done',    value: totalDone },
        { label: 'Rest · Pause',  value: `${restDays} · ${pauseDays}` },
      ].map(({ label, value }) => (
        <div key={label} className="bg-slate-50 dark:bg-white/5 rounded-xl px-3 py-2.5">
          <div className="text-base font-bold text-slate-700 dark:text-slate-100 leading-none">{value}</div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

function InlineDayDetail({ log, dateStr, onClose }) {
  const tasks = log?.tasks ?? [];
  const done  = tasks.filter(t => t.completed).length;
  const label = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const stateEmoji = log ? (STATE_EMOJI[log.dayState] ?? '✅') : '';

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {stateEmoji} {log ? `${done}/${tasks.length} done` : 'No data'}
          </p>
        </div>
        <button onClick={onClose} className="text-slate-300 dark:text-slate-600 text-lg leading-none active:text-slate-500">✕</button>
      </div>
      {tasks.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-3">No tasks logged.</p>
      ) : (
        <ul className="space-y-1.5">
          {tasks.map((task, i) => (
            <li key={task.id ?? i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5">
              <span className="text-base leading-none">{task.emoji}</span>
              <span className={`flex-1 text-sm ${task.completed ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 line-through'}`}>
                {task.name}
              </span>
              <span className={`text-sm font-medium ${task.completed ? 'text-green-500 dark:text-emerald-300' : 'text-slate-300 dark:text-slate-600'}`}>
                {task.completed ? '✓' : '○'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MonthCalendar({ logs, onSelectDay }) {
  const today = todayStr();
  const [ym, setYm]               = useState(() => today.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(null);

  const [year, month] = ym.split('-').map(Number);
  const logMap = Object.fromEntries(logs.map(l => [l.date, l]));

  const firstDow     = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const leadingBlanks = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth  = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const prevMonth = () => { setYm(new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 7)); setSelectedDate(null); };
  const nextMonth = () => { setYm(new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 7)); setSelectedDate(null); };

  const handleSelect = (dateStr, state) => {
    if (state === 'future') return;
    setSelectedDate(prev => prev === dateStr ? null : dateStr);
    onSelectDay?.(dateStr);
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

  const selectedLog = selectedDate ? (logMap[selectedDate] ?? null) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xl font-bold active:bg-slate-200 dark:active:bg-white/10">‹</button>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{MONTH_NAMES[month - 1]} {year}</span>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xl font-bold active:bg-slate-200 dark:active:bg-white/10">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) =>
          cell === null ? (
            <div key={`b${i}`} />
          ) : (
            <button
              key={cell.dateStr}
              onClick={() => handleSelect(cell.dateStr, cell.state)}
              className={[
                'aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5',
                STATE_BG[cell.state],
                STATE_TEXT[cell.state],
                cell.isToday ? 'ring-2 ring-slate-700 ring-offset-1' : '',
                selectedDate === cell.dateStr ? 'ring-2 ring-slate-400 ring-offset-1' : '',
                cell.state !== 'future' ? 'active:opacity-70' : 'cursor-default',
              ].join(' ')}
            >
              <span className="text-sm font-bold leading-none">{cell.num}</span>
              {STATE_EMOJI[cell.state] ? (
                <span className="text-[10px] leading-none">{STATE_EMOJI[cell.state]}</span>
              ) : cell.total > 0 && !cell.isFuture ? (
                <span className="text-[9px] leading-none opacity-80">{cell.done}/{cell.total}</span>
              ) : null}
            </button>
          )
        )}
      </div>

      <CalendarLegend />

      {selectedDate ? (
        <InlineDayDetail
          log={selectedLog}
          dateStr={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      ) : (
        <MonthSummary logs={logs} ym={ym} />
      )}
    </div>
  );
}
