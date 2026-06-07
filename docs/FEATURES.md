# DevTrack Features

Detailed feature reference. For a quick overview, see the [main README](../README.md).

## Timer & Session Tracking
- **Work/break timer** with start, stop, pause, and resume
- **Idle detection** — automatically detects when you step away
- **Pause tracking** — every pause is recorded with precise start/end timestamps
- **Accurate durations** — `totalWorkTime` and `totalBreakTime` calculated independently
- **Session lifecycle** — running → paused → completed, with full state transitions
- **Auto-save every 30 seconds** during active sessions for crash recovery
- **Tag system** — categorize sessions with multiple tags for project tracking
- **Session editing** — full CRUD on completed sessions (time, tags, notes, everything)
- **Active session persistence** — survives page reloads with full state restoration

## Git Integration (100% Local)
- **Track multiple repositories** — add any local git repo by absolute path
- **Automatic commit sync** — fetches commit history directly from `git log`
- **Branch detection** — shows which branch each commit belongs to
- **File change statistics** — insertions, deletions, and files changed per commit
- **Multi-identity support** — track commits across multiple git identities (work + personal)
- **Auto-detect identities** — scans repos for `user.name` and `user.email`
- **Manual commits** — add commits manually for work outside version control
- **Smart work estimation** — groups consecutive commits into work sessions with confidence scoring
- **Sync on session stop** — automatically syncs all repos when you finish a session
- **Security-hardened** — path traversal prevention, shell escaping, read-only operations only

## Notes, Checkpoints & Work Logs
- **Timestamped checkpoints** — add notes at any point during a session with precise timestamps
- **Standalone work log** — capture thoughts and progress even without an active session
- **Inline editing** — edit checkpoint text and timestamps in-place
- **Privacy controls** — mark notes as private (automatically excluded from exports)
- **Search** — full-text search across all work log entries
- **Date grouping** — entries organized by day with expandable sections

## Analytics & Insights
- **Daily hours over time** — tracked vs git-estimated hours (Line Chart)
- **Weekly work/break distribution** — 7-day area chart with gradient fills
- **Tag distribution** — time allocation across projects (Pie Chart)
- **Peak hours** — identifies your most productive hours of the day (Bar Chart)
- **Date range filtering** — week, month, or year views
- **Git-estimated comparison** — compare manually tracked time against commit-derived estimates
- **Goal tracking** — compares actual hours against your daily goal

## Dashboard
- **4 stat cards** with animated progress bars: today's hours, session count, break time, streak
- **Weekly activity chart** — Recharts-powered stacked area chart with gradient fills
- **Recent activity feed** — last 6 sessions with commit associations
- **Streak tracking** — current and best streak calculated over 365 days
- **Git comparison panel** — estimated vs tracked hours with dual progress bars

## Professional Export Engine

**Excel (.xlsx)** — 6 professionally styled sheets with custom color scheme:

| Sheet | Contents |
|-------|----------|
| **Dashboard** | Executive summary — total hours, sessions, commits, goal %, tag distribution |
| **Timesheet** | Enterprise grid — clock in/out, break hours, overtime detection, daily subtotals |
| **Daily Summary** | Day-by-day goal tracking with variance calculations |
| **Tag Analysis** | Project breakdown — hours, sessions, avg duration, % of total |
| **Git Activity** | Complete commit log with file stats, SHA, branch info |
| **Work Log** | Standalone timestamped notes (conditional sheet) |

Also includes CSV export, checkpoint toggles, privacy filtering, and professional styling.

## Data Persistence & Disaster Recovery

```
Layer 1: localStorage (instant, always available)
    ↓ corrupt or cleared?
Layer 2: Server disk backup (server/data/devtrack.json)
    ↓ file corrupted?
Layer 3: Version snapshots (up to 20, one-click restore)
    ↓ all versions lost?
Layer 4: Atomic writes prevent corruption in the first place
```

## Sync Engine
- **Field-level diffing** — compares sessions, commits, settings, and UI state independently
- **Three sync strategies**: Push (local wins), Pull (server wins), Merge (interactive)
- **Dry-run preview** — see exactly what will change before committing
- **Conflict resolution UI** — side-by-side comparison with bulk resolution options
- **App-wide inert lock** — entire UI freezes during sync to prevent concurrent modifications
