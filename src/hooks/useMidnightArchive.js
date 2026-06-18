import { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getAllTasks, getTodayLog, saveLog } from '../db/queries';
import { todayStr, getISOWeek } from '../utils/dateHelpers';

const BACKUP_PROMPT_KEY = 'df_last_backup_prompt';

function shouldShowBackupPrompt() {
  if (new Date().getDay() !== 1) return false; // Monday only
  const last = localStorage.getItem(BACKUP_PROMPT_KEY);
  if (!last) return true;
  return (Date.now() - new Date(last).getTime()) / 86400000 >= 6;
}

function markBackupPromptShown() {
  localStorage.setItem(BACKUP_PROMPT_KEY, new Date().toISOString());
}

export function useMidnightArchive() {
  const [loading, setLoading] = useState(true);

  const setTodayTasks       = useAppStore(s => s.setTodayTasks);
  const setTodayDayState    = useAppStore(s => s.setTodayDayState);
  const setShowBackupPrompt = useAppStore(s => s.setShowBackupPrompt);

  useEffect(() => {
    (async () => {
      try {
        const todayLog = await getTodayLog();

        if (todayLog) {
          // Same day — restore existing state
          setTodayTasks(todayLog.tasks ?? []);
          setTodayDayState(todayLog.dayState ?? 'active');
        } else {
          // New day — start fresh from templates and persist immediately
          const today     = todayStr();
          const templates = await getAllTasks();
          const tasks     = templates.map(t => ({ ...t, completed: false }));

          setTodayTasks(tasks);
          setTodayDayState('active');

          // Save initial log so the history heatmap knows this day is active
          try {
            await saveLog({
              date:       today,
              dayState:   'active',
              tasks,
              weekNumber: getISOWeek(today),
              createdAt:  new Date().toISOString(),
            });
          } catch (saveErr) {
            console.error('useMidnightArchive: failed to save initial log:', saveErr);
          }

          if (shouldShowBackupPrompt()) {
            setShowBackupPrompt(true);
            markBackupPromptShown();
          }
        }
      } catch (err) {
        console.error('useMidnightArchive failed:', err);
        // Fail silently — don't crash app, show stale state
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { loading };
}
