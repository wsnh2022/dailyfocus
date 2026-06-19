import { useStreak } from '../../hooks/useStreak';
import { generateMessage } from '../../utils/momentumMessage';
import { useAppStore } from '../../store/useAppStore';

const DOT_STYLES = {
  hit:     'bg-green-400',
  partial: 'bg-green-200',
  miss:    'bg-red-300',
  rest:    'bg-blue-300',
  pause:   'bg-amber-300',
  none:    'bg-slate-200',
};

const DOT_LABELS = {
  hit:     'Complete',
  partial: 'Partial',
  miss:    'Missed',
  rest:    'Rest',
  pause:   'Pause',
  none:    'No data',
};

export default function MomentumBar() {
  const { data, loading } = useStreak();
  const todayTasks = useAppStore(s => s.todayTasks);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-3 h-[88px] animate-pulse" />
    );
  }

  const { currentStreak, bestStreak, yesterdayRate, weeklyAvgRate, dots } = data;
  const message = generateMessage({ streak: currentStreak, weeklyAvgRate, yesterdayRate });

  const total = todayTasks.length;
  const done  = todayTasks.filter(t => t.completed).length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm mb-3">
      {/* Stats row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-slate-800 leading-none">
              {currentStreak > 0 ? `🔥 ${currentStreak}` : '-'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">streak</div>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-center">
            <div className="text-lg font-bold text-slate-500 leading-none">{bestStreak}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">best</div>
          </div>
          {yesterdayRate !== null && (
            <>
              <div className="w-px h-8 bg-slate-100" />
              <div className="text-center">
                <div className="text-lg font-bold text-slate-500 leading-none">{yesterdayRate}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">yesterday</div>
              </div>
            </>
          )}
          {total > 0 && (
            <>
              <div className="w-px h-8 bg-slate-100" />
              <div className="text-center">
                <div className="text-lg font-bold text-slate-800 leading-none">{pct}%</div>
                <div className="text-[10px] text-slate-400 mt-0.5">today</div>
              </div>
            </>
          )}
        </div>

        {/* 7-day dots */}
        <div className="flex items-center gap-1">
          {dots.map((dot, i) => (
            <div
              key={dot.date}
              title={`${dot.date} · ${DOT_LABELS[dot.state]}`}
              className={`w-2.5 h-2.5 rounded-full ${DOT_STYLES[dot.state]}`}
            />
          ))}
        </div>
      </div>

      {/* Progress / message */}
      {total > 0 ? (
        <div className="flex items-center gap-2.5">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 font-medium shrink-0 tabular-nums">
            {done} / {total} done
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-500 italic leading-snug">{message}</p>
      )}
    </div>
  );
}
