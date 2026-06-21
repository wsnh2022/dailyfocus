export const vibrateOnce = () => {
  if ('vibrate' in navigator) navigator.vibrate(200);
};

export const vibratePattern = (pattern = [200, 100, 200]) => {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
};

export const vibrateLong = () => {
  if ('vibrate' in navigator) navigator.vibrate([400, 100, 400]);
};
// iOS Safari does not support Vibration API - the 'vibrate' in navigator
// check handles this gracefully with no error thrown.
