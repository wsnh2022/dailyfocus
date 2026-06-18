import { MAX_REST_DAYS_PER_WEEK, MAX_CONSECUTIVE_PAUSE_DAYS } from '../constants/dayStates';
import { getISOWeek, getPastDate } from './dateHelpers';

export async function canSetDayState(newState, allLogs) {
  const todayWeek    = getISOWeek(new Date().toISOString().split('T')[0]);
  const thisWeekLogs = allLogs.filter(l => getISOWeek(l.date) === todayWeek);

  if (newState === 'rest') {
    const restCount = thisWeekLogs.filter(l => l.dayState === 'rest').length;
    if (restCount >= MAX_REST_DAYS_PER_WEEK) {
      return { allowed: false, reason: '2 Rest Days already used this week.' };
    }
  }

  if (newState === 'pause') {
    const yesterday = getPastDate(1);
    const dayBefore = getPastDate(2);
    const yLog  = allLogs.find(l => l.date === yesterday);
    const dbLog = allLogs.find(l => l.date === dayBefore);
    if (yLog?.dayState === 'pause' && dbLog?.dayState === 'pause') {
      return {
        allowed: false,
        reason: "You've paused 2 days in a row. Restart or declare a Rest Day.",
      };
    }
  }

  return { allowed: true };
}
