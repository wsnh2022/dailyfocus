import { useAppStore } from '../../store/useAppStore';

export default function HeroTitle() {
  const heroSubtitle = useAppStore(s => s.heroSubtitle);

  return (
    <div className="px-1 pt-2 pb-3">
      <h1 className="text-3xl font-black text-slate-900 leading-tight tracking-tight">
        DailyFocus
      </h1>
      <p className="text-sm text-slate-400 font-medium mt-0.5">{heroSubtitle}</p>
    </div>
  );
}
