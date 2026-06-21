# DailyFocus - Project Map

A mobile-first PWA for daily habit tracking with live timers, streak monitoring, and offline IndexedDB storage. Deployed to GitHub Pages at `/dailyfocus/`.

**Stack:** React 18 · React Router 6 · Zustand · Dexie (IndexedDB) · Tailwind 3 · Vite 5 · PWA (Workbox)

---

## Routing (`src/App.jsx`)

| Path | Component | Purpose |
|---|---|---|
| `/` | HomeScreen | Daily task list, momentum bar, day-state selector |
| `/editor` | EditorScreen | Create new task |
| `/editor/:id` | EditorScreen | Edit existing task |
| `/apps` | AppsScreen | Mini-app launcher |
| `/apps/pomodoro` | PomodoroApp | Fullscreen Pomodoro timer |
| `/history` | HistoryScreen | 13-week heatmap + daily breakdown |
| `/settings` | SettingsScreen | Backup/restore, sound settings |
| `*` | → `/` | Catch-all fallback |

All routes share: `ErrorBoundary` wrapper, `BottomNav` (hidden when Pomodoro is fullscreen), `Toast` notifications.

---

## State (`src/store/useAppStore.js`)

Single Zustand store. Key slices:

| Key | Type | Description |
|---|---|---|
| `todayTasks[]` | Task[] | Live task list for today with completion state |
| `todayDayState` | `'active'|'rest'|'pause'` | Current day classification |
| `activeTimerId` | string\|null | Enforces single-timer rule across countdown + Pomodoro |
| `heroSubtitle` | string | Editable dashboard subtitle (localStorage-backed) |
| `showBackupPrompt` | bool | Weekly Monday backup reminder |
| `pomodoroRunning` | bool | Hides BottomNav when true |
| `toast` | object\|null | Active toast notification |

---

## Database (`src/db/`)

**`schema.js`** - Defines `DailyFocusDB` via Dexie with 3 tables:
- `task_templates` - Reusable task definitions (checkbox / countdown / pomodoro)
- `daily_logs` - One log per calendar date; primary key is ISO date string (`"2024-06-19"`)
- `pomodoro_sessions` - Records of each completed Pomodoro set

**`queries.js`** - All DB access helpers: task CRUD, `reorderTasks()`, `saveLog()`, `getAllLogs()`, `getLastNLogs(n)`, `addSession()`, `getSessionsByDate()`

---

## Hooks (`src/hooks/`)

| File | Purpose |
|---|---|
| `useMidnightArchive.js` | On mount: detects new day → clones templates into today's log; same day → merges stored completion state. Hydrates store via `setTodayTasks` / `setTodayDayState`. Runs once at app boot. |
| `useStreak.js` | Loads all logs once, runs `calculateStreaks()` + `getSevenDayDots()`, returns `{ currentStreak, bestStreak, yesterdayRate, weeklyAvgRate, dots }` |
| `useCountdown.js` | Generic countdown timer; handles screen-lock recovery via `visibilitychange`; pauses if `activeTimerId` changes |
| `usePomodoro.js` | 6-phase state machine (idle→work→work_done→break→break_done→done); persists to localStorage for page-refresh recovery; enforces single-timer via `activeTimerId` |

---

## Utils (`src/utils/`)

| File | Purpose |
|---|---|
| `dateHelpers.js` | `todayStr()`, `yesterdayStr()`, `getPastDate(n)`, `getISOWeek(dateStr)` - all return ISO date strings using UTC |
| `streakCalc.js` | `calculateStreaks(logs)` → streak counts + yesterday/weekly completion rates. `getSevenDayDots(logs)` → 6-dot array for past 6 days |
| `momentumMessage.js` | `generateMessage({ streak, weeklyAvgRate, yesterdayRate })` → motivational 1-liner shown when no tasks exist |
| `dayStateValidator.js` | `canSetDayState(newState, allLogs)` → enforces max 2 rest days/week and max 2 consecutive pause days |
| `sound.js` | Web Audio API tone sequences + Web Speech API voice for Pomodoro phase transitions. Profiles: tones / bell / chime / silent |
| `vibrate.js` | Haptic feedback helpers: `vibrateOnce()`, `vibrateLong()`, `vibratePattern(arr)` |
| `backupExport.js` | `exportBackup()` (JSON download), `importBackup(file)` (JSON upload + DB replace), `clearAllData()` |

---

## Constants (`src/constants/`)

| File | Contents |
|---|---|
| `dayStates.js` | `DAY_STATES` enum, `DAY_STATE_CONFIG` (label/emoji/colors), limits: `MAX_REST_DAYS_PER_WEEK=2`, `MAX_CONSECUTIVE_PAUSE_DAYS=2`, `MAX_TASKS=8` |
| `colors.js` | `PRESET_COLORS[12]` - Tailwind color swatches with bg/text/border classes; `getColor(id)` lookup |
| `emojiCategories.js` | Emoji arrays grouped by category (Fitness, Study, Health, Work, Personal, Food) |

---

## Components

### Home (`src/components/home/`)

| File | Purpose |
|---|---|
| `HomeScreen.jsx` | Root home view: renders HeroTitle, MomentumBar, BackupBanner, DayStateButton, drag-sortable task list via `@dnd-kit` |
| `HeroTitle.jsx` | "DailyFocus" heading + editable subtitle stored in Zustand + localStorage |
| `MomentumBar.jsx` | Stats row: Streak · Best · Yesterday% · Today% · 7-day dots. Progress bar below (done/total). Motivational message when no tasks. |
| `DayStateButton.jsx` | Active/Rest/Pause selector; validates limits via `canSetDayState()`; shows blocking reason in modal |
| `TaskCard.jsx` | Dispatcher: renders CheckboxCard, CountdownCard, or PomodoroCard based on `taskType`. All cards have swipe-to-delete/edit and drag handle. |
| `SortableTaskCard.jsx` | Wraps TaskCard with `useSortable` from dnd-kit |
| `TimerDisplay.jsx` | Formatted `mm:ss` timer text with optional phase badge |

### Editor (`src/components/editor/`)

| File | Purpose |
|---|---|
| `EditorScreen.jsx` | Routing wrapper: passes existing task or null + nextSortOrder to TaskEditor |
| `TaskEditor.jsx` | Full task form: name, emoji, color, taskType, conditional timer fields |
| `EmojiPicker.jsx` | Category grid from `EMOJI_CATEGORIES` |
| `ColorPicker.jsx` | 12-color grid from `PRESET_COLORS` |
| `TimerTypeSelect.jsx` | Radio buttons for checkbox / countdown / pomodoro |

### History (`src/components/history/`)

| File | Purpose |
|---|---|
| `HistoryScreen.jsx` | Summary stats + CalendarHeatmap + legend; click day → DayDetail modal |
| `CalendarHeatmap.jsx` | 53-week × 7-day grid; cell color by log state + completion ratio |
| `DayDetail.jsx` | Modal: all tasks for selected date with completion status |

### Apps (`src/components/apps/`)

| File | Purpose |
|---|---|
| `AppsScreen.jsx` | Mini-app launcher (currently just Pomodoro link) |
| `PomodoroApp.jsx` | Fullscreen Pomodoro: task picker, sound selector, large timer, set tracking, auto-completes task |

### Settings (`src/components/settings/`)

| File | Purpose |
|---|---|
| `SettingsScreen.jsx` | Hero subtitle editor, Pomodoro sound profile picker, backup/import/clear-data controls |

### Shared (`src/components/shared/`)

| File | Purpose |
|---|---|
| `BottomNav.jsx` | 4-tab fixed nav (Home / Apps / History / Settings); hides when `pomodoroRunning` |
| `Modal.jsx` | Overlay modal - backdrop + centered card, click-outside to close |
| `Toast.jsx` | Top-center notification; supports success / error / pomodoro-done / pomodoro-break / pomodoro-work |
| `ErrorBoundary.jsx` | React error boundary with graceful fallback UI |

---

## Data Flow

```
App boot
  → useMidnightArchive() loads today's log from DB
  → setTodayTasks / setTodayDayState → Zustand store

MomentumBar mounts
  → useStreak() loads all logs → calculateStreaks() → streak/rate stats
  → todayTasks from store → live today% derived inline

Task toggle
  → updateTaskCompletion (store) → saveLog() (DB)
  → completed tasks sink to bottom

Countdown / Pomodoro
  → useCountdown / usePomodoro hook drives timer state
  → activeTimerId enforces only one running at a time
  → Pomodoro completion → addSession() (DB) + task auto-complete
```

---

## Key Conventions

- **Dates are UTC ISO strings** (`toISOString().split('T')[0]`). Be aware of timezone offset when debugging date mismatches.
- **Optimistic UI** - store updates first, DB write follows; toast on failure.
- **Single timer rule** - `activeTimerId` in store; hooks pause themselves if they're not the active one.
- **LocalStorage keys** - `df_hero_subtitle`, `df_pomo_sound`, `df_pomo_voice`, `df_pomo_${taskId}` (Pomodoro recovery), `df_last_backup_prompt`.
- **Max tasks** - `MAX_TASKS = 8` enforced in editor.
- **Mobile-first** - max-width 448px, 44px+ tap targets, swipe actions on task cards.

---

## Build & Deploy

- `npm run dev` - Vite dev server
- `npm run build` - Output to `dist/`, base path `/dailyfocus/`
- Push to `main` → GitHub Actions builds + deploys to GitHub Pages automatically
- Live URL: `https://wsnh2022.github.io/dailyfocus/`
