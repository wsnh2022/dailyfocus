export default function TimerDisplay({ formatted, phase, currentSet, totalSets }) {
  return (
    <div>
      <p className="text-sm font-mono font-semibold text-slate-400 leading-none mt-0.5">{formatted}</p>
      {phase && phase !== 'idle' && phase !== 'done' && (
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            phase === 'work' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
          }`}>
            {phase === 'work' ? 'WORK' : 'BREAK'}
          </span>
          <span className="text-xs text-slate-400">Set {currentSet}/{totalSets}</span>
        </div>
      )}
    </div>
  );
}
