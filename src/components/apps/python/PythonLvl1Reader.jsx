import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import lvl1 from '../../../data/python/lvl-1.json';
import interviewEssentials from '../../../data/python/interview-essentials.json';
import { usePythonProgress } from '../../../hooks/usePythonProgress';
import CodeBlock from './CodeBlock';
import ConceptTable from './ConceptTable';

function IndentLine({ text, tone = 'correct' }) {
  const dotColor = tone === 'correct' ? 'text-emerald-300/30' : 'text-rose-300/35';
  const textColor = tone === 'correct' ? 'text-emerald-100/85' : 'text-rose-100/80';
  const m = text.match(/^( *)(.*)$/);
  const spaces = m ? m[1].length : 0;
  const groups = Math.floor(spaces / 4);
  const remainder = spaces % 4;
  const rest = m ? m[2] : text;
  return (
    <div className="font-mono text-[12.5px] leading-relaxed whitespace-pre">
      {Array.from({ length: groups }).map((_, i) => (
        <span key={i} className={dotColor}>····</span>
      ))}
      {remainder > 0 && <span className={dotColor}>{'·'.repeat(remainder)}</span>}
      <span className={textColor}>{rest}</span>
    </div>
  );
}

function IndentVisual({ correctTitle, correctCode, wrongTitle, wrongCode }) {
  const correctLines = correctCode.split('\n');
  const wrongLines   = wrongCode.split('\n');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div className="rounded-xl bg-black/40 border border-emerald-400/15 overflow-hidden">
        <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-emerald-300/70 border-b border-emerald-400/10 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
          {correctTitle}
        </div>
        <div className="px-3.5 py-3 overflow-x-auto">
          {correctLines.map((line, i) => <IndentLine key={i} text={line} tone="correct" />)}
        </div>
      </div>
      <div className="rounded-xl bg-black/40 border border-rose-400/15 overflow-hidden">
        <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-rose-300/70 border-b border-rose-400/10 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400/60" />
          {wrongTitle}
        </div>
        <div className="px-3.5 py-3 overflow-x-auto">
          {wrongLines.map((line, i) => <IndentLine key={i} text={line} tone="wrong" />)}
        </div>
      </div>
    </div>
  );
}

export default function PythonLvl1Reader() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const { learned, setSectionLearned } = usePythonProgress();
  const [scrollPct, setScrollPct] = useState(0);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const pct = total > 0 ? Math.min(100, Math.max(0, (h.scrollTop / total) * 100)) : 0;
      setScrollPct(pct);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [sectionId]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setMounted(false);
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, [sectionId]);

  const isInterview = sectionId === 'interview-essentials';

  const { section, index, next, prev } = useMemo(() => {
    if (isInterview) {
      return { section: interviewEssentials, index: -1, next: null, prev: null };
    }
    const idx = lvl1.findIndex((s) => s.id === sectionId);
    return {
      section: idx >= 0 ? lvl1[idx] : null,
      index: idx,
      next: idx >= 0 && idx < lvl1.length - 1 ? lvl1[idx + 1] : null,
      prev: idx > 0 ? lvl1[idx - 1] : null,
    };
  }, [sectionId, isInterview]);

  if (!section) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <button onClick={() => navigate('/apps/python-lvl-1')} className="text-white/60">‹ Back</button>
        <p className="mt-6 text-white/60 text-sm">Section not found.</p>
      </div>
    );
  }

  const isLearned = !!learned[section.id];
  const accent = isInterview ? 'amber' : 'emerald';
  const progressBarColor = isInterview ? 'bg-amber-400/60' : 'bg-emerald-400/50';
  const subsectionColor  = isInterview ? 'text-amber-300/80' : 'text-emerald-300/70';
  const learnedActive    = isInterview ? 'bg-amber-400/15 text-amber-200' : 'bg-emerald-400/15 text-emerald-200';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="sticky top-0 z-10 backdrop-blur bg-slate-950/85 border-b border-white/5">
        <div className="h-0.5 bg-white/5">
          <div
            className={`h-full ${progressBarColor} transition-[width] duration-150`}
            style={{ width: `${scrollPct}%` }}
          />
        </div>
        <div className="px-4 pt-5 pb-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/apps/python-lvl-1')}
            className="text-white/60 text-2xl leading-none w-8 h-8 flex items-center justify-center -ml-2"
            aria-label="Back"
          >‹</button>
          <div className="flex-1 min-w-0">
            <div className={`text-[10px] font-mono uppercase tracking-wider ${isInterview ? 'text-amber-300/60' : 'text-white/30'}`}>
              {isInterview ? 'Pinned' : `${String(index + 1).padStart(2, '0')} of ${String(lvl1.length).padStart(2, '0')}`}
            </div>
            <h1 className="text-lg font-semibold truncate tracking-tight">{section.title}</h1>
          </div>
          <div className="text-2xl">{section.emoji}</div>
        </div>
      </div>

      <div
        className="px-4 pt-4 pb-32 transition-opacity duration-300"
        style={{ opacity: mounted ? 1 : 0 }}
      >
        <p className="text-[14px] text-white/65 leading-relaxed mb-5 font-medium">{section.intro}</p>

        <div key={sectionId} className="space-y-3">
          {section.concepts.map((c, i) => {
            if (c.kind === 'subsection') {
              return (
                <div key={i} className="pt-3 pb-1">
                  <h3 className={`text-[12.5px] uppercase tracking-[0.18em] font-bold ${subsectionColor}`}>{c.title}</h3>
                </div>
              );
            }
            if (c.kind === 'paragraph') {
              return (
                <p key={i} className="text-[14px] text-white/70 leading-relaxed">{c.text}</p>
              );
            }
            if (c.kind === 'interviewer-asks') {
              return (
                <div key={i} className="flex items-start gap-2 -mt-1">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-amber-300/80 font-bold mt-1 shrink-0">Asks</span>
                  <p className="text-[13.5px] text-amber-50/90 italic leading-relaxed font-medium">{c.text}</p>
                </div>
              );
            }
            if (c.kind === 'remember') {
              return (
                <div key={i} className="pt-2 pl-3 border-l-2 border-amber-400/20">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300/70 font-bold mb-1">Remember</div>
                  <p className="text-[13.5px] text-white/75 leading-relaxed">{c.text}</p>
                </div>
              );
            }
            if (c.kind === 'indent-visual') {
              return <IndentVisual key={i} {...c} />;
            }
            if (c.kind === 'warning') {
              return (
                <div key={i} className="rounded-xl bg-amber-400/[0.07] border border-amber-400/15 px-3.5 py-3">
                  <div className="flex gap-2">
                    <span className="text-amber-300 text-sm leading-tight">!</span>
                    <p className="text-[13.5px] text-amber-100/90 leading-relaxed font-medium">{c.text}</p>
                  </div>
                </div>
              );
            }
            if (c.kind === 'table') {
              return <ConceptTable key={i} headers={c.headers} rows={c.rows} />;
            }
            if (c.kind === 'code') {
              return <CodeBlock key={i} code={c.code} />;
            }
            return null;
          })}
        </div>
      </div>

      <div className="fixed bottom-16 inset-x-0 max-w-md mx-auto backdrop-blur bg-slate-950/90 border-t border-white/5 px-4 py-3 flex items-center gap-2">
        <button
          onClick={() => prev && navigate(`/apps/python-lvl-1/${prev.id}`)}
          disabled={!prev}
          className="w-10 h-10 rounded-lg bg-white/[0.04] disabled:opacity-30 text-white/70 text-xl"
        >‹</button>
        <button
          onClick={() => setSectionLearned(section.id, !isLearned)}
          className={`flex-1 h-10 rounded-lg text-[13px] font-medium transition-colors ${
            isLearned ? learnedActive : 'bg-white/[0.05] text-white/65'
          }`}
        >
          {isLearned ? 'Learned ✓' : 'Mark as learned'}
        </button>
        <button
          onClick={() => next && navigate(`/apps/python-lvl-1/${next.id}`)}
          disabled={!next}
          className="w-10 h-10 rounded-lg bg-white/[0.04] disabled:opacity-30 text-white/70 text-xl"
        >›</button>
      </div>
    </div>
  );
}
