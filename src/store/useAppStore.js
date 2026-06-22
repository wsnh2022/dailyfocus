import { create } from 'zustand';

export const useAppStore = create((set) => ({
  // Today's task list with live completion state
  todayTasks: [],
  setTodayTasks: (tasks) => set({ todayTasks: tasks }),
  updateTaskCompletion: (taskId, completed) =>
    set(state => ({
      todayTasks: state.todayTasks.map(t =>
        t.id === taskId ? { ...t, completed } : t
      )
    })),

  // Active timer - only one can run at a time
  activeTimerId: null,
  setActiveTimer: (id) => set({ activeTimerId: id }),
  clearActiveTimer: () => set({ activeTimerId: null }),

  // Today's day state
  todayDayState: 'active',
  setTodayDayState: (dayState) => set({ todayDayState: dayState }),

  // Momentum bar data
  momentum: null,
  setMomentum: (data) => set({ momentum: data }),

  // Weekly backup prompt
  showBackupPrompt: false,
  setShowBackupPrompt: (show) => set({ showBackupPrompt: show }),

  // Standalone Pomodoro app - hides nav when running
  pomodoroRunning: false,
  setPomodoroRunning: (v) => set({ pomodoroRunning: v }),

  // Hero subtitle (editable in Settings)
  heroSubtitle: localStorage.getItem('df_hero_subtitle') ?? 'datacraft by yogi',
  setHeroSubtitle: (v) => {
    localStorage.setItem('df_hero_subtitle', v);
    set({ heroSubtitle: v });
  },

  // Theme: 'light' | 'dark'
  theme: localStorage.getItem('df_theme') ?? 'light',
  setTheme: (next) => {
    localStorage.setItem('df_theme', next);
    const root = document.documentElement;
    if (next === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'dark' ? '#020617' : '#1e293b');
    set({ theme: next });
  },

  // Toast notifications
  toast: null,
  showToast: (message, type = 'success', duration = 3000) => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), duration);
  },
}));
