import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { saveLog, reorderTasks } from '../../db/queries';
import { useMidnightArchive } from '../../hooks/useMidnightArchive';
import { todayStr, getISOWeek } from '../../utils/dateHelpers';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import SortableTaskCard from './SortableTaskCard';
import MomentumBar from './MomentumBar';
import DayStateButton from './DayStateButton';
import HeroTitle from './HeroTitle';

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
  const setTodayTasks        = useAppStore(s => s.setTodayTasks);
  const updateTaskCompletion = useAppStore(s => s.updateTaskCompletion);
  const showToast            = useAppStore(s => s.showToast);
  const showBackupPrompt     = useAppStore(s => s.showBackupPrompt);
  const setShowBackupPrompt  = useAppStore(s => s.setShowBackupPrompt);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragEnd = useCallback(async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = todayTasks.findIndex(t => t.id === active.id);
    const newIndex = todayTasks.findIndex(t => t.id === over.id);
    const reordered = arrayMove(todayTasks, oldIndex, newIndex);
    setTodayTasks(reordered);
    await reorderTasks(reordered.map(t => t.id));
    const today = todayStr();
    await saveLog({
      date:       today,
      dayState:   useAppStore.getState().todayDayState,
      tasks:      reordered,
      weekNumber: getISOWeek(today),
      createdAt:  new Date().toISOString(),
    });
  }, [todayTasks, setTodayTasks]);

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
      <HeroTitle />
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
          <p className="text-sm text-slate-400 mb-6">Add your first task to get started.</p>
          <button
            onClick={() => navigate('/editor', { state: { fromHome: true } })}
            className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-semibold text-sm"
          >
            + Add Task
          </button>
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={todayTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-3">
                {todayTasks.map(task => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={(completed) => handleToggleComplete(task.id, completed)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <button
            onClick={() => navigate('/editor', { state: { fromHome: true } })}
            className="w-full mt-3 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-sm font-medium active:bg-slate-50"
          >
            + Add task
          </button>
        </>
      )}
    </div>
  );
}
