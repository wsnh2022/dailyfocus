/**
 * Generates a short motivational message based on streak and weekly performance.
 * @param {{ streak: number, weeklyAvgRate: number|null, yesterdayRate: number|null }} opts
 * @returns {string}
 */
export function generateMessage({ streak, weeklyAvgRate, yesterdayRate }) {
  // Streak-based messages (highest priority)
  if (streak >= 30) return "Legendary. 30+ days straight.";
  if (streak >= 21) return `${streak} days. That's real discipline.`;
  if (streak >= 14) return `${streak}-day streak. Keep the chain alive.`;
  if (streak >= 7)  return `A full week of wins. Don't stop now.`;
  if (streak >= 3)  return `${streak} days strong. Momentum is building.`;
  if (streak === 2) return "Two in a row. Make it three.";
  if (streak === 1) return "Good start. Do it again today.";

  // No current streak — use yesterday or weekly rate
  if (yesterdayRate !== null) {
    if (yesterdayRate === 100) return "Perfect yesterday. Now repeat it.";
    if (yesterdayRate >= 75)   return "Strong effort yesterday. Push higher.";
    if (yesterdayRate >= 50)   return "Half done is better than none. Aim higher.";
    if (yesterdayRate > 0)     return "Yesterday was a start. Today, go further.";
    return "Yesterday missed. Today is a new chance.";
  }

  if (weeklyAvgRate !== null) {
    if (weeklyAvgRate >= 80) return "Strong week. Keep the standard high.";
    if (weeklyAvgRate >= 50) return "Decent week. Push for consistency.";
    return "This week has room to grow. Start today.";
  }

  return "Every great streak starts with one day.";
}
