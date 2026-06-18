import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { saveLog } from '../../db/queries';
import { useMidnightArchive } from '../../hooks/useMidnightArchive';
import { todayStr, getISOWeek } from '../../utils/dateHelpers';
import TaskCard from './TaskCard';
import MomentumBar from './MomentumBar';
import DayStateButton from './DayStateButton';

function BackupBanner({ onDismiss, onGoBackup }) {
  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-3">
      <span className="text-base shrink-0">💾</span>
      <p className="text-xs text-amber-800 flex-1 font-medium">
        Weekly reminder: back up your data.
      </p>
      <button
        onClick={onGoBackup}
        className="text-xs font-semibold text-amber-700 underline shrink-0"
      >
        Back up
      </button>
      <button onClick={onDismiss} className="text-amber-400 text-sm ml-1 shrink-0">✕</button>
    </div>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { loading } = useMidnightArchive();

  const todayTasks           = useAppStore(s => s.todayTasks);
  const updateTaskCompletion = useAppStore(s => s.updateTaskCompletion);
  const showToast            = useAppStore(s => s.showToast);
  const showBackupPrompt     = useAppStore(s => s.showBackupPrompt);
  const setShowBackupPrompt  = useAppStore(s => s.setShowBackupPrompt);

  const handleToggleComplete = useCallback(async (taskId, completed) => {
    updateTaskCompletion(taskId, completed);
    try {
      const today       = todayStr();
      const latestTasks = useAppStore.getState().todayTasks;
      await saveLog({
        date:       today,
        dayState:   useAppStore.getState().todayDayState,
        tasks:      latestTasks,
        weekNumber: getISOWeek(today),
        createdAt:  new Date().toISOString(),
      });
    } catch {
      showToast('Failed to save progress', 'error');
    }
  }, [updateTaskCompletion, showToast]);

  if (loading) {
    return <div className="p-4 text-sm text-slate-400">Loading…</div>;
  }

  return (
    <div className="p-4">
      <MomentumBar />

      {showBackupPrompt && (
        <BackupBanner
          onDismiss={() => setShowBackupPrompt(false)}
          onGoBackup={() => { setShowBackupPrompt(false); navigate('/settings'); }}
        />
      )}

      <DayStateButton />

      {todayTasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-slate-500 font-medium mb-1">No tasks yet.</p>
          <p className="text-sm text-slate-400 mb-6">Tap + to add your first task.</p>
          <button
            onClick={() => navigate('/editor')}
            className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-semibold text-sm"
          >
            + Add Tasks
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {todayTasks.map(task => (
            <li key={task.id}>
              <TaskCard
                task={task}
                onToggleComplete={(completed) => handleToggleComplete(task.id, completed)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
