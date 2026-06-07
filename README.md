<div align="center">

# ⏱️ DevTrack

**The developer-first time tracker that actually understands how you work.**

Track sessions. Sync git commits. Export professional reports. All local, all private, all yours.

[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Express 5](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [Deep Dives](#-deep-dives)

</div>

---

## 🧠 Why DevTrack?

Most time trackers are built for managers. DevTrack is built for **developers**.

- **No cloud, no accounts, no telemetry** — your data stays on your machine
- **Git-native** — automatically tracks work from your commit history
- **Dual storage** — localStorage for speed, disk for durability
- **Professional exports** — Excel reports with 6 styled sheets that look enterprise-grade
- **Smart estimations** — estimates work hours from commit patterns when you forget to track

---

## ✨ Features

### ⏱️ Precision Timer & Session Tracking

- **Work/break timer** with start, stop, pause, and resume
- **Idle detection** — automatically detects when you step away
- **Pause tracking** — every pause is recorded with precise start/end timestamps
- **Accurate durations** — `totalWorkTime` and `totalBreakTime` calculated independently
- **Session lifecycle** — running → paused → completed, with full state transitions
- **Auto-save every 30 seconds** during active sessions for crash recovery
- **Tag system** — categorize sessions with multiple tags for project tracking
- **Session editing** — full CRUD on completed sessions (time, tags, notes, everything)
- **Active session persistence** — survives page reloads with full state restoration

### 🔀 Git Integration (100% Local)

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

### 📝 Notes, Checkpoints & Work Logs

- **Timestamped checkpoints** — add notes at any point during a session with precise timestamps
- **Standalone work log** — capture thoughts and progress even without an active session
- **Inline editing** — edit checkpoint text and timestamps in-place
- **Privacy controls** — mark notes as private (automatically excluded from exports)
- **Search** — full-text search across all work log entries
- **Date grouping** — entries organized by day with expandable sections
- **Legacy migration** — automatically converts old notes to checkpoint format on upgrade
- **280-character focused notes** — keeps entries concise and actionable

### 📊 Analytics & Insights

- **Daily hours over time** — tracked vs git-estimated hours (Line Chart)
- **Weekly work/break distribution** — 7-day area chart with gradient fills
- **Tag distribution** — time allocation across projects (Pie Chart)
- **Peak hours** — identifies your most productive hours of the day (Bar Chart)
- **Date range filtering** — week, month, or year views
- **Smart data fetching** — fetches full history from server for year-range analytics
- **Git-estimated comparison** — compare manually tracked time against commit-derived estimates
- **Goal tracking** — compares actual hours against your daily goal

### 🖥️ Dashboard

- **4 stat cards** with animated progress bars:
  - Today's work hours with goal progress
  - Completed session count
  - Total break time
  - Current streak (with best streak comparison)
- **Weekly activity chart** — Recharts-powered stacked area chart with gradient fills
- **Recent activity feed** — last 6 sessions with commit associations
- **Streak tracking** — current and best streak calculated over 365 days
- **Git comparison panel** — estimated vs tracked hours with dual progress bars
- **Active session display** — shows running timer status with pause/resume controls
- **Welcome screen** — guided onboarding for first-time users

### 📤 Professional Export Engine

**Excel (.xlsx)** — 6 professionally styled sheets with custom color scheme:

| Sheet | Contents |
|-------|----------|
| **Dashboard** | Executive summary — total hours, sessions, commits, goal %, tag distribution |
| **Timesheet** | Enterprise grid — clock in/out, break hours, overtime detection, daily subtotals |
| **Daily Summary** | Day-by-day goal tracking with variance calculations |
| **Tag Analysis** | Project breakdown — hours, sessions, avg duration, % of total |
| **Git Activity** | Complete commit log with file stats, SHA, branch info |
| **Work Log** | Standalone timestamped notes (conditional sheet) |
| **Raw Data** | Unformatted export for data portability and re-import |

**Also includes:**
- **CSV export** — enhanced format with metadata headers and computed fields
- **Checkpoint toggles** — include/exclude session notes in exports
- **Work log toggle** — include/exclude standalone notes
- **Period filtering** — day, week, month, or year
- **Privacy filtering** — private notes automatically excluded
- **Professional styling** — Calibri + Consolas fonts, freeze panes, auto-filters, print margins, alternating row colors, amber accent headers

### 💾 Data Persistence & Disaster Recovery

DevTrack uses a **layered defense** system to ensure your data is never lost:

```
Layer 1: localStorage (instant, always available)
    ↓ corrupt or cleared?
Layer 2: Server disk backup (server/data/devtrack.json)
    ↓ file corrupted?
Layer 3: Version snapshots (up to 20, one-click restore)
    ↓ all versions lost?
Layer 4: Atomic writes prevent corruption in the first place
```

**Reliability features:**
- **Dual storage** — localStorage for instant access + server-side disk backup
- **Debounced auto-save** — 300ms throttle prevents excessive writes
- **Force-save on page close** — synchronous save + keepalive fetch for server backup
- **Atomic writes** — tmp+rename pattern prevents partial writes on the server
- **Write mutex** — serialized writes prevent concurrent POST interleaving
- **Version snapshots** — up to 20 timestamped snapshots with one-click restore
- **Auto-backup on restore** — creates safety snapshot before any version restore
- **Smart cache eviction** — 60-day localStorage window with server as source of truth
- **Cross-tab conflict detection** — warns about pending changes from other tabs
- **Corruption recovery** — auto-renames corrupt files, falls back to healthy copy
- **Data validation** — shape validation on every read and write
- **Migration system** — automatic schema evolution with backward compatibility

### 🔄 Sync Engine

A **pure function** library with zero side effects for maximum reliability:

- **Field-level diffing** — compares sessions, commits, settings, and UI state independently
- **Identity keys** — sessions by `id`, commits by `sha::repo::timestamp`
- **Three sync strategies**:
  - **Push** — local wins (browser → disk)
  - **Pull** — server wins (disk → browser)
  - **Merge** — three-way merge with interactive conflict resolution
- **Dry-run preview** — see exactly what will change before committing
- **Conflict resolution UI** — side-by-side comparison with bulk resolution options
- **App-wide inert lock** — entire UI freezes during sync to prevent concurrent modifications

### ⚙️ Settings & Configuration

- **Daily work goal** — configurable target hours with progress tracking
- **Git identity management** — add, remove, and auto-detect git identities across repos
- **Data management** — full reset with confirmation, version browsing and restore
- **Server status monitoring** — real-time connection indicator with health checks
- **UI preferences** — all view states, filters, and selections persist across reloads

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Port 9000)                    │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Dashboard │  │  Timer   │  │ Sessions │  │Analytics│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │             │             │              │       │
│  ┌────┴─────┐  ┌────┴─────┐  ┌───┴──────┐              │
│  │  GitView │  │Work Log  │  │  Export   │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │              │                     │
│  ┌────┴─────────────┴──────────────┴────────────────┐  │
│  │              Central State (useState)              │  │
│  │  sessions · commits · workLog · settings · ui     │  │
│  └───────────────────┬──────────────────────────────┘  │
│                      │                                   │
│         ┌────────────┼────────────┐                     │
│         │            │            │                      │
│    ┌────▼─────┐ ┌────▼────┐ ┌────▼─────┐              │
│    │localStorage│ │SyncView│ │ExportView│              │
│    │ (primary) │ │(merge) │ │(engine)  │              │
│    └──────────┘ └────┬────┘ └──────────┘              │
│                      │                                  │
├──────────────────────┼──────────────────────────────────┤
│        Vite Proxy    │(/api/* → :9001)                  │
├──────────────────────┼──────────────────────────────────┤
│                      ▼                                  │
│          Companion Server (Port 9001)                   │
│                                                         │
│  ┌──────────────────┐  ┌──────────────────────────────┐│
│  │  Git Endpoints    │  │      Data Endpoints          ││
│  │ /api/git/health   │  │  GET/POST/DELETE /api/data   ││
│  │ /api/git/validate │  │  /api/data/versions          ││
│  │ /api/git/log      │  │  /api/data/versions/:id      ││
│  │ /api/git/branches │  │  /api/data/versions/:id/     ││
│  │ /api/git/user     │  │           restore            ││
│  └───────┬──────────┘  └─────────────┬────────────────┘│
│          │                           │                  │
│    ┌─────▼───────┐         ┌────────▼────────┐         │
│    │   git CLI   │         │  server/data/   │         │
│    │ (local only)│         │  devtrack.json  │         │
│    └─────────────┘         │  versions/      │         │
│                            └─────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

### Design Principles

| Principle | Implementation |
|-----------|---------------|
| **Zero cloud dependency** | All data stored locally — localStorage + local disk |
| **Privacy-first** | No telemetry, no accounts, no remote APIs |
| **Dual reliability** | Browser + server persistence with sync engine |
| **Atomic operations** | tmp+rename writes, write mutex, debounced saves |
| **Graceful degradation** | Works offline; syncs when server available |
| **Progressive enhancement** | Core features work without server; server adds durability |

---

## 🗂️ Data Model

```javascript
{
  sessions: [{
    id, type,                // "work" | "break"
    start, end, duration,    // timestamps + milliseconds
    tags: [],                // project/category labels
    notes,                   // legacy text notes
    status,                  // "running" | "paused" | "completed"
    pauses: [{ start, end }],
    checkpoints: [{ id, text, ts, private }],
    totalWorkTime,           // ms of actual work
    totalBreakTime,          // ms of breaks/pauses
    commitIds: [],           // SHAs of commits during session
    _estimatedId             // links to git-estimated sessions
  }],

  commits: [{
    sha, message, repo, repoPath,
    timestamp, author, authorEmail, branch,
    source,                  // "local" | "manual"
    filesChanged, insertions, deletions
  }],

  workLog: [{ id, text, ts, private }],

  settings: {
    dailyGoal: 8,
    trackedRepos: [{ id, path, name, branch, lastSync }],
    gitAuthors: { identities: [], autoDetected: null }
  },

  ui: {
    view, sessionsFilter, gitRepoFilter,
    analyticsRange, exportPeriod, exportFormat,
    exportIncludeCheckpoints, exportIncludeWorkLog
  }
}
```

---

## 🛡️ Security

DevTrack takes security seriously even though it runs entirely locally:

- **Path traversal prevention** — all paths validated as absolute, `..` sequences rejected
- **Shell escaping** — `shEscape()` wraps all git command arguments in single quotes
- **Read-only git operations** — no push, pull, checkout, or any mutating git commands
- **Input validation** — all API inputs validated for type, format, and length
- **No remote access** — server binds to `127.0.0.1` only
- **Size limits** — 5MB request limit, 10,000 item array caps
- **Private note filtering** — private content automatically excluded from all exports

---

## 🧰 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React 19 | Component architecture with hooks |
| **Build Tool** | Vite 8 | Dev server (port 9000), proxy, HMR |
| **Backend** | Express 5 | Companion server for git + data (port 9001) |
| **Styling** | Tailwind CSS 3 | Dark theme with stone palette |
| **Animations** | Framer Motion | Page transitions, micro-interactions |
| **Charts** | Recharts 3 | Area, Line, Bar, Pie charts |
| **Export** | xlsx-js-style | Styled Excel generation |
| **Concurrency** | concurrently | Parallel dev server + client |

---

## 📐 Project Structure

```
devtrack/
├── index.html                  # Entry point
├── src/
│   ├── main.jsx                # React root mount
│   ├── App.jsx                 # Full application (~5,800 lines)
│   │   ├── Dashboard           # Stats, charts, activity feed
│   │   ├── TimerView           # Work/break timer with idle detection
│   │   ├── SessionsView        # Session history + editing
│   │   ├── GitView             # Repo tracking + commit log
│   │   ├── AnalyticsView       # Charts + productivity insights
│   │   ├── WorkLogView         # Timestamped notes + search
│   │   ├── ExportView          # Excel/CSV generation
│   │   ├── SyncView            # Data sync + conflict resolution
│   │   └── SettingsModal       # Goals, identities, data management
│   └── utils/
│       ├── exportEngine.js     # Excel/CSV generation (~1,250 lines)
│       └── syncEngine.js       # Diff computation + merge (~420 lines)
├── server/
│   ├── git-server.mjs          # Express companion server (~600 lines)
│   └── data/                   # Persisted data (gitignored)
│       ├── devtrack.json       # Disk backup of app state
│       └── versions/           # Version snapshots + manifest.json
├── vite.config.js              # Vite + proxy configuration
├── tailwind.config.js          # Tailwind + dark theme config
└── package.json                # Dependencies + scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **Git** CLI (for repository tracking features)

### Install & Run

```bash
# Clone the repository
git clone https://github.com/your-username/devtrack.git
cd devtrack

# Install dependencies
npm install

# Start both client + server
npm run dev
```

Open [http://localhost:9000](http://localhost:9000) — the app is ready to use.

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite (9000) + git server (9001) concurrently |
| `npm run dev:client` | Start only the Vite dev server |
| `npm run dev:server` | Start only the companion server |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | ESLint across all `.js`/`.jsx` files |
| `npm run preview` | Preview production build |

---

## 🔬 Deep Dives

### How Session Tracking Works

```
Start → Timer begins → Work time accumulates
  ↓
Pause → Pause recorded with start/end timestamps
  ↓
Resume → Timer continues, totalWorkTime accumulates
  ↓
Add Checkpoints → Timestamped notes captured in real-time
  ↓
Stop → Session completed, git repos auto-synced
  ↓
Edit → Adjust times, tags, notes after the fact
```

The timer tracks `totalWorkTime` (actual productive time) and `totalBreakTime` independently, so your analytics always reflect real productivity — not wall-clock time.

### How Git Estimation Works

When you forget to start the timer, DevTrack can estimate your work from commits:

1. **Filter** commits by your configured git identity
2. **Group** consecutive commits into sessions (based on time gaps)
3. **Apply smart padding** — adds ramp-up and cool-down time around commit clusters
4. **Detect bursts** — extends sessions for heavy commit activity periods
5. **Score confidence** — assigns high, medium, or low based on commit density
6. **Handle multi-repo** — merges estimates across multiple repositories

You can import any estimated session into your tracked time with one click.

### How Disaster Recovery Works

Every layer has automatic recovery:

| Scenario | Recovery |
|----------|----------|
| Corrupt localStorage | Restore from server disk backup |
| Corrupt server file | Auto-renamed to `.corrupt`, restore from localStorage |
| Both corrupted | Restore from version snapshots (up to 20 stored) |
| Page crash during write | 30-second checkpoint system limits data loss to 30s max |
| Browser tab closed unexpectedly | Synchronous save + keepalive fetch ensures data persists |

Additional protections:
- **Atomic writes** — tmp file → rename means zero partial writes
- **Write mutex** — serialized server writes prevent concurrent interleaving
- **Data shape validation** — every read and write validates structure integrity
- **Schema migration** — automatic upgrade of older data formats with zero data loss

### How Sync Works

The sync engine is a **pure function** library (syncEngine.js) with zero side effects:

1. **Compute diff** — field-level comparison of local vs server data
2. **Classify changes** — local-only, server-only, identical, or conflicting
3. **Choose strategy** — push (local wins), pull (server wins), or merge (interactive)
4. **Preview** — dry-run shows exactly what will change, with warnings
5. **Resolve conflicts** — side-by-side UI for each conflicting session/commit
6. **Execute** — atomic application with immediate persistence to both stores

The entire app goes **inert** during sync (via the HTML `inert` attribute) to prevent any concurrent modifications — a simple but effective safety mechanism.

### How Export Works

The export pipeline transforms raw tracking data into professional reports:

```
Raw sessions/commits → Filter by period → Aggregate by day/tag
    → Compute derived metrics → Apply styling → Generate workbook
    → Trigger browser download
```

Excel exports use **xlsx-js-style** for cell-level styling:
- Custom amber/slate color scheme across all sheets
- Calibri font for data, Consolas for IDs and SHA hashes
- Freeze panes on headers, auto-filters on data tables
- Alternating row colors, bold totals, conditional formatting
- Print-ready margins and page setup

---

## 🎨 Design Philosophy

- **Dark-first** — stone palette with amber accents, optimized for long coding sessions
- **Zero icon dependencies** — 40+ custom inline SVGs through a reusable `Icon` component
- **Smooth motion** — Framer Motion page transitions, spring physics for mobile menu, animated progress bars
- **Responsive** — mobile sidebar with slide-out overlay, fluid grids, touch-friendly targets
- **Accessibility** — focus-visible outlines (amber), ARIA live regions for toast notifications, `prefers-reduced-motion` support
- **Toast notifications** — every user action gets immediate visual feedback
- **Subtle grain texture** — CSS conic-gradient noise overlay for visual depth

---

## 📊 By the Numbers

| Metric | Value |
|--------|-------|
| Frontend (App.jsx) | ~5,800 lines |
| Export Engine | ~1,250 lines |
| Sync Engine | ~420 lines |
| Companion Server | ~600 lines |
| **Total Application Code** | **~8,100 lines** |
| Runtime Dependencies | 6 packages |
| Icon Library Dependencies | 0 (custom inline SVGs) |
| Cloud Dependencies | 0 |
| Data Sent to External Services | 0 bytes |

---

## 🤝 Contributing

Contributions are welcome! This project uses:

- **ESLint** flat config with React hooks + React Refresh plugins
- **Plain JSX** — no TypeScript
- **Concurrently** for parallel development

---

## 📄 License

MIT

---

<div align="center">

**Built for developers who take their time seriously.**

</div>
