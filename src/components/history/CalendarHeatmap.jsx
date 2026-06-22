const DOT_COLORS = {
  hit:     'bg-green-400',
  partial: 'bg-green-200',
  miss:    'bg-red-300',
  rest:    'bg-blue-300',
  pause:   'bg-amber-300',
  none:    'bg-slate-200 dark:bg-white/10',
  future:  'bg-slate-100 dark:bg-white/5',
  planned: 'bg-violet-200',
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildGrid(logs, weeksBack = 13) {
  const logMap = {};
  for (const log of logs) logMap[log.date] = log;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  // Monday of the current week
  const dow = today.getDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysFromMon);

  const start = new Date(thisMonday);
  start.setDate(thisMonday.getDate() - (weeksBack - 1) * 7);

  const weeks = [];
  const cur = new Date(start);

  for (let w = 0; w < weeksBack; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cur.toISOString().split('T')[0];
      const isFuture = cur > today;
      const log = logMap[dateStr];

      let state = 'none';
      if (isFuture) {
        state = (log && (log.tasks ?? []).length > 0) ? 'planned' : 'future';
      } else if (log) {
        if (log.dayState === 'rest')        state = 'rest';
        else if (log.dayState === 'pause')  state = 'pause';
        else {
          const tasks = log.tasks ?? [];
          const done  = tasks.filter(t => t.completed).length;
          if (tasks.length === 0)      state = 'none';
          else if (done === tasks.length) state = 'hit';
          else if (done > 0)           state = 'partial';
          else                         state = 'miss';
        }
      }

      week.push({ date: dateStr, state, month: cur.getMonth(), isToday: dateStr === todayStr });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

export default function CalendarHeatmap({ logs, onSelectDay }) {
  const weeks = buildGrid(logs);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-[3px] pt-5 shrink-0">
          {DAY_LABELS.map((lbl, i) => (
            <div
              key={i}
              className="w-5 h-[18px] text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-end pr-0.5"
            >
              {lbl}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, wi) => {
          const showMonth = wi === 0 || week[0].month !== weeks[wi - 1][0].month;
          return (
            <div key={wi} className="flex flex-col gap-[3px]">
              {/* Month label */}
              <div className="h-5 text-[10px] text-slate-400 dark:text-slate-500 flex items-end leading-none">
                {showMonth ? MONTH_NAMES[week[0].month] : ''}
              </div>

              {week.map((day) => (
                <button
                  key={day.date}
                  onClick={() => day.state !== 'future' && onSelectDay(day.date)}
                  title={day.state === 'planned' ? `${day.date} · Planned` : day.date}
                  className={[
                    'w-[18px] h-[18px] rounded-sm',
                    DOT_COLORS[day.state],
                    day.isToday ? 'ring-2 ring-slate-500 ring-offset-1' : '',
                    day.state !== 'future' ? 'cursor-pointer hover:opacity-75' : 'cursor-default',
                  ].join(' ')}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
