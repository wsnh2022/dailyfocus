import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { saveLog, reorderTasks, getUpcomingLogs } from '../../db/queries';
import { useMidnightArchive } from '../../hooks/useMidnightArchive';
import { todayStr, tomorrowStr, getISOWeek } from '../../utils/dateHelpers';
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

  const [upcomingLogs, setUpcomingLogs]   = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const tomorrow = tomorrowStr();

  useEffect(() => {
    getUpcomingLogs().then(logs => setUpcomingLogs(logs.filter(l => l.tasks?.length > 0)));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragEnd = useCallback(async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const current   = useAppStore.getState().todayTasks;
    const pending   = current.filter(t => !t.completed);
    const completed = current.filter(t =>  t.completed);
    const oldIndex  = pending.findIndex(t => t.id === active.id);
    const newIndex  = pending.findIndex(t => t.id === over.id);
    const reordered = [...arrayMove(pending, oldIndex, newIndex), ...completed];
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
  }, [setTodayTasks]);

  const handleToggleComplete = useCallback(async (taskId, completed) => {
    updateTaskCompletion(taskId, completed);
    // Sink completed tasks to the bottom, keep relative order within each group
    const latest = useAppStore.getState().todayTasks;
    const sorted = [
      ...latest.filter(t => !t.completed),
      ...latest.filter(t =>  t.completed),
    ];
    setTodayTasks(sorted);
    try {
      const today = todayStr();
      await saveLog({
        date:       today,
        dayState:   useAppStore.getState().todayDayState,
        tasks:      sorted,
        weekNumber: getISOWeek(today),
        createdAt:  new Date().toISOString(),
      });
    } catch {
      showToast('Failed to save progress', 'error');
    }
  }, [updateTaskCompletion, setTodayTasks, showToast]);

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
      ) : (() => {
        const pendingTasks   = todayTasks.filter(t => !t.completed);
        const completedTasks = todayTasks.filter(t =>  t.completed);
        return (
          <>
            {pendingTasks.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={pendingTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <ul className="space-y-3">
                    {pendingTasks.map(task => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onToggleComplete={(completed) => handleToggleComplete(task.id, completed)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}

            {completedTasks.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowCompleted(v => !v)}
                  className="flex items-center gap-1.5 w-full py-2 text-sm text-slate-400 font-medium"
                >
                  <span className={`text-base leading-none transition-transform duration-200 inline-block ${showCompleted ? 'rotate-90' : ''}`}>›</span>
                  Completed ({completedTasks.length})
                </button>
                {showCompleted && (
                  <ul className="space-y-2">
                    {completedTasks.map(task => (
                      <li
                        key={task.id}
                        className="flex items-center gap-3 bg-white rounded-2xl px-3 py-2.5 shadow-sm opacity-70"
                      >
                        <span className="text-xl leading-none">{task.emoji}</span>
                        <span className="flex-1 text-sm text-slate-400 line-through">{task.name}</span>
                        <button
                          onClick={() => handleToggleComplete(task.id, false)}
                          className="w-6 h-6 rounded-full bg-green-100 text-green-500 text-xs flex items-center justify-center shrink-0"
                          aria-label="Mark incomplete"
                        >
                          ✓
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <button
              onClick={() => navigate('/editor', { state: { fromHome: true } })}
              className="w-full mt-3 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-sm font-medium active:bg-slate-50"
            >
              + Add task
            </button>
          </>
        );
      })()}

      {upcomingLogs.length > 0 && (
        <div className="mt-5">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Upcoming</h2>
          <div className="space-y-2">
            {upcomingLogs.map(log => (
              <div key={log.date} className="bg-white rounded-2xl p-3 shadow-sm">
                <p className="text-xs font-semibold text-slate-400 mb-2">
                  📅 {log.date === tomorrow ? 'Tomorrow' : log.date}
                </p>
                <div className="space-y-1.5">
                  {(log.tasks ?? []).map(t => (
                    <div key={t.id} className="flex items-center gap-2">
                      <span className="text-base leading-none">{t.emoji}</span>
                      <span className="text-sm text-slate-700 font-medium">{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
