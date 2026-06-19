import { useState, useEffect } from 'react';
import { getAllLogs } from '../../db/queries';
import { calculateStreaks } from '../../utils/streakCalc';
import MonthCalendar from './MonthCalendar';
import WeekView from './WeekView';

const LEGEND = [
  { color: 'bg-green-400',  label: 'Complete' },
  { color: 'bg-green-200',  label: 'Partial'  },
  { color: 'bg-red-300',    label: 'Missed'   },
  { color: 'bg-blue-300',   label: 'Rest'     },
  { color: 'bg-amber-300',  label: 'Pause'    },
  { color: 'bg-violet-200', label: 'Planned'  },
];

export default function HistoryScreen() {
  const [logs, setLogs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]   = useState('month');

  useEffect(() => {
    getAllLogs().then(l => { setLogs(l); setLoading(false); });
  }, []);

  const { currentStreak, bestStreak } = calculateStreaks(logs);
  const totalActiveDays = logs.filter(l => {
    if (l.dayState !== 'active') return false;
    return (l.tasks ?? []).some(t => t.completed);
  }).length;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-slate-800 mb-4">History</h1>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <div className="text-lg font-bold text-slate-800 leading-none">
            {currentStreak > 0 ? `🔥 ${currentStreak}` : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">streak</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <div className="text-lg font-bold text-slate-800 leading-none">
            {bestStreak > 0 ? bestStreak : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">best</div>
        </div>
        <div className="bg-white rounded-2xl p-3 shadow-sm text-center">
          <div className="text-lg font-bold text-slate-800 leading-none">
            {totalActiveDays > 0 ? totalActiveDays : '—'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">total days</div>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
        {[
          { id: 'month', label: '📅 Month' },
          { id: 'week',  label: '📆 Week'  },
        ].map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={[
              'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
              view === v.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400',
            ].join(' ')}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        {loading ? (
          <div className="h-64 rounded-xl bg-slate-100 animate-pulse" />
        ) : view === 'month' ? (
          <MonthCalendar logs={logs} />
        ) : (
          <WeekView logs={logs} />
        )}

        <div className="flex items-center gap-x-3 gap-y-1.5 mt-4 flex-wrap">
          {LEGEND.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
              <span className="text-[10px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
