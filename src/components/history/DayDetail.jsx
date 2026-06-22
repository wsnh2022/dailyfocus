import { useState, useEffect } from 'react';
import { getLogByDate } from '../../db/queries';
import { DAY_STATE_CONFIG } from '../../constants/dayStates';
import Modal from '../shared/Modal';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function DayDetail({ date, onClose }) {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLogByDate(date).then(l => { setLog(l); setLoading(false); });
  }, [date]);

  const cfg   = log ? (DAY_STATE_CONFIG[log.dayState] ?? DAY_STATE_CONFIG.active) : null;
  const tasks = log?.tasks ?? [];
  const done  = tasks.filter(t => t.completed).length;

  return (
    <Modal onClose={onClose}>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">{formatDate(date)}</p>

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">Loading…</div>
      ) : !log ? (
        <div className="py-10 text-center">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-sm text-slate-500 dark:text-slate-300">No data for this day.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {cfg.emoji} {cfg.label}
            </h2>
            {tasks.length > 0 && (
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                {done}/{tasks.length} done
              </span>
            )}
          </div>

          {tasks.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No tasks logged.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task, i) => (
                <li
                  key={task.id ?? i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5"
                >
                  <span className="text-lg">{task.emoji}</span>
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
        </>
      )}
    </Modal>
  );
}
