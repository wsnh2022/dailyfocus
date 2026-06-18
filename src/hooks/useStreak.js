import { useState, useEffect } from 'react';
import { getAllLogs } from '../db/queries';
import { calculateStreaks, getSevenDayDots } from '../utils/streakCalc';

export function useStreak() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const logs = await getAllLogs();
        const { currentStreak, bestStreak, yesterdayRate, weeklyAvgRate } = calculateStreaks(logs);
        const dots = getSevenDayDots(logs);
        setData({ currentStreak, bestStreak, yesterdayRate, weeklyAvgRate, dots });
      } catch (err) {
        console.error('useStreak failed:', err);
        setData({ currentStreak: 0, bestStreak: 0, yesterdayRate: null, weeklyAvgRate: null, dots: [] });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading };
}
