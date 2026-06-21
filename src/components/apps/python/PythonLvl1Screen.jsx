import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import lvl1 from '../../../data/python/lvl-1.json';
import { usePyodide } from '../../../hooks/usePyodide';
import { usePythonProgress } from '../../../hooks/usePythonProgress';

export default function PythonLvl1Screen() {
  const navigate = useNavigate();
  const { status } = usePyodide({ autoLoad: true });
  const { learned, count } = usePythonProgress();

  const total = lvl1.length;
  const pct = total ? Math.round((count / total) * 100) : 0;

  const statusLabel = useMemo(() => {
    if (status === 'loading') return 'Warming Python';
    if (status === 'error')   return 'Python unavailable';
    if (status === 'ready')   return 'Python ready';
    return 'Python idle';
  }, [status]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="px-4 pt-6 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/apps')}
          className="text-white/60 text-2xl leading-none w-8 h-8 flex items-center justify-center -ml-2"
          aria-label="Back"
        >‹</button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight">Python lvl-1</h1>
          <p className="text-xs text-white/40 mt-0.5">{statusLabel}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-emerald-300">{count}/{total}</div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider">learned</div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-emerald-400/60 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="px-3 pb-24 space-y-2">
        <button
          onClick={() => navigate('/apps/python-lvl-1/interview-essentials')}
          className="w-full flex items-center gap-3 rounded-xl bg-amber-400/[0.06] hover:bg-amber-400/[0.09] active:bg-amber-400/[0.12] border border-amber-400/15 transition-colors px-3 py-3 text-left mb-1"
        >
          <div className="text-2xl w-10 h-10 rounded-lg bg-amber-400/[0.08] flex items-center justify-center shrink-0">
            🎯
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-amber-300/70 font-medium uppercase tracking-wider">Pinned</span>
              <span className="text-sm font-medium text-amber-50 truncate">Interview Essentials</span>
            </div>
            <div className="text-[11px] text-amber-100/45 mt-0.5">13 must-remember gotchas</div>
          </div>
          {learned['interview-essentials'] && (
            <div className="shrink-0 w-5 h-5 rounded-full bg-amber-300/15 flex items-center justify-center">
              <svg viewBox="0 0 16 16" className="w-3 h-3 text-amber-200">
                <path fill="currentColor" d="M6.4 11.2L3.2 8l1.1-1.1 2.1 2.1 4.7-4.7 1.1 1.1z" />
              </svg>
            </div>
          )}
        </button>

        {lvl1.map((section, idx) => {
          const isLearned = !!learned[section.id];
          return (
            <button
              key={section.id}
              onClick={() => navigate(`/apps/python-lvl-1/${section.id}`)}
              className="w-full flex items-center gap-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] active:bg-white/[0.09] transition-colors px-3 py-3 text-left"
            >
              <div className="text-2xl w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                {section.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/30 font-mono w-5">{String(idx + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-medium text-white/85 truncate">{section.title}</span>
                </div>
                <div className="text-[11px] text-white/40 mt-0.5 ml-7">{section.concepts.length} concepts</div>
              </div>
              {isLearned && (
                <div className="shrink-0 w-5 h-5 rounded-full bg-emerald-400/15 flex items-center justify-center">
                  <svg viewBox="0 0 16 16" className="w-3 h-3 text-emerald-300">
                    <path fill="currentColor" d="M6.4 11.2L3.2 8l1.1-1.1 2.1 2.1 4.7-4.7 1.1 1.1z" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
