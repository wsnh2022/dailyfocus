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

  // Standalone Pomodoro app — hides nav when running
  pomodoroRunning: false,
  setPomodoroRunning: (v) => set({ pomodoroRunning: v }),

  // Toast notifications
  toast: null,
  showToast: (message, type = 'success', duration = 3000) => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), duration);
  },
}));
