# DailyFocus

A mobile-first Progressive Web App for daily habit tracking with live timers, streak monitoring, future task planning, and fully offline IndexedDB storage.

**Live:** https://wsnh2022.github.io/dailyfocus/

---

## Features

### Tasks
- **Three task types** - Checkbox (simple done/not-done with optional subtasks), Countdown timer (target duration), Pomodoro (configurable work/break/sets)
- **Subtasks** - add up to 6 subtasks to any checkbox task; tap a subtask in the editor to edit it inline; progress bar tracks completion
- **Pause and resume** - countdown timers and Pomodoro phases can be paused mid-session and resumed later; countdown progress survives page reloads
- **Drag-to-reorder** - long-press and drag pending tasks into priority order
- **Completed collapse** - finished tasks fold under a "Completed (n)" chevron, keeping pending tasks front and centre
- **Single timer rule** - only one countdown or Pomodoro can run at a time; paused timers hold their slot until resumed or reset

### Planning
- **14-day date strip** - scrollable date row on the home screen; tap any date to switch context
- **Future task planning** - add tasks to any upcoming date; they appear as pre-planned entries (dot on the strip, violet cell on the heatmap)
- **Quick assign** - when adding a task for a future date, your saved task templates appear as one-tap chips to pre-fill the form
- **Delete pre-planned tasks** - remove a future task directly from the date view

### Streaks & History
- **Momentum Bar** - current streak, best streak, yesterday %, today %, 6-day dot history; motivational message when no tasks exist
- **Day states** - Active / Rest / Pause; rest and pause days don't break your streak (max 2 rest days/week, max 2 consecutive pause days)
- **13-week heatmap** - GitHub-style calendar; cells coloured by completion ratio; violet for future planned days; tap any cell to see that day's task breakdown

### Pomodoro
- **Fullscreen Pomodoro app** - preset selector (25/5, 50/10, 90/20), large phase timer, set tracking, mute toggle
- **Phase state machine** - idle → work → work_done → break → break_done → done; auto-completes the linked task on finish
- **Pause/resume** - pause mid-work or mid-break and resume exactly where you left off; background dims to indicate paused state
- **Sound profiles** - Tones / Bell / Chime / Silent; optional voice announcements via Web Speech API
- **Crash recovery** - Pomodoro state persisted to localStorage; paused seconds restored on page reload

### Data & Backup
- **Offline-first** - all data lives in IndexedDB (Dexie); Workbox service worker caches assets for full offline use
- **Persistent storage** - calls `navigator.storage.persist()` at boot to prevent silent eviction
- **JSON backup** - full export of all three DB tables; atomic import (rolls back on failure); version-checked
- **CSV export** - history as a spreadsheet (Date, Day State, Task Name, Task Type, Duration, Completed); opens in Excel / Google Sheets
- **Weekly reminder** - backup prompt shown every Monday
- **Clear all data** - confirmation modal before destructive wipe

### UI
- **Dark mode** - Slate Night palette, persisted via localStorage
- **Haptic feedback** - vibration on timer completion and Pomodoro phase transitions (where supported)
- **PWA installable** - add to home screen on iOS and Android

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| UI | React + Tailwind CSS | 18 / 3 |
| Routing | React Router | 6 |
| State | Zustand | 4 |
| DB | Dexie.js (IndexedDB) | 3 |
| Drag & Drop | @dnd-kit | 6 |
| Build | Vite | 5 |
| PWA | vite-plugin-pwa (Workbox) | 0.20 |
| Deploy | GitHub Actions → GitHub Pages | - |

---

## Running Locally

```bash
npm install
npm run dev        # hot-reload dev server at http://localhost:5173
```

## Build & Preview

```bash
npm run build && npm run preview
# Preview at http://localhost:4173/dailyfocus/ - same base path as production
```

## Deployment

Push to `main` → GitHub Actions builds and deploys automatically:

1. Node 22 · `npm ci` · `npm run build`
2. Uploads `dist/` as a Pages artifact
3. Deploys via `actions/deploy-pages@v4`

**Required:** GitHub repo → Settings → Pages → Source → **GitHub Actions**

---

## Project Structure

```
src/
  App.jsx                     # Routes, BrowserRouter, storage.persist() call

  components/
    home/
      HomeScreen.jsx          # Date strip, task list, completed collapse, day state
      DateStrip.jsx           # 14-day scrollable date picker with task-count dots
      HeroTitle.jsx           # Editable subtitle (localStorage-backed)
      MomentumBar.jsx         # Streak stats, progress bar, motivational message
      DayStateButton.jsx      # Active / Rest / Pause selector with limit validation
      TaskCard.jsx            # Dispatcher: CheckboxCard / CountdownCard / PomodoroCard
      SortableTaskCard.jsx    # dnd-kit wrapper for drag-to-reorder
      TimerDisplay.jsx        # mm:ss timer text with phase badge

    editor/
      EditorScreen.jsx        # Routing wrapper; passes targetDate from location state
      TaskEditor.jsx          # Full task form; subtask inline editing; quick-assign chips
      ColorPicker.jsx         # 12-colour grid
      TimerTypeSelect.jsx     # Checkbox / Countdown / Pomodoro radio buttons

    history/
      HistoryScreen.jsx       # Summary stats + heatmap
      CalendarHeatmap.jsx     # 13-week grid; planned / complete / partial / missed / rest
      DayDetail.jsx           # Modal showing tasks for a tapped date

    apps/
      AppsScreen.jsx          # Mini-app launcher
      PomodoroApp.jsx         # Fullscreen Pomodoro: preset selector, timer, set tracker

    settings/
      SettingsScreen.jsx      # Subtitle editor, dark mode, sound profiles, backup controls

    shared/
      BottomNav.jsx           # 4-tab nav; hidden during active Pomodoro
      Modal.jsx               # Backdrop + centred card
      Toast.jsx               # Top-centre notifications
      ErrorBoundary.jsx       # Graceful fallback UI

  db/
    schema.js                 # Dexie DB - task_templates / daily_logs / pomodoro_sessions
    queries.js                # All DB helpers: CRUD, reorder, saveLog, addTaskToDateLog,
                              #   removeTaskFromLog, getUpcomingLogs, addSession

  hooks/
    useMidnightArchive.js     # Day transition: merges pre-planned + templates into today's log
    useStreak.js              # Loads all logs → calculateStreaks() + getSevenDayDots()
    useCountdown.js           # Generic countdown; pause persists to localStorage; screen-lock recovery
    usePomodoro.js            # 6-phase state machine; pause/resume; localStorage crash recovery

  store/
    useAppStore.js            # Zustand: todayTasks, dayState, activeTimerId, toast, etc.

  utils/
    dateHelpers.js            # todayStr / tomorrowStr / getPastDate / getISOWeek (all UTC)
    streakCalc.js             # calculateStreaks() / getSevenDayDots()
    momentumMessage.js        # Motivational 1-liner generator
    dayStateValidator.js      # Enforces rest/pause day limits
    backupExport.js           # exportBackup() / exportCsv() / importBackup() / clearAllData()
    sound.js                  # Web Audio tone sequences + Web Speech voice announcements
    vibrate.js                # Haptic feedback helpers

  constants/
    dayStates.js              # DAY_STATES enum, config, MAX_TASKS=8
    colors.js                 # 12 preset Tailwind colour swatches
    emojiCategories.js        # Emoji arrays by category

public/
  icons/                      # PWA icons (192px, 512px)

scripts/
  gen-icons.mjs               # Generates PNG icons without canvas/sharp
```

---

## Key Conventions

| Convention | Detail |
|---|---|
| Dates | UTC ISO strings (`toISOString().split('T')[0]`). Never mix with local Date arithmetic. |
| Optimistic UI | Store updates first, DB write follows; toast on failure |
| Single timer | `activeTimerId` in Zustand; hooks self-pause if they don't hold the ID; paused timers are not considered "running" for this check |
| Pause persistence | Countdown: `df_countdown_<taskId>` stores remaining seconds. Pomodoro: `df_pomo_<taskId>` stores phase + currentSet + secondsLeft + isPaused flag |
| Pre-planned tasks | Saved to `daily_logs` with `prePlanned: true`; task IDs prefixed `pp_`; `useMidnightArchive` merges them into the live log on the target date |
| Future-date edits | `HomeScreen` passes `targetDate` via router `location.state` to `EditorScreen` |
| Drag & drop | Only pending tasks are inside `SortableContext`; `handleDragEnd` reads fresh store state via `useAppStore.getState()` to avoid stale closures |

## LocalStorage Keys

| Key | Purpose |
|---|---|
| `df_hero_subtitle` | Editable dashboard subtitle |
| `df_pomo_sound` | Selected Pomodoro sound profile |
| `df_pomo_voice` | Voice announcement toggle |
| `df_pomo_<taskId>` | Pomodoro phase recovery: `{ phase, currentSet, isPaused?, secondsLeft? }` |
| `df_countdown_<taskId>` | Countdown pause recovery: remaining seconds as a string |
| `df_last_backup_prompt` | ISO date of last backup reminder |
| `df_dark_mode` | Dark mode preference |

## Known Gotchas

- **Dexie**: stay on v3.x - v4 has breaking API changes
- **React StrictMode**: double-fires `useEffect` in dev; all effects are idempotent so no extra guard is needed
- **HMR hook count**: changing hook count inside a component during hot reload causes a Zustand crash - restart the dev server if this happens
- **Timezone**: `todayStr()` is UTC. The date strip uses `Date.UTC()` arithmetic seeded from `todayStr()` - never mix local `new Date()` strings with UTC-keyed IndexedDB records
- **Pomodoro pause + activeTimerId**: `isActivelyRunning` (not `isRunning`) is used when deciding whether another timer starting should reset this one - a paused Pomodoro keeps its localStorage state and can be resumed
