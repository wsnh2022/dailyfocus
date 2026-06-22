const TYPES = [
  { value: 'checkbox',  label: '✓ Check'    },
  { value: 'countdown', label: '⏱ Timer'    },
  { value: 'pomodoro',  label: '🍅 Pomodoro' },
];

export default function TimerTypeSelect({ value, onChange }) {
  return (
    <div className="flex mt-2 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
      {TYPES.map(({ value: v, label }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            value === v ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
