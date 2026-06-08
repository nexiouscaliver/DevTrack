# Pomodoro Mode — Research Findings

**Date:** 2026-06-08
**Feature:** Pomodoro timer mode with auto-cycling work/break intervals
**App.jsx:** 6027 lines

---

## 1. Files to Modify

### Primary: `src/App.jsx`

| Area | Lines | What to Change |
|------|-------|----------------|
| `DEFAULT_DATA` | 420–442 | Add `pomodoro` key to `settings` |
| `sanitizeData()` | 458–490 | Handle new `pomodoro` settings fields |
| `ICONS` map | 40–252 | Add `skipForward` icon for skip-break action |
| `App()` state | 785–804 | Add `pomodoroState` (cycle count, phase, target duration) |
| Timer tick `useEffect` | 1031–1037 | Add countdown logic — detect when pomodoro interval elapses |
| `startSession()` | 1085–1137 | Accept optional `pomodoroMeta` on session for tracking |
| `stopSession()` | 1176–1260 | Trigger next pomodoro phase when auto-cycling |
| `updateSettings()` | 1382–1384 | No change needed — already merges |
| `SettingsModal` | 4719–4954 | Add Pomodoro settings section |
| `TimerView` | 2205–2570+ | Add mode toggle, countdown display, pomodoro counter, skip/extend buttons |
| `Dashboard` StatCards | 2002–2032 | Add pomodoro count stat card |
| `Dashboard` props | 1908–1918 | Pass pomodoro count data |

### No changes needed:
- `server/git-server.mjs` — pomodoro state lives in client-side `data.sessions`
- `vite.config.js` — no new proxy routes needed
- `package.json` — no new dependencies (browser Notification API is native)

---

## 2. Existing Patterns to Follow

### State Management
- All state in `App()` via `useState` hooks
- Persisted state goes into `data` object → `setData()` triggers debounced save (300ms)
- Non-persisted UI state uses separate `useState` hooks

### Session Lifecycle
```
startSession(type, tags, notes)
  → creates session object {id, type, start, status:"running", pauses:[], ...}
  → calls setActiveSession(session), setElapsed(0)
  → calls setData to append to sessions array
  → auto-closes any existing running/paused session first

pauseSession()
  → appends {start: Date.now(), end: null} to pauses
  → sets status to "paused"

resumeSession()
  → closes last pause entry
  → sets status to "running"

stopSession()
  → calculates totalDuration, totalWorkTime, totalBreakTime
  → auto-syncs git repos
  → sets status to "completed"
```

### Settings Pattern
- `DEFAULT_DATA.settings` defines shape
- `SettingsModal` receives `data`, `updateSettings`, `showToast`
- Form is local `useState(data.settings)`, saved via `updateSettings(form)`
- `updateSettings` merges: `setData(d => ({...d, settings: {...d.settings, ...updates}}))`

### Timer Display (TimerView lines 2345–2394)
- Circular SVG progress ring (256x256 viewBox, r=110 circle)
- Currently fills based on elapsed / (dailyGoal * 3600000)
- Timer text: `formatDuration(displayWorkTime)` → `HH:MM:SS`
- Gradient: `from-amber-500 to-orange-600` for work, `from-sky-500 to-blue-600` for break

### Animations
- Framer Motion `motion.div` with `initial`, `animate`, `exit` props
- `AnimatePresence` for conditional rendering transitions

### Icons
- All inline SVG via `ICONS` map (Lucide-style paths)
- Used as `<Icon path={ICONS.name} size={16} />`

---

## 3. Integration Points

### Functions to Call
| Function | Location | Usage |
|----------|----------|-------|
| `startSession(type, tags, notes)` | line 1085 | Start work/break intervals as real sessions |
| `stopSession()` | line 1176 | End current interval before transitioning |
| `pauseSession()` | line 1139 | Manual pause during pomodoro |
| `resumeSession()` | line 1156 | Resume from manual pause |
| `showToast(msg, type)` | line 1079 | Interval completion notification |
| `updateSettings(updates)` | line 1382 | Persist pomodoro config |
| `computeElapsed(session)` | line 687 | Calculate elapsed for countdown |
| `formatDuration(ms)` | line 255 | Display countdown time |

### State to Read
| State | Location | Usage |
|-------|----------|-------|
| `activeSession` | line 786 | Check current session type and status |
| `elapsed` | line 790 | Derive remaining time for countdown |
| `data.settings` | line 783 | Read pomodoro config (intervals, long break frequency) |
| `data.sessions` | line 783 | Count completed pomodoros today |

### UI Locations
| Location | What Goes There |
|----------|----------------|
| TimerView header area | Mode toggle (Free Timer vs Pomodoro) |
| TimerView timer ring | Countdown display (remaining instead of elapsed) |
| TimerView controls | Skip Break / Extend Interval buttons |
| TimerView below ring | Pomodoro counter (🍅 dots or progress pips) |
| SettingsModal | New "Pomodoro" settings section |
| Dashboard stats grid | Pomodoro count stat card (5th card or replace one) |

---

## 4. Key Technical Findings

### Timer Tick Mechanism
- `useEffect` at line 1031 runs `setInterval` every 1000ms
- Calls `setElapsed(computeElapsed(activeSession))` each tick
- For pomodoro: need to compare `elapsed` against target duration (e.g., 25 min)
- **Important:** `computeElapsed()` for paused sessions returns BREAK time, not work time. For running sessions returns wall-clock minus pauses.

### Session Auto-Close Logic
- `startSession()` already auto-closes any running/paused session (lines 1087–1111)
- This is perfect for pomodoro transitions — calling `startSession("break")` will auto-complete the current work session

### No Browser Notification API
- Zero usage of `Notification` API in codebase
- Will need to add: `Notification.requestPermission()` + `new Notification(title, opts)`
- Browser support is universal for modern browsers
- Should be opt-in (not all users want system notifications)

### Data Persistence
- Every `setData` triggers debounced save to localStorage + server (300ms)
- Pomodoro sessions will be regular sessions — automatically persisted
- Pomodoro state (current cycle count, phase) can be derived or stored in `ui` prefs

### `formatDuration` Output
- Returns `HH:MM:SS` format
- For countdown, need a `formatCountdown(ms)` or reuse `formatDuration` with `target - elapsed`

---

## 5. Constraints & Risks

### Must Not Break
- Existing free timer mode (work/break with manual controls)
- Session data integrity (all pomodoro sessions are real sessions)
- Data persistence flow (debounced save)
- Session auto-complete on page reload for stale sessions
- Analytics counting (break sessions already handled in analytics)

### Performance Considerations
- App.jsx is 6027 lines — pomodoro code should be efficient
- Timer tick already runs every 1s — countdown check adds minimal overhead
- No new interval timers needed — piggyback on existing tick

### Edge Cases
- User manually stops during a pomodoro work interval
- User switches from pomodoro mode to free timer mid-session
- User navigates away during a pomodoro interval
- Page refresh during active pomodoro cycle
- Pomodoro running across midnight (day boundary)
- Multiple pomodoro cycles in one day (counter reset)

---

## 6. Open Questions for Brainstorming

1. **Auto-cycle behavior:** When work interval ends, should it automatically start the break or wait for user confirmation?
2. **Long breaks:** Every N pomodoros (configurable N?), default after 4?
3. **Counter placement:** TimerView only, or also Dashboard stat card?
4. **Countdown display:** Replace existing timer or toggle between elapsed/countdown?
5. **Notifications:** Toast only, or also browser Notification API?
6. **Mode activation:** Toggle inside TimerView, or separate nav item?
7. **Skip/extend:** Skip break = go straight to next work? Extend = add 5 min?
8. **Session tagging:** Should pomodoro sessions auto-tag as "pomodoro"?
9. **Pause during pomodoro:** Should manual pause be allowed during pomodoro work interval?
10. **State recovery:** If user refreshes mid-pomodoro, should cycle resume or reset?

---

## 7. Dependencies Check

**Current `package.json` dependencies:** All sufficient. No new packages needed.
- React 19, Framer Motion, Tailwind CSS, Recharts — all present
- Browser Notification API — native, no library needed
- No new server endpoints needed

---

*Research complete. Ready for Phase 2: Brainstorming.*
