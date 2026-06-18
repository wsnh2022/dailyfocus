import Dexie from 'dexie';

export const db = new Dexie('DailyFocusDB');

db.version(1).stores({
  task_templates: '++id, name, emoji, color, taskType, duration, durationUnit, workMin, breakMin, sets, sortOrder',
  daily_logs: '&date, dayState, tasks, weekNumber, createdAt, archivedAt',
  pomodoro_sessions: '++id, date, taskId, taskName, setNumber, totalSets, workMin, breakMin, completedAt'
});

export default db;
