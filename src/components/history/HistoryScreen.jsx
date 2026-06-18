import { useState, useEffect } from 'react';
import { getAllLogs } from '../../db/queries';
import { calculateStreaks } from '../../utils/streakCalc';
import CalendarHeatmap from './CalendarHeatmap';
import DayDetail from './DayDetail';

const LEGEND = [
  { color: 'bg-green-400', label: 'Complete' },
  { color: 'bg-green-200', label: 'Partial'  },
  { color: 'bg-red-300',   label: 'Missed'   },
  { color: 'bg-blue-300',  label: 'Rest'     },
  { color: 'bg-amber-300', label: 'Pause'    },
];

export default function HistoryScreen() {
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

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
      <div className="grid grid-cols-3 gap-3 mb-5">
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

      {/* Heatmap card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Last 13 Weeks</h2>

        {loading ? (
          <div className="h-36 rounded-xl bg-slate-100 animate-pulse" />
        ) : (
          <CalendarHeatmap logs={logs} onSelectDay={setSelectedDate} />
        )}

        {/* Legend */}
        <div className="flex items-center gap-x-3 gap-y-1.5 mt-3 flex-wrap">
          {LEGEND.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
              <span className="text-[10px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedDate && (
        <DayDetail date={selectedDate} onClose={() => setSelectedDate(null)} />
      )}
    </div>
  );
}
