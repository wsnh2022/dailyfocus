# DailyFocus

A mobile-first Progressive Web App (PWA) for daily habit tracking with live timers, streak monitoring, and offline support.

**Live:** https://wsnh2022.github.io/dailyfocus/

---

## Features

- **Task types** — Checkbox, Countdown timer, Pomodoro (multi-set)
- **Day states** — Active, Rest, Pause (rest/pause days don't break your streak)
- **Momentum Bar** — current streak, best streak, 6-day dot history, motivational message
- **History** — 13-week GitHub-style heatmap, tap any day for a detailed task breakdown
- **Settings** — export/import JSON backup, clear all data
- **PWA** — installable on Android/iOS, works fully offline after first load
- **Single timer enforcement** — only one countdown/pomodoro runs at a time

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 18 + Tailwind CSS |
| Routing | React Router 6 |
| State | Zustand 4 |
| DB | Dexie.js 3 (IndexedDB) |
| Build | Vite 5 |
| PWA | vite-plugin-pwa 0.20 (Workbox) |
| Deploy | GitHub Actions → GitHub Pages |

## Running Locally

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev
# or double-click dev.bat
```

App runs at `http://localhost:5173`.

## Build & Preview

```bash
# Production build + local preview
# double-click preview.bat
# or:
npm run build && npm run preview
```

Preview serves at `http://localhost:4173/dailyfocus/` — same base path as production.

## Deployment

Pushes to `main` automatically deploy via GitHub Actions (`.github/workflows/deploy.yml`):

1. Installs Node 22, runs `npm ci` + `npm run build`
2. Uploads `dist/` as a Pages artifact
3. Deploys to GitHub Pages via `actions/deploy-pages@v4`

**Required setting:** GitHub repo → Settings → Pages → Source → **GitHub Actions**

## Project Structure

```
src/
  components/
    editor/       # Task create/edit forms, emoji picker
    history/      # Calendar heatmap, day detail modal
    home/         # Home screen, task cards, momentum bar
    settings/     # Backup/restore, clear data
    shared/       # Modal, BottomNav, Toast, ErrorBoundary
  db/
    schema.js     # Dexie DB schema (3 tables)
    queries.js    # All DB read/write helpers
  hooks/
    useMidnightArchive.js  # Day transition + initial log persistence
    useStreak.js           # Streak + dot calculations
    useCountdown.js        # Generic countdown timer
    usePomodoro.js         # Pomodoro state machine
  store/
    useAppStore.js  # Zustand store (tasks, timers, toasts)
  utils/
    dateHelpers.js       # todayStr, getISOWeek, etc.
    streakCalc.js        # Pure streak + dot logic
    momentumMessage.js   # Motivational message generator
    backupExport.js      # JSON backup import/export
public/
  icons/           # PWA icons (192px, 512px)
scripts/
  gen-icons.mjs    # Generates PNG icons without canvas/sharp
```

## Important Notes

- **Dexie**: stay on v3.x — v4 has breaking API changes
- **React StrictMode**: double-fires `useEffect` in dev; effects are idempotent so no guard needed
- **HMR hook count**: changing hook count in a component during HMR causes a Zustand crash — restart the dev server if this happens
