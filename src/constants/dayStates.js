export const DAY_STATES = {
  ACTIVE: 'active',
  REST:   'rest',
  PAUSE:  'pause',
};

export const DAY_STATE_CONFIG = {
  active:  { label: 'Active Day',  emoji: '✅', heatmapClass: 'bg-green-400'  },
  rest:    { label: 'Rest Day',    emoji: '🌿', heatmapClass: 'bg-blue-300'   },
  pause:   { label: 'Pause Day',   emoji: '⏸️', heatmapClass: 'bg-amber-300'  },
  partial: { label: 'Partial',     emoji: '',   heatmapClass: 'bg-green-200'  },
  none:    { label: 'No Data',     emoji: '',   heatmapClass: 'bg-slate-200'  },
};

export const MAX_REST_DAYS_PER_WEEK = 2;
export const MAX_CONSECUTIVE_PAUSE_DAYS = 2;
export const MAX_TASKS = 8;
