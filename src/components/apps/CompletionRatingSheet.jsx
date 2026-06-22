import { useEffect, useState } from 'react';

export default function CompletionRatingSheet({ open, onRate, onSkip }) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (open) {
      const raf = requestAnimationFrame(() => setAnimateIn(true));
      return () => cancelAnimationFrame(raf);
    }
    setAnimateIn(false);
  }, [open]);

  if (!open) return null;

  const handleRate = (rating) => {
    setAnimateIn(false);
    setTimeout(() => onRate(rating), 220);
  };

  const handleSkip = () => {
    setAnimateIn(false);
    setTimeout(onSkip, 220);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 pointer-events-auto ${
          animateIn ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleSkip}
      />
      <div
        className={`relative w-full max-w-md bg-slate-900 border-t border-white/10 rounded-t-2xl px-5 pt-6 pb-7 pointer-events-auto transition-transform duration-300 ease-out ${
          animateIn ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ boxShadow: '0 -10px 40px rgba(0,0,0,0.35)' }}
      >
        <div className="mx-auto w-10 h-1 rounded-full bg-white/15 mb-5" />
        <h2 className="text-center text-white/90 text-base font-semibold tracking-tight mb-1">
          How did that read?
        </h2>
        <p className="text-center text-white/40 text-[12px] mb-5">
          Honest gut-check, no wrong answer
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleRate('got-it')}
            className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 hover:bg-emerald-400/15 active:bg-emerald-400/20 transition-colors px-3 py-4 text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-100 text-[14px] font-semibold">Got it</span>
            </div>
            <p className="text-emerald-100/55 text-[11.5px] leading-snug">I can read this cleanly</p>
          </button>

          <button
            onClick={() => handleRate('read-again')}
            className="rounded-xl border border-amber-400/25 bg-amber-400/10 hover:bg-amber-400/15 active:bg-amber-400/20 transition-colors px-3 py-4 text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-100 text-[14px] font-semibold">Read again</span>
            </div>
            <p className="text-amber-100/55 text-[11.5px] leading-snug">Come back to this</p>
          </button>
        </div>

        <button
          onClick={handleSkip}
          className="block mx-auto mt-4 text-white/35 hover:text-white/65 text-[12px] py-1.5 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
