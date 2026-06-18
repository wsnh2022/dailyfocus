# DailyFocus — Development Plan
> Mobile-first PWA daily action tracker with live timers, Pomodoro sessions, streak tracking,
> and offline-first IndexedDB storage. Stack locked. Build vertically.

---

## LOCKED STACK

| Layer | Tool | Version | Notes |
|---|---|---|---|
| Platform | PWA (Progressive Web App) | — | Installable on Android + iOS via browser |
| Frontend | React | 18.3.1 | Hooks only, no class components |
| Build Tool | Vite | 5.4.x | Fast HMR, native ESM |
| Language | JavaScript | ES2022 | No TypeScript in V1 - keep build simple |
| Styling | Tailwind CSS | 3.4.x | Mobile-first utility classes |
| State | Zustand | 4.5.x | Lightweight, no boilerplate |
| Database | Dexie.js | 3.2.7 | IndexedDB wrapper - MUST be 3.x not 4.x |
| PWA | vite-plugin-pwa | 0.20.5 | Workbox service worker + manifest |
| Audio/Vibration | Web APIs | Native | Vibration API + Web Audio API (built-in) |
| UI Icons | Lucide React | 0.383.0 | UI chrome only - not task icons |
| Routing | React Router DOM | 6.26.1 | 4 screens, client-side routing |
| Deployment | Netlify | Free tier | Static hosting, HTTPS auto, zero config |

> **CRITICAL:** Dexie.js 4.x has completely breaking API changes from 3.x.
> Always use exactly 3.2.7. Pin this version and never auto-upgrade.

---

## PROJECT STRUCTURE

```
dailyfocus/
├── public/
│   ├── manifest.json               # PWA manifest (name, icons, theme_color)
│   ├── icons/                      # PWA icons: 72, 96, 128, 144, 192, 512px PNG
│   └── offline.html                # Fallback shown when offline + not cached
├── src/
│   ├── components/
│   │   ├── home/
│   │   │   ├── HomeScreen.jsx      # Main today view - top-level layout
│   │   │   ├── MomentumBar.jsx     # Yesterday score, streak, 7-day dots, message
│   │   │   ├── TaskCard.jsx        # Single task card (renders all 3 types)
│   │   │   ├── TimerDisplay.jsx    # MM:SS countdown + pomodoro phase display
│   │   │   └── DayStateButton.jsx  # Active / Rest Day / Pause Day toggle
│   │   ├── history/
│   │   │   ├── HistoryScreen.jsx   # History screen wrapper + month navigation
│   │   │   ├── CalendarHeatmap.jsx # Monthly day grid with color states
│   │   │   └── DayDetail.jsx       # Tap-to-expand read-only day snapshot
│   │   ├── editor/
│   │   │   ├── EditorScreen.jsx    # Full CRUD task editor screen
│   │   │   ├── TaskEditor.jsx      # Add/edit task form with all fields
│   │   │   ├── EmojiPicker.jsx     # Category-filtered emoji picker modal
│   │   │   ├── ColorPicker.jsx     # 12-color preset palette grid
│   │   │   └── TimerTypeSelect.jsx # Checkbox / Countdown / Pomodoro selector
│   │   ├── settings/
│   │   │   └── SettingsScreen.jsx  # JSON export, import, weekly backup prompt
│   │   └── shared/
│   │       ├── BottomNav.jsx       # 4-tab mobile navigation bar
│   │       ├── Modal.jsx           # Reusable full-screen modal wrapper
│   │       ├── Toast.jsx           # Success/error toast notifications
│   │       └── ErrorBoundary.jsx   # Global React error boundary
│   ├── db/
│   │   ├── schema.js               # Dexie DB instance + version + table definitions
│   │   └── queries.js              # All DB read/write helper functions
│   ├── hooks/
│   │   ├── useCountdown.js         # Single countdown timer logic
│   │   ├── usePomodoro.js          # Pomodoro sets + work/break auto-advance
│   │   ├── useMidnightArchive.js   # Archive check on every app open
│   │   ├── useStreak.js            # Streak data from DB logs
│   │   └── useBackupPrompt.js      # Weekly Monday backup reminder logic
│   ├── store/
│   │   └── useAppStore.js          # Zustand global state (timer, tasks, day state)
│   ├── utils/
│   │   ├── streakCalc.js           # Pure streak calculation functions
│   │   ├── momentumMessage.js      # Data-driven motivational message generator
│   │   ├── dateHelpers.js          # Date formatting, week/day comparison helpers
│   │   ├── vibrate.js              # Vibration API wrapper with fallback check
│   │   ├── dayStateValidator.js    # Rest/Pause day rule enforcement
│   │   └── backupExport.js         # JSON export + import with transaction safety
│   ├── constants/
│   │   ├── colors.js               # 12 preset task colors (hex + Tailwind classes)
│   │   ├── emojiCategories.js      # Emoji organized by category
│   │   └── dayStates.js            # Day state enums, colors, and validation rules
│   ├── App.jsx                     # React Router + layout wrapper
│   └── main.jsx                    # React entry point + ErrorBoundary mount
├── index.html
├── vite.config.js                  # Vite + PWA plugin configuration
├── tailwind.config.js
├── netlify.toml                    # Netlify build + redirect rules
├── package.json                    # Exact pinned versions - never use ^ or ~
└── .gitignore
```

`.gitignore` must include: `node_modules/`, `dist/`, `.env`, `.DS_Store`

---

## DATABASE SCHEMA (Dexie.js)

Three tables. No joins. One clear responsibility each.

```javascript
// src/db/schema.js
import Dexie from 'dexie';

export const db = new Dexie('DailyFocusDB');

db.version(1).stores({
  // User's task configuration - source of truth for task setup
  task_templates: '++id, name, emoji, color, taskType, duration, durationUnit, workMin, breakMin, sets, sortOrder',

  // One record per calendar day - primary key is date string 'YYYY-MM-DD'
  daily_logs: '&date, dayState, tasks, weekNumber, createdAt, archivedAt',

  // One record per completed Pomodoro set
  pomodoro_sessions: '++id, date, taskId, taskName, setNumber, totalSets, workMin, breakMin, completedAt'
});

export default db;
```

**Field reference:**
- `task_templates.taskType`: `'checkbox'` | `'countdown'` | `'pomodoro'`
- `task_templates.durationUnit`: `'min'` | `'hrs'`
- `task_templates.color`: stores the color `id` string (e.g. `'green'`) not hex
- `daily_logs.dayState`: `'active'` | `'rest'` | `'pause'`
- `daily_logs.tasks`: JSON array of task snapshots with `completed: true/false`
- `daily_logs.weekNumber`: ISO week number - used for Rest Day count queries

---

## PHASE 0 - Environment Setup

**System prerequisites:**

```bash
# Verify Node.js (18.x or 20.x required - NOT 22.x, unstable with some Vite deps)
node --version

# If wrong version, download LTS from https://nodejs.org/en
# Windows: use the .msi installer

# Verify npm
npm --version   # Must be 9.x or 10.x
```

**Project scaffold:**

```bash
npm create vite@5.4.0 dailyfocus -- --template react
cd dailyfocus

# Install production dependencies - exact versions
npm install react@18.3.1 react-dom@18.3.1
npm install react-router-dom@6.26.1
npm install zustand@4.5.4
npm install dexie@3.2.7
npm install lucide-react@0.383.0

# Install dev dependencies - exact versions
npm install -D tailwindcss@3.4.10 postcss@8.4.47 autoprefixer@10.4.20
npm install -D vite-plugin-pwa@0.20.5
npm install -D @vitejs/plugin-react@4.3.1

# Init Tailwind
npx tailwindcss init -p
```

**vite.config.js:**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'DailyFocus',
        short_name: 'DailyFocus',
        description: 'Daily action tracker with live timers and streak tracking',
        theme_color: '#1e293b',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: []
      }
    })
  ]
})
```

**tailwind.config.js:**

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      screens: {
        'xs': '390px'
      }
    }
  },
  plugins: []
}
```

**netlify.toml (create in project root):**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

> **CRITICAL:** The `[[redirects]]` rule is mandatory. Without it, any direct URL
> access (e.g. typing /history) returns 404 on Netlify.

**Git init:**

```bash
git init
git add .
git commit -m "chore: project scaffold - DailyFocus PWA"
```

**Success Criteria:**
- [ ] `node --version` returns 18.x or 20.x
- [ ] `npm run dev` starts without errors at localhost:5173
- [ ] No TypeScript errors or missing module warnings in terminal
- [ ] `.gitignore` confirmed to exclude `node_modules/` and `dist/`
- [ ] `package.json` shows all versions without `^` or `~` prefixes

---

## PHASE 1 - Database Layer (Day 1 AM)

Build and verify Dexie.js before any UI. If the data layer is wrong, everything built on top breaks.

**src/db/schema.js** - full schema as shown above.

**src/db/queries.js:**

```javascript
import { db } from './schema';

// --- Task Templates ---
export const getAllTasks = () =>
  db.task_templates.orderBy('sortOrder').toArray();

export const addTask = (task) =>
  db.task_templates.add(task);

export const updateTask = (id, changes) =>
  db.task_templates.update(id, changes);

export const deleteTask = (id) =>
  db.task_templates.delete(id);

export const reorderTasks = async (orderedIds) => {
  await db.transaction('rw', db.task_templates, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.task_templates.update(orderedIds[i], { sortOrder: i });
    }
  });
};

// --- Daily Logs ---
export const getLogByDate = (date) =>
  db.daily_logs.get(date);

export const getTodayLog = () => {
  const today = new Date().toISOString().split('T')[0];
  return db.daily_logs.get(today);
};

export const saveLog = (log) =>
  db.daily_logs.put(log);

export const getLogRange = (startDate, endDate) =>
  db.daily_logs.where('date').between(startDate, endDate, true, true).toArray();

export const getAllLogs = () =>
  db.daily_logs.orderBy('date').toArray();

export const getLastNLogs = (n) =>
  db.daily_logs.orderBy('date').reverse().limit(n).toArray();

// --- Pomodoro Sessions ---
export const addSession = (session) =>
  db.pomodoro_sessions.add(session);

export const getSessionsByDate = (date) =>
  db.pomodoro_sessions.where('date').equals(date).toArray();
```

**Verify in browser DevTools console:**

```javascript
// At localhost:5173, open DevTools > Console and run:
// Application tab > Storage > IndexedDB > DailyFocusDB
// Should show 3 tables: task_templates, daily_logs, pomodoro_sessions
```

**Success Criteria:**
- [ ] `DailyFocusDB` database visible in DevTools Application > IndexedDB
- [ ] Three tables visible: `task_templates`, `daily_logs`, `pomodoro_sessions`
- [ ] Manual add via console saves without error
- [ ] Manual `getAllTasks()` returns the saved record
- [ ] DB opens on page reload without version mismatch error

---

## PHASE 2 - Constants + Global Store (Day 1 PM)

**src/constants/colors.js:**

```javascript
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
```

**src/constants/emojiCategories.js:**

```javascript
export const EMOJI_CATEGORIES = {
  'Fitness':  ['🏋️','🧘','🚶','🏃','🚴','🤸','⚽','🏊','🥊','🧗','🤾','🏌️','🏄','🎽','🥅'],
  'Study':    ['📚','💻','✏️','📝','🧠','🔬','📐','🎓','💡','📖','🗂️','📊','🔭','🖊️','📓'],
  'Health':   ['💊','🥗','💧','🛌','🍎','🏥','🩺','🦷','👁️','🧴','🫀','🫁','🧪','🥦','🫐'],
  'Work':     ['💼','📧','📞','🗓️','📋','💰','🤝','📈','⌨️','🖥️','📌','🗃️','📤','✅','⏰'],
  'Personal': ['🎯','⭐','🌟','🔑','🌱','🧩','🎨','🎵','📸','✈️','🏠','❤️','🌈','🎭','🪴'],
  'Food':     ['🍳','☕','🥤','🍱','🧃','🥑','🍜','🍣','🥐','🫖','🥩','🌮','🍇','🧁','🫙'],
};
```

**src/constants/dayStates.js:**

```javascript
export const DAY_STATES = {
  ACTIVE: 'active',
  REST:   'rest',
  PAUSE:  'pause',
};

export const DAY_STATE_CONFIG = {
  active:  { label: 'Active Day',  emoji: '✅', heatmapClass: 'bg-green-400'  },
  rest:    { label: 'Rest Day',    emoji: '🌿', heatmapClass: 'bg-blue-300'   },
  pause:   { label: 'Pause Day',  emoji: '⏸️', heatmapClass: 'bg-amber-300'  },
  partial: { label: 'Partial',     emoji: '',   heatmapClass: 'bg-green-200'  },
  none:    { label: 'No Data',     emoji: '',   heatmapClass: 'bg-slate-200'  },
};

export const MAX_REST_DAYS_PER_WEEK = 2;
export const MAX_CONSECUTIVE_PAUSE_DAYS = 2;
export const MAX_TASKS = 8;
```

**src/store/useAppStore.js:**

```javascript
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

  // Toast notifications
  toast: null,
  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },
}));
```

**Success Criteria:**
- [ ] All constants import without errors in browser console
- [ ] `useAppStore()` accessible in any component
- [ ] Color constants produce valid Tailwind classes (test by rendering a colored div)
- [ ] All 6 emoji categories load with correct emoji arrays

---

## PHASE 3 - App Shell + Navigation (Day 2 AM)

**src/App.jsx:**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/shared/ErrorBoundary';
import BottomNav from './components/shared/BottomNav';
import Toast from './components/shared/Toast';
import HomeScreen from './components/home/HomeScreen';
import EditorScreen from './components/editor/EditorScreen';
import HistoryScreen from './components/history/HistoryScreen';
import SettingsScreen from './components/settings/SettingsScreen';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50 max-w-md mx-auto relative pb-20 overflow-x-hidden">
          <Routes>
            <Route path="/"              element={<HomeScreen />} />
            <Route path="/editor"        element={<EditorScreen />} />
            <Route path="/editor/:id"    element={<EditorScreen />} />
            <Route path="/history"       element={<HistoryScreen />} />
            <Route path="/settings"      element={<SettingsScreen />} />
            <Route path="*"              element={<Navigate to="/" replace />} />
          </Routes>
          <BottomNav />
          <Toast />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

**BottomNav tabs:** Home (🏠) | Add Task (➕) | History (📅) | Settings (⚙️)

**Success Criteria:**
- [ ] All 4 routes render placeholder content without errors
- [ ] Bottom nav highlights the active route correctly
- [ ] App renders correctly at 390px viewport (no horizontal scroll)
- [ ] Navigating between all 4 tabs works without white screen

---

## PHASE 4 - Task CRUD Editor (Day 2 PM)

**Form fields in TaskEditor.jsx:**
1. Task name (text input, max 30 chars, required)
2. Emoji (opens EmojiPicker modal on tap)
3. Color (ColorPicker grid of 12 swatches)
4. Task type (3-button toggle: Checkbox / Countdown / Pomodoro)
5. Duration (number input + min/hrs toggle)
6. If Pomodoro selected: Work minutes, Break minutes, Number of sets

**Validation rules (enforce in code, not just UI):**

```javascript
const VALIDATION = {
  name:     { min: 1, max: 30 },
  duration: { min: 1, max: 999 },
  workMin:  { min: 1, max: 120 },
  breakMin: { min: 1, max: 60 },
  sets:     { min: 1, max: 10 },
  maxTasks: 8,
};
```

**CRUD flows:**
- **Add:** Validate all fields, call `addTask()`, navigate back to home
- **Edit:** Pre-fill all fields from existing task, call `updateTask()` on save
- **Delete:** Show confirmation modal ("Delete this task?"), call `deleteTask()`, navigate home
- **Order:** Tasks display in `sortOrder` order on home screen

**Task count display:** Show "3 / 8 tasks" in editor header. Disable Add button when at 8.

**Success Criteria:**
- [ ] Can add all 3 task types with full fields
- [ ] Saved tasks appear on home screen immediately
- [ ] Edit screen pre-fills all fields correctly
- [ ] Delete removes task from DB and home screen
- [ ] Cannot add 9th task (button disabled, message shown)
- [ ] Pomodoro-specific fields only visible when Pomodoro type selected

---

## PHASE 5 - Timer System (Day 3 AM)

This is the most complex phase. Build each timer in isolation and test before combining.

**src/utils/vibrate.js:**

```javascript
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
// check handles this gracefully with no error thrown
```

**src/hooks/useCountdown.js:**

```javascript
import { useState, useEffect, useRef, useCallback } from 'react';
import { vibrateLong } from '../utils/vibrate';

export function useCountdown(totalSeconds, onComplete) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const remainingRef = useRef(totalSeconds);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    remainingRef.current = secondsLeft;
    setIsRunning(false);
  }, [secondsLeft]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
    remainingRef.current = totalSeconds;
  }, [totalSeconds]);

  // Handle screen lock/unlock - recalculate elapsed on visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isRunning && startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newRemaining = Math.max(0, remainingRef.current - elapsed);
        setSecondsLeft(newRemaining);
        if (newRemaining <= 0) {
          setIsRunning(false);
          vibrateLong();
          onComplete?.();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning, onComplete]);

  useEffect(() => {
    if (!isRunning) return;
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          vibrateLong();
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, onComplete]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');
  const formatted = `${mins}:${secs}`;
  const progress = 1 - secondsLeft / totalSeconds;

  return { secondsLeft, isRunning, formatted, progress, start, pause, reset };
}
```

**src/hooks/usePomodoro.js:**

```javascript
import { useState, useEffect, useRef, useCallback } from 'react';
import { vibratePattern, vibrateLong } from '../utils/vibrate';

export function usePomodoro({ workMin, breakMin, totalSets, onSetComplete, onAllComplete }) {
  const [phase, setPhase] = useState('idle'); // 'idle' | 'work' | 'break' | 'done'
  const [currentSet, setCurrentSet] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(workMin * 60);
  const intervalRef = useRef(null);

  const clearTimer = () => clearInterval(intervalRef.current);

  const startPhase = useCallback((type, duration) => {
    clearTimer();
    setPhase(type);
    setSecondsLeft(duration * 60);
  }, []);

  const advanceAfterWork = useCallback((completedSet) => {
    vibratePattern();
    onSetComplete?.(completedSet);
    if (completedSet >= totalSets) {
      setPhase('done');
      vibrateLong();
      onAllComplete?.();
    } else {
      setCurrentSet(s => s + 1);
      startPhase('break', breakMin);
    }
  }, [totalSets, breakMin, startPhase, onSetComplete, onAllComplete]);

  const start = useCallback(() => {
    if (phase === 'idle') startPhase('work', workMin);
  }, [phase, workMin, startPhase]);

  const skipCurrent = useCallback(() => {
    clearTimer();
    if (phase === 'work') advanceAfterWork(currentSet);
    else if (phase === 'break') startPhase('work', workMin);
  }, [phase, currentSet, workMin, advanceAfterWork, startPhase]);

  useEffect(() => {
    if (phase !== 'work' && phase !== 'break') return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearTimer();
          if (phase === 'work') advanceAfterWork(currentSet);
          else startPhase('work', workMin);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, currentSet, workMin, advanceAfterWork, startPhase]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return {
    phase,
    currentSet,
    totalSets,
    formatted: `${mins}:${secs}`,
    start,
    skipCurrent,
    isDone: phase === 'done',
  };
}
```

> **CRITICAL:** Only one timer active at a time. Use `activeTimerId` from Zustand.
> When user taps Start on a second task - call `clearActiveTimer()` first, then
> pause the previous task's timer before starting the new one.

**Success Criteria:**
- [ ] Countdown timer counts down correctly and vibrates on zero
- [ ] Pomodoro auto-advances: work ends - break starts - next work set begins
- [ ] Pomodoro vibrates on each set completion (pattern) and full completion (long)
- [ ] Starting a second task pauses the first timer
- [ ] Timer handles screen lock: recalculates elapsed time on screen wake
- [ ] Timer display always shows MM:SS format
- [ ] Completed task auto-checks its checkbox

---

## PHASE 6 - Today Screen + Task Cards (Day 3 PM)

**TaskCard renders based on `taskType`:**

- **Checkbox:** Emoji icon + task name + duration label + tap-to-complete checkbox
- **Countdown:** Emoji icon + MM:SS display + Start/Pause button + checkbox auto-fills on complete
- **Pomodoro:** Emoji icon + MM:SS + set counter "Set 2 / 3" + phase badge (WORK/BREAK) + Start/Skip + checkbox auto-fills when all sets done

**Card layout (matches original image design):**
- Left: colored square (task color bg) with large emoji centered
- Middle: large number (duration or time remaining) + task name below
- Right: styled checkbox (border color = task color)

**Long-press on card:** opens edit screen for that task (`/editor/:id`)

**Empty state:** When no tasks configured, show centered message:
"No tasks yet. Tap + to add your first task." with a large add button.

**Success Criteria:**
- [ ] All 3 task types render correct card layout
- [ ] Checkbox tap completes task and persists to today's DB log
- [ ] Countdown card shows live decreasing timer
- [ ] Pomodoro card shows correct set count and phase label
- [ ] Completed tasks show visual completed state (checkmark + opacity reduction)
- [ ] Long-press navigates to edit screen for that task
- [ ] Empty state renders when no tasks exist

---

## PHASE 7 - Day State + Midnight Archive (Day 4 AM)

**src/utils/dayStateValidator.js:**

```javascript
import { MAX_REST_DAYS_PER_WEEK, MAX_CONSECUTIVE_PAUSE_DAYS } from '../constants/dayStates';

function getISOWeek(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function getPastDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export async function canSetDayState(newState, allLogs) {
  const todayWeek = getISOWeek(new Date().toISOString().split('T')[0]);
  const thisWeekLogs = allLogs.filter(l => getISOWeek(l.date) === todayWeek);

  if (newState === 'rest') {
    const restCount = thisWeekLogs.filter(l => l.dayState === 'rest').length;
    if (restCount >= MAX_REST_DAYS_PER_WEEK) {
      return { allowed: false, reason: '2 Rest Days already used this week.' };
    }
  }

  if (newState === 'pause') {
    const yesterday = getPastDate(1);
    const dayBefore  = getPastDate(2);
    const yLog  = allLogs.find(l => l.date === yesterday);
    const dbLog = allLogs.find(l => l.date === dayBefore);
    if (yLog?.dayState === 'pause' && dbLog?.dayState === 'pause') {
      return {
        allowed: false,
        reason: "You've paused 2 days in a row. Restart or declare a Rest Day."
      };
    }
  }

  return { allowed: true };
}
```

**src/hooks/useMidnightArchive.js logic:**

```javascript
// On every app open:
// 1. Get last archived date from DB (getLastNLogs(1)[0].date)
// 2. Get today's date string 'YYYY-MM-DD'
// 3. If last archived date !== today:
//    a. Save yesterday's task states as-is (completed/incomplete) to daily_logs
//    b. Load task_templates as fresh today's task list (all completed = false)
//    c. Check if today is Monday - if yes and lastBackupPrompt > 7 days ago, show backup prompt
// 4. If last archived date === today:
//    a. Load today's existing log state (preserve completions made today)
// This logic is idempotent - safe to run multiple times per day
```

**Success Criteria:**
- [ ] DayStateButton shows current day state
- [ ] Setting Rest Day blocked after 2 in same week (modal with reason message)
- [ ] Setting Pause Day blocked after 2 consecutive (modal with reason message)
- [ ] On app open next calendar day, yesterday archived correctly
- [ ] New day loads yesterday's task config as template, all completions reset
- [ ] Incomplete tasks from yesterday saved as `completed: false` in their log entry
- [ ] Archive is idempotent (opening app twice today doesn't double-archive)

---

## PHASE 8 - Momentum Bar (Day 4 PM)

**src/utils/streakCalc.js:**

```javascript
export function calculateStreaks(logs) {
  if (!logs || logs.length === 0) return { current: 0, best: 0 };

  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const today = new Date().toISOString().split('T')[0];

  // Start counting from yesterday (today may be in progress)
  let current = 0;
  let best = 0;
  let temp = 0;
  let expectedDate = getPastDate(1); // yesterday

  for (const log of sorted) {
    if (log.date > expectedDate) continue; // skip today's in-progress log
    if (log.date < expectedDate) break;    // gap found - streak broken

    if (log.dayState === 'active') {
      const allDone = log.tasks?.every(t => t.completed);
      const anyDone = log.tasks?.some(t => t.completed);
      if (allDone || log.tasks?.length === 0) {
        temp++;
        current = temp;
      } else if (anyDone) {
        temp++; // partial counts - still kept streak
        current = temp;
      } else {
        break; // zero tasks done - streak broken
      }
    } else if (log.dayState === 'rest') {
      temp++; // rest days protect streak
      current = temp;
    } else if (log.dayState === 'pause') {
      break; // pause day resets streak
    }

    best = Math.max(best, temp);
    expectedDate = getPreviousDateStr(log.date);
  }

  return { current, best };
}

export function getSevenDayDots(logs) {
  const dots = [];
  for (let i = 6; i >= 0; i--) {
    const dateStr = getPastDate(i);
    const log = logs.find(l => l.date === dateStr);
    if (!log) {
      dots.push({ date: dateStr, state: 'none', rate: 0 });
    } else if (log.dayState === 'rest') {
      dots.push({ date: dateStr, state: 'rest', rate: 1 });
    } else if (log.dayState === 'pause') {
      dots.push({ date: dateStr, state: 'pause', rate: 0 });
    } else {
      const total = log.tasks?.length ?? 0;
      const done = log.tasks?.filter(t => t.completed).length ?? 0;
      const rate = total > 0 ? done / total : 0;
      const state = rate === 1 ? 'complete' : rate > 0 ? 'partial' : 'none';
      dots.push({ date: dateStr, state, rate });
    }
  }
  return dots;
}

function getPastDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function getPreviousDateStr(dateStr) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
```

**src/utils/momentumMessage.js:**

```javascript
export function generateMessage({ yesterdayLog, streak, weeklyAvgRate }) {
  if (!yesterdayLog) return "First day. Set your tasks and start building.";

  const { dayState, tasks } = yesterdayLog;

  if (dayState === 'rest')  return "Yesterday was a rest day. Fresh start today.";
  if (dayState === 'pause') return "Yesterday was a pause day. Today counts. Go.";

  const total     = tasks?.length ?? 0;
  const completed = tasks?.filter(t => t.completed).length ?? 0;
  const rate      = total > 0 ? completed / total : 0;

  if (rate === 1  && streak >= 7)  return `${streak} days straight. Don't break it now.`;
  if (rate === 1)                  return `${completed}/${total} yesterday. Clean sweep. Keep it going.`;
  if (rate >= 0.75)                return `${completed}/${total} yesterday. One more today beats your average.`;
  if (rate >= 0.5  && streak > 3)  return `${completed}/${total} yesterday. ${streak}-day streak to protect.`;
  if (rate >= 0.5)                 return `${completed}/${total} yesterday. Aim for ${Math.ceil(total * 0.75)} today.`;
  if (rate > 0    && streak > 7)   return `Rough day. But ${streak} days behind you. Restart strong.`;
  if (rate > 0)                    return `${completed} done yesterday. Small wins count. Do more today.`;
  return "Zero yesterday. That's information. Use it. Start now.";
}
```

**MomentumBar layout (top of HomeScreen):**
- Row 1: "Yesterday: 5/8" | "🔥 14 days" | "Best: 21 days"
- Row 2: Seven colored dots (7-day history)
- Row 3: Dynamic motivational message (italic, subtle)

**Success Criteria:**
- [ ] Yesterday score shows correct completed/total count
- [ ] Current streak calculates correctly from DB logs
- [ ] Personal best streak updates when current exceeds it
- [ ] 7-day dots show correct colors per day state
- [ ] Message changes based on actual data (not random)
- [ ] All values show "0" or "First day" message on fresh install

---

## PHASE 9 - History Screen (Day 5 AM)

**CalendarHeatmap.jsx layout:**
- Month/Year header with left/right arrows and "Today" button
- Day-of-week labels: S M T W T F S
- Full month grid of day squares (32x32px touch targets)
- Each square color: green (complete), light green (partial), blue (rest), amber (pause), slate (no data)
- Today's square has a dot/ring indicator
- Tap any square that has data: opens DayDetail modal

**DayDetail.jsx (modal):**
- Date header (e.g. "Wednesday, 18 Jun")
- Day state badge (Active / Rest Day / Pause Day)
- Task list with: emoji, task name, duration, completion checkmark or empty box
- Pomodoro tasks show: sets completed out of total
- Read-only - no editing from this view
- Close button or tap-outside to dismiss

**Month navigation:**
- Only allow going back (no future months)
- Stop at the month of the first log in DB

**Success Criteria:**
- [ ] Current month grid renders with correct day alignment
- [ ] All logged days show correct color states
- [ ] Tapping a logged day shows correct task snapshot in modal
- [ ] Previous month navigation works
- [ ] Today's date has a visual indicator
- [ ] Empty days (no log) show slate/grey

---

## PHASE 10 - Settings + Backup (Day 5 PM)

**SettingsScreen sections:**

1. **App Info** - App name, version number
2. **Backup** - "Export Backup" button + "Import Backup" file input
3. **Data** - "Clear All Data" with double-confirmation modal (type "DELETE" to confirm)

**src/utils/backupExport.js:**

```javascript
import { db } from '../db/schema';

export async function exportBackup() {
  try {
    const tasks    = await db.task_templates.toArray();
    const logs     = await db.daily_logs.toArray();
    const sessions = await db.pomodoro_sessions.toArray();

    const backup = {
      version: 1,
      appName: 'DailyFocus',
      exportedAt: new Date().toISOString(),
      data: { tasks, logs, sessions }
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href     = url;
    a.download = `dailyfocus-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function importBackup(file) {
  try {
    const text   = await file.text();
    const backup = JSON.parse(text);

    if (backup.version !== 1) throw new Error('Incompatible backup version');
    if (!backup.data?.tasks) throw new Error('Invalid backup file structure');

    await db.transaction('rw', db.task_templates, db.daily_logs, db.pomodoro_sessions, async () => {
      await db.task_templates.clear();
      await db.daily_logs.clear();
      await db.pomodoro_sessions.clear();
      if (backup.data.tasks.length)    await db.task_templates.bulkAdd(backup.data.tasks);
      if (backup.data.logs.length)     await db.daily_logs.bulkAdd(backup.data.logs);
      if (backup.data.sessions.length) await db.pomodoro_sessions.bulkAdd(backup.data.sessions);
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
```

**Weekly backup prompt logic (in useMidnightArchive.js):**

```javascript
// Uses localStorage for prompt tracking only (not task data)
const BACKUP_PROMPT_KEY = 'df_last_backup_prompt';

function shouldShowBackupPrompt() {
  const today = new Date();
  if (today.getDay() !== 1) return false; // Only on Monday
  const last = localStorage.getItem(BACKUP_PROMPT_KEY);
  if (!last) return true;
  const daysSince = (Date.now() - new Date(last).getTime()) / 86400000;
  return daysSince >= 6;
}

function markBackupPromptShown() {
  localStorage.setItem(BACKUP_PROMPT_KEY, new Date().toISOString());
}
```

**Success Criteria:**
- [ ] Export creates a valid JSON file named with today's date
- [ ] Downloaded JSON contains all 3 data tables with correct structure
- [ ] Import restores all data correctly (verify in DevTools IndexedDB viewer)
- [ ] Import rejects wrong version number with clear error toast
- [ ] Import rejects corrupted JSON with clear error toast
- [ ] Import is atomic (all-or-nothing via Dexie transaction)
- [ ] Backup prompt appears on first Monday open of the week
- [ ] Prompt dismissed does not reappear until next Monday

---

## PHASE 11 - Error Handling + Edge Cases (Day 6 AM)

**src/components/shared/ErrorBoundary.jsx:**

```jsx
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('DailyFocus crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50">
          <div className="text-5xl mb-4">😵</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-6 text-sm">Your data is safe. Try reloading the app.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-slate-800 text-white px-8 py-3 rounded-2xl font-medium"
          >
            Reload DailyFocus
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Edge case handler table:**

| Scenario | Handler |
|---|---|
| Add 9th task | Add button disabled at 8, toast "Maximum 8 tasks reached" |
| IndexedDB write fails | Try/catch on every query call, show error toast, log to console |
| Import corrupted JSON | JSON.parse in try/catch, toast "Invalid backup file" |
| Import wrong version | Check `backup.version === 1`, toast "Incompatible backup version" |
| Vibration API absent | `'vibrate' in navigator` check before every vibrate call |
| Screen locks mid-timer | visibilitychange handler recalculates elapsed time on resume |
| Midnight archive fails | Catch error, log it, don't crash - show stale tasks instead |
| Rest day limit hit | Block with modal dialog (not just toast - too easy to miss) |
| Pause day limit hit | Block with modal dialog with specific reason message |
| App opens on same day twice | Archive check compares dates - idempotent, no double-archive |
| Zero tasks configured | Home shows empty state CTA "Tap + to add your first task" |
| No logs in DB | Momentum Bar shows "First day" state gracefully |

**Success Criteria:**
- [ ] Error boundary renders recovery screen instead of white screen
- [ ] All 12 edge cases from table tested manually
- [ ] Every DB call has try/catch with user-visible error feedback
- [ ] Timer handles screen lock/unlock correctly (no time jumping)

---

## PHASE 12 - PWA Build + Deploy (Day 6 PM)

**Build:**

```bash
npm run build
# Output in dist/ folder
```

**Test PWA locally on mobile before deploying:**

```bash
# Install serve globally
npm install -g serve

# Serve the production build
serve -s dist

# Find your local IP
ipconfig   # Windows - look for IPv4 Address

# On your mobile browser open:
http://192.168.X.X:3000
```

**Deploy to Netlify:**

```bash
# Option 1 (simplest): drag and drop dist/ folder to netlify.com/drop
# No account needed for quick test

# Option 2 (recommended): connect GitHub for auto-deploy on every push
# netlify.toml is already created in Phase 0
```

**Install as PWA on Android:**
1. Open the Netlify URL in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home Screen"
4. Tap "Install"

**Install as PWA on iOS:**
1. Open the Netlify URL in Safari (must be Safari)
2. Tap the Share icon (square with arrow)
3. Scroll down, tap "Add to Home Screen"
4. Tap "Add"

**Share with accountability group:**
- Send the Netlify URL via WhatsApp
- Each member installs on their own device
- Each device has its own independent IndexedDB data store
- No accounts, no login, no data shared between members

**Success Criteria:**
- [ ] `npm run build` completes without errors or warnings
- [ ] Lighthouse PWA score >= 90 (run in Chrome DevTools > Lighthouse tab)
- [ ] App installs to home screen on Android Chrome
- [ ] App installs to home screen on iOS Safari
- [ ] App works fully offline after first install (turn off WiFi, reopen)
- [ ] All 4 screens work correctly after PWA install
- [ ] Backup export downloads a file on mobile (saves to Files app)
- [ ] Timer vibration works on Android (not expected on iOS - known limitation)

---

## TIMELINE

| Day | Phase | Deliverable |
|---|---|---|
| Day 0 | Environment Setup | Vite + React + Tailwind + PWA running at localhost |
| Day 1 AM | Database Layer | Dexie schema verified in DevTools IndexedDB |
| Day 1 PM | Constants + Store | Colors, emojis, Zustand store all working |
| Day 2 AM | App Shell | 4 screens routing, bottom nav, mobile layout |
| Day 2 PM | Task CRUD Editor | Add, edit, delete all 3 task types to DB |
| Day 3 AM | Timer System | Countdown + Pomodoro with auto-advance + vibration |
| Day 3 PM | Today Screen | All 3 card types rendering with correct layout |
| Day 4 AM | Day State + Archive | Midnight archive + rest/pause rules enforced |
| Day 4 PM | Momentum Bar | Streak, 7-day dots, dynamic message all data-driven |
| Day 5 AM | History Screen | Calendar heatmap + day detail tap working |
| Day 5 PM | Settings + Backup | JSON export/import + weekly backup prompt |
| Day 6 AM | Error Handling | All 12 edge cases covered, error boundary live |
| Day 6 PM | PWA Deploy | Installed on phone, Netlify URL shared with group |

---

## DEBUGGING MATRIX

| Symptom | Check First | Check Second |
|---|---|---|
| IndexedDB not persisting | DevTools > Application > IndexedDB - confirm DB exists | Dexie version must be exactly 3.2.7 - check package.json |
| DB opens then crashes | Check for Dexie version mismatch warning in console | Delete the DB in DevTools and reload (schema changed) |
| Timer stops on screen lock | Confirm `visibilitychange` handler is attached in useCountdown | Use `Date.now()` timestamps, not interval tick count |
| PWA not installing on Android | Must be served over HTTPS - Netlify provides this automatically | Check manifest.json has correct icon paths and sizes |
| PWA not installing on iOS | Must use Safari browser - Chrome on iOS cannot install PWAs | Confirm `display: 'standalone'` in manifest.json |
| Blank white screen on load | Check browser console for JS import errors | Confirm React Router redirect rule exists in netlify.toml |
| /history route returns 404 | netlify.toml `[[redirects]]` rule missing or misconfigured | Redeploy after adding netlify.toml to repo |
| Vibration not working | iOS Safari does not support Vibration API - this is expected | On Android, check `'vibrate' in navigator` returns true |
| Backup export fails on iOS | Use `document.body.appendChild(a); a.click(); body.removeChild(a)` pattern | Avoid `window.open()` for blob URLs on iOS |
| Heatmap shows wrong colors | Date strings must be 'YYYY-MM-DD' - avoid Date object comparison | Check timezone: `new Date().toISOString()` uses UTC not local |
| Streak counting incorrectly | Log the sorted logs array to console - check sort direction | Gap detection: missing dates between logs must break streak |
| Yesterday template not loading | Confirm midnight archive ran - check DB for yesterday date entry | `getLogByDate(yesterday)` must return tasks array not undefined |
| Rest day rule not blocking | `getISOWeek()` helper must agree on week boundaries across logs | Verify all logs for the week are being fetched in the query |

---

## MVP LOCK - Do Not Build in V1

- Push notifications / morning reminders (V2)
- SVG icon library replacing emoji picker (V2)
- Smart daily/evening reminders with configurable times (V2)
- Task drag-to-reorder on home screen (V2)
- Multiple daily templates (weekday vs weekend) (V2)
- Dark mode (V2)
- Social sharing / screenshot generator of day summary (V2)
- Cross-device sync or cloud backup (V2)
- Weekly/monthly summary report screen (V2)
- Task categories or grouping (V2)
- Habit analytics / completion trend charts (V2)

---

## DECISION LOG

| Decision | Choice | Alternatives Considered | Reason |
|---|---|---|---|
| Platform | PWA | Native Android app | No app store, instant install via URL |
| Framework | React 18 + Vite | Vanilla JS, Vue | Timer/state complexity needs React |
| Storage | Dexie.js (IndexedDB) | CSV, localStorage, SQLite WASM | Local-only, offline, handles years of data |
| State | Zustand | Redux, Context API | Lightweight, no boilerplate |
| Deployment | Netlify free | Vercel, self-hosted | Zero config, HTTPS auto, drag-and-drop deploy |
| Task icons | Emoji (V1) | SVG icon library | Ship fast, add polish in V2 |
| Task colors | 12 preset palette | Full color picker, auto-assign | No bad color choices, always looks good |
| Task types | Checkbox / Countdown / Pomodoro | Pomodoro only for all | Matches all use cases in original design |
| Max tasks | 8 | 4 (too rigid), unlimited (unfocused) | Balance flexibility and daily focus |
| Day states | Active / Rest Day / Pause Day | Binary complete/incomplete | Accountability without shame spiral |
| Rest Day limit | 2 per week | Unlimited, 1 per week | Intentional rest without enabling avoidance |
| Pause Day limit | Max 2 consecutive | Streak reset on any pause | Breaks streak to prevent abuse, modal blocks 3rd |
| History view | Heatmap + day detail | List only, heatmap only | Visual motivation plus full data access |
| Momentum location | Home screen top | Separate stats screen | Contextual motivation, zero extra navigation |
| Backup strategy | Weekly JSON prompt + manual export | Auto midnight file, CSV | PWA cannot auto-write files without user tap |
| Notifications V1 | None (timer vibrate only) | Full notification system | Reduces complexity, safe for V1 |

---

## FINAL CHECKLIST

- [ ] All packages pinned with exact versions in package.json (no ^ or ~ prefixes)
- [ ] Dexie.js is exactly 3.2.7 - confirmed in package.json
- [ ] netlify.toml includes `[[redirects]]` rule for React Router
- [ ] Vibration API wrapped with `'vibrate' in navigator` check before every call
- [ ] Only one timer runs at a time - enforced via Zustand `activeTimerId`
- [ ] Midnight archive is idempotent - safe to run multiple times same day
- [ ] Day state violations blocked with modal dialog (not just toast)
- [ ] Import backup uses Dexie transaction (all-or-nothing restore)
- [ ] Export backup uses `document.body.appendChild(a)` pattern (iOS compatible)
- [ ] Error boundary wraps entire app in main.jsx
- [ ] Timer uses `visibilitychange` to recalculate elapsed on screen resume
- [ ] PWA manifest includes 192px and 512px icons (both required)
- [ ] netlify.toml committed to repo before connecting to Netlify
- [ ] Production build tested with `serve -s dist` on real mobile device
- [ ] App tested fully offline after installing to home screen
- [ ] Lighthouse PWA score >= 90 before sharing with accountability group
- [ ] All 12 edge cases from debugging matrix tested manually
- [ ] Weekly backup prompt uses localStorage for timestamp only (not task data)
- [ ] Empty state renders correctly when zero tasks configured
- [ ] Momentum Bar shows graceful "First day" state on fresh install

---

*DailyFocus V1 Beta - Built for accountability. FOCUS. CONSISTENCY. GROWTH.*
