# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevTrack is a developer time tracking SPA with a lightweight companion server for local git integration. Client-side data persists in `localStorage` under key `"devtrack_data_v1"`. Git commit data is fetched from local repositories via a companion Express server.

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

**Single-file frontend + companion git server**:

### Frontend (`src/App.jsx`, ~1700 lines)

- **`App()`** — root component with all state (`useState`) and navigation. State auto-saves to localStorage on every change via `useEffect`.
- **Six view components**, each in a clearly marked section:
  - `Dashboard` — stats cards, weekly chart, recent activity
  - `TimerView` — work/break timer, session start/stop, idle detection
  - `SessionsView` — session history list with edit/delete
  - `GitView` — local git repository tracking via companion server
  - `AnalyticsView` — charts (daily hours, tag distribution, hourly activity, peak hours)
  - `ExportView` — Excel/CSV export with multiple sheets (uses `xlsx` library)
- **Supporting components**: `StatCard`, `SettingsModal`, `Toast`
- **Utilities**: `Icon` (SVG component), `ICONS` map, `formatDuration`, `formatTime`, `formatDate`, `isToday`, `dayName`, `startOfDay`
- **Data layer**: `load()`, `save()` — operate on a single JSON blob in localStorage. `load()` includes migration logic for data model changes.

**Entry points**: `index.html` → `src/main.jsx` → `src/App.jsx`

### Git Server (`server/git-server.mjs`, ~180 lines)

Lightweight Express server on port 9001 that runs local git commands. Vite proxies `/api/git/*` requests to this server.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/git/health` | GET | Check if git CLI is available |
| `/api/git/validate` | POST | Validate a folder path is a git repository |
| `/api/git/log` | POST | Fetch commit history with file stats |
| `/api/git/branches` | POST | List branches in a repository |

Uses `child_process.exec` with shell-escaped arguments for reliable PATH resolution.

## Key Libraries

| Library | Purpose |
|---------|---------|
| React 19 | UI framework (JSX, no TypeScript) |
| Vite 8 | Build tool, dev server (port 9000), proxy to git server |
| Express 5 | Companion server for local git commands (port 9001) |
| Tailwind CSS 3 | Styling (dark theme with slate palette) |
| Framer Motion | Animations (`motion`, `AnimatePresence`) |
| Recharts 3 | Charts (Area, Line, Bar, Pie) |
| xlsx | Excel/CSV export |
| concurrently | Run Vite + git server together |

## Data Model

The entire app state is one object persisted as JSON:

```
{
  sessions: [{ id, type, start, end, duration, tags, notes, status }],
  commits: [{ sha, message, repo, repoPath, timestamp, author, authorEmail, branch, source, filesChanged, insertions, deletions }],
  settings: { dailyGoal, idleMinutes, trackedRepos: [{ id, path, name, branch, lastSync }] },
}
```

The `source` field on commits is `"local"` (synced from git) or `"manual"` (user-entered).
The `load()` function migrates old data: removes `githubToken`/`githubUser`, adds `trackedRepos`, tags existing commits as `source: "manual"`.

## Styling Conventions

- Dark theme only — Tailwind classes with `bg-slate-*`, `text-slate-*` palette
- All icons are inline SVG via the `Icon` component and `ICONS` map (no icon library dependency)
- Responsive layout using Tailwind's responsive prefixes

## Important Notes

- Git integration is **local-only** — no remote API calls. The companion server runs `git log` on user-specified local folders.
- No environment variables or `.env` files needed
- ESLint config uses the flat config format (`eslint.config.js`) with React hooks and React Refresh plugins
- Vite proxy config in `vite.config.js` forwards `/api/git` to `localhost:9001` (dev mode only)
