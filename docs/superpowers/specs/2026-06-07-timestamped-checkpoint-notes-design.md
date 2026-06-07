# Timestamped Checkpoint Notes — Design Spec

**Date:** 2026-06-07
**Status:** Approved (post-review revision)
**Branch:** feature/timestamped-notes
**Reviewed by:** external code-reviewer agent — all 20 findings addressed

---

## Overview

Extend DevTrack's existing session notes from a single flat text field into a timestamped checkpoint system. Users can add incremental, time-stamped notes during a running session and independently via a standalone Work Log. Each checkpoint can be marked private (hidden from exports). The feature replaces the current notes textarea in the timer view with an inline timeline and adds a new "Work Log" navigation tab.

---

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Session checkpoints + standalone work log | Maximum flexibility — track progress during sessions and log thoughts anytime |
| CRUD | Edit text, delete note, edit timestamp | Full control for real workflows including backdating |
| Timer UX | Inline timeline replaces flat textarea | Cleaner UX — the old notes field becomes the first checkpoint |
| Work Log view | Unified timeline with session cards | Session checkpoints grouped in expandable cards, standalone notes muted between them |
| Navigation | New "Work Log" tab (7th nav item) | First-class feature, positioned between Analytics and Export |
| Storage | session.checkpoints[] for session entries, data.workLog[] for standalone only | Single-write — no duplication, no sync risk (see Data Model) |
| Export | Two separate toggles: session checkpoints / standalone notes | Granular control — include progress notes but keep personal thoughts private |
| Privacy | Per-note eye/eye-off toggle | Per-note granularity, private notes excluded from all exports |
| Icons | 6 new Feather-style SVG paths | Matches existing Feather-era icon system in ICONS map |
| Timestamp editing | Text input, h:mm AM/PM format | Simpler than a datetime picker; invalid input reverts with toast |
| Delete confirmation | confirm() dialog | Matches existing pattern in Sessions view |
| Component location | All new views remain in App.jsx | Consistent with existing single-file architecture |

---

## Data Model

### Design principle: single-write, no duplication

Each piece of data lives in exactly one place:

- **Session checkpoints** → stored only in `session.checkpoints[]`
- **Standalone notes** → stored only in `data.workLog[]`

The Work Log view merges both sources at read time for display. There is no dual-write. When a note is added while a session is running, it goes into `session.checkpoints[]` only — the Work Log view reads `session.checkpoints[]` to show those entries alongside standalone ones.

### Session object — new field

```js
{
  // ... existing fields unchanged (id, type, start, end, duration, tags, notes, status, pauses, etc.)

  checkpoints: [                // NEW — ordered oldest-first, sorted by ts ascending
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

  workLog: [                    // NEW — standalone entries only, NO sessionId field
    {
      id: "wl_1717768200000",   // wl_{timestamp}
      text: "Lunch, reviewed PR feedback",
      ts: 1717768200000,        // Unix ms timestamp
      private: false,
    },
  ],
}
```

### The `session.notes` field

`session.notes` is a **standalone field** that serves as the session title/summary. It is completely independent of checkpoints. Editing or deleting a checkpoint (including the first one created during migration) does NOT affect `session.notes`. The timer view's pre-session input ("What are you working on?") sets both `session.notes` AND creates the first checkpoint, but after that they diverge independently.

### Write semantics by surface

All mutations must use a **single `setData` call** that atomically updates the relevant state:

| Action | Where it writes | Method |
|--------|----------------|--------|
| Add checkpoint from Timer (session running) | `session.checkpoints[]` | Single `setData` updating the session in `data.sessions` |
| Add checkpoint from Sessions view (completed session) | `session.checkpoints[]` | Single `setData` updating the session |
| Add note from Work Log (no session running) | `data.workLog[]` | Single `setData` appending to `data.workLog` |
| Add note from Work Log (session running) | `session.checkpoints[]` | Single `setData` updating the session — NOT workLog |
| Edit checkpoint text/timestamp/privacy | `session.checkpoints[]` or `data.workLog[]` depending on source | Single `setData` |
| Delete checkpoint | Remove from whichever array holds it | Single `setData` |
| Delete session | Remove session from `data.sessions` | Single `setData` — checkpoints are embedded, removed with session |

### Work Log view — data merging at read time

The Work Log view constructs its timeline by merging two sources:

1. All `session.checkpoints[]` entries from all sessions, each tagged with session metadata (session.notes title, session time range)
2. All `data.workLog[]` entries (standalone, no session context)

Both are sorted by `ts` descending, grouped by day. This is a computed view — no persisted duplication.

---

## Migration

In the existing `migrate()` function:

1. **Guard:** Only process sessions where `s.notes` is a non-empty string AND `s.start` is a valid number AND the session has no existing `checkpoints` array:
   ```js
   if (s.notes && s.notes.trim() && s.start && !isNaN(s.start) && !s.checkpoints) {
     s.checkpoints = [{
       id: `cp_${s.start}`,
       text: s.notes.trim(),
       ts: s.start,
       private: false,
     }];
   }
   ```
2. If a session has no `notes` or invalid `start`: set `checkpoints: []` (if not already present)
3. Keep `notes` field as-is — it remains the session title and is unaffected by checkpoint operations
4. If top-level data has no `workLog` array: add `workLog: []`
5. Zero data loss — existing sessions without checkpoints display and export exactly as before

**Backfill note:** Migration does NOT create `workLog[]` entries for existing session checkpoints. The Work Log view reads `session.checkpoints[]` directly, so historical session checkpoints appear in the Work Log timeline automatically. Only standalone notes (added post-migration) live in `workLog[]`.

---

## UI Changes

### Timer View

**Before:** Tags input + "What are you working on?" textarea → becomes session `notes`

**After:**
- **Session not started**: Tags input + `<input type="text">` "What are you working on?" (sets `session.notes` AND creates first checkpoint)
- **Session running**: Input transforms to checkpoint timeline:
  - Top: `<input type="text">` "Add checkpoint" with "Add" button (disabled when input is empty or whitespace-only)
  - Below: scrollable timeline of checkpoints (newest on top, max-height with `overflow-y: auto`)
  - Each entry: timestamp (h:mm AM/PM), text, eye/eye-off privacy toggle
  - Hover reveals edit (pencil) and delete (trash) icons
  - Edit mode: inline editable text (`<input type="text">`) + editable timestamp field (`<input type="text">` with h:mm AM/PM format, parsed on save, reverts to previous value with toast on invalid input) + Save/Cancel buttons
- **Max length**: 280 characters per checkpoint, single line only (no multi-line)
- **Default privacy**: visible (eye icon, `private: false`)
- **Keyboard**: Enter to add checkpoint
- **Auto-scroll**: timeline scrolls to newest entry on add
- **Empty state**: subtle hint text "Add checkpoints to track your progress"
- **After timestamp edit**: checkpoints array is re-sorted by `ts` ascending (oldest-first)

### Work Log View (New Tab)

New 7th navigation tab — "Work Log" — positioned between Analytics and Export.

**Layout:**
- Header: "Work Log" title + "+ Add Note" button + search input
- Content: chronological feed grouped by day (calendar icon + date header)
- Day groups contain:
  - **Session cards**: amber clock icon + session title (`session.notes`) + time range + duration + checkpoint count. Expandable/collapsible (chevron-down/chevron-right). Expanded shows full checkpoint timeline inside.
  - **Standalone notes**: muted (opacity 0.55), file-text icon, italic text, no card border. Slotted between session cards chronologically.
- **Default expansion**: most recent session expanded, older sessions collapsed

**Add Note:**
- Inline form: `<input type="text">` + timestamp (`<input type="text">`, defaults to now, h:mm AM/PM, invalid reverts with toast) + Add button
- If session running: note is written to `session.checkpoints[]` (not workLog) — it appears as a session checkpoint
- If no session running: note is written to `data.workLog[]` as a standalone entry

**Search:**
- Searches across: `session.checkpoints[].text`, `session.notes` (session title), and `data.workLog[].text`
- Case-insensitive substring match (same pattern as existing Sessions search)

**Edit/Delete:**
- Hover reveals edit (pencil) and delete (trash) icons on each entry
- Edit: inline editable text + editable timestamp + Save/Cancel
- Delete: `confirm()` dialog ("Delete this note?") — matches existing session delete pattern in the codebase
- When editing/deleting a session checkpoint from the Work Log view, the mutation targets `session.checkpoints[]` directly

**Privacy toggle:**
- Eye/eye-off icon on every entry (session checkpoints and standalone notes)
- Click to toggle between visible (amber eye) and private (muted stone eye-off)
- Works identically to timer view

### Sessions View

Each session card gets a collapsible "checkpoints" section:
- Collapsed: shows count only — "4 checkpoints ▸"
- Expanded: full timeline with timestamps, text, privacy toggles, edit/delete
- Editable: add new checkpoints to completed sessions (timestamp defaults to session end time, editable)
- Session-level edit (notes, tags) unchanged — checkpoints edited via the timeline
- **After timestamp edit**: checkpoints re-sorted by `ts` ascending

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

**Toggle state flow to export engine:**
The ExportView passes two new flags to `generateExcelReport` / `generateCSVReport`:
```js
generateExcelReport({
  ...data,
  commits: filteredCommits,
  includeCheckpoints: true,   // from toggle state
  includeWorkLog: true,       // from toggle state
})
```
The export engine reads `session.checkpoints` (filtered by `private === false`) and `data.workLog` (filtered by `private === false`) based on these flags.

**When "In-session checkpoints" is ON:**
- **Timesheet sheet** (day-level aggregation, one row per day): new "Checkpoints" column appended. Content is ALL non-private checkpoints from ALL work sessions on that day, concatenated with `\n`. Cell has `wrapText: true` and wider column width. Format: `h:mm AM/PM — text`.
- **Raw Data sheet** (per-session rows): new "Checkpoints" column after "Notes". Contains only that session's non-private checkpoints, concatenated with `\n`. Same format.
- Private entries (`private: true`) are excluded automatically.

**When "Standalone work log notes" is ON:**
- **Excel**: adds a new "Work Log" sheet with columns: Date | Time | Note
  - Date: formatted date string (e.g., "Jun 7, 2026")
  - Time: h:mm AM/PM
  - Note: checkpoint text
  - Sorted chronologically
  - Private entries excluded
- **CSV**: after main data, adds a blank line then work log section with same columns

**When both toggles are OFF:**
- Export behaves exactly as today — no checkpoint data anywhere.

---

## New Icons (6)

All Feather-style icons added to the existing `ICONS` map. The existing codebase uses Feather-era SVG paths throughout (e.g., `edit` uses `2.121` arc data). These new icons use the same Feather style for visual consistency — `strokeWidth: 2`, `strokeLinecap: round`, `strokeLinejoin: round`.

| Name | SVG content | Usage |
|------|------------|-------|
| `eye` | `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>` | Visible (amber `#f59e0b`) |
| `eyeOff` | `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>` | Private (muted stone `#78716c`) |
| `calendar` | `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>` | Day headers |
| `chevronDown` | `<polyline points="6 9 12 15 18 9"/>` | Expanded session card |
| `chevronRight` | `<polyline points="9 18 15 12 9 6"/>` | Collapsed session card |
| `flag` | `<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>` | Checkpoint entry icon |

**Note on icon provenance:** These use Feather-era paths (pre-Lucide fork) to match the existing ICONS map. The calendar icon intentionally omits the horizontal divider line (Feather `calendar-days` variant) for a cleaner look. All icons render correctly within the existing `Icon` component's `<svg viewBox="0 0 24 24">` wrapper.

**Reused existing icons:** `clock` (session card header), `fileText` (standalone note), `edit` (edit checkpoint), `trash` (delete checkpoint), `plus` (add checkpoint button).

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
| Running session + add note from Work Log tab | Note written to `session.checkpoints[]` only — appears in both Timer timeline and Work Log view |
| Toggle privacy, then export | Privacy evaluated at export time. Re-export reflects current state |
| Large number of checkpoints | Timeline scrolls with `max-height` + `overflow-y: auto`. Export cells wrap text |
| Browser refresh during running session | Checkpoints persisted to `localStorage` on every change (same as session state) |
| 280 char limit reached | Input `maxLength={280}` enforced. Add button disabled when input is empty or whitespace-only |
| Delete a session that has checkpoints | Checkpoints are embedded in the session object, so they are removed with the session. No orphaned data (no workLog entries reference sessions) |
| Edit checkpoint timestamp | After save, checkpoints array re-sorted by `ts` ascending (oldest-first) |
| Invalid timestamp input on edit | Reverts to previous value, shows toast "Invalid time format — use h:mm AM/PM" |
| Work Log shows historical sessions | Work Log reads `session.checkpoints[]` directly — pre-migration sessions that got a migrated checkpoint appear in the timeline automatically |
| No checkpoints or standalone notes exist | Work Log shows empty state: "No entries yet. Add a note or start tracking." |

---

## Shared Mutation Logic

Checkpoint CRUD operations happen from three surfaces (Timer, Work Log, Sessions). All three must call the same helper functions to avoid divergent behavior:

- `addCheckpoint(sessionId, text, ts)` — adds to `session.checkpoints[]`
- `updateCheckpoint(sessionId, checkpointId, updates)` — edits text/ts/private on a session checkpoint
- `deleteCheckpoint(sessionId, checkpointId)` — removes from `session.checkpoints[]`
- `addWorkLogEntry(text, ts)` — adds to `data.workLog[]`
- `updateWorkLogEntry(entryId, updates)` — edits text/ts/private on a standalone entry
- `deleteWorkLogEntry(entryId)` — removes from `data.workLog[]`

Each helper performs a single `setData` call. The Work Log view determines which helper to call based on whether the entry is a session checkpoint or standalone note.

---

## Scope — What Does NOT Change

- Dashboard view
- Git view
- Analytics view
- Settings modal
- Companion git server (`server/git-server.mjs`)
- Data persistence layer (`load()`/`save()` mechanics — only migration logic changes)
- Export engine file structure (`src/utils/exportEngine.js` — only new columns/sheets added)
- Vite/Express configuration
- Any existing session fields (`id`, `type`, `start`, `end`, `duration`, `tags`, `notes`, `status`, `pauses`, `totalWorkTime`, `totalBreakTime`, `commitIds`)

---

## File Size Note

The current `App.jsx` is ~3314 lines. This feature will add an estimated 800–1200 lines (WorkLogView, checkpoint timeline in TimerView, checkpoint section in SessionsView, shared helpers, 6 new icons). All new code remains in `App.jsx` to match the existing single-file architecture. If file size becomes a concern during implementation, a follow-up refactor can extract views to separate files.
