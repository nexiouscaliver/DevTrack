<div align="center">

# DevTrack

**Track your time. Not your privacy.**

Developer-first time tracking. 100% local. Git-native.

[![CI](https://img.shields.io/github/actions/workflow/status/nexiouscaliver/devtrack/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/nexiouscaliver/devtrack/actions)
[![License](https://img.shields.io/github/license/nexiouscaliver/devtrack?style=flat-square&color=green)](LICENSE)
[![Cloud Dependencies](https://img.shields.io/badge/Cloud_Dependencies-0-44cc11?style=flat-square&labelColor=1c1917)]()
[![Telemetry](https://img.shields.io/badge/Telemetry-0_bytes-44cc11?style=flat-square&labelColor=1c1917)]()

[Features](#-features) · [Getting Started](#-getting-started) · [Architecture](#-architecture) · [Full Docs](docs/FEATURES.md)

</div>

---

## Why DevTrack?

Most time trackers are built for managers who need reports. DevTrack is built for **developers** who need focus.

Your data belongs on your machine — no cloud, no accounts, no telemetry. Git already knows what you did — DevTrack connects the dots. A timer should work when you forget to start it — smart estimation from commits. Export should be the beginning, not the end — professional Excel reports from day one.

---

## How It Compares

| | DevTrack | Toggl | Clockify | ActivityWatch | Super Productivity |
|---|---|---|---|---|---|
| **Data location** | Local only | Cloud | Cloud | Local | Local |
| **Account required** | No | Yes | Yes | No | No |
| **Git integration** | Native, local | None | None | None | Basic |
| **Telemetry** | 0 bytes | Analytics | Analytics | Optional | Optional |
| **Excel export** | 6 styled sheets | CSV (paid) | CSV/PDF (paid) | JSON | Basic |
| **Works offline** | Yes | No | No | Yes | Yes |
| **Setup** | `npm run dev` | Sign up + plugin | Sign up + plugin | Desktop install | Desktop install |
| **Price** | Free | $10+/mo | $0-$18/mo | Free | Free |

DevTrack has no mobile app, no team features, and no browser extension. That is by design — it does one thing well.

---

## Features

**Timer & Sessions** — Work/break timer with idle detection, pause tracking, session persistence across reloads, and full editing after completion.

**Git Integration** — Track multiple local repositories. Auto-sync commit history with file stats, branch detection, and multi-identity support. Smart work estimation from commit patterns with confidence scoring. Read-only, security-hardened.

**Analytics** — Daily hours, tag distribution, peak hours, weekly trends. Compare tracked time against git-estimated hours. Date range filtering.

**Professional Export** — Excel reports with 6 styled sheets (dashboard, timesheet, daily summary, tag analysis, git activity, work log). CSV export. Privacy-aware filtering.

**Sync & Recovery** — Field-level diffing, three merge strategies, conflict resolution UI. Layered persistence: localStorage + disk backup + version snapshots with one-click restore.

**Notes & Work Log** — Timestamped checkpoints during sessions. Standalone work log with search. Privacy controls for sensitive entries.

Full feature details in [docs/FEATURES.md](docs/FEATURES.md). Technical deep dives in [docs/DEEP_DIVES.md](docs/DEEP_DIVES.md).

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Git** CLI (for repository tracking features)

### Install & Run

```bash
git clone https://github.com/nexiouscaliver/devtrack.git
cd devtrack
npm install
npm run dev
```

Open [http://localhost:9000](http://localhost:9000) — the app is ready to use.

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite (9000) + git server (9001) |
| `npm run dev:client` | Vite dev server only |
| `npm run dev:server` | Companion server only |
| `npm run build` | Production build to `dist/` |
| `npm run test` | Run test suite |
| `npm run lint` | ESLint check |
| `npm run preview` | Preview production build |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Port 9000)                    │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Dashboard │  │  Timer   │  │ Sessions │  │Analytics│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │             │             │              │       │
│  ┌────┴─────────────┴─────────────┴──────────────┴────┐ │
│  │              Central State (useState)               │ │
│  │  sessions · commits · workLog · settings · ui      │ │
│  └───────────────────┬────────────────────────────────┘ │
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
│  │ /api/git/*        │  │  GET/POST/DELETE /api/data   ││
│  └───────┬──────────┘  └─────────────┬────────────────┘│
│          │                           │                  │
│    ┌─────▼───────┐         ┌────────▼────────┐         │
│    │   git CLI   │         │  server/data/   │         │
│    │ (local only)│         │  devtrack.json  │         │
│    └─────────────┘         └─────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

| Principle | Implementation |
|-----------|---------------|
| **Zero cloud dependency** | All data stored locally — localStorage + local disk |
| **Privacy-first** | No telemetry, no accounts, no remote APIs |
| **Dual reliability** | Browser + server persistence with sync engine |
| **Atomic operations** | tmp+rename writes, write mutex, debounced saves |
| **Graceful degradation** | Works offline; syncs when server available |

---

## Security

DevTrack takes security seriously even though it runs entirely locally:

- **Path traversal prevention** — all paths validated, `..` sequences rejected
- **Shell escaping** — `shEscape()` wraps all git command arguments
- **Read-only git operations** — no push, pull, checkout, or mutating git commands
- **No remote access** — server binds to `127.0.0.1` only
- **Size limits** — 5MB request limit, 10,000 item array caps
- **Private note filtering** — private content excluded from all exports

All claims are verifiable in the open-source code. The server binds to `127.0.0.1`. Git operations are read-only.

---

## Disaster Recovery

Your tracked time survives real-world accidents. Here is exactly what happens when things go wrong.

### What happens when…

| Scenario | What happens | How |
|----------|-------------|-----|
| **Browser tab closed accidentally** | Zero data loss | `beforeunload` fires a synchronous `localStorage.setItem` + `keepalive: true` fetch to the server |
| **Browser crashes** | ≤ 300ms of data loss | Every state change triggers a debounced save (300ms) to both localStorage and server |
| **Power cut / PC restart** | ≤ 300ms of data loss | localStorage persists across reboots. Server cleans up stale `.tmp` files on startup. Active session state is stored in localStorage and restored on next load |
| **Active timer on reload** | Timer resumes exactly where it left off | Running/paused sessions are persisted with full state (start time, pauses, tags, notes). On reload, the timer picks up without missing a beat |
| **localStorage corrupted** | Auto-recovered from server | Server disk backup loads automatically. A toast notifies you. localStorage is repaired in place |
| **Server file corrupted** | Auto-renamed, client data used | The `.json` file is renamed to `.corrupt`. Client data becomes the source of truth and re-saves to a fresh file |
| **Both corrupted** | Restored from version snapshots | Up to 20 point-in-time snapshots stored on disk. One-click restore from the Sync view |
| **Write interrupted mid-save** | No corruption — atomic writes | Server writes to a `.tmp` file first, then renames. A write mutex prevents concurrent writes from interleaving. If the process dies, the `.tmp` is cleaned up on next start |
| **Multiple tabs open** | Conflict detection + warning | `storage` events detect when another tab writes data. If you have unsaved changes, a warning toast appears. Otherwise, the other tab's data is adopted silently |
| **Server not running** | Everything still works | The app reads/writes localStorage as primary. When the server comes back, the Sync view reconciles both copies |

### The defense in depth

```
Every state change
    ↓ (300ms debounced)
localStorage.setItem()         ← Layer 1: instant, always available
    ↓
POST /api/data (keepalive)     ← Layer 2: disk backup via companion server
    ↓                              (atomic tmp→rename, write mutex)
Server data file corrupted?
    ↓
Version snapshots (up to 20)   ← Layer 3: point-in-time restore
```

None of this requires configuration. It all works out of the box.

---

## Project Structure

```
devtrack/
├── index.html                  # Entry point
├── src/
│   ├── main.jsx                # React root mount
│   ├── App.jsx                 # Full application (~6,000 lines)
│   └── utils/
│       ├── syncEngine.js       # Pure diff/merge engine (~420 lines)
│       ├── syncEngine.test.js  # Test suite
│       └── exportEngine.js     # Excel/CSV generation (~1,250 lines)
├── server/
│   ├── git-server.mjs          # Express companion server (~600 lines)
│   └── data/                   # Persisted data (gitignored)
├── docs/
│   ├── FEATURES.md             # Detailed feature reference
│   ├── DEEP_DIVES.md           # How-it-works technical docs
│   └── adr/                    # Architecture Decision Records
├── vite.config.js              # Vite + proxy configuration
└── package.json                # Dependencies + scripts
```

---

## Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and code style.

### Roadmap

- [ ] Pomodoro mode with configurable intervals
- [ ] Keyboard shortcuts for timer controls
- [ ] Calendar view for session visualization
- [ ] Browser extension for external tool tracking
- [ ] Docker compose for one-command deployment

---

## Tech Stack

React 19 · Vite 8 · Express 5 · Tailwind CSS 3 · Recharts 3 · Framer Motion · xlsx-js-style

---

## License

[MIT](LICENSE)

<div align="center">

**Built for developers who take their time seriously.**

</div>
