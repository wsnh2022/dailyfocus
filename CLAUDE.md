# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
npm run dev       # dev server at http://localhost:5173 (base path /)
npm run build     # production build to dist/ (base path /dailyfocus/)
npm run preview   # serve dist/ at http://localhost:4173/dailyfocus/
```

No test runner or linter is configured. There is no `npm test` or `npm run lint`.

**Important:** `vite.config.js` switches `base` based on `command` - dev uses `/`, build uses `/dailyfocus/`. Never hardcode `/dailyfocus/` in source; use relative paths or Vite's `import.meta.env.BASE_URL`.

---

## Architecture

A mobile-first PWA for daily habit tracking. All data is local - no backend, no auth.

**Stack:** React 18 + React Router 6 + Zustand + Dexie (IndexedDB) + Tailwind 3 + Vite 5 + Workbox PWA

### Data layer

Three Dexie tables (`src/db/schema.js`):
- `task_templates` - reusable task definitions; source of truth for the task list
- `daily_logs` - one document per ISO date; stores `{ date, dayState, tasks[], weekNumber }`; tasks are embedded snapshots, not references
- `pomodoro_sessions` - append-only log of completed Pomodoro sets

All DB access goes through `src/db/queries.js`. The store never touches Dexie directly.

### State (Zustand, `src/store/useAppStore.js`)

Single store. The most important slice: `todayTasks[]` is the live task list for the selected date. Changes write optimistically to the store first, then async to DB via `saveLog()`. `activeTimerId` enforces the one-running-timer rule across all card types.

### Boot sequence (`src/hooks/useMidnightArchive.js`)

Runs once on mount. Detects whether today already has a log:
- **Same day:** merges stored completion state back into `todayTasks`
- **New day:** clones templates from `task_templates` into a fresh `daily_logs` entry, merging any pre-planned tasks already saved for today

This is the only place `todayTasks` gets seeded. Everything else reads from the store.

### Timer architecture

Two hooks drive all timers:

**`useCountdown`** - generic; takes `(totalSeconds, onComplete, storageKey?)`. With `storageKey`, pause state (remaining seconds) persists to localStorage and survives reloads. Screen-lock recovery via `visibilitychange`.

**`usePomodoro`** - 6-phase state machine: `idle -> work -> work_done -> break -> break_done -> done`. Pause/resume: `pauseCurrent()` freezes the interval; `resumeCurrent()` restarts it. Persists `{ phase, currentSet, isPaused?, secondsLeft? }` to `localStorage[df_pomo_<taskId>]`. Exposes `isActivelyRunning` (true only when ticking, not when paused) - use this, not `isRunning`, when deciding whether a new timer should displace this one.

Both hooks are used in `src/components/home/TaskCard.jsx` (inline cards) and `usePomodoro` is also used in `src/components/apps/PomodoroApp.jsx` (fullscreen).

### Routing & layout

`src/App.jsx` wraps all routes in `ErrorBoundary` + `Toast`. `BottomNav` hides when `pomodoroRunning` is true in the store. All routes are under `/dailyfocus/` in production.

### Pre-planned tasks

Tasks added for a future date are written directly to that date's `daily_logs` entry with `prePlanned: true` and IDs prefixed `pp_`. They never enter `task_templates`. `useMidnightArchive` merges them when that date becomes today.

---

## Key Conventions

- **All dates are UTC ISO strings** - `todayStr()` uses `toISOString().split('T')[0]`. Never use local `new Date()` arithmetic alongside UTC-keyed DB records or you'll get date-boundary bugs.
- **Optimistic UI everywhere** - store update first, DB write after, toast on failure.
- **Single timer** - `activeTimerId` in Zustand. On mount, countdown/pomodoro cards register themselves; on unmount they clear themselves. A paused timer does not hold `activeTimerId`.

## LocalStorage Keys

| Key | Purpose |
|---|---|
| `df_hero_subtitle` | Editable dashboard subtitle |
| `df_pomo_sound` | Pomodoro sound profile |
| `df_pomo_voice` | Voice announcement toggle |
| `df_pomo_<taskId>` | Pomodoro crash/pause recovery: `{ phase, currentSet, isPaused?, secondsLeft? }` |
| `df_countdown_<taskId>` | Countdown pause recovery: remaining seconds as string |
| `df_last_backup_prompt` | ISO date of last Monday backup reminder |
| `df_dark_mode` | Dark mode preference |

## Gotchas

- **Dexie v3 only** - v4 has breaking API changes; do not upgrade
- **HMR hook count** - changing the number of hooks in a component during hot reload causes a Zustand crash; restart `npm run dev`
- **Rapid HMR edits** - Vite can serve stale modules after several fast saves; add a whitespace change to force re-emission
- **React StrictMode** - double-fires effects in dev; all effects are written to be idempotent
