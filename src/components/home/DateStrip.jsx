import { useRef, useEffect } from 'react';
import { todayStr } from '../../utils/dateHelpers';

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildDays(count = 14) {
  const base = todayStr(); // local ISO date e.g. "2026-06-23"
  const [y, m, d] = base.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const local = new Date(y, m - 1, d + i);
    const yy = local.getFullYear();
    const mm = String(local.getMonth() + 1).padStart(2, '0');
    const dd = String(local.getDate()).padStart(2, '0');
    return {
      date:    `${yy}-${mm}-${dd}`,
      day:     DAY_ABBR[local.getDay()],
      num:     local.getDate(),
      isToday: i === 0,
    };
  });
}

export default function DateStrip({ selected, onSelect, taskCountByDate = {} }) {
  const days        = buildDays(14);
  const today       = todayStr();
  const stripRef    = useRef(null);
  const selectedRef = useRef(null);

  useEffect(() => {
    if (selectedRef.current && stripRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selected]);

  return (
    <div
      ref={stripRef}
      className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4"
      style={{ scrollbarWidth: 'none' }}
    >
      {days.map(({ date, day, num, isToday }) => {
        const isSel    = date === selected;
        const count    = taskCountByDate[date] ?? 0;
        const hasTasks = count > 0;
        const isFuture = date > today;

        return (
          <button
            key={date}
            ref={isSel ? selectedRef : null}
            onClick={() => onSelect(date)}
            className={[
              'flex flex-col items-center gap-0.5 rounded-2xl py-2 px-3 shrink-0 transition-colors',
              isSel
                ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                : isToday
                  ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100'
                  : 'bg-transparent text-slate-600 dark:text-slate-300',
            ].join(' ')}
          >
            <span className={`text-[10px] font-medium ${isSel ? 'text-slate-300 dark:text-slate-500' : 'text-slate-400 dark:text-slate-500'}`}>
              {isToday ? 'Today' : day}
            </span>
            <span className="text-sm font-bold leading-none">{num}</span>
            <span className={[
              'w-1 h-1 rounded-full mt-0.5',
              hasTasks
                ? isFuture
                  ? isSel ? 'bg-violet-300' : 'bg-violet-400'
                  : isSel ? 'bg-green-300'  : 'bg-green-400'
                : 'opacity-0',
            ].join(' ')} />
          </button>
        );
      })}
    </div>
  );
}
