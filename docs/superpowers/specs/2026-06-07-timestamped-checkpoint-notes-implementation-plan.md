# Timestamped Checkpoint Notes — Implementation Plan

**Date:** 2026-06-07
**Status:** Revised (post-review)
**Branch:** feature/timestamped-notes
**Spec:** `docs/superpowers/specs/2026-06-07-timestamped-checkpoint-notes-design.md`

---

## Approach

Implementation proceeds in **9 phases**, ordered by dependency: foundation changes first (icons, data model, migration), then shared helpers, then UI surfaces (Timer → Work Log → Sessions → Export), and finally polish. Each phase is a single commit checkpoint.

Phases 1–3 have zero visual impact — the app runs identically before and after. Phase 4 (Timer) is the first user-visible change. This ordering minimizes risk: data model and helpers are battle-tested by the time we build UI on top.

---

## Phase 1: Add New Icons to ICONS Map

**File:** `src/App.jsx` (inside `const ICONS = { ... }`, after `close` at line ~223)
**Lines changed:** ~30 added
**Risk:** None — additive only, no existing code touched

Add 6 new Feather-style SVG entries to the `ICONS` object, after the last existing icon (`close`, around line 223):

```js
eye: (
  <>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </>
),
eyeOff: (
  <>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </>
),
calendar: (
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
  </>
),
chevronDown: <polyline points="6 9 12 15 18 9" />,
chevronRight: <polyline points="9 18 15 12 9 6" />,
flag: (
  <>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </>
),
```

**Verify:** App still loads, no console errors. Existing icons render unchanged.

---

## Phase 2: Data Model + Migration

**File:** `src/App.jsx`
**Lines changed:** ~25
**Risk:** Low — migration is additive, existing data unchanged

### 2a. Update `DEFAULT_DATA` (line 369)

Add `workLog: []` to the default data object:

```js
const DEFAULT_DATA = {
  sessions: [],
  commits: [],
  workLog: [],           // NEW
  settings: { ... },
  ui: { ... },
};
```

### 2b. Update `migrate()` function (line 402)

Add migration logic at the end of the function, before `return parsed`:

```js
// Migrate session checkpoints — backfill from notes
parsed.sessions = parsed.sessions.map((s) => ({
  ...s,
  checkpoints: s.checkpoints || (
    s.notes && s.notes.trim() && s.start && !isNaN(s.start)
      ? [{ id: `cp_${s.start}_migrated`, text: s.notes.trim(), ts: s.start, private: false }]
      : []
  ),
}));

// Add workLog array if missing
if (!parsed.workLog) {
  parsed.workLog = [];
}
```

**Key detail:** The migration creates a first checkpoint from `session.notes` only if:
- `notes` is non-empty
- `start` is a valid number
- `checkpoints` array doesn't already exist

The `session.notes` field is preserved as-is — it's the session title, independent of checkpoints.

**Verify:** Load app with existing data. All sessions should gain a `checkpoints` array. Sessions with notes get a first checkpoint. `workLog` array appears in data. No data loss.

---

## Phase 3: Shared Mutation Helpers

**File:** `src/App.jsx`
**Lines changed:** ~80
**Risk:** Low — new functions, no existing behavior changed
**Placement:** Inside `App()` component, after `updateSession` (line ~696) and before `updateSettings` (line ~698)

Add 6 helper functions. All perform a single `setData` call each:

```js
// ── Checkpoint & Work Log mutation helpers ──

const addCheckpoint = useCallback((sessionId, text, ts = Date.now()) => {
  // Use timestamp + random suffix to prevent ID collisions (e.g. rapid adds within same ms)
  const checkpoint = {
    id: `cp_${ts}_${Math.random().toString(36).slice(2, 6)}`,
    text: text.trim(),
    ts,
    private: false,
  };
  setData((d) => ({
    ...d,
    sessions: d.sessions.map((s) =>
      s.id === sessionId
        ? { ...s, checkpoints: [...(s.checkpoints || []), checkpoint].sort((a, b) => a.ts - b.ts) }
        : s
    ),
  }));
  // Keep activeSession in sync
  setActiveSession((prev) =>
    prev && prev.id === sessionId
      ? { ...prev, checkpoints: [...(prev.checkpoints || []), checkpoint].sort((a, b) => a.ts - b.ts) }
      : prev
  );
}, []);

const updateCheckpoint = useCallback((sessionId, checkpointId, updates) => {
  setData((d) => ({
    ...d,
    sessions: d.sessions.map((s) =>
      s.id === sessionId
        ? {
            ...s,
            checkpoints: (s.checkpoints || [])
              .map((cp) => cp.id === checkpointId ? { ...cp, ...updates } : cp)
              .sort((a, b) => a.ts - b.ts),
          }
        : s
    ),
  }));
  setActiveSession((prev) =>
    prev && prev.id === sessionId
      ? {
          ...prev,
          checkpoints: (prev.checkpoints || [])
            .map((cp) => cp.id === checkpointId ? { ...cp, ...updates } : cp)
            .sort((a, b) => a.ts - b.ts),
        }
      : prev
  );
}, []);

const deleteCheckpoint = useCallback((sessionId, checkpointId) => {
  setData((d) => ({
    ...d,
    sessions: d.sessions.map((s) =>
      s.id === sessionId
        ? { ...s, checkpoints: (s.checkpoints || []).filter((cp) => cp.id !== checkpointId) }
        : s
    ),
  }));
  setActiveSession((prev) =>
    prev && prev.id === sessionId
      ? { ...prev, checkpoints: (prev.checkpoints || []).filter((cp) => cp.id !== checkpointId) }
      : prev
  );
}, []);

const addWorkLogEntry = useCallback((text, ts = Date.now()) => {
  const entry = {
    id: `wl_${ts}_${Math.random().toString(36).slice(2, 6)}`,
    text: text.trim(),
    ts,
    private: false,
  };
  setData((d) => ({ ...d, workLog: [...(d.workLog || []), entry] }));
}, []);

const updateWorkLogEntry = useCallback((entryId, updates) => {
  setData((d) => ({
    ...d,
    workLog: (d.workLog || []).map((e) =>
      e.id === entryId ? { ...e, ...updates } : e
    ),
  }));
}, []);

const deleteWorkLogEntry = useCallback((entryId) => {
  setData((d) => ({
    ...d,
    workLog: (d.workLog || []).filter((e) => e.id !== entryId),
  }));
}, []);
```

**Key design decisions in helpers:**
- `addCheckpoint` keeps `activeSession` in sync (same pattern as `updateSession`)
- Checkpoints are sorted by `ts` ascending after every mutation (spec requirement)
- `addWorkLogEntry` appends to `data.workLog[]` only — no session coupling
- All use `useCallback` with empty deps (they close over `setData`/`setActiveSession` which are stable)
- **ID collision prevention:** Checkpoint and workLog IDs include a random 4-char suffix to prevent collisions when multiple entries are created in the same millisecond

**Known concern — dual state sync (reviewer finding #2, #4):** The existing `updateSession` pattern (line 687-696) maintains separate `data.sessions` and `activeSession` state. The checkpoint helpers follow this same pattern. There is a theoretical race window: if `addCheckpoint` and `stopSession` fire in rapid succession, the `activeSession` captured by `stopSession`'s `setActiveSession` callback might not include the latest checkpoint. **Mitigation:** `stopSession` (line 641-680) should be updated to read the session's checkpoints from `setData`'s functional updater (which always has the latest `data.sessions`) rather than from `activeSession`. Specifically, in the `stopSession` function, after closing pauses and computing `ended`, we need to do:

```js
const ended = {
  ...current,
  // Read checkpoints from the latest data state, not from activeSession
  // This prevents data loss if addCheckpoint was called in the same tick
};
setData((d) => {
  const latestSession = d.sessions.find((s) => s.id === current.id);
  const checkpoints = latestSession?.checkpoints || current.checkpoints || [];
  ended.checkpoints = checkpoints;
  // ... rest of existing stopSession setData logic
});
```

This ensures `stopSession` always captures the latest checkpoint state from `data.sessions` rather than the potentially-stale `activeSession`.

**Verify:** App loads, no errors. Helpers are defined but not yet called.

---

## Phase 4: Update `startSession` + TimerView Checkpoint Timeline

**File:** `src/App.jsx`
**Lines changed:** ~120 (TimerView section, lines 1439–1774)
**Risk:** Medium — modifies the primary user-facing view

### 4a. Update `startSession` (line 586)

Add `checkpoints` to the new session object:

```js
const session = {
  id: `s_${Date.now()}`,
  type,
  start: Date.now(),
  end: null,
  duration: 0,
  tags,
  notes,
  status: "running",
  pauses: [],
  checkpoints: [],     // NEW — always start with empty array
};
```

Also create the first checkpoint from the notes input:

```js
if (notes && notes.trim()) {
  session.checkpoints = [{
    id: `cp_${session.start}_initial`,
    text: notes.trim(),
    ts: session.start,
    private: false,
  }];
}
```

### 4a-ii. Update `importEstimatedSession` and `importAllEstimated` (lines 716–745)

Both functions create session objects from git-estimated data. Add `checkpoints: []` to each to prevent these sessions from lacking the field until next migration:

```js
// In importEstimatedSession (line 717):
const session = {
  id: `s_${Date.now()}`,
  type: "work",
  start: est.start,
  end: est.end,
  duration: est.duration,
  tags: ["git-estimated", est.repoName].filter(Boolean),
  notes: est.notes,
  status: "completed",
  _estimatedId: est.id,
  checkpoints: [],     // NEW
};

// In importAllEstimated (line 733):
const newSessions = sessions.map((est) => ({
  id: `s_${Date.now()}_${est.id}`,
  type: "work",
  start: est.start,
  end: est.end,
  duration: est.duration,
  tags: ["git-estimated", est.repoName].filter(Boolean),
  notes: est.notes,
  status: "completed",
  _estimatedId: est.id,
  checkpoints: [],     // NEW
}));
```

### 4b. Rewrite TimerView — Running Session Section

**Current:** Tags input + Notes textarea + Save button (lines 1625–1684)
**New:** Tags input + Checkpoint timeline + Add checkpoint input

The pre-session state (no active session) stays mostly the same:
- Keep tags input (lines 1598–1607)
- Change `<textarea>` to `<input type="text">` for "What are you working on?" (line 1609)
- This sets `session.notes` AND creates the first checkpoint

The running/paused session state changes significantly:
- Remove the notes textarea and Save button
- Replace with:
  1. Tags input (keep existing, lines 1631–1636)
  2. Checkpoint add input: `<input type="text" maxLength={280} placeholder="Add checkpoint..." />` + Add button
  3. Scrollable timeline (`max-height: 240px; overflow-y: auto`) showing checkpoints newest-first
  4. Each checkpoint entry: flag icon + timestamp + text + privacy toggle (eye/eyeOff) + hover-reveal edit/delete
  5. Edit mode: inline `<input type="text">` for text + `<input type="text">` for timestamp + Save/Cancel
  6. Empty state: "Add checkpoints to track your progress"
  7. Auto-scroll to newest entry on add
  8. Enter key to add checkpoint

**Timestamp parsing helper** — add as a local utility inside TimerView or at module level:

```js
const parseTimeInput = (input) => {
  // Require "h:mm AM/PM" format — no guessing. Ambiguous input is rejected.
  const match = input.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return null;
  let [_, h, m, period] = match;
  h = parseInt(h);
  m = parseInt(m);
  if (m >= 60 || h < 1 || h > 12) return null;
  const periodLower = period.toLowerCase();
  if (h === 12) h = 0;
  if (periodLower === 'pm') h += 12;
  // Build date from today + parsed time
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
};
```

**For editable timestamp fields:** When pre-populating the edit input with an existing checkpoint's time, use a locale-fixed format instead of `formatTime` (which depends on browser locale). Define a helper:

```js
const formatTimeForInput = (ts) => {
  const d = new Date(ts);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
};
```

This ensures `parseTimeInput` can always round-trip with `formatTimeForInput`.

**Checkpoint timeline component structure** (inline within TimerView):

```jsx
{activeSession && (
  <div className="bg-stone-800/60 border border-stone-700/60 rounded-xl p-3 mt-2.5">
    {/* Add checkpoint input */}
    <div className="flex gap-2">
      <input
        value={cpInput}
        onChange={(e) => setCpInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && cpInput.trim()) handleAddCp(); }}
        placeholder="Add checkpoint..."
        maxLength={280}
        className="flex-1 px-3 py-1.5 bg-stone-900/80 border border-stone-700/50 rounded-lg text-sm ..."
      />
      <button
        onClick={handleAddCp}
        disabled={!cpInput.trim()}
        className="px-3 py-1.5 rounded-lg bg-amber-500/20 ..."
      >
        <Icon path={ICONS.plus} size={14} /> Add
      </button>
    </div>

    {/* Timeline */}
    {(activeSession.checkpoints || []).length > 0 && (
      <div className="mt-3 max-h-60 overflow-y-auto space-y-1.5 pr-1" ref={timelineRef}>
        {[...(activeSession.checkpoints || [])].reverse().map((cp) => (
          // Each checkpoint entry — see detail below
        ))}
      </div>
    )}
    {(activeSession.checkpoints || []).length === 0 && (
      <p className="text-stone-600 text-xs text-center py-3">
        Add checkpoints to track your progress
      </p>
    )}
  </div>
)}
```

**Each checkpoint entry** renders as:
- Left: small amber filled dot (CSS `w-1.5 h-1.5 rounded-full bg-amber-400`)
- Center: timestamp (`formatTime(cp.ts)`) + text
- Right: privacy toggle (eye/eyeOff), edit/delete on hover
- Edit mode swaps text for input, shows Save/Cancel

**State needed in TimerView:**
- `cpInput` — text input for new checkpoint
- `editingCpId` — which checkpoint is being edited (null or checkpoint ID)
- `editCpData` — { text, tsInput } for the checkpoint being edited

**Handlers in TimerView:**
- `handleAddCp()` — calls `addCheckpoint(activeSession.id, cpInput.trim())`, clears input, auto-scrolls
- `handleEditCp(cp)` — sets `editingCpId = cp.id`, `editCpData = { text: cp.text, tsInput: formatTimeInput(cp.ts) }`
- `handleSaveCp(cp)` — parses tsInput, calls `updateCheckpoint(sessionId, cp.id, { text, ts })` or shows toast on invalid
- `handleCancelEditCp()` — sets `editingCpId = null`
- `handleDeleteCp(cp)` — `confirm("Delete this checkpoint?")` → `deleteCheckpoint(sessionId, cp.id)`
- `handleTogglePrivate(cp)` — calls `updateCheckpoint(sessionId, cp.id, { private: !cp.private })`

**Verify:** Start a session, add checkpoints, toggle privacy, edit text, edit timestamp, delete. All persisted to localStorage. Refresh preserves data.

---

## Phase 5: WorkLogView Component + Navigation

**File:** `src/App.jsx`
**Lines changed:** ~350 (new component + nav update)
**Risk:** Medium — new view component, new nav tab

### 5a. Add to Navigation (line 872)

Insert between analytics and export:

```js
const nav = [
  { id: "dashboard", label: "Dashboard", icon: ICONS.dashboard },
  { id: "timer", label: "Timer", icon: ICONS.timer },
  { id: "sessions", label: "Sessions", icon: ICONS.list },
  { id: "git", label: "Git Tracking", icon: ICONS.github },
  { id: "analytics", label: "Analytics", icon: ICONS.chart },
  { id: "worklog", label: "Work Log", icon: ICONS.flag },      // NEW
  { id: "export", label: "Export Report", icon: ICONS.download },
];
```

### 5b. Add to View Router (inside App's return, find the view switch)

Find the existing view switch (likely a ternary or conditional rendering block in App's JSX) and add the `worklog` case:

```jsx
{view === "worklog" && (
  <WorkLogView
    data={data}
    activeSession={activeSession}
    addCheckpoint={addCheckpoint}
    updateCheckpoint={updateCheckpoint}
    deleteCheckpoint={deleteCheckpoint}
    addWorkLogEntry={addWorkLogEntry}
    updateWorkLogEntry={updateWorkLogEntry}
    deleteWorkLogEntry={deleteWorkLogEntry}
    showToast={showToast}
  />
)}
```

### 5c. Add export toggles to DEFAULT_DATA.ui

In `DEFAULT_DATA.ui`:
```js
ui: {
  view: "dashboard",
  sessionsFilter: "all",
  gitRepoFilter: "all",
  analyticsRange: "week",
  exportPeriod: "week",
  exportFormat: "xlsx",
  exportIncludeCheckpoints: true,   // NEW
  exportIncludeWorkLog: true,       // NEW
},
```

**Note:** No additional migration code needed for these new UI keys. The existing migration at line 429 (`parsed.ui = { ...DEFAULT_DATA.ui, ...(parsed.ui || {}) }`) spreads in any new keys from `DEFAULT_DATA.ui`, so both `exportIncludeCheckpoints` and `exportIncludeWorkLog` will be added to existing user data automatically on next load.

### 5d. WorkLogView Component (~300 lines)

**Placement:** After `ExportView` (after line ~3066), before `SettingsModal`.

**Props:**
```js
function WorkLogView({
  data,
  activeSession,
  addCheckpoint,
  updateCheckpoint,
  deleteCheckpoint,
  addWorkLogEntry,
  updateWorkLogEntry,
  deleteWorkLogEntry,
  showToast,
})
```

**Internal state:**
- `search` — search input
- `addText` — new note text input
- `addTsInput` — new note timestamp input (defaults to now)
- `showAddForm` — toggle add form visibility
- `expandedSessions` — `Set<sessionId>` tracking which session cards are expanded
- `editingEntry` — `{ id, type: 'checkpoint' | 'worklog', text, tsInput }` or null

**Data merging logic (useMemo):**

```js
const timeline = useMemo(() => {
  const entries = [];
  // 1. All session checkpoints
  data.sessions.forEach((s) => {
    (s.checkpoints || []).forEach((cp) => {
      entries.push({
        ...cp,
        source: 'session',
        sessionId: s.id,
        sessionTitle: s.notes || 'Untitled session',
        sessionTimeRange: `${formatTime(s.start)} – ${formatTime(s.end || Date.now())}`,
        sessionType: s.type,
      });
    });
  });
  // 2. All standalone work log entries
  (data.workLog || []).forEach((wl) => {
    entries.push({ ...wl, source: 'standalone' });
  });
  // 3. Sort descending by timestamp
  entries.sort((a, b) => b.ts - a.ts);
  return entries;
}, [data.sessions, data.workLog]);
```

**Note on useMemo dependencies:** Since `data` is a single state object and `setData` creates a new reference on every call, `data.sessions` and `data.workLog` will be new references on any state change — not just when sessions or workLog change. This means the timeline recalculates on every `setData` call. For small-to-medium datasets this is acceptable and matches the existing pattern used throughout the codebase (e.g., `stats` useMemo at line 752 depends on `[data.sessions, data.settings.dailyGoal, now]`).

**Grouping by day:**

```js
const grouped = useMemo(() => {
  const groups = {};
  timeline.forEach((entry) => {
    const key = formatDate(entry.ts);
    (groups[key] = groups[key] || []).push(entry);
  });
  return groups;
}, [timeline]);
```

**Search filtering:**

```js
const filtered = useMemo(() => {
  if (!search.trim()) return grouped;
  const q = search.toLowerCase();
  const result = {};
  Object.entries(grouped).forEach(([date, entries]) => {
    const matching = entries.filter((e) =>
      e.text.toLowerCase().includes(q) ||
      (e.sessionTitle || '').toLowerCase().includes(q)
    );
    if (matching.length > 0) result[date] = matching;
  });
  return result;
}, [grouped, search]);
```

**Layout structure:**

```
Header: "Work Log" + "+ Add Note" button + search input

For each day group (descending):
  Day header: calendar icon + date

  For each entry in group:
    If source === 'session' and first occurrence of this sessionId in group:
      Session card header: clock icon + session title + time range + duration
        + chevronDown/Right toggle
        + checkpoint count badge
      If expanded:
        Checkpoint entries inside card (flag icon + time + text + privacy + edit/delete)

    If source === 'standalone':
      Muted row (opacity 0.55, fileText icon, italic text, no border)
      Privacy toggle + edit/delete on hover

Empty state: "No entries yet. Add a note or start tracking."
```

**Default expansion:** Most recent session card expanded on mount:

```js
useEffect(() => {
  const latest = data.sessions
    .filter((s) => (s.checkpoints || []).length > 0)
    .sort((a, b) => b.start - a.start)[0];
  if (latest) setExpandedSessions(new Set([latest.id]));
}, []); // Only on mount
```

**Add Note handler:**

```js
const handleAddNote = () => {
  const text = addText.trim();
  if (!text) return;
  const ts = addTsInput ? parseTimeInput(addTsInput) : Date.now();
  if (addTsInput && !ts) {
    showToast("Invalid time format — use h:mm AM/PM", "error");
    return;
  }
  if (activeSession) {
    addCheckpoint(activeSession.id, text, ts || Date.now());
  } else {
    addWorkLogEntry(text, ts || Date.now());
  }
  setAddText("");
  setAddTsInput("");
  setShowAddForm(false);
};
```

**Edit/Delete handlers:**
- Determine source type (checkpoint vs worklog) from the entry
- Checkpoint mutations call `updateCheckpoint` / `deleteCheckpoint` with the entry's `sessionId`
- Worklog mutations call `updateWorkLogEntry` / `deleteWorkLogEntry` with the entry's `id`
- Delete uses `confirm("Delete this note?")`

**Privacy toggle:**
- Eye icon (amber, `text-amber-400`) when `private === false`
- EyeOff icon (muted stone, `text-stone-500`) when `private === true`
- Click calls `updateCheckpoint(sessionId, cp.id, { private: !cp.private })` or `updateWorkLogEntry(entry.id, { private: !entry.private })`

**Verify:** Work Log tab appears in navigation. Day grouping works. Session cards expand/collapse. Add note writes to correct location (checkpoint if session running, workLog if not). Edit/delete/privacy toggle all work. Search filters correctly. Standalone notes appear muted between session cards.

---

## Phase 6: Sessions View — Collapsible Checkpoints

**File:** `src/App.jsx`
**Lines changed:** ~80
**Risk:** Low — additive section inside existing session cards

### Changes to SessionsView (line 1777)

The component already receives `data` and `updateSession`. We also need to pass the new mutation helpers:

```js
function SessionsView({
  data,
  deleteSession,
  updateSession,
  initialFilter,
  onFilterChange,
  addCheckpoint,        // NEW
  updateCheckpoint,     // NEW
  deleteCheckpoint,     // NEW
  showToast,            // NEW
})
```

**Inside each session card** (after the commits section, around line 1952), add a collapsible checkpoints section:

```jsx
{/* Checkpoints section */}
{(s.checkpoints || []).length > 0 && (
  <div className="mt-2">
    <button
      onClick={() => toggleSessionCpExpand(s.id)}
      className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-300"
    >
      <Icon
        path={expandedSessionCps.has(s.id) ? ICONS.chevronDown : ICONS.chevronRight}
        size={12}
      />
      {(s.checkpoints || []).length} checkpoint{(s.checkpoints || []).length !== 1 ? "s" : ""}
    </button>
  </div>
)}
```

**Expanded state** shows the same checkpoint timeline as the timer (reuse the same rendering pattern):
- Timestamp + text + privacy toggle + edit/delete
- Add checkpoint input at the bottom (for adding to completed sessions)
- Timestamp defaults to session end time

**State in SessionsView:**
- `expandedSessionCps` — `Set<sessionId>`
- `cpInputs` — `{ [sessionId]: string }` — add input per session
- `editingCp` — same pattern as TimerView's edit state

**Verify:** Completed sessions show checkpoint count. Expand/collapse works. Can add/edit/delete checkpoints on completed sessions. Privacy toggle works. Checkpoints re-sort after timestamp edit.

---

## Phase 7: Export View — Checkpoint Toggles

**File:** `src/App.jsx` (ExportView, lines 2887–3066) + `src/utils/exportEngine.js`
**Lines changed:** ~120 total (~40 in App.jsx, ~80 in exportEngine.js)
**Risk:** Medium — modifies export output

### 7a. ExportView — Add Toggle UI (App.jsx)

After the Format selector (line ~2987), add checkpoint toggles section:

```jsx
<div>
  <label className="text-xs text-stone-400 uppercase tracking-wide">
    Checkpoint Notes
  </label>
  <div className="mt-2 space-y-2">
    <label className="flex items-start gap-3 p-3 bg-stone-800/60 rounded-xl cursor-pointer">
      <input
        type="checkbox"
        checked={includeCheckpoints}
        onChange={(e) => {
          setIncludeCheckpoints(e.target.checked);
          onPrefsChange?.({ ...exportPrefs, includeCheckpoints: e.target.checked });
        }}
        className="mt-0.5 accent-amber-500"
      />
      <div>
        <p className="text-sm font-medium">In-session checkpoints</p>
        <p className="text-xs text-stone-500">
          Adds a "Checkpoints" column to Raw Data and Timesheet sheets.
          Private notes excluded automatically.
        </p>
      </div>
    </label>
    <label className="flex items-start gap-3 p-3 bg-stone-800/60 rounded-xl cursor-pointer">
      <input
        type="checkbox"
        checked={includeWorkLog}
        onChange={(e) => {
          setIncludeWorkLog(e.target.checked);
          onPrefsChange?.({ ...exportPrefs, includeWorkLog: e.target.checked });
        }}
        className="mt-0.5 accent-amber-500"
      />
      <div>
        <p className="text-sm font-medium">Standalone work log notes</p>
        <p className="text-xs text-stone-500">
          Adds a "Work Log" sheet with all standalone entries.
          Private notes excluded automatically.
        </p>
      </div>
    </label>
  </div>
</div>
```

**ExportView state changes:**
- Add `includeCheckpoints` / `includeWorkLog` state (initialized from `data.ui`)
- Pass flags to export functions:
  ```js
  const handleExport = () => {
    const exportData = {
      ...data,
      commits: filterByAuthor(data.commits || [], gitAuthors),
      includeCheckpoints,
      includeWorkLog,
    };
    if (format === "xlsx") {
      generateExcelReport(exportData, period);
    } else {
      generateCSVReport(exportData, period);
    }
    showToast(`${format === "xlsx" ? "Excel" : "CSV"} report exported!`);
  };
```

### 7b. ExportView — Update Sheets Preview

When `includeCheckpoints` is ON, add "7th sheet" / update sheet count display.
When `includeWorkLog` is ON, add "Work Log" to the sheets grid.

### 7c. Export Engine — Timesheet Sheet Updates (`exportEngine.js`)

In `buildTimesheetSheet` (line 564):

**Headers:** Add "Checkpoints" as the last column (only when `data.includeCheckpoints` is true):

```js
const headers = [
  "Date", "Day", "Clock In", "Clock Out",
  "Gross Hours", "Break Hours", "Net Work",
  "Sessions", "Overtime?", "Tags", "Notes",
  ...(data.includeCheckpoints ? ["Checkpoints"] : []),  // NEW — conditional
];
```

**Data rows:** When `data.includeCheckpoints` is true, collect all non-private checkpoints from that day's work sessions. Note: `prep.byDay[].workSessions` are direct references to the original session objects (not copies), so `s.checkpoints` is already available without needing the raw `data` object for session data:

```js
const checkpointsCol = data.includeCheckpoints
  ? day.workSessions
      .flatMap((s) => (s.checkpoints || []).filter((cp) => !cp.private))
      .sort((a, b) => a.ts - b.ts)
      .map((cp) => `${formatTime(cp.ts)} — ${cp.text}`)
      .join("\n")
  : "";
```

Set on the cell with `wrapText: true` and wider column width. Column index for checkpoints is `headers.length - 1`.

**IMPORTANT — Total row update:** The `setTotalRow` call (line 633-640) must include an extra empty string at the end when checkpoints column is present:

```js
setTotalRow(ws, r, [
  "GRAND TOTAL", "",
  "", "",
  formatDurationHMS(grandTotalGross),
  formatDurationHMS(grandTotalBreak),
  formatDurationHMS(grandTotalWork),
  grandTotalSessions, "", "",
  ...(data.includeCheckpoints ? [""] : []),  // NEW
], true);
```

**IMPORTANT — finalizeSheet widths update:** The hardcoded widths array `[14, 7, 11, 11, 12, 12, 12, 10, 13, 24, 36]` (11 entries) must be extended with a 12th width for the checkpoints column:

```js
const widths = [14, 7, 11, 11, 12, 12, 12, 10, 13, 24, 36];
if (data.includeCheckpoints) widths.push(40);  // wider for wrapped checkpoint text
```

### 7d. Export Engine — Raw Data Sheet Updates

In `buildRawDataSheet` (line 898):

**Session headers:** Add "Checkpoints" after "Notes" (only when `data.includeCheckpoints` is true):

```js
const sessionHeaders = [
  "ID", "Type", "Start", "End", "Duration (min)",
  "Work Time (min)", "Break Time (min)", "Pauses",
  "Tags", "Notes",
  ...(data.includeCheckpoints ? ["Checkpoints"] : []),  // NEW — conditional
  "Status"
];
```

**Data rows:** Add per-session checkpoints. **Column index shift:** When checkpoints column is present, "Status" moves from column 10 to column 11. The existing `setCell(ws, r, 10, s.status, ...)` must become conditional:

```js
// Existing columns 0-9 stay the same
// Column 10: Notes (existing, index unchanged)
setCell(ws, r, 9, sanitizeCell(s.notes || ""), { ...baseStyle, alignment: { wrapText: true, vertical: "center" } });

// NEW — Column 10 or 11 depending on checkpoints presence
let colIdx = 10;
if (data.includeCheckpoints) {
  const checkpointsCol = (s.checkpoints || [])
    .filter((cp) => !cp.private)
    .sort((a, b) => a.ts - b.ts)
    .map((cp) => `${formatTime(cp.ts)} — ${cp.text}`)
    .join("\n");
  setCell(ws, r, colIdx, sanitizeCell(checkpointsCol), { ...baseStyle, alignment: { wrapText: true, vertical: "center" } });
  colIdx++;
}
setCell(ws, r, colIdx, s.status, baseStyle);  // Status at column 10 or 11
```

**IMPORTANT — finalizeSheet widths update:** The hardcoded widths array `[16, 8, 22, 12, 14, 14, 14, 10, 34, 36, 10]` (11 entries) must be updated:

```js
const sWidths = [16, 8, 22, 12, 14, 14, 14, 10, 34, 36];
if (data.includeCheckpoints) sWidths.push(40);  // Checkpoints column
sWidths.push(10);  // Status
```

### 7e. Export Engine — New Work Log Sheet

When `data.includeWorkLog` is true, add a 7th sheet:

```js
// After buildRawDataSheet
if (data.includeWorkLog && (data.workLog || []).filter((e) => !e.private).length > 0) {
  XLSX.utils.book_append_sheet(wb, buildWorkLogSheet(data, prep.cutoff), "Work Log");
}
```

`buildWorkLogSheet` structure:
- Title header: "DevTrack — Work Log"
- Columns: Date | Time | Note
- Rows: non-private `data.workLog` entries **filtered to the export period** (entries with `ts >= cutoff`) sorted by `ts` ascending
- Date: `formatDate(entry.ts)`
- Time: `formatTime(entry.ts)`
- Note: `entry.text`
- Apply standard styling (alternating rows, column widths)

**Date filtering:** Pass `prep.cutoff` to `buildWorkLogSheet` so standalone work log entries are filtered to the same date range as sessions. Without this, a "week" export would include ALL standalone notes regardless of date.

### 7f. Export Engine — CSV Work Log Section

In `generateCSVReport` (line 1031):

After the sessions section, add a work log block when `data.includeWorkLog` is true. **Must filter by date range** using the same `cutoff` as sessions:

```js
const workLogEntries = (data.workLog || [])
  .filter((e) => !e.private && e.ts >= cutoff)
  .sort((a, b) => a.ts - b.ts);
if (workLogEntries.length > 0) {
  rows.push('');
  rows.push('# Work Log');
  rows.push(['"Date"', '"Time"', '"Note"'].join(','));
  workLogEntries.forEach((e) => {
    rows.push([`"${formatDate(e.ts)}"`, `"${formatTime(e.ts)}"`, `"${e.text.replace(/"/g, '""')}"`].join(','));
  });
}
```

### 7g. Pass `data` reference to sheet builders

Currently `buildTimesheetSheet(prep, settings)` doesn't have access to the raw `data` object. **Note:** `prep.sessions` and `prep.byDay[].workSessions` are direct references to the original session objects (they are `.filter()` results, not copies), so `s.checkpoints` is already accessible on `prep` session objects. However, we need the raw `data` for:
- `data.includeCheckpoints` / `data.includeWorkLog` flags
- `data.workLog` standalone entries (for the Work Log sheet)

Change signatures:
- `buildTimesheetSheet(prep, settings, data)` — check `data.includeCheckpoints`
- `buildRawDataSheet(prep, data)` — check `data.includeCheckpoints`

In `generateExcelReport`:
```js
XLSX.utils.book_append_sheet(wb, buildTimesheetSheet(prep, data.settings, data), "Timesheet");
XLSX.utils.book_append_sheet(wb, buildRawDataSheet(prep, data), "Raw Data");
```

**Verify:** Export with toggles ON includes checkpoint columns and Work Log sheet. Export with toggles OFF produces identical output to current behavior. Private checkpoints excluded. CSV export includes work log section when toggle ON.

---

## Phase 8: Props Plumbing (Done inline with Phases 4–7)

**File:** `src/App.jsx`
**Lines changed:** ~20
**Risk:** Low — just passing props through

**IMPORTANT:** This phase is NOT a separate step. It is done inline as part of Phases 4–7. Each view's props must be updated at the same time as the view component's implementation. If done separately, the component would receive `undefined` for the new props and crash.

Update the view rendering in App's return JSX to pass the new helper props **when implementing each view**:

**Phase 4 — TimerView props:**
```jsx
{view === "timer" && (
  <TimerView
    activeSession={activeSession}
    elapsed={elapsed}
    startSession={startSession}
    pauseSession={pauseSession}
    resumeSession={resumeSession}
    stopSession={stopSession}
    updateSession={updateSession}
    addCheckpoint={addCheckpoint}       // NEW
    updateCheckpoint={updateCheckpoint} // NEW
    deleteCheckpoint={deleteCheckpoint} // NEW
    data={data}
    showToast={showToast}
  />
)}
```

**Phase 6 — SessionsView props:**
```jsx
{view === "sessions" && (
  <SessionsView
    data={data}
    deleteSession={deleteSession}
    updateSession={updateSession}
    initialFilter={data.ui?.sessionsFilter}
    onFilterChange={(f) => updateUi({ sessionsFilter: f })}
    addCheckpoint={addCheckpoint}       // NEW
    updateCheckpoint={updateCheckpoint} // NEW
    deleteCheckpoint={deleteCheckpoint} // NEW
    showToast={showToast}               // NEW
  />
)}
```

---

## Phase 9: Polish + Edge Cases

**File:** `src/App.jsx` + `src/utils/exportEngine.js`
**Lines changed:** ~30
**Risk:** Low

- Extract `parseTimeInput` and `formatTimeForInput` to module level (near `formatTime` at line ~236) so they're shared between TimerView and WorkLogView
- Verify `session.notes` remains completely independent of checkpoints in all code paths
- Verify the pre-session input ("What are you working on?") creates both `session.notes` AND first checkpoint
- Verify delete session removes embedded checkpoints (no orphan data)
- Verify Work Log view correctly handles sessions with 0 checkpoints
- Verify empty states render correctly in all views
- Verify auto-scroll works in Timer checkpoint timeline
- **Cross-view state guard (finding #16):** If a checkpoint is being edited in TimerView (local `editingCpId` state) and the same checkpoint is deleted from WorkLogView, the TimerView's edit state becomes stale. Add a guard in the save handler: if the checkpoint no longer exists in `activeSession.checkpoints`, cancel the edit silently (`setEditingCpId(null)`). This is defensive — the scenario is unlikely but possible.
- **Midnight edge case (finding #17):** `parseTimeInput` builds the timestamp from `new Date()` (today) + parsed hours/minutes. If a user edits a timestamp from yesterday's session at exactly midnight, `new Date()` rolls over to the next day. The resulting timestamp would be wrong. This is an acceptable edge case — the user can correct it. Document as known limitation.
- Run `npm run build` to ensure no build errors
- Run `npm run lint` to ensure no lint errors

---

## File Change Summary

| File | Phase | Changes |
|------|-------|---------|
| `src/App.jsx` | 1 | +30 lines — 6 new icons in ICONS map (after `close`, line ~223) |
| `src/App.jsx` | 2 | +25 lines — DEFAULT_DATA, migration |
| `src/App.jsx` | 3 | +85 lines — 6 mutation helpers + stopSession fix |
| `src/App.jsx` | 4 | +140 lines — startSession + imports update + TimerView checkpoint timeline + props |
| `src/App.jsx` | 5 | +350 lines — WorkLogView component + navigation |
| `src/App.jsx` | 6 | +90 lines — SessionsView checkpoint section + props |
| `src/App.jsx` | 7a-b | +40 lines — ExportView toggle UI |
| `src/App.jsx` | 9 | +10 lines — Polish |
| `src/utils/exportEngine.js` | 7c-g | +90 lines — Timesheet/RawData columns + Work Log sheet + CSV section |
| **Total** | | **~860 lines added** |

## Estimated App.jsx Final Size

~3314 (current) + ~770 (App.jsx additions) = **~4085 lines**

This is within the spec's estimate of 800–1200 lines. The increase is manageable for a single-file React SPA and matches the existing pattern.

---

## Commit Checkpoints

| Commit | Phase | Message |
|--------|-------|---------|
| 1 | 1 | feat: add 6 new Feather-style icons to ICONS map |
| 2 | 2 | feat: add checkpoints data model and migration |
| 3 | 3 | feat: add checkpoint and work log mutation helpers |
| 4 | 4 | feat: replace timer notes with checkpoint timeline |
| 5 | 5 | feat: add Work Log view with unified timeline |
| 6 | 6 | feat: add collapsible checkpoints to Sessions view |
| 7 | 7 | feat: add checkpoint/export toggles and Work Log sheet to export engine |
| 8 | 9 | fix: polish, edge case handling, and cross-view state guards |

**Note:** Phase 8 (props plumbing) is done inline with Phases 4–7, not as a separate commit.

---

## Testing Strategy (Manual)

Since there's no test framework, each phase is verified manually:

1. **Phase 1–3:** App loads, existing data intact, no console errors
2. **Phase 4:** Start session → type "Working on API" → start → add checkpoints → toggle privacy → edit text → edit timestamp → delete → refresh → verify persistence
3. **Phase 5:** Work Log tab → add note (no session) → starts session → add note → verify one goes to workLog, one to checkpoints → search → edit/delete → expand/collapse session cards
4. **Phase 6:** Sessions → find session with checkpoints → expand → edit → add new → verify re-sort after timestamp edit
5. **Phase 7:** Export → toggle checkpoints ON → export Excel → verify Checkpoints column in Timesheet/Raw Data → toggle work log ON → verify Work Log sheet → toggle both OFF → export matches pre-feature output
6. **Phase 9:** `npm run build` passes, `npm run lint` passes

---

## Out of Scope

These items from the spec's "What Does NOT Change" section are explicitly not touched:

- Dashboard view
- Git view
- Analytics view
- Settings modal
- Companion git server (`server/git-server.mjs`)
- `load()`/`save()` mechanics (only `migrate()` changes)
- Any existing session fields (id, type, start, end, duration, tags, notes, status, pauses, totalWorkTime, totalBreakTime, commitIds)

---

## Appendix: External Review Findings (17 total)

Reviewed by external code-reviewer agent. All findings addressed:

| # | Severity | Title | Fix |
|---|----------|-------|-----|
| 1 | MEDIUM | `parseTimeInput` AM/PM heuristic silently produces wrong times | Removed heuristic — AM/PM is now required. Added `formatTimeForInput` locale-fixed helper |
| 2 | MEDIUM | `addCheckpoint` dual state sync race condition | Acknowledged — matches existing `updateSession` pattern. Added stopSession mitigation (Phase 3) |
| 3 | MEDIUM | Checkpoint ID collision risk | Added random 4-char suffix to all IDs: `cp_${ts}_${random}` |
| 4 | MEDIUM | `stopSession` checkpoint data loss on rapid add-then-stop | Updated Phase 3 to read latest checkpoints from `data.sessions` inside `setData` updater |
| 5 | MEDIUM | Export `prep` already has checkpoint references | Clarified Phase 7g: `prep.sessions` carries checkpoints, only need `data` for flags and `workLog` |
| 6 | MEDIUM | Timesheet total row + widths column count mismatch | Added explicit updates to `setTotalRow` and `finalizeSheet` widths in Phase 7c |
| 7 | MEDIUM | Raw Data column index shift for Status | Made columns conditional with `colIdx` tracking in Phase 7d |
| 8 | MEDIUM | `importEstimatedSession`/`importAllEstimated` missing `checkpoints` | Added Phase 4a-ii updating both import functions |
| 9 | LOW | Export UI prefs migration not mentioned | Added note in Phase 5c that existing spread migration handles it |
| 10 | LOW | WorkLogView useMemo re-computes on any state change | Acknowledged in Phase 5d — matches existing pattern, acceptable for small datasets |
| 11 | LOW | `formatTime` locale output doesn't match parseTimeInput | Added `formatTimeForInput` with fixed h:mm AM/PM format |
| 12 | LOW | Phase 8 must be done alongside Phases 4–7 | Merged Phase 8 into earlier phases with explicit "do inline" instructions |
| 13 | LOW | Icons should go after `close`, not `clipboard` | Fixed placement to after `close` at line ~223 |
| 14 | LOW | Minor line number inaccuracies | Fixed where noted |
| 15 | LOW | Work Log sheet not filtered by date range | Added `cutoff` parameter to `buildWorkLogSheet`, filtering in CSV too |
| 16 | LOW | Cross-view editing state sync (edit in Timer, delete from Work Log) | Added guard in Phase 9: cancel edit if checkpoint no longer exists |
| 17 | LOW | `parseTimeInput` midnight edge case | Documented as known limitation in Phase 9 |
