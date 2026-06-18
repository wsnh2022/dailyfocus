export const PRESET_COLORS = [
  { id: 'green',  hex: '#22c55e', bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-500'  },
  { id: 'purple', hex: '#a855f7', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500' },
  { id: 'blue',   hex: '#3b82f6', bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-500'   },
  { id: 'amber',  hex: '#f59e0b', bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-500'  },
  { id: 'red',    hex: '#ef4444', bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-500'    },
  { id: 'pink',   hex: '#ec4899', bg: 'bg-pink-100',   text: 'text-pink-700',   border: 'border-pink-500'   },
  { id: 'teal',   hex: '#14b8a6', bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-500'   },
  { id: 'orange', hex: '#f97316', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-500' },
  { id: 'indigo', hex: '#6366f1', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-500' },
  { id: 'rose',   hex: '#f43f5e', bg: 'bg-rose-100',   text: 'text-rose-700',   border: 'border-rose-500'   },
  { id: 'cyan',   hex: '#06b6d4', bg: 'bg-cyan-100',   text: 'text-cyan-700',   border: 'border-cyan-500'   },
  { id: 'lime',   hex: '#84cc16', bg: 'bg-lime-100',   text: 'text-lime-700',   border: 'border-lime-500'   },
];

export const getColor = (id) => PRESET_COLORS.find(c => c.id === id) ?? PRESET_COLORS[0];
