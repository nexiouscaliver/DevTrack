# DevTrack Deep Dives

Technical deep dives into how DevTrack works under the hood. For feature overview, see [FEATURES.md](./FEATURES.md).

## How Session Tracking Works

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

## How Git Estimation Works

When you forget to start the timer, DevTrack can estimate your work from commits:

1. **Filter** commits by your configured git identity
2. **Group** consecutive commits into sessions (based on time gaps)
3. **Apply smart padding** — adds ramp-up and cool-down time around commit clusters
4. **Detect bursts** — extends sessions for heavy commit activity periods
5. **Score confidence** — assigns high, medium, or low based on commit density
6. **Handle multi-repo** — merges estimates across multiple repositories

## How Disaster Recovery Works

| Scenario | Recovery |
|----------|----------|
| Corrupt localStorage | Restore from server disk backup |
| Corrupt server file | Auto-renamed to `.corrupt`, restore from localStorage |
| Both corrupted | Restore from version snapshots (up to 20 stored) |
| Page crash during write | 30-second checkpoint system limits data loss to 30s max |
| Browser tab closed unexpectedly | Synchronous save + keepalive fetch ensures data persists |

Additional protections: atomic writes (tmp → rename), write mutex, data shape validation on every read/write, automatic schema migration.

## How Sync Works

The sync engine is a **pure function** library (syncEngine.js) with zero side effects:

1. **Compute diff** — field-level comparison of local vs server data
2. **Classify changes** — local-only, server-only, identical, or conflicting
3. **Choose strategy** — push (local wins), pull (server wins), or merge (interactive)
4. **Preview** — dry-run shows exactly what will change, with warnings
5. **Resolve conflicts** — side-by-side UI for each conflicting session/commit
6. **Execute** — atomic application with immediate persistence to both stores

The entire app goes **inert** during sync (via the HTML `inert` attribute) to prevent any concurrent modifications.

## How Export Works

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

## Data Model

The entire app state is one JSON object persisted as a single blob:

```json
{
  "sessions": [{
    "id": "uuid",
    "type": "work|break",
    "start": "ISO 8601",
    "end": "ISO 8601",
    "duration": "ms",
    "tags": ["tag1"],
    "notes": "string",
    "status": "running|paused|completed",
    "pauses": [{"start": "ISO 8601", "end": "ISO 8601"}],
    "checkpoints": [{"id": "uuid", "text": "string", "ts": "ISO 8601"}],
    "totalWorkTime": "ms",
    "totalBreakTime": "ms"
  }],
  "commits": [{
    "sha": "string",
    "message": "string",
    "repo": "string",
    "repoPath": "string",
    "timestamp": "ISO 8601",
    "author": "string",
    "authorEmail": "string",
    "branch": "string",
    "source": "local|manual",
    "filesChanged": 0,
    "insertions": 0,
    "deletions": 0
  }],
  "workLog": [{
    "id": "uuid",
    "text": "string",
    "ts": "ISO 8601",
    "private": false
  }],
  "settings": {
    "dailyGoal": 8,
    "trackedRepos": [{"id": "uuid", "path": "string", "name": "string", "branch": "string", "lastSync": "ISO 8601"}],
    "gitAuthors": {"identities": [], "autoDetected": null}
  },
  "ui": {
    "view": "dashboard|timer|sessions|git|analytics|export",
    "sessionsFilter": "string",
    "gitRepoFilter": "string",
    "analyticsRange": "string",
    "exportPeriod": "string",
    "exportFormat": "string"
  }
}
```

- `source` on commits: `"local"` (synced from git) or `"manual"` (user-entered)
- `ui` section persists user preferences across reloads (active view, filters, ranges)
- Version snapshots are stored in `server/data/versions/` with a `manifest.json` registry (max 20)

## Design Philosophy

DevTrack follows a specific set of design principles:

- **Dark-first** — stone palette from Tailwind, no light mode toggle. Dark is the default, not an afterthought.
- **Zero icon dependencies** — all icons are inline SVG via the `Icon` component and `ICONS` map. No icon library, no font icons, no external asset loading.
- **Smooth motion** — Framer Motion for page transitions, element animations, and micro-interactions. No jarring state changes.
- **Responsive** — Tailwind responsive prefixes throughout. Works on tablets and laptops, not just desktop.
- **Accessible** — proper ARIA labels, keyboard navigation support, semantic HTML structure.
- **Toast notifications** — non-intrusive feedback for all user actions. No `alert()` calls anywhere.
- **Grain texture** — subtle background texture adds depth without distraction.

## By the Numbers

| Metric | Value |
|--------|-------|
| Frontend source | ~6,000 lines (App.jsx) |
| Sync engine | ~420 lines (syncEngine.js) |
| Export engine | ~1,250 lines (exportEngine.js) |
| Companion server | ~600 lines (git-server.mjs) |
| Total source | ~8,200 lines |
| Dependencies | 6 runtime, 11 dev |
| Build size | < 500KB gzipped |
| Data layer | localStorage + local disk |
| External APIs | None |
