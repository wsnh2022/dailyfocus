const TYPES = [
  { value: 'checkbox',  label: '✓ Check'    },
  { value: 'countdown', label: '⏱ Timer'    },
  { value: 'pomodoro',  label: '🍅 Pomodoro' },
];

export default function TimerTypeSelect({ value, onChange }) {
  return (
    <div className="flex mt-2 rounded-xl border border-slate-200 overflow-hidden">
      {TYPES.map(({ value: v, label }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            value === v ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
