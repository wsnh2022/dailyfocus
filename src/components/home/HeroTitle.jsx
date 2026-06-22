import { useAppStore } from '../../store/useAppStore';

export default function HeroTitle() {
  const heroSubtitle = useAppStore(s => s.heroSubtitle);
  const theme        = useAppStore(s => s.theme);
  const setTheme     = useAppStore(s => s.setTheme);
  const isDark = theme === 'dark';

  return (
    <div className="px-1 pt-2 pb-3 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
          DailyFocus
        </h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-0.5">{heroSubtitle}</p>
      </div>
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="shrink-0 w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center text-base active:scale-95 transition-transform"
      >
        {isDark ? '☀️' : '🌙'}
      </button>
    </div>
  );
}
