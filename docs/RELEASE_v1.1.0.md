# DevTrack v1.1.0 Release Notes

**Release Date:** June 8, 2026

## 🆕 New Features

### 🍅 Pomodoro Timer Mode
Full Pomodoro Technique integration with configurable work/break cycles:
- **Mode toggle** — switch between classic manual timer and Pomodoro mode
- **Customizable intervals** — work duration, short break, long break, cycles before long break (in Settings)
- **Countdown display** — visual countdown with animated progress ring and session counter
- **Grace period** — configurable window to extend or skip breaks when a session ends
- **Auto-transition** — seamless work → break → work cycling with desktop notifications
- **Skip break / Extend work** — quick action buttons during transitions
- **Mount recovery** — resumes in-progress Pomodoro session after page reload
- **Data model** — isolated Pomodoro state, migration-safe, with sanitize defaults

### 📅 Calendar View
Monthly calendar grid with activity tracking:
- **Intensity heatmap** — color-coded days showing work volume at a glance
- **Day expansion** — click any day to see detailed session breakdown
- **Navigation** — browse months forward/back with today shortcut
- **Responsive** — adapts layout for mobile and desktop

### ⌨️ Keyboard Shortcuts
Global Alt+key shortcuts for power users:
- **Alt+S** — Start/Stop timer
- **Alt+P** — Toggle Pomodoro mode
- **Alt+X** — Stop/reset current session
- **Alt+1–7** — Quick switch between views (Dashboard, Timer, Sessions, Git, Calendar, Analytics, Export)
- **Alt+/** — Toggle keyboard shortcuts help overlay
- **Escape** — Consolidated close/exit handler for modals, overlays, and popups

### 🎨 Custom Logo
- **New icon** — replaced AI-generated logo with a custom clock+code icon for favicon, apple-touch-icon, and all branding assets

### 🐳 Docker Deployment
Production-ready containerized deployment:
- **Multi-stage Dockerfile** — optimized build with Node.js production image
- **docker-compose.yml** — one-command deployment with health checks and volume persistence
- **Security hardened** — runs as non-root user with resource limits
- **Production server** — configurable port and bind address for container environments
- **.dockerignore** — clean builds excluding dev files

## 🐛 Bug Fixes

- **Auto-complete stale sessions** — running sessions from previous days are now auto-completed on load
- **Auto-close orphans** — starting a new session properly closes any existing running session
- **Dashboard stats refresh** — stats now update periodically instead of freezing at mount time
- **Session card overflow** — long commit messages no longer overflow session card layout
- **First-time welcome** — welcome message only appears when no sessions exist (not on empty filters)
- **Sync engine** — added workLog diff/merge support for data synchronization
- **Timer tag persistence** — commit-session links preserved across reloads with auto-persist
- **SPA fallback** — server SPA fallback now only handles GET requests (not POST/DELETE)
- **ESLint** — resolved all linting errors for clean CI

## 📄 Documentation

- Updated README with Docker deployment instructions across all sections
- Added disaster recovery section to README
- Added Pomodoro mode research, design spec, and implementation plan docs

## 📊 Stats

| Metric | Value |
|--------|-------|
| Commits since v1.0.0 | 37 |
| Files changed | 17 |
| Lines added | +3,715 |
| Lines removed | -92 |

## 📦 Files Changed

```
 .dockerignore                   |  19 +
 Dockerfile                      |  40 +
 README.md                       | 147 +-
 docker-compose.yml              |  38 +
 server/git-server.mjs           |  34 +-
 src/App.jsx                     | 1,449 +-
 src/utils/syncEngine.js         |  54 +-
 src/utils/syncEngine.test.js    |  55 +
 docs/superpowers/plans/*        | 1,361 +++
 docs/superpowers/research/*     | 197 +++
 docs/superpowers/specs/*        | 362 +++
 12 files changed, 3,672 insertions(+), 86 deletions(-)
```

---

**Full Changelog:** https://github.com/nexiouscaliver/devtrack/compare/v1.0.0...v1.1.0
