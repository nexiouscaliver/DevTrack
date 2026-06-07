# Timestamped Checkpoint Notes — Design Spec

**Date:** 2026-06-07
**Status:** Approved
**Branch:** feature/timestamped-notes

---

## Overview

Extend DevTrack's existing session notes from a single flat text field into a timestamped checkpoint system. Users can add incremental, time-stamped notes during a running session and independently via a standalone Work Log. Each checkpoint can be marked private (hidden from exports). The feature replaces the current notes textarea in the timer view with an inline timeline and adds a new "Work Log" navigation tab.

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Session checkpoints + standalone work log | Maximum flexibility — track progress during sessions and log thoughts anytime |
| Auto-linking | Standalone notes auto-link to running session | Best of both worlds — standalone entries gain context when a session is active |
| CRUD | Edit text, delete note, edit timestamp | Full control for real workflows including backdating |
| Timer UX | Inline timeline replaces flat textarea | Cleaner UX — the old notes field becomes the first checkpoint |
| Work Log view | Unified timeline with session cards | Session checkpoints grouped in expandable cards, standalone notes muted between them |
| Navigation | New "Work Log" tab (7th nav item) | First-class feature, positioned between Analytics and Export |
| Storage | Checkpoints array on session + top-level workLog array | Co-located with sessions for easy export, separate array for standalone entries |
| Export | Two separate toggles: session checkpoints / standalone notes | Granular control — include progress notes but keep personal thoughts private |
| Privacy | Per-note eye/eye-off toggle | Per-note granularity, private notes excluded from all exports |
| Icons | 6 new Lucide-style SVG paths | Matches existing stroke-based icon system exactly |

---

## Data Model

### Session object — new field

```js
{
  // ... existing fields unchanged (id, type, start, end, duration, tags, notes, status, pauses, etc.)

  checkpoints: [                // NEW — ordered oldest-first
    {
      id: "cp_1717763100000",   // cp_{timestamp}
      text: "Starting API refactor",
      ts: 1717763100000,        // Unix ms timestamp
      private: false,           // privacy toggle (false = visible in export)
    },
  ],
}
```

### Top-level data — new array

```js
{
  sessions: [...],
  commits: [...],
  settings: {...},

  workLog: [                    // NEW — standalone + auto-linked entries
    {
      id: "wl_1717768200000",   // wl_{timestamp}
      text: "Lunch, reviewed PR feedback",
      ts: 1717768200000,        // Unix ms timestamp
      sessionId: null,          // null = standalone, "s_..." = linked to session
      private: false,
    },
  ],
}
```

### Linking semantics

- **Timer view entry** → written to `session.checkpoints[]` AND `data.workLog[]` (with `sessionId`)
- **Work Log view entry (no session)** → written to `data.workLog[]` only (with `sessionId: null`)
- **Work Log view entry (session running)** → written to `data.workLog[]` (with `sessionId`) AND `session.checkpoints[]`
- `session.checkpoints[]` is the canonical source for session-linked entries
- `data.workLog[]` is the canonical source for standalone entries
- Work Log view merges both chronologically for display

---

## Migration

In the existing `migrate()` function:

1. If a session has `notes` (non-empty string) but no `checkpoints` array:
   - Create `checkpoints: [{ id: "cp_{session.start}", text: session.notes, ts: session.start, private: false }]`
   - Keep `notes` field as-is (used as session title/summary in existing views)
2. If top-level data has no `workLog` array: add `workLog: []`
3. If a session has no `notes` and no `checkpoints`: set `checkpoints: []`
4. Zero data loss — existing sessions without checkpoints display and export exactly as before

---

## UI Changes

### Timer View

**Before:** Tags input + "What are you working on?" textarea → becomes session `notes`

**After:**
- **Session not started**: Tags input + text input "What are you working on?" (becomes first checkpoint + session `notes`)
- **Session running**: Input transforms to checkpoint timeline:
  - Top: "Add checkpoint" text input with "Add" button
  - Below: scrollable timeline of checkpoints (newest on top)
  - Each entry: timestamp (h:mm AM/PM), text, eye/eye-off privacy toggle
  - Hover reveals edit (pencil) and delete (trash) icons
  - Edit mode: inline editable text + editable timestamp field + Save/Cancel
- **Max length**: 280 characters per checkpoint
- **Default privacy**: visible (eye icon, `private: false`)
- **Keyboard**: Enter to add, Shift+Enter for newline (if multi-line input is used)
- **Auto-scroll**: timeline scrolls to newest entry on add
- **Empty state**: subtle hint text "Add checkpoints to track your progress"

### Work Log View (New Tab)

New 7th navigation tab — "Work Log" — positioned between Analytics and Export.

**Layout:**
- Header: "Work Log" title + "+ Add Note" button + search input
- Content: chronological feed grouped by day (calendar icon + date header)
- Day groups contain:
  - **Session cards**: amber clock icon + session title + time range + duration + checkpoint count. Expandable/collapsible (chevron-down/chevron-right). Expanded shows full checkpoint timeline inside.
  - **Standalone notes**: muted (opacity 0.55), file-text icon, italic text, no card border. Slotted between session cards chronologically.
- **Default expansion**: most recent session expanded, older sessions collapsed

**Add Note:**
- Inline form: text input + timestamp (defaults to now) + Add button
- If session running: note auto-links to session (stored in both `workLog` and `session.checkpoints`)
- If no session: pure standalone entry in `workLog` with `sessionId: null`

**Search:**
- Filters across all checkpoint text, standalone note text, and session names
- Case-insensitive substring match (same pattern as existing Sessions search)

**Edit/Delete:**
- Hover reveals edit (pencil) and delete (trash) icons on each entry
- Edit: inline editable text + editable timestamp + Save/Cancel
- Delete: toast with "Undo" option (same pattern as session delete)

**Privacy toggle:**
- Eye/eye-off icon on every entry (session checkpoints and standalone notes)
- Click to toggle between visible (amber eye) and private (muted stone eye-off)
- Works identically to timer view

### Sessions View

Each session card gets a collapsible "checkpoints" section:
- Collapsed: shows count only — "4 checkpoints ▸"
- Expanded: full timeline with timestamps, text, privacy toggles, edit/delete
- Editable: add new checkpoints to completed sessions (timestamp defaults to session end time)
- Session-level edit (notes, tags) unchanged — checkpoints edited via the timeline

### Export View

Two new toggle checkboxes added below date range and format selectors:

```
Checkpoint Notes
─────────────────
☑ In-session checkpoints
  Adds a "Checkpoints" column to Raw Data and Timesheet sheets.
  Private notes are excluded automatically.

☑ Standalone work log notes
  Adds a "Work Log" sheet with all standalone entries.
  Private notes are excluded automatically.
```

**When "In-session checkpoints" is ON:**
- **Timesheet sheet**: new "Checkpoints" column appended. Content is timestamped entries concatenated with `\n`, cell has `wrapText: true` and wider column width.
- **Raw Data sheet**: new "Checkpoints" column after "Notes". Same format as timesheet but per-session.
- Format per checkpoint: `h:mm AM/PM — text` (e.g., `9:45 AM — Starting refactor`)
- Multiple checkpoints joined with newline within a single cell.
- Private entries (`private: true`) are excluded automatically.

**When "Standalone work log notes" is ON:**
- **Excel**: adds a new "Work Log" sheet with columns: Date | Time | Note | Linked Session
  - Date: formatted date string
  - Time: h:mm AM/PM
  - Note: checkpoint text
  - Linked Session: session `notes` title if `sessionId` is set, else "—"
  - Sorted chronologically
  - Private entries excluded
- **CSV**: after main data, adds a blank line then work log section with same columns

**When both toggles are OFF:**
- Export behaves exactly as today — no checkpoint data anywhere.

---

## New Icons (6)

All standard Lucide/Feather icons added to the existing `ICONS` map:

| Name | SVG paths | Usage |
|------|-----------|-------|
| `eye` | `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>` | Visible (amber `#f59e0b`) |
| `eyeOff` | `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>` | Private (muted stone `#78716c`) |
| `calendar` | `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>` | Day headers |
| `chevronDown` | `<polyline points="6 9 12 15 18 9"/>` | Expanded session card |
| `chevronRight` | `<polyline points="9 18 15 12 9 6"/>` | Collapsed session card |
| `flag` | `<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>` | Checkpoint entry icon |

**Reused existing icons:** `clock` (session card header), `fileText` (standalone note), `edit` (edit checkpoint), `trash` (delete checkpoint), `plus` (add checkpoint button), `search` (work log search).

**Color rules:**
- Amber (`text-amber-400` / `#f59e0b`): visible privacy toggle, session card header, day header, timeline dot for session entries
- Muted stone (`text-stone-500` / `#78716c`): private privacy toggle, standalone notes, collapsed chevrons
- Default stone (`text-stone-400` / `#a8a29e`): checkpoint timestamps

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Session ends with no checkpoints added | Checkpoints section shows "No checkpoints" with option to add retroactively |
| Add checkpoint to completed session | Allowed from Sessions view. Timestamp defaults to session end time, editable |
| Edit checkpoint timestamp outside session range | Allowed. Checkpoint stays linked regardless of timestamp position |
| Delete all checkpoints from a session | Session keeps `notes` title. Checkpoints section shows "No checkpoints" |
| Running session + add from Work Log tab | Entry added to both `workLog` (with `sessionId`) and `session.checkpoints` |
| Toggle privacy, then export | Privacy evaluated at export time. Re-export reflects current state |
| Large number of checkpoints | Timeline scrolls with `max-height` + `overflow-y: auto`. Export cells wrap text |
| Browser refresh during running session | Checkpoints persisted to `localStorage` on every change (same as session state) |
| 280 char limit reached | Input disables further typing. No truncation — hard limit enforced |

---

## Scope — What Does NOT Change

- Dashboard view
- Git view
- Analytics view
- Settings modal
- Companion git server (`server/git-server.mjs`)
- Data persistence layer (`load()`/`save()` mechanics — only migration logic changes)
- Vite/Express configuration
- Any existing session fields (`id`, `type`, `start`, `end`, `duration`, `tags`, `notes`, `status`, `pauses`, `totalWorkTime`, `totalBreakTime`, `commitIds`)
