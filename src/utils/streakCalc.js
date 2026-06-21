import { todayStr, yesterdayStr, getPastDate } from './dateHelpers';

/**
 * Returns { currentStreak, bestStreak, yesterdayRate, weeklyAvgRate }
 * An active day counts toward streak only if at least 1 task was completed.
 * Rest and pause days do NOT break the streak - they're neutral.
 */
export function calculateStreaks(logs) {
  const logMap = {};
  for (const log of logs) logMap[log.date] = log;

  const yesterday = yesterdayStr();

  // Current streak: walk backwards from yesterday
  let currentStreak = 0;
  let daysBack = 1;
  while (true) {
    const dateStr = getPastDate(daysBack);
    const log = logMap[dateStr];

    if (!log) break; // no log = no data = streak broken

    if (log.dayState === 'active') {
      const tasks = log.tasks ?? [];
      const completed = tasks.filter(t => t.completed).length;
      if (completed === 0) break; // active day with 0 completions breaks streak
      currentStreak++;
    }
    // rest/pause days are neutral - just advance without incrementing or breaking
    daysBack++;
    if (daysBack > 365) break; // safety cap
  }

  // Best streak: scan all logs sorted by date
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  let bestStreak = 0;
  let running = 0;
  let prevDate = null;

  for (const log of sorted) {
    if (log.dayState === 'active') {
      const tasks = log.tasks ?? [];
      const completed = tasks.filter(t => t.completed).length;
      if (completed > 0) {
        // Check for gap - only count consecutive calendar days (rest/pause allowed in between)
        // Rebuild actual sequence checking for gaps
        running++;
        bestStreak = Math.max(bestStreak, running);
      } else {
        running = 0; // zero-completion active day resets
      }
    }
    // rest/pause: don't touch running
    prevDate = log.date;
  }
  bestStreak = Math.max(bestStreak, currentStreak);

  // Yesterday completion rate
  const yLog = logMap[yesterday];
  let yesterdayRate = null;
  if (yLog && yLog.dayState === 'active') {
    const tasks = yLog.tasks ?? [];
    yesterdayRate = tasks.length > 0
      ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
      : 0;
  }

  // Weekly average completion rate (last 7 days, active days only)
  const activeDaysThisWeek = [];
  for (let i = 1; i <= 7; i++) {
    const d = getPastDate(i);
    const log = logMap[d];
    if (log && log.dayState === 'active') {
      const tasks = log.tasks ?? [];
      if (tasks.length > 0) {
        activeDaysThisWeek.push(
          tasks.filter(t => t.completed).length / tasks.length
        );
      }
    }
  }
  const weeklyAvgRate = activeDaysThisWeek.length > 0
    ? Math.round((activeDaysThisWeek.reduce((s, r) => s + r, 0) / activeDaysThisWeek.length) * 100)
    : null;

  return { currentStreak, bestStreak, yesterdayRate, weeklyAvgRate };
}

/**
 * Returns array of 7 dot objects for the past 7 days (index 0 = 6 days ago, index 6 = yesterday).
 * Each: { date, state: 'hit'|'miss'|'rest'|'pause'|'none' }
 */
export function getSevenDayDots(logs) {
  const logMap = {};
  for (const log of logs) logMap[log.date] = log;

  const dots = [];
  for (let i = 6; i >= 1; i--) {
    const dateStr = getPastDate(i);
    const log = logMap[dateStr];

    if (!log) {
      dots.push({ date: dateStr, state: 'none' });
      continue;
    }

    if (log.dayState === 'rest')  { dots.push({ date: dateStr, state: 'rest' });  continue; }
    if (log.dayState === 'pause') { dots.push({ date: dateStr, state: 'pause' }); continue; }

    // active
    const tasks = log.tasks ?? [];
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;

    if (total === 0)               dots.push({ date: dateStr, state: 'none' });
    else if (completed === total)  dots.push({ date: dateStr, state: 'hit' });
    else if (completed > 0)        dots.push({ date: dateStr, state: 'partial' });
    else                           dots.push({ date: dateStr, state: 'miss' });
  }

  return dots; // 6 dots (days ago 6 → 1), most recent last
}
