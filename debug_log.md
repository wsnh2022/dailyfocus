# DailyFocus - Hosting & Deployment Debug Log

A record of every production issue encountered after deploying to GitHub Pages, what caused it, and how it was resolved.

---

## Issue 1 - White Screen on GitHub Pages

**Date:** June 2026  
**URL:** `https://wsnh2022.github.io/dailyfocus/`  
**Symptom:** Blank white page on mobile. Page title "DailyFocus" showed in the browser tab but no UI rendered.

### Root Cause

GitHub Pages was configured with **Source: Deploy from a branch → `main` → `/ (root)`**. This serves the raw source files directly from the `main` branch root.

The source `index.html` contains:

```html
<script type="module" src="/src/main.jsx"></script>
```

Browsers cannot execute `.jsx` files natively - they require Vite's dev server to transpile them. Without the build step, the script 404s silently and React never mounts, leaving the `#root` div empty.

The `dist/` folder (the actual built output) is listed in `.gitignore` and is **never committed to the repo**, so branch-based serving had nothing usable to serve.

### Investigation

Fetching `https://wsnh2022.github.io/dailyfocus/assets/index-D0-z92gX.js` (the built JS bundle) returned **HTTP 404**, confirming the built files were not being served.

### Fix Attempt 1 - Switch to JamesIves action (wrong direction)

Updated `.github/workflows/deploy.yml` to use `JamesIves/github-pages-deploy-action@v4`, which pushes built `dist/` to a `gh-pages` branch. This approach requires Pages source to be set to "Deploy from a branch → `gh-pages`".

**Result:** This was the wrong direction - GitHub Pages source was already set to **"GitHub Actions"** (not "Deploy from a branch"), meaning the Actions-based deployment method was correct all along. The JamesIves action was incompatible with this setting.

### Fix Attempt 2 - Restore original workflow (correct)

Reverted `deploy.yml` back to the original approach:

```yaml
- uses: actions/upload-pages-artifact@v3
  with:
    path: dist
- uses: actions/deploy-pages@v4
```

With Pages source set to **"GitHub Actions"**, this correctly deploys the built `dist/` folder as a Pages artifact. The workflow builds fresh on every push to `main` - no committed build output needed.

**Result:** ✅ Site loaded correctly.

---

## Issue 2 - URL Redirecting from `/dailyfocus/` to `/`

**Symptom:** Visiting `https://wsnh2022.github.io/dailyfocus/` and refreshing in Chrome redirected to `https://wsnh2022.github.io/` (the GitHub Pages root for the user, unrelated to this app).

### Root Cause

`App.jsx` used `<BrowserRouter>` with no `basename`:

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/"        element={<HomeScreen />} />
    <Route path="/editor"  element={<EditorScreen />} />
    ...
    <Route path="*"        element={<Navigate to="/" replace />} />
  </Routes>
</BrowserRouter>
```

React Router 6 evaluates routes against the full browser pathname. When deployed at `/dailyfocus/`, the pathname is `/dailyfocus/`. Without `basename="/dailyfocus"`, React Router does not strip the prefix before matching - so `/dailyfocus/` does **not** match `path="/"`, no route matches at all, and the catch-all `<Navigate to="/" replace />` fires, sending the browser to `https://wsnh2022.github.io/`.

This also caused:
- All in-app navigation to go to wrong URLs
- Service worker unable to intercept correctly
- PWA install not working (app never fully loaded)

### Fix

Added `basename` using Vite's `import.meta.env.BASE_URL`, which automatically reflects the `base` config:

```jsx
<BrowserRouter basename={import.meta.env.BASE_URL}>
```

| Environment | `BASE_URL` value | Effective basename |
|---|---|---|
| Dev (`vite`) | `/` | `/` (root, no change) |
| Production build | `/dailyfocus/` | `/dailyfocus/` |

**Result:** ✅ Routes matched correctly. Navigation worked. Refresh no longer redirected.

---

## Issue 3 - Added Tasks Not Appearing on Home Screen

**Symptom:** After adding a new task in the Add Task screen, the Home screen still showed the old task list. The new task only appeared the next day.

### Root Cause

The Home screen reads `todayTasks` from Zustand, which is populated by `useMidnightArchive` on app mount:

- **New day**: loads all templates from DB → creates today's task list → saves to `daily_log`
- **Same day (log exists)**: restores tasks from the **existing `daily_log`** - ignores templates

When a new task was saved via `TaskEditor`, it was written to `task_templates` but the already-running day's `daily_log` was **not updated**. The Zustand store retained the stale list from the initial mount. Navigating back to Home showed the old list.

The same issue applied to editing a task name/emoji and deleting a task - changes to templates weren't reflected in today's live view.

### Fix

Modified `TaskEditor.jsx` to sync changes into the Zustand store and persist the updated log immediately after every save or delete:

```javascript
// After adding a new task:
const newId = await addTask(data);
const updated = [...todayTasks, { ...data, id: newId, completed: false }];
setTodayTasks(updated);
await saveLog({ date: today, dayState, tasks: updated, ... });

// After editing an existing task:
const updated = todayTasks.map(t => t.id === task.id ? { ...t, ...data } : t);
setTodayTasks(updated);
await saveLog({ ... });

// After deleting a task:
const updated = todayTasks.filter(t => t.id !== task.id);
setTodayTasks(updated);
await saveLog({ ... });
```

**Result:** ✅ New/edited/deleted tasks reflect immediately on Home without restart.

---

## Issue 4 - PWA Shows "App Already Installed" (Wrong App)

**Symptom:** On Android Chrome, visiting `https://wsnh2022.github.io/dailyfocus/` showed "This app is already installed" pointing to a different PWA (`https://wsnh2022.github.io/prompts.html`) that was previously installed on the same GitHub Pages user domain.

### Root Cause

The previously installed `prompts.html` PWA was registered on the same origin (`wsnh2022.github.io`) with a service worker scope of `/`. A scope of `/` claims the **entire origin** - including all sub-paths like `/dailyfocus/`. Chrome identified the DailyFocus PWA as belonging to the already-installed app because they shared the same origin with no `id` field to distinguish them.

Without an explicit `id` in the Web App Manifest, browsers derive app identity from `start_url`, but the scope conflict at the origin level caused Chrome to conflate the two.

### Fix

Added an explicit `id` field to the PWA manifest in `vite.config.js`:

```javascript
manifest: {
  id: '/dailyfocus/',   // ← added
  scope: '/dailyfocus/',
  start_url: '/dailyfocus/',
  ...
}
```

The `id` field is the Web App Manifest spec's canonical unique identifier for a PWA. Setting it to `/dailyfocus/` makes Chrome treat this as a distinct installable app, regardless of what other PWAs share the same origin.

**Additional step for users:** If Chrome still shows the conflict after the manifest update, clear the site storage on Android:  
Chrome → site settings for `wsnh2022.github.io` → Clear data → revisit the app.

**Result:** ✅ DailyFocus recognised as a separate installable PWA.

---

## Issue 5 - Emoji Picker Cut Off on Mobile

**Symptom:** The "Pick an Emoji" bottom sheet was too tall - the emoji grid extended below the bottom of the screen and was inaccessible on short phone screens.

### Root Cause

`Modal.jsx` had no height constraint - the bottom sheet could grow to any height. `EmojiPicker.jsx` rendered all emojis in a plain `grid` with no scroll, so a large category overflowed off-screen.

### Fix

Two-part fix:

**`Modal.jsx`** - cap the sheet height and make it a flex column:
```jsx
<div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10 max-h-[85vh] flex flex-col">
```

**`EmojiPicker.jsx`** - lock the header and category tabs, make only the grid scroll:
```jsx
{/* header - flex-shrink-0, never compresses */}
{/* category tabs - flex-shrink-0 */}
<div className="overflow-y-auto flex-1 min-h-0">
  <div className="grid grid-cols-5 gap-2">
    {/* emojis */}
  </div>
</div>
```

**Result:** ✅ Header and category tabs always visible; emoji grid scrolls within the remaining space.

---

## Key Lessons

| # | Lesson |
|---|---|
| 1 | GitHub Pages with `actions/deploy-pages` requires Pages source set to **"GitHub Actions"** - not "Deploy from a branch". |
| 2 | React Router `BrowserRouter` **must** have `basename` set when the app is deployed at a sub-path. Use `import.meta.env.BASE_URL` to handle dev/prod automatically. |
| 3 | PWA `id` in the manifest is essential when multiple PWAs share the same origin (e.g., a shared GitHub Pages user domain). |
| 4 | State that lives in Zustand must be kept in sync with the DB manually - writing to Dexie does not automatically update in-memory store state. |
| 5 | Bottom sheets need `max-h` + `flex flex-col` on the container and `overflow-y-auto flex-1 min-h-0` on the scrollable section to work correctly on all screen sizes. |
