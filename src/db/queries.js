import { db } from './schema';
import { getISOWeek, tomorrowStr } from '../utils/dateHelpers';

// --- Task Templates ---
export const getAllTasks = () =>
  db.task_templates.orderBy('sortOrder').toArray();

export const getTaskById = (id) =>
  db.task_templates.get(id);

export const addTask = (task) =>
  db.task_templates.add(task);

export const updateTask = (id, changes) =>
  db.task_templates.update(id, changes);

export const deleteTask = (id) =>
  db.task_templates.delete(id);

export const reorderTasks = async (orderedIds) => {
  await db.transaction('rw', db.task_templates, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.task_templates.update(orderedIds[i], { sortOrder: i });
    }
  });
};

// --- Daily Logs ---
export const getLogByDate = (date) =>
  db.daily_logs.get(date);

export const getTodayLog = () => {
  const today = new Date().toISOString().split('T')[0];
  return db.daily_logs.get(today);
};

export const saveLog = (log) =>
  db.daily_logs.put(log);

export const getLogRange = (startDate, endDate) =>
  db.daily_logs.where('date').between(startDate, endDate, true, true).toArray();

export const getAllLogs = () =>
  db.daily_logs.orderBy('date').toArray();

export const getLastNLogs = (n) =>
  db.daily_logs.orderBy('date').reverse().limit(n).toArray();

export const addTaskToDateLog = async (dateStr, taskData) => {
  const existing = await getLogByDate(dateStr);
  const task = {
    ...taskData,
    id: `pp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    completed: false,
  };
  const tasks = [...(existing?.tasks ?? []), task];
  return saveLog({
    date:       dateStr,
    dayState:   existing?.dayState  ?? 'active',
    tasks,
    weekNumber: existing?.weekNumber ?? getISOWeek(dateStr),
    createdAt:  existing?.createdAt  ?? new Date().toISOString(),
    prePlanned: true,
  });
};

export const getUpcomingLogs = () =>
  db.daily_logs.where('date').aboveOrEqual(tomorrowStr()).toArray();

export const removeTaskFromLog = async (dateStr, taskId) => {
  const log = await getLogByDate(dateStr);
  if (!log) return;
  return saveLog({ ...log, tasks: (log.tasks ?? []).filter(t => t.id !== taskId) });
};

// --- Pomodoro Sessions ---
export const addSession = (session) =>
  db.pomodoro_sessions.add(session);

export const getSessionsByDate = (date) =>
  db.pomodoro_sessions.where('date').equals(date).toArray();
