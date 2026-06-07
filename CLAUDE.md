# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevTrack is a developer time tracking SPA with a lightweight companion server for local git integration and data persistence. Client-side data persists in `localStorage` under key `"devtrack_data_v1"` and is also saved to `server/data/devtrack.json` via the companion server.

## Commands

```bash
npm run dev        # Start Vite (9000) + git server (9001) concurrently
npm run dev:client # Start only the Vite dev server on port 9000
npm run dev:server # Start only the git companion server on port 9001
npm run build      # Production build to dist/
npm run lint       # ESLint across all .js/.jsx files
npm run preview    # Preview production build
```

No test framework is configured.

## Architecture

**Single-file frontend + companion server**:

### Frontend (`src/App.jsx`, ~4000 lines)

- **`App()`** — root component with all state (`useState`) and navigation. State auto-saves to localStorage + server on every change via debounced `useEffect`.
- **Six view components**, each in a clearly marked section:
  - `Dashboard` — stats cards, weekly chart, recent activity
  - `TimerView` — work/break timer, session start/stop, idle detection
  - `SessionsView` — session history list with edit/delete
  - `GitView` — local git repository tracking via companion server
  - `AnalyticsView` — charts (daily hours, tag distribution, hourly activity, peak hours)
  - `ExportView` — Excel/CSV export with multiple sheets (uses `src/utils/exportEngine.js`)
- **Supporting components**: `StatCard`, `SettingsModal`, `SyncView`, `Toast`
- **Utilities**: `Icon` (SVG component), `ICONS` map, `formatDuration`, `formatTime`, `formatDate`, `isToday`, `dayName`, `startOfDay`
- **Data layer**: `load()`, `loadFromServer()`, `save()` — operate on a single JSON blob. `load()` includes migration logic.

**Entry points**: `index.html` → `src/main.jsx` → `src/App.jsx`

**Utility modules**: `src/utils/exportEngine.js` (Excel/CSV generation), `src/utils/syncEngine.js` (diff computation, merge strategies)

### Companion Server (`server/git-server.mjs`, ~500 lines)

Express server on port 9001 bound to `127.0.0.1`. Vite proxies `/api/*` requests to this server.

**Git endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/git/health` | GET | Check if git CLI is available |
| `/api/git/validate` | POST | Validate a folder path is a git repository |
| `/api/git/log` | POST | Fetch commit history with file stats |
| `/api/git/branches` | POST | List branches in a repository |
| `/api/git/user` | POST | Get git user.name & user.email for a repo |

**Data persistence endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/data` | GET | Load persisted app data from disk |
| `/api/data` | POST | Save app data to disk (write-queued, 5MB limit) |
| `/api/data` | DELETE | Clear persisted data file |

**Version management endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/data/versions` | GET | List all version snapshots |
| `/api/data/versions/:id` | GET | Get full data of a specific version |
| `/api/data/versions` | POST | Create a version snapshot from current disk data |
| `/api/data/versions/:id/restore` | POST | Auto-backup current, then restore version |
| `/api/data/versions/:id` | DELETE | Delete a single version snapshot |
| `/api/data/versions` | DELETE | Delete all version snapshots |

Uses `child_process.exec` with shell-escaped arguments. Data writes use atomic tmp+rename with a Promise-chain write mutex.

## Key Libraries

| Library | Purpose |
|---------|---------|
| React 19 | UI framework (JSX, no TypeScript) |
| Vite 8 | Build tool, dev server (port 9000), proxy to companion server |
| Express 5 | Companion server for local git commands + data persistence (port 9001) |
| Tailwind CSS 3 | Styling (dark theme with stone palette) |
| Framer Motion | Animations (`motion`, `AnimatePresence`) |
| Recharts 3 | Charts (Area, Line, Bar, Pie) |
| xlsx | Excel/CSV export |
| concurrently | Run Vite + git server together |

## Data Model

The entire app state is one object persisted as JSON:

```
{
  sessions: [{ id, type, start, end, duration, tags, notes, status, pauses, totalWorkTime, totalBreakTime }],
  commits: [{ sha, message, repo, repoPath, timestamp, author, authorEmail, branch, source, filesChanged, insertions, deletions }],
  settings: { dailyGoal, trackedRepos: [{ id, path, name, branch, lastSync }], gitAuthors: { identities: [], autoDetected: null } },
  ui: { view, sessionsFilter, gitRepoFilter, analyticsRange, exportPeriod, exportFormat },
}
```

- `source` on commits: `"local"` (synced from git) or `"manual"` (user-entered)
- `ui` section persists user preferences across reloads (active view, filters, ranges)
- Version snapshots are stored in `server/data/versions/` with a `manifest.json` registry (max 20)

## Styling Conventions

- Dark theme only — Tailwind classes with `bg-stone-*`, `text-stone-*` palette
- All icons are inline SVG via the `Icon` component and `ICONS` map (no icon library dependency)
- Responsive layout using Tailwind's responsive prefixes

## Important Notes

- Git integration is **local-only** — no remote API calls. The companion server runs `git log` on user-specified local folders.
- Data persistence is **local-only** — `server/data/devtrack.json` is the disk backup of localStorage.
- No environment variables or `.env` files needed
- ESLint config uses the flat config format (`eslint.config.js`) with React hooks and React Refresh plugins
- Vite proxy config in `vite.config.js` forwards `/api/git`, `/api/data/versions`, and `/api/data` to `localhost:9001` (dev mode only)
- Server data directory (`server/data/`) is gitignored — user data stays local
