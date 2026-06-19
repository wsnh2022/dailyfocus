import { db } from '../db/schema';

export async function exportBackup() {
  const [templates, logs, sessions] = await Promise.all([
    db.task_templates.toArray(),
    db.daily_logs.toArray(),
    db.pomodoro_sessions.toArray(),
  ]);

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    task_templates: templates,
    daily_logs: logs,
    pomodoro_sessions: sessions,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `dailyfocus-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!data.version || data.version !== 1) {
          reject(new Error('Unsupported backup format.'));
          return;
        }

        await db.transaction('rw', [db.task_templates, db.daily_logs, db.pomodoro_sessions], async () => {
          await db.task_templates.clear();
          await db.daily_logs.clear();
          await db.pomodoro_sessions.clear();

          if (data.task_templates?.length)    await db.task_templates.bulkPut(data.task_templates);
          if (data.daily_logs?.length)        await db.daily_logs.bulkPut(data.daily_logs);
          if (data.pomodoro_sessions?.length) await db.pomodoro_sessions.bulkPut(data.pomodoro_sessions);
        });

        resolve({
          tasks:    data.task_templates?.length   ?? 0,
          logs:     data.daily_logs?.length        ?? 0,
          sessions: data.pomodoro_sessions?.length ?? 0,
        });
      } catch (err) {
        reject(err instanceof SyntaxError ? new Error('Invalid JSON file.') : err);
      }
    };

    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsText(file);
  });
}

export async function exportCsv() {
  const logs = await db.daily_logs.orderBy('date').toArray();

  const rows = [['Date', 'Day State', 'Task Name', 'Task Type', 'Duration', 'Completed']];
  for (const log of logs) {
    if (!log.tasks?.length) {
      rows.push([log.date, log.dayState ?? '', '', '', '', '']);
    } else {
      for (const task of log.tasks) {
        let duration = '';
        if (task.taskType === 'pomodoro') {
          duration = `${task.workMin ?? 25}-Work:${String(task.breakMin ?? 5).padStart(2, '0')}-Break:${String(task.sets ?? 4).padStart(2, '0')}-Sets`;
        } else if (task.duration) {
          const mins = task.durationUnit === 'hrs' ? task.duration * 60 : task.duration;
          duration = `${mins}-Min`;
        }
        rows.push([
          log.date,
          log.dayState ?? '',
          task.name ?? '',
          task.taskType ?? '',
          duration,
          task.completed ? 'true' : 'false',
        ]);
      }
    }
  }

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `dailyfocus-export-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function clearAllData() {
  await db.transaction('rw', [db.task_templates, db.daily_logs, db.pomodoro_sessions], async () => {
    await db.task_templates.clear();
    await db.daily_logs.clear();
    await db.pomodoro_sessions.clear();
  });
}
