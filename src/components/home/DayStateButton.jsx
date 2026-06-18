import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getAllLogs, saveLog } from '../../db/queries';
import { DAY_STATE_CONFIG } from '../../constants/dayStates';
import { canSetDayState } from '../../utils/dayStateValidator';
import { todayStr, getISOWeek } from '../../utils/dateHelpers';
import Modal from '../shared/Modal';

const STATES = ['active', 'rest', 'pause'];

export default function DayStateButton() {
  const todayDayState    = useAppStore(s => s.todayDayState);
  const setTodayDayState = useAppStore(s => s.setTodayDayState);
  const todayTasks       = useAppStore(s => s.todayTasks);
  const showToast        = useAppStore(s => s.showToast);

  const [showPicker, setShowPicker]   = useState(false);
  const [blockReason, setBlockReason] = useState(null);

  const handleSelect = async (newState) => {
    setShowPicker(false);
    if (newState === todayDayState) return;

    try {
      const allLogs = await getAllLogs();
      const result  = await canSetDayState(newState, allLogs);

      if (!result.allowed) { setBlockReason(result.reason); return; }

      setTodayDayState(newState);

      const today = todayStr();
      await saveLog({
        date:       today,
        dayState:   newState,
        tasks:      todayTasks,
        weekNumber: getISOWeek(today),
        createdAt:  new Date().toISOString(),
      });
    } catch {
      showToast('Failed to update day type', 'error');
    }
  };

  const cfg = DAY_STATE_CONFIG[todayDayState] ?? DAY_STATE_CONFIG.active;

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-sm border border-slate-200 text-sm font-medium text-slate-700"
        >
          <span>{cfg.emoji}</span>
          <span>{cfg.label}</span>
          <span className="text-slate-400 text-xs ml-0.5">▾</span>
        </button>
      </div>

      {showPicker && (
        <Modal onClose={() => setShowPicker(false)}>
          <h2 className="text-lg font-bold text-slate-800 mb-4">Set Day Type</h2>
          <div className="space-y-2">
            {STATES.map(key => {
              const { label, emoji } = DAY_STATE_CONFIG[key];
              return (
                <button
                  key={key}
                  onClick={() => handleSelect(key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    todayDayState === key ? 'bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className={`text-sm ${todayDayState === key ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                    {label}
                  </span>
                  {todayDayState === key && (
                    <span className="ml-auto text-xs text-slate-400">current</span>
                  )}
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {blockReason && (
        <Modal onClose={() => setBlockReason(null)}>
          <div className="text-center py-2">
            <div className="text-4xl mb-3">🚫</div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Can't set that</h2>
            <p className="text-sm text-slate-500 mb-6">{blockReason}</p>
            <button
              onClick={() => setBlockReason(null)}
              className="w-full py-3 rounded-xl bg-slate-800 text-white font-semibold text-sm"
            >
              Got it
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
